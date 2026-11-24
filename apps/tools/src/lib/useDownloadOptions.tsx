"use client";

import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import dynamic from "next/dynamic";
import { getToken } from "@clearcut/auth/token";
import { normalizePage } from "@clearcut/auth/attribution";
import { getDict, type Locale } from "./dictionary";
import { devForcedDownloadMode, resolveDownloadModeFor, type DownloadMode, type DownloadModeSource } from "./downloadMode";
import { isOtpRequiredBeforeDownload } from "@/config/downloadVerification";
import { verifySession } from "./api/verifySession";
import { downloadFlagsWithin, fetchDownloadFlags, trackFlagExposures, type FlagContext } from "./experiment";
import { getLoginGateConfig } from "./loginGate";
import { useLoginGate } from "./useLoginGate";
import { bumpDownloadCount, getSaveConsent, needsSecondDownloadGate, readDownloadCount, setSaveConsent } from "./savedImages/logic";
import SaveConsentCheckbox from "@/components/SaveConsentCheckbox";

const DownloadOptionsModal = dynamic(() => import("@/components/DownloadOptionsModal"), { ssr: false });

/** Which choice the visitor made in the soft-gate sheet. */
export type DownloadOption = "image_only" | "image_with_free_pdf";

/**
 * Amplitude properties describing one download, handed to the tool's own
 * "downloaded" event so it carries exactly what happened (not what was
 * assumed): `download_mode` is the mode that really ran; `authentication_required`
 * is true only when this very download had to verify a number;
 * `otp_verification_status` is `not_required` (no OTP involved), `already_verified`
 * (a session already existed) or `verified` (number verified with OTP just now).
 * `download_option` exists only in the soft gate; `download_mode_conflict` only
 * when both flags were ON (invalid → Legacy).
 */
export interface DownloadMeta {
  tool_name: string;
  tool_page: string;
  download_mode: DownloadMode;
  /** Phase 127: `config` (config/downloadVerification.ts), `amplitude` (the flags) or `dev_override` (localhost QA). */
  download_mode_source: DownloadModeSource;
  download_mode_conflict?: true;
  download_option?: DownloadOption;
  authentication_required: boolean;
  otp_verification_status: "not_required" | "already_verified" | "verified";
  pdf_requested: boolean;
  /** CC-174 second-download gate only: the visitor ticked "save my photo & signature" before verifying. */
  save_consent?: boolean;
}

type Track = (event: string, props?: Record<string, unknown>) => void;
type Base = Pick<DownloadMeta, "tool_name" | "tool_page" | "download_mode" | "download_mode_source" | "download_mode_conflict">;
type Pending = { save: (meta: DownloadMeta) => void; base: Base };

/**
 * The Download behaviour of ANY Tools image tool, chosen per exam / page by two
 * Amplitude flags (phase 71 §12; rule table in lib/downloadMode.ts):
 *
 *   const { requestDownload, modals } = useDownloadOptions({ locale, track, tool, exam });
 *   requestDownload((meta) => saveTheFile(meta));
 *   ...
 *   return <>{...}{modals}</>;
 *
 *  - legacy (both flags OFF / unknown): save(meta) at once — no OTP, no modal.
 *  - hard_gate: the shared OTP login opens over the page (the tool's state — the
 *    processed image — is untouched) and save(meta) runs once after a successful
 *    verification; a visitor who already has a session downloads at once.
 *  - soft_gate: the "Your image is ready!" sheet. "Download Image" → save(meta)
 *    at once; "Download Image & Get Free PDF" → the OTP login, then save(meta)
 *    once. The lead is the verified number (stored by the login) plus the events
 *    below — nothing else is stored.
 *  Closing the sheet or the login downloads nothing.
 *
 * Analytics (docs/phases/71): `track` gets generic names ("Download Options
 * Viewed", "Download Option Selected", "Download Options Dismissed", "Free PDF
 * Requested") — soft gate only; the tool adds its prefix and common properties.
 * The login's own events carry `tool_name`, `tool_page`, `download_mode` (and
 * `download_option`) through the gate's `eventProps`.
 */
export function useDownloadOptions({
  locale,
  track,
  tool,
  exam,
}: {
  locale: Locale;
  track?: Track;
  /** resizer | image-compressor | signature-compressor | add-name-date */
  tool: string;
  /** Exam slug on an exam page (the flag context), undefined elsewhere. */
  exam?: string | null;
}) {
  const copy = getDict(locale).tool.downloadOptions;
  const { requireLogin, gate } = useLoginGate();
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const pending = useRef<Pending | null>(null);
  const resolving = useRef(false);
  // Phase 127: the backend login check before an OTP-required download (config/downloadVerification.ts).
  const [verifying, setVerifying] = useState(false);
  const [verifyFailed, setVerifyFailed] = useState(false);
  const lastSave = useRef<((meta: DownloadMeta) => void) | null>(null);
  const otpRequired = isOtpRequiredBeforeDownload(exam);

  const flagContext = useCallback((): FlagContext => ({ exam, tool, page: normalizePage(window.location.pathname).page }), [exam, tool]);

  // Start the evaluation as soon as the tool is on screen, so the Download tap
  // finds the answer already cached (cache is per exam|tool — never shared).
  useEffect(() => {
    // An exam that always needs OTP (config/downloadVerification.ts) never reads the flags.
    if (otpRequired) return;
    const start = () => void fetchDownloadFlags(flagContext());
    if (typeof window.requestIdleCallback === "function") {
      const id = window.requestIdleCallback(start, { timeout: 2000 });
      return () => window.cancelIdleCallback?.(id);
    }
    const t = setTimeout(start, 300);
    return () => clearTimeout(t);
  }, [flagContext, otpRequired]);

  const finish = useCallback((p: Pending, patch: Omit<DownloadMeta, keyof Base>) => {
    // CC-174: the second-download gate counts downloads per browser (every mode counts, so
    // switching the flag on later does not treat a returning visitor as new).
    bumpDownloadCount();
    p.save({ ...p.base, ...patch });
  }, []);

  const dismiss = useCallback(() => {
    const p = pending.current;
    pending.current = null;
    setOpen(false);
    if (p) track?.("Download Options Dismissed", { tool_name: p.base.tool_name, tool_page: p.base.tool_page, download_mode: p.base.download_mode });
  }, [track]);

  const chooseImage = useCallback(() => {
    const p = pending.current;
    pending.current = null;
    setOpen(false);
    if (!p) return;
    const download_option: DownloadOption = "image_only";
    track?.("Download Option Selected", { ...p.base, download_option, authentication_required: false });
    finish(p, { download_option, authentication_required: false, otp_verification_status: "not_required", pdf_requested: false });
  }, [track, finish]);

  const choosePdf = useCallback(() => {
    const p = pending.current;
    pending.current = null;
    setOpen(false);
    if (!p) return;
    const download_option: DownloadOption = "image_with_free_pdf";
    track?.("Download Option Selected", { ...p.base, download_option, authentication_required: !getToken() });
    requireLogin(
      { ...getLoginGateConfig("download-pdf", locale), eventProps: { ...p.base, download_option } },
      ({ verifiedNow }) => {
        const otp_verification_status = verifiedNow ? "verified" : "already_verified";
        finish(p, { download_option, authentication_required: verifiedNow, otp_verification_status, pdf_requested: true });
        // The lead signal: this verified number asked for the free PDF (see docs/phases/71 §10).
        track?.("Free PDF Requested", { ...p.base, download_option, otp_verification_status });
      },
    );
  }, [locale, requireLogin, track, finish]);

  const requestDownload = useCallback(
    async (save: (meta: DownloadMeta) => void) => {
      if (resolving.current) return; // a second tap while the answer is still loading
      resolving.current = true;
      setVerifyFailed(false);
      try {
        const ctx = flagContext();
        // A config-required exam is hard_gate whatever the flags say, so it does not wait for them.
        const flags = isOtpRequiredBeforeDownload(exam) ? null : await downloadFlagsWithin(ctx);
        const { mode, conflict, source } = resolveDownloadModeFor(exam, flags, devForcedDownloadMode());
        if (flags) trackFlagExposures(flags, ctx);
        if (conflict) {
          console.warn("[tools] hard_gate and soft_gate are both ON for this page: falling back to Legacy (download_mode_conflict). Switch one off in Amplitude.");
        }
        const base: Base = {
          tool_name: tool,
          tool_page: ctx.page,
          download_mode: mode,
          download_mode_source: source,
          ...(conflict ? { download_mode_conflict: true as const } : {}),
        };
        const download: Pending = { save, base };

        if (mode === "legacy") {
          finish(download, { authentication_required: false, otp_verification_status: "not_required", pdf_requested: false });
        } else if (mode === "second_download_gate") {
          // CC-174: the first download is free; from the 2nd one a visitor without a session
          // verifies with OTP on the page (no redirect) and may opt in to saving the image.
          if (!needsSecondDownloadGate(readDownloadCount(), Boolean(getToken()))) {
            const already = Boolean(getToken());
            finish(download, {
              authentication_required: false,
              otp_verification_status: already ? "already_verified" : "not_required",
              pdf_requested: false,
            });
          } else {
            const copy = getDict(locale).tool.savedImages;
            setSaveConsent(false);
            requireLogin(
              {
                ...getLoginGateConfig("download", locale),
                id: "save-images",
                title: copy.gateTitle,
                subtitle: copy.gateSubtitle,
                otpSubmitLabel: copy.gateOtpSubmit,
                extraContent: <SaveConsentCheckbox label={copy.consentLabel} />,
                eventProps: base,
              },
              ({ verifiedNow }) =>
                finish(download, {
                  authentication_required: verifiedNow,
                  otp_verification_status: verifiedNow ? "verified" : "already_verified",
                  pdf_requested: false,
                  save_consent: getSaveConsent(),
                }),
            );
          }
        } else if (mode === "hard_gate") {
          if (source === "config" && getToken()) {
            // Phase 127: a local token is not enough — the backend must still accept it.
            setVerifying(true);
            let check: Awaited<ReturnType<typeof verifySession>>;
            try {
              check = await verifySession();
            } finally {
              setVerifying(false);
            }
            if (check === "valid") {
              finish(download, { authentication_required: false, otp_verification_status: "already_verified", pdf_requested: false });
              return;
            }
            if (check === "error") {
              // Offline / 5xx / 403: no file, token kept, "Try again" (never a bypass, never a lock-out).
              lastSave.current = save;
              setVerifyFailed(true);
              return;
            }
            // "expired": authedRequest already cleared the token, so the OTP login opens below.
          }
          requireLogin({ ...getLoginGateConfig("download", locale), eventProps: base }, ({ verifiedNow }) =>
            finish(download, {
              authentication_required: verifiedNow,
              otp_verification_status: verifiedNow ? "verified" : "already_verified",
              pdf_requested: false,
            }),
          );
        } else {
          pending.current = download;
          setMounted(true);
          setOpen(true);
          track?.("Download Options Viewed", { tool_name: base.tool_name, tool_page: base.tool_page, download_mode: mode, logged_in: Boolean(getToken()) });
        }
      } finally {
        resolving.current = false;
      }
    },
    [flagContext, exam, tool, locale, requireLogin, track, finish],
  );

  /** Phase 127: the "Try again" after a failed login check repeats the same download request. */
  const retryDownload = useCallback(() => {
    const save = lastSave.current;
    if (save) void requestDownload(save);
  }, [requestDownload]);

  const modals: ReactNode = (
    <>
      {mounted && (
        <DownloadOptionsModal open={open} copy={copy} onSelectImage={chooseImage} onSelectPdf={choosePdf} onClose={dismiss} />
      )}
      {gate}
    </>
  );

  return { requestDownload, modals, verifying, verifyFailed, retryDownload };
}

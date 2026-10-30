"use client";

import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import dynamic from "next/dynamic";
import { getToken } from "@clearcut/auth/token";
import { normalizePage } from "@clearcut/auth/attribution";
import { getDict, type Locale } from "./dictionary";
import { resolveDownloadMode, type DownloadMode } from "./downloadMode";
import { downloadFlagsWithin, fetchDownloadFlags, trackFlagExposures, type FlagContext } from "./experiment";
import { getLoginGateConfig } from "./loginGate";
import { useLoginGate } from "./useLoginGate";

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
  download_mode_conflict?: true;
  download_option?: DownloadOption;
  authentication_required: boolean;
  otp_verification_status: "not_required" | "already_verified" | "verified";
  pdf_requested: boolean;
}

type Track = (event: string, props?: Record<string, unknown>) => void;
type Base = Pick<DownloadMeta, "tool_name" | "tool_page" | "download_mode" | "download_mode_conflict">;
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

  const flagContext = useCallback((): FlagContext => ({ exam, tool, page: normalizePage(window.location.pathname).page }), [exam, tool]);

  // Start the evaluation as soon as the tool is on screen, so the Download tap
  // finds the answer already cached (cache is per exam|tool — never shared).
  useEffect(() => {
    const start = () => void fetchDownloadFlags(flagContext());
    if (typeof window.requestIdleCallback === "function") {
      const id = window.requestIdleCallback(start, { timeout: 2000 });
      return () => window.cancelIdleCallback?.(id);
    }
    const t = setTimeout(start, 300);
    return () => clearTimeout(t);
  }, [flagContext]);

  const finish = useCallback((p: Pending, patch: Omit<DownloadMeta, keyof Base>) => p.save({ ...p.base, ...patch }), []);

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
      try {
        const ctx = flagContext();
        const flags = await downloadFlagsWithin(ctx);
        const { mode, conflict } = resolveDownloadMode(flags);
        if (flags) trackFlagExposures(flags, ctx);
        if (conflict) {
          console.warn("[tools] hard_gate and soft_gate are both ON for this page: falling back to Legacy (download_mode_conflict). Switch one off in Amplitude.");
        }
        const base: Base = {
          tool_name: tool,
          tool_page: ctx.page,
          download_mode: mode,
          ...(conflict ? { download_mode_conflict: true as const } : {}),
        };
        const download: Pending = { save, base };

        if (mode === "legacy") {
          finish(download, { authentication_required: false, otp_verification_status: "not_required", pdf_requested: false });
        } else if (mode === "hard_gate") {
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
    [flagContext, tool, locale, requireLogin, track, finish],
  );

  const modals: ReactNode = (
    <>
      {mounted && (
        <DownloadOptionsModal open={open} copy={copy} onSelectImage={chooseImage} onSelectPdf={choosePdf} onClose={dismiss} />
      )}
      {gate}
    </>
  );

  return { requestDownload, modals };
}

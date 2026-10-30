"use client";

import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import dynamic from "next/dynamic";
import { getToken } from "@clearcut/auth/token";
import { normalizePage } from "@clearcut/auth/attribution";
import { getDict, type Locale } from "./dictionary";
import { getLoginGateConfig } from "./loginGate";
import { useLoginGate } from "./useLoginGate";
import { flushPendingPdfRequest, recordPdfRequest, toSlug, type PdfRequestContext } from "./api/pdfRequestApi";

const DownloadOptionsModal = dynamic(() => import("@/components/DownloadOptionsModal"), { ssr: false });

/** Which choice the visitor made. */
export type DownloadOption = "image_only" | "image_with_free_pdf";

/**
 * Amplitude properties describing one download, handed to the tool's own
 * "downloaded" event so it carries exactly what happened (not what was
 * assumed): `authentication_required` is true only when this very download had
 * to verify a number; `otp_verification_status` is `not_required` (plain
 * download), `already_verified` (PDF option with a session that already
 * existed) or `verified` (PDF option, number verified with OTP just now).
 */
export interface DownloadMeta {
  tool_name: string;
  tool_page: string;
  download_option: DownloadOption;
  authentication_required: boolean;
  otp_verification_status: "not_required" | "already_verified" | "verified";
  pdf_requested: boolean;
}

type Track = (event: string, props?: Record<string, unknown>) => void;
type RequestContext = Omit<PdfRequestContext, "locale">;
type Pending = {
  save: (meta: DownloadMeta) => void;
  ctx: RequestContext;
  base: { tool_name: string; tool_page: string };
};

/**
 * The "Your image is ready!" sheet for ANY Tools image tool (phase 71).
 *
 *   const { requestDownload, modals } = useDownloadOptions({ locale, track });
 *   requestDownload((meta) => saveTheFile(meta), { tool: "resizer", exam, preset });
 *   ...
 *   return <>{...}{modals}</>;
 *
 *  - "Download Image"                -> save(meta) at once, no login (meta.download_option = "image_only").
 *  - "Download Image & Get Free PDF" -> the shared OTP login opens over the page
 *    (the tool's state — the processed image — is untouched), then
 *    save(meta) runs once (download_option = "image_with_free_pdf") and the verified visitor's request for
 *    the free PDF is recorded for the WhatsApp delivery workflow. A visitor who
 *    is already logged in skips the OTP and is still recorded.
 *  - Closing the sheet, or the login, downloads nothing.
 *
 * Analytics (docs/phases/71): `track` gets generic names ("Download Options
 * Viewed", "Download Option Selected", "Download Options Dismissed", "Free PDF
 * Requested"); the tool adds its own prefix and common properties. The login's
 * own events (Verification Sent / Resent / Failed, Authentication Outcome) carry
 * `tool_name`, `tool_page`, `download_option` through the gate's `eventProps`.
 */
export function useDownloadOptions({ locale, track }: { locale: Locale; track?: Track }) {
  const copy = getDict(locale).tool.downloadOptions;
  const { requireLogin, gate } = useLoginGate();
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const pending = useRef<Pending | null>(null);

  // A request that could not be delivered earlier (offline) goes out now.
  useEffect(() => {
    flushPendingPdfRequest();
  }, []);

  const requestDownload = useCallback(
    (save: Pending["save"], ctx: RequestContext) => {
      const base = { tool_name: ctx.tool, tool_page: normalizePage(window.location.pathname).page };
      pending.current = { save, ctx, base };
      setMounted(true);
      setOpen(true);
      track?.("Download Options Viewed", { ...base, logged_in: Boolean(getToken()) });
    },
    [track],
  );

  const dismiss = useCallback(() => {
    const p = pending.current;
    pending.current = null;
    setOpen(false);
    if (p) track?.("Download Options Dismissed", p.base);
  }, [track]);

  const chooseImage = useCallback(() => {
    const p = pending.current;
    pending.current = null;
    setOpen(false);
    if (!p) return;
    const meta: DownloadMeta = {
      ...p.base,
      download_option: "image_only",
      authentication_required: false,
      otp_verification_status: "not_required",
      pdf_requested: false,
    };
    track?.("Download Option Selected", { ...p.base, download_option: meta.download_option, authentication_required: false });
    p.save(meta);
  }, [track]);

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
        const meta: DownloadMeta = {
          ...p.base,
          download_option,
          authentication_required: verifiedNow,
          otp_verification_status: verifiedNow ? "verified" : "already_verified",
          pdf_requested: true,
        };
        p.save(meta);
        void recordPdfRequest({ ...p.ctx, exam: toSlug(p.ctx.exam), locale }).then((saved) =>
          track?.("Free PDF Requested", {
            ...p.base,
            download_option,
            otp_verification_status: meta.otp_verification_status,
            request_saved: saved,
          }),
        );
      },
    );
  }, [locale, requireLogin, track]);

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

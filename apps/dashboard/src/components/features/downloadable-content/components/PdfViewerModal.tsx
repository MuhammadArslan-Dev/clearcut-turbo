"use client";

import React, { useCallback, useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import DotsLoader from "@/components/ui/loader/DotsLoader";
import { useBackHandler } from "@/hooks/Global/useBackHandler";

// Phones (and the Facebook/Instagram in-app browsers most of our traffic
// arrives in) don't render a PDF inside an iframe — the old modal showed a
// blank box, which read as a dead "View PDF" tap (CC-105). There the browser's
// own PDF viewer in a new tab is the one that works; desktop keeps the modal.
const shouldOpenInNewTab = () =>
  typeof window !== "undefined" &&
  window.matchMedia("(max-width: 768px)").matches;

const HISTORY_KEY = "pdfViewer";

/**
 * Shared "View PDF" behaviour for the notes and papers pages.
 * `openPdf(url)` must be called straight from the click handler so the
 * new-tab open isn't treated as a popup.
 */
export function usePdfViewer() {
  const [url, setUrl] = useState<string | null>(null);

  const openPdf = useCallback((pdfUrl?: string | null) => {
    if (!pdfUrl) return;
    if (shouldOpenInNewTab()) {
      window.open(pdfUrl, "_blank", "noopener");
      return;
    }
    // One history entry per open, so Back closes the viewer instead of
    // leaving the page.
    window.history.pushState({ [HISTORY_KEY]: true }, "");
    setUrl(pdfUrl);
  }, []);

  const closeFromBack = useCallback(() => setUrl(null), []);

  const close = useCallback(() => {
    setUrl(null);
    // Drop the entry openPdf pushed, or the next Back would do nothing.
    if (window.history.state?.[HISTORY_KEY]) window.history.back();
  }, []);

  useBackHandler({ isOpen: url !== null, onClose: closeFromBack });

  const viewer = url ? <PdfViewerModal url={url} onClose={close} /> : null;

  return { openPdf, viewer };
}

function PdfViewerModal({ url, onClose }: { url: string; onClose: () => void }) {
  const t = useTranslations("common");
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 bg-black/60 z-[var(--z-modal)] flex items-center justify-center"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-white w-full sm:w-[90%] h-[85%] sm:h-[90%] rounded-lg overflow-hidden relative"
      >
        <button
          type="button"
          onClick={onClose}
          aria-label={t("close")}
          className="absolute top-2 right-2 z-10 flex min-h-11 min-w-11 items-center justify-center bg-white rounded shadow cursor-pointer"
        >
          ✕
        </button>

        {!loaded && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
            <DotsLoader size={48} />
            <p className="body-medium text-surface-gray-normal">{t("openingPdf")}</p>
          </div>
        )}

        <iframe
          src={url}
          onLoad={() => setLoaded(true)}
          className="w-full h-full"
          title="PDF Viewer"
        />
      </div>
    </div>
  );
}

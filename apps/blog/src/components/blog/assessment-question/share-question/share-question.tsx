"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Check, Link2, Share2 } from "lucide-react";
import { Button } from "@clearcut/ui/button";
import WhatsappIcon from "@clearcut/ui/icons/whatsapp-icon";
import { useIsMobile } from "@clearcut/hooks/use-is-mobile";
import { limitChars } from "@clearcut/utils/text-limit";
import { cn } from "@clearcut/ui/utils";
import { CustomBottomSheet, CustomModal } from "@/components/modals-bottom-sheet";
import { toPlainText } from "@/utils/plain-text";
import { questionShareUrl, whatsAppShareUrl } from "./share-url";

const COPIED_FEEDBACK_MS = 2500;
const SNIPPET_CHARS = 120;

const optionClass =
  "w-full flex items-center gap-3 rounded-lg border-2 border-[var(--color-border-gray-subtle)] p-3 text-left body-medium !font-semibold surface-text-gray-normal transition-colors hover:bg-[var(--color-background-gray-subtle)] outline-none focus-visible:ring-3 focus-visible:ring-ring/50";

export default function ShareQuestion({
  questionId,
  question,
  exam,
  chapterPath,
}: {
  questionId: number;
  question: string;
  exam?: string;
  /** "<level>/subject/<subject>/<chapter>" — the question's canonical chapter. */
  chapterPath?: string;
}) {
  const t = useTranslations("ShareQuestion");
  const locale = useLocale();
  const isMobile = useIsMobile();
  const [open, setOpen] = useState(false);
  const [url, setUrl] = useState("");
  const [copied, setCopied] = useState(false);
  const [copyFailed, setCopyFailed] = useState(false);
  const linkRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!copied) return;
    const timer = setTimeout(() => setCopied(false), COPIED_FEEDBACK_MS);
    return () => clearTimeout(timer);
  }, [copied]);

  const snippet = useMemo(() => (open ? limitChars(toPlainText(question), SNIPPET_CHARS) : ""), [open, question]);

  const openShare = () => {
    setUrl(
      questionShareUrl({
        origin: window.location.origin,
        locale,
        exam,
        chapterPath,
        fallbackPath: window.location.pathname,
        questionId,
      }),
    );
    setCopied(false);
    setCopyFailed(false);
    setOpen(true);
  };

  const copyLink = async () => {
    setCopyFailed(false);
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      return;
    } catch {
      // Clipboard API refused (permissions, in-app browsers): fall back to
      // copying from the visible link field.
    }
    const field = linkRef.current;
    field?.focus();
    field?.select();
    let ok = false;
    try {
      ok = document.execCommand("copy");
    } catch {
      ok = false;
    }
    setCopied(ok);
    // Leave the link selected so the visitor can copy it by hand.
    setCopyFailed(!ok);
  };

  const Container = isMobile ? CustomBottomSheet : CustomModal;

  return (
    <>
      <Button
        type="button"
        variant="soft"
        color="primary"
        size="sm"
        leftIcon={<Share2 size={14} aria-hidden="true" />}
        aria-haspopup="dialog"
        onClick={openShare}
      >
        {t("trigger")}
      </Button>

      <Container
        isOpen={open}
        onClose={() => setOpen(false)}
        isHeader
        accessible
        title={t("title")}
        subtitle={t("subtitle")}
        // The bottom sheet keeps its own full-width default on phones.
        maxWidth={isMobile ? undefined : "max-w-sm"}
        headerIcon={
          <span className="shrink-0 w-10 h-10 rounded-full flex items-center justify-center bg-[var(--color-primary-bg-soft)] text-brand">
            <Share2 size={18} aria-hidden="true" />
          </span>
        }
      >
        <div className="px-4 sm:px-6 pt-4 pb-6 space-y-3">
          <input
            ref={linkRef}
            readOnly
            value={url}
            aria-label={t("linkLabel")}
            onFocus={(e) => e.currentTarget.select()}
            className="w-full rounded-lg border border-[var(--color-border-gray-subtle)] bg-[var(--color-background-gray-subtle)] px-3 py-2 body-small !font-normal surface-text-gray-subtle outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
          />

          <button type="button" onClick={copyLink} className={cn(optionClass, copied && "border-[var(--color-answer-correct-border)]")}>
            {copied ? (
              <Check size={18} aria-hidden="true" className="text-[var(--color-answer-correct-border)]" />
            ) : (
              <Link2 size={18} aria-hidden="true" className="text-brand" />
            )}
            {copied ? t("copied") : t("copyLink")}
          </button>

          <a
            href={whatsAppShareUrl(t("whatsappMessage", { question: snippet }), url)}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => setOpen(false)}
            className={optionClass}
          >
            <WhatsappIcon size={18} color="currentColor" aria-hidden="true" className="text-[var(--color-success)]" />
            {t("whatsapp")}
          </a>

          {copyFailed && (
            <p role="alert" className="body-small !font-normal surface-text-gray-subtle">
              {t("copyFailed")}
            </p>
          )}
          <p aria-live="polite" className="sr-only">
            {copied ? t("copied") : ""}
          </p>
        </div>
      </Container>
    </>
  );
}

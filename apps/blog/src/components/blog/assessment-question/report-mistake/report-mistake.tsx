"use client";

import React, { useId, useMemo, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { Flag } from "lucide-react";
import { Button } from "@clearcut/ui/button";
import { useIsMobile } from "@clearcut/hooks/use-is-mobile";
import { cn } from "@clearcut/ui/utils";
import { CustomBottomSheet, CustomModal } from "@/components/modals-bottom-sheet";
import { REPORT_REASONS, validateMistakeReport, type MistakeReportErrors, type ReportReason } from "./report-reasons";
import { submitMistakeReport } from "./submit-mistake-report";
import { toPlainText } from "@/utils/plain-text";

const DETAILS_MAX_LENGTH = 1000;

export default function ReportMistake({ questionId, question }: { questionId: number; question: string }) {
  const t = useTranslations("ReportMistake");
  const isMobile = useIsMobile();
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState<ReportReason | null>(null);
  const [details, setDetails] = useState("");
  const [errors, setErrors] = useState<MistakeReportErrors>({});
  const [submitting, setSubmitting] = useState(false);

  const ids = { group: useId(), reasonError: useId(), details: useId(), detailsError: useId() };
  const firstReasonRef = useRef<HTMLInputElement>(null);
  const detailsRef = useRef<HTMLTextAreaElement>(null);
  const questionText = useMemo(() => (open ? toPlainText(question) : ""), [open, question]);

  const close = () => {
    setOpen(false);
    setReason(null);
    setDetails("");
    setErrors({});
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const found = validateMistakeReport(reason, details);
    setErrors(found);
    if (found.reason) return firstReasonRef.current?.focus();
    if (found.details) return detailsRef.current?.focus();

    setSubmitting(true);
    try {
      await submitMistakeReport({ questionId, reason: reason as ReportReason, details: details.trim() });
      close();
    } finally {
      setSubmitting(false);
    }
  };

  const isOther = reason === "other";
  const Container = isMobile ? CustomBottomSheet : CustomModal;

  return (
    <>
      <Button
        type="button"
        variant="soft"
        color="warning"
        size="sm"
        leftIcon={<Flag size={14} aria-hidden="true" />}
        aria-haspopup="dialog"
        onClick={() => setOpen(true)}
        className="border border-[var(--color-highlight-yellow-border)] bg-[var(--color-highlight-yellow-bg)] text-[var(--color-highlight-yellow-text)] hover:bg-[var(--color-highlight-yellow-bg)] hover:brightness-95"
      >
        {t("trigger")}
      </Button>

      <Container
        isOpen={open}
        onClose={close}
        isHeader
        accessible
        title={t("title")}
        subtitle={t("subtitle")}
        // The bottom sheet keeps its own full-width default on phones.
        maxWidth={isMobile ? undefined : "max-w-2xl"}
        headerIcon={
          <span className="shrink-0 w-10 h-10 rounded-full flex items-center justify-center bg-[var(--color-highlight-yellow-bg)] text-[var(--color-highlight-yellow-text)]">
            <Flag size={18} aria-hidden="true" />
          </span>
        }
      >
        <form onSubmit={onSubmit} noValidate className="px-4 sm:px-6 pt-4 pb-6 space-y-5">
          <div className="rounded-lg bg-[var(--color-background-gray-subtle)] p-3 space-y-1">
            <p className="body-small !font-semibold surface-text-gray-normal">{t("questionLabel")}</p>
            <p className="body-medium !font-normal surface-text-gray-subtle line-clamp-3">{questionText}</p>
          </div>

          <fieldset aria-describedby={errors.reason ? ids.reasonError : undefined}>
            <legend id={ids.group} className="body-small !font-semibold uppercase tracking-wide surface-text-gray-muted mb-2">
              {t("reasonLabel")}
            </legend>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {REPORT_REASONS.map((key, i) => (
                <label
                  key={key}
                  className={cn(
                    "flex flex-col gap-0.5 rounded-lg border-2 p-3 cursor-pointer transition-colors",
                    "border-[var(--color-border-gray-subtle)] hover:bg-[var(--color-background-gray-subtle)]",
                    "has-[:focus-visible]:ring-3 has-[:focus-visible]:ring-ring/50",
                    reason === key && "border-[var(--color-brand)] bg-[var(--color-primary-bg-soft)] hover:bg-[var(--color-primary-bg-soft)]",
                  )}
                >
                  <input
                    ref={i === 0 ? firstReasonRef : undefined}
                    type="radio"
                    name={ids.group}
                    value={key}
                    checked={reason === key}
                    onChange={() => {
                      setReason(key);
                      setErrors((prev) => ({ ...prev, reason: undefined, details: undefined }));
                    }}
                    className="sr-only"
                  />
                  <span className={cn("body-medium !font-semibold", reason === key ? "text-brand" : "surface-text-gray-normal")}>
                    {t(`reasons.${key}.title`)}
                  </span>
                  <span className="body-small !font-normal surface-text-gray-muted">{t(`reasons.${key}.description`)}</span>
                </label>
              ))}
            </div>
            {errors.reason && (
              <p id={ids.reasonError} role="alert" className="mt-2 body-small !font-normal text-[var(--color-danger)]">
                {t("errors.reason")}
              </p>
            )}
          </fieldset>

          <div className="space-y-2">
            <div className="flex items-baseline justify-between gap-2">
              <label htmlFor={ids.details} className="body-medium !font-semibold surface-text-gray-normal">
                {t("detailsLabel")}{" "}
                {!isOther && <span className="!font-normal surface-text-gray-muted">{t("optional")}</span>}
              </label>
              {isOther && <span className="body-small !font-semibold text-[var(--color-warning)]">{t("otherHint")}</span>}
            </div>
            <textarea
              ref={detailsRef}
              id={ids.details}
              rows={3}
              maxLength={DETAILS_MAX_LENGTH}
              value={details}
              onChange={(e) => {
                setDetails(e.target.value);
                if (errors.details) setErrors((prev) => ({ ...prev, details: undefined }));
              }}
              placeholder={isOther ? t("placeholderOther") : t("placeholder")}
              required={isOther}
              aria-invalid={Boolean(errors.details)}
              aria-describedby={errors.details ? ids.detailsError : undefined}
              className={cn(
                "w-full rounded-lg border-2 bg-white p-3 body-medium !font-normal surface-text-gray-normal resize-y outline-none transition-colors",
                "border-[var(--color-border-gray-subtle)] focus:border-[var(--color-brand)]",
                errors.details && "border-[var(--color-danger)]",
              )}
            />
            {errors.details && (
              <p id={ids.detailsError} role="alert" className="body-small !font-normal text-[var(--color-danger)]">
                {t("errors.details")}
              </p>
            )}
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-[var(--color-border-gray-subtle)]">
            <Button type="button" variant="plain" color="gray" onClick={close}>
              {t("cancel")}
            </Button>
            <Button type="submit" variant="solid" color="primary" loading={submitting} sx={{ borderRadius: "50px" }}>
              {t("submit")}
            </Button>
          </div>
        </form>
      </Container>
    </>
  );
}

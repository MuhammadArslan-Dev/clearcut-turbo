"use client";

import React, { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import Button from "@clearcut/ui/button";
import { trackEvent } from "@/lib/analytics/browser";
import { supportWhatsAppUrl } from "@/lib/support";
import { useAuth } from "@/providers/AuthProvider";

export type CancelReason =
  | "exam_over"
  | "expensive"
  | "no_time"
  | "content"
  | "no_autopay"
  | "other";

const REASONS: CancelReason[] = ["exam_over", "expensive", "no_time", "content", "no_autopay", "other"];

type Offer = "pause" | "whatsapp" | "autopay_info" | "congrats" | null;

/**
 * One offer per reason (CC-97). Only offers that map to an action that
 * already exists: pause, WhatsApp, or plain information. "Too expensive"
 * gets no offer until RD decides one (discount / plan switch).
 */
const offerFor = (reason: CancelReason, canPause: boolean): Offer => {
  if (reason === "no_time") return canPause ? "pause" : null;
  if (reason === "content") return "whatsapp";
  if (reason === "no_autopay") return "autopay_info";
  if (reason === "exam_over") return "congrats";
  return null;
};

export default function CancelFlowContent({
  subscriptionId,
  courseName,
  canPause,
  loading,
  result,
  onCancel,
  onPause,
  onClose,
}: {
  subscriptionId: number | string;
  courseName: string;
  canPause: boolean;
  loading: boolean;
  /** Set once the cancel/pause went through: the backend's own message (it carries the access end date). */
  result: { action: "cancel" | "pause"; message: string } | null;
  onCancel: (reason: CancelReason, note: string) => void;
  onPause: (reason: CancelReason) => void;
  onClose: () => void;
}) {
  const t = useTranslations("subscriptionsTab");
  const { user } = useAuth();
  const [step, setStep] = useState<"reason" | "offer" | "confirm">("reason");
  const [reason, setReason] = useState<CancelReason | null>(null);
  const [note, setNote] = useState("");
  const offer = reason ? offerFor(reason, canPause) : null;
  const props = { subscription_id: String(subscriptionId), course_name: courseName };

  useEffect(() => {
    trackEvent("Cancel Started", props);
    // once per opening
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const goNext = () => {
    if (!reason) return;
    trackEvent("Cancel Reason Selected", { ...props, reason });
    if (offer && offer !== "congrats") {
      trackEvent("Save Offer Shown", { ...props, reason, offer });
      setStep("offer");
    } else {
      setStep("confirm");
    }
  };

  if (result) {
    return (
      <div className="p-6 space-y-5" role="status">
        <div className="space-y-1.5">
          <p className="font-semibold text-surface-gray-normal">
            {result.action === "pause" ? t("doneTitle_pause") : t("doneTitle_cancel")}
          </p>
          <p className="text-sm text-surface-gray-subtle leading-relaxed">{result.message}</p>
        </div>
        <Button onClick={onClose} variant="solid" fullWidth rounded="12px">
          {t("done")}
        </Button>
      </div>
    );
  }

  if (step === "reason") {
    return (
      <div className="p-6 space-y-4">
        <p className="font-semibold text-surface-gray-normal">{t("cancelReasonTitle")}</p>
        <div className="space-y-2" role="radiogroup" aria-label={t("cancelReasonTitle")}>
          {REASONS.map((r) => (
            <button
              key={r}
              type="button"
              role="radio"
              aria-checked={reason === r}
              onClick={() => setReason(r)}
              className={`flex w-full items-center justify-between gap-3 rounded-xl border px-4 py-3 text-left text-sm cursor-pointer ${
                reason === r ? "border-brand bg-brand/5 font-semibold" : "border-[var(--border-gray-normal)]"
              }`}
            >
              <span>{t(`reason_${r}`)}</span>
              <span
                className={`shrink-0 h-4 w-4 rounded-full border ${
                  reason === r ? "border-[5px] border-brand" : "border-gray-400"
                }`}
              />
            </button>
          ))}
        </div>
        {reason === "other" && (
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value.slice(0, 300))}
            placeholder={t("otherPlaceholder")}
            rows={3}
            className="w-full rounded-xl border border-[var(--border-gray-normal)] p-3 text-sm"
          />
        )}
        <div className="flex gap-3">
          <Button onClick={onClose} variant="outlined" color="neutral" fullWidth rounded="12px">
            {t("back")}
          </Button>
          <Button onClick={goNext} disabled={!reason} variant="solid" fullWidth rounded="12px">
            {t("continue")}
          </Button>
        </div>
      </div>
    );
  }

  if (step === "offer" && reason && offer) {
    const accept = () => {
      trackEvent("Save Offer Accepted", { ...props, reason, offer });
      if (offer === "pause") onPause(reason);
      if (offer === "whatsapp") {
        window.open(
          supportWhatsAppUrl(t("whatsappMessage", { course: courseName, phone: user?.phone ?? "" })),
          "_blank",
          "noopener",
        );
        onClose();
      }
    };
    return (
      <div className="p-6 space-y-5">
        <div className="space-y-1.5">
          <p className="font-semibold text-surface-gray-normal">{t(`offer_${offer}_title`)}</p>
          <p className="text-sm text-surface-gray-subtle leading-relaxed">{t(`offer_${offer}_body`)}</p>
        </div>
        <div className="flex flex-col gap-3">
          {offer !== "autopay_info" && (
            <Button onClick={accept} loading={loading} disabled={loading} variant="solid" fullWidth rounded="12px">
              {t(`offer_${offer}_cta`)}
            </Button>
          )}
          <Button
            onClick={() => setStep("confirm")}
            disabled={loading}
            variant="outlined"
            color="danger"
            fullWidth
            rounded="12px"
          >
            {offer === "autopay_info" ? t("confirm_cancel") : t("cancelAnyway")}
          </Button>
        </div>
      </div>
    );
  }

  // confirm
  return (
    <div className="p-6 space-y-5">
      <div className="space-y-1.5">
        {reason === "exam_over" && <p className="font-semibold text-surface-gray-normal">{t("congrats")}</p>}
        <p className="font-semibold text-surface-gray-normal">
          {t("confirmTitle", { action: t("action_cancel") })}
        </p>
        <p className="text-sm text-surface-gray-subtle leading-relaxed">{t("desc_cancel")}</p>
      </div>
      <div className="flex gap-3">
        <Button onClick={onClose} disabled={loading} variant="outlined" color="neutral" fullWidth rounded="12px">
          {t("back")}
        </Button>
        <Button
          onClick={() => reason && onCancel(reason, note.trim())}
          disabled={loading}
          loading={loading}
          color="danger"
          variant="solid"
          fullWidth
          rounded="12px"
        >
          {t("confirm_cancel")}
        </Button>
      </div>
    </div>
  );
}

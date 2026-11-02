"use client";

import React, { useMemo } from "react";
import { AnimatePresence } from "framer-motion";
import { useTranslations } from "next-intl";
import { BottomSheet } from "@/components/features/Sheets/BottomSheet";
import { Modal } from "@/components/features/Sheets/Modal";
import ShimmerButton from "@/components/ui/button/shimmer-button";
import { CrossIcon, LockIcon } from "@/components/ui/icons";
import { useIsMobile } from "@/hooks/useIsMobile";

/**
 * CC-168: "Autopay didn't go through? Pay once." One button and no plan
 * choice: same exam, the one-time monthly pack. Built like ContinueFreeSheet.
 */
export default function AutopayFallbackSheet({
  isOpen,
  price,
  busy,
  statusText,
  error,
  onPay,
  onClose,
}: {
  isOpen: boolean;
  price: number;
  /** A checkout is opening or a payment is being confirmed. */
  busy: boolean;
  statusText?: string;
  error?: string | null;
  onPay: () => void;
  onClose: () => void;
}) {
  const t = useTranslations("payment.autopayFallback");
  const isMobile = useIsMobile();
  const Container = useMemo(() => (isMobile ? BottomSheet : Modal), [isMobile]);
  const close = () => {
    if (!busy) onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <Container isHeader={false} isOpen={isOpen} onClose={close}>
          <div className="p-4 flex flex-col gap-6">
            <div className="flex justify-between items-start gap-4">
              <div className="flex flex-col gap-1">
                <h6 className="heading-medium !font-semibold">{t("title")}</h6>
                <p className="body-small text-surface-gray-muted">{t("subtitle")}</p>
              </div>
              <button className="cursor-pointer" onClick={close} aria-label="Close">
                <CrossIcon />
              </button>
            </div>

            <div className="flex flex-col items-center gap-2">
              <ShimmerButton
                onClick={onPay}
                size="lg"
                loading={busy}
                iconPosition="right"
                icon={<LockIcon variant="without-key" size={16} color="white" />}
                text={t("cta", { price: `₹${price}` })}
              />
              {busy && statusText && (
                <p className="body-small text-surface-gray-muted" aria-live="polite">
                  {statusText}
                </p>
              )}
              {error && (
                <p className="body-small text-[var(--color-danger)] text-center" role="alert">
                  {error}
                </p>
              )}
              {!busy && (
                <button
                  type="button"
                  onClick={close}
                  className="body-medium text-surface-gray-muted underline underline-offset-4 py-2 cursor-pointer"
                >
                  {t("notNow")}
                </button>
              )}
            </div>
          </div>
        </Container>
      )}
    </AnimatePresence>
  );
}

"use client";

import React, { useEffect, useMemo, useState } from "react";
import { AnimatePresence } from "framer-motion";
import { useTranslations } from "next-intl";
import { BottomSheet } from "@/components/features/Sheets/BottomSheet";
import { Modal } from "@/components/features/Sheets/Modal";
import ShimmerButton from "@/components/ui/button/shimmer-button";
import OptionSelectionCard from "@/components/ui/cards/option-selection-card";
import { CrossIcon } from "@/components/ui/icons";
import { useIsMobile } from "@/hooks/useIsMobile";

export type ContinueFreeReason = "expensive" | "exploring" | "later" | "payment_issue" | "skipped";

const REASONS: Exclude<ContinueFreeReason, "skipped">[] = ["expensive", "exploring", "later", "payment_issue"];

/**
 * CC-63: one optional question when a student leaves the payment page for
 * free learning. Built exactly like LanguageModal (the design system's
 * "pick one" sheet): BottomSheet/Modal, heading + close, OptionSelectionCard
 * rows, ShimmerButton to confirm. Continue / Skip leave at once; "payment
 * issue" opens WhatsApp help and keeps the student here; close stays.
 */
export default function ContinueFreeSheet({
  isOpen,
  onAnswer,
  onClose,
}: {
  isOpen: boolean;
  onAnswer: (reason: ContinueFreeReason) => void;
  onClose: () => void;
}) {
  const t = useTranslations("modals.unlockFullAccessModal");
  const rootT = useTranslations("");
  const isMobile = useIsMobile();
  const Container = useMemo(() => (isMobile ? BottomSheet : Modal), [isMobile]);
  const [selected, setSelected] = useState<Exclude<ContinueFreeReason, "skipped"> | null>(null);

  // Fresh choice every time the sheet opens.
  useEffect(() => {
    if (isOpen) setSelected(null);
  }, [isOpen]);

  return (
    <AnimatePresence>
      {isOpen && (
        <Container isHeader={false} isOpen={isOpen} onClose={onClose}>
          <div className="p-4 flex flex-col gap-6">
            {/* Header */}
            <div className="flex justify-between items-center">
              <h6 className="heading-medium !font-semibold">{t("continueFreeReasonTitle")}</h6>
              <button className="cursor-pointer" onClick={onClose} aria-label="Close">
                <CrossIcon />
              </button>
            </div>

            {/* Reasons */}
            <div className="grid grid-cols-1 gap-4">
              {REASONS.map((reason) => (
                <OptionSelectionCard
                  key={reason}
                  content={<p>{t(`continueFreeReason_${reason}`)}</p>}
                  selected={selected === reason}
                  showIcon
                  onClick={() => setSelected(reason)}
                />
              ))}
            </div>

            <div className="flex flex-col gap-2">
              <ShimmerButton
                text={rootT("actions.continue")}
                onClick={() => selected && onAnswer(selected)}
                size="md"
                gap={4}
                iconPosition="right"
                disabled={!selected}
              />
              <button
                type="button"
                onClick={() => onAnswer("skipped")}
                className="body-medium text-surface-gray-muted underline underline-offset-4 py-2 cursor-pointer self-center"
              >
                {t("continueFreeSkip")}
              </button>
            </div>
          </div>
        </Container>
      )}
    </AnimatePresence>
  );
}

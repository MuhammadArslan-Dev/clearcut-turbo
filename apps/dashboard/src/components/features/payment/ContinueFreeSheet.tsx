"use client";

import React, { useMemo } from "react";
import { AnimatePresence } from "framer-motion";
import { useTranslations } from "next-intl";
import { Button } from "@clearcut/ui/button";
import { BottomSheet } from "@/components/features/Sheets/BottomSheet";
import { Modal } from "@/components/features/Sheets/Modal";
import ModalHeader from "@/components/features/test-series/components/ModalHeader";
import { useIsMobile } from "@/hooks/useIsMobile";

export type ContinueFreeReason = "expensive" | "exploring" | "later" | "payment_issue" | "skipped";

const REASONS: Exclude<ContinueFreeReason, "skipped">[] = ["expensive", "exploring", "later", "payment_issue"];

/**
 * CC-63: one optional question when a student leaves the payment page for
 * free learning. Same shell as the app's other sheets (BottomSheet on
 * mobile, Modal on desktop, ModalHeader) — see ExamEndConfirmationSheet.
 * Any answer (or Skip) leaves at once; "payment issue" opens WhatsApp help
 * and keeps the student here; the close button / backdrop just stays.
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
  const isMobile = useIsMobile();
  const Container = useMemo(() => (isMobile ? BottomSheet : Modal), [isMobile]);

  return (
    <AnimatePresence>
      <Container isHeader={false} isOpen={isOpen} maxWidth="md:max-w-[420px]" onClose={onClose}>
        <div className="bg-white flex flex-col">
          <ModalHeader title={t("continueFreeReasonTitle")} onClose={onClose} />

          <div className="px-3 pb-2 flex flex-col gap-2">
            {REASONS.map((reason) => (
              <Button
                key={reason}
                onClick={() => onAnswer(reason)}
                fullWidth
                size="md"
                variant="outlined"
                color="gray"
                sx={{ borderRadius: "50px" }}
              >
                {t(`continueFreeReason_${reason}`)}
              </Button>
            ))}
          </div>

          <div className="px-3 pb-4 flex justify-center">
            <button
              type="button"
              onClick={() => onAnswer("skipped")}
              className="body-medium text-surface-gray-muted underline underline-offset-4 py-2 px-3 cursor-pointer"
            >
              {t("continueFreeSkip")}
            </button>
          </div>
        </div>
      </Container>
    </AnimatePresence>
  );
}

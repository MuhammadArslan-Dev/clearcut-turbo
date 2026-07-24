'use client';
import React, { useMemo, useCallback } from "react";
import { useIsMobile } from "@/hooks/useIsMobile";
import { useCourseStore } from "@/store/course/useCourseStore";

import {
  AlertCircleIcon,
  LockIcon,
} from "@/components/ui/icons";
import { AnimatePresence } from "framer-motion";
import ShimmerButton from "@/components/ui/button/shimmer-button";
import { Button } from "@mui/joy";
import { highlightTextUtil } from "@/utils/text/highlightTextUtil";
import { useTranslations } from "next-intl";
import { useRazorpayPayment } from "@/hooks/payment/useRazorpayPayment";
import { BottomSheet } from "@/components/features/Sheets/BottomSheet";
import { Modal } from "@/components/features/Sheets/Modal";
import { useDrawerBackHandler } from "@/hooks/Global/useDrawerBackHandler";

const FEATURES = [
  { text: "noTests", highlight: "noTestsNote" },
  { text: "noNotes", highlight: "noNotesNote" },
] as const;

export default function PaymentFailedWarningModal() {
  const { isOpen, data, close, mode, open } = useCourseStore();
  const modalT = useTranslations("payment");
  const isMobile = useIsMobile();
  useDrawerBackHandler();

  /* ---------------------------------- container (stable) ---------------------------------- */
  const Container = useMemo(
    () => (isMobile ? BottomSheet : Modal),
    [isMobile]
  );

  /* ---------------------------------- payment hook ---------------------------------- */
  const { handlePayment, loading } = useRazorpayPayment({
    examId: data?.id!,
    examName: data?.short_name!,
    price: Number(data?.price),
    onClose: close,
    onSuccess: () => open("payment-success", data!),
    onFailure: () => open("payment-failed", data!),
  });

  /* ---------------------------------- derived values ---------------------------------- */
  const examTitle = useMemo(
    () => `${data?.short_name ?? ""} Exam`,
    [data?.short_name]
  );

  /* ---------------------------------- handlers ---------------------------------- */
  const handleRetryPayment = useCallback(() => {
    handlePayment();
  }, [handlePayment]);

  /* ---------------------------------- render ---------------------------------- */
  return (
    <AnimatePresence>
      {isOpen && mode === "payment-failed-warning" && (
        <Container
          maxWidth="max-w-[450px] !rounded-t-lg"
          isHeader={true}
          maxHeight="max-h-[95vh]"
          title={modalT("paymentWarning.title")}
          isOpen
          onClose={close}
        >
          <div className="h-full flex flex-col justify-between md:gap-2">
            {/* Content */}
            <div className="w-full flex flex-col items-center justify-center gap-4 py-4">
              <div className="max-w-[352px] w-full flex flex-col gap-5 bg-white p-4 rounded-lg">
                <div className="flex flex-col gap-8">
                  <div className="flex flex-col items-center gap-4">
                    <div className="heading-large !font-semibold text-surface-gray-normal">
                      {modalT("paymentWarning.subtitle", {
                        exam: examTitle,
                      })}
                    </div>

                    <div className="flex flex-col gap-2">
                      <div className="flex items-center gap-2">
                        <AlertCircleIcon size={20} />
                        <div className="text-surface-gray-muted body-medium flex-1">
                          {highlightTextUtil(
                            modalT("paymentWarning.noVideos"),
                            [modalT("paymentWarning.noVideosNotes")],
                            "body-medium !font-semibold text-surface-gray-subtle"
                          )}
                        </div>
                      </div>

                      {FEATURES.map(({ text, highlight }) => (
                        <div key={text} className="flex items-center gap-2">
                          <AlertCircleIcon size={20} />
                          <div className="text-surface-gray-muted body-medium flex-1">
                            {highlightTextUtil(
                              `${modalT(
                                `paymentWarning.${text}`
                              )} ${modalT(
                                `paymentWarning.${highlight}`
                              )}`,
                              [modalT(`paymentWarning.${highlight}`)],
                              "body-medium !font-semibold text-surface-gray-subtle"
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="sticky bottom-0 z-10 px-3 py-2 bg-white">
              <div className="w-full flex flex-col items-center gap-2">
                <div className="w-full flex flex-col items-center gap-1">
                  <div className="w-full max-w-[400px]">
                    <ShimmerButton
                      onClick={handleRetryPayment}
                      loading={loading}
                      size="lg"
                      iconPosition="right"
                      icon={
                        <LockIcon
                          variant="without-key"
                          size={16}
                          color="white"
                        />
                      }
                      text={modalT("paymentWarning.unlockNow", {
                        exam: examTitle,
                      })}
                    />
                  </div>
                </div>

                <div className="w-full max-w-[400px]">
                  <Button
                    onClick={close}
                    fullWidth
                    size="sm"
                    sx={{ borderRadius: "50px" }}
                    color="gray"
                    variant="soft"
                  >
                    <div className="flex items-center gap-2">
                      <span>
                        {modalT("paymentWarning.continueFree")}
                      </span>
                    </div>
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </Container>
      )}
    </AnimatePresence>
  );
}

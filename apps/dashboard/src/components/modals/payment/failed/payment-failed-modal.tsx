import React, { useMemo, useCallback } from "react";
import { useIsMobile } from "@/hooks/useIsMobile";
import { useCourseStore } from "@/store/course/useCourseStore";
import {
  AlertCircleIcon,
  ArrowIcon,
  ClockIcon,
  LockIcon,
} from "@/components/ui/icons";
import { AnimatePresence } from "framer-motion";
import ShimmerButton from "@/components/ui/button/shimmer-button";
import { TrophyIcon } from "lucide-react";
import { highlightTextUtil } from "@/utils/text/highlightTextUtil";
import { Button } from "@clearcut/ui/button";
import { useTranslations } from "next-intl";
import { useRazorpayPayment } from "@/hooks/payment/useRazorpayPayment";
import { useModalStore } from "@/store/modal/useModalStore";
import { Modal } from "@/components/features/Sheets/Modal";
import { DrawerSheet } from "@/components/features/Sheets/DrawerSheet";
import { useDrawerBackHandler } from "@/hooks/Global/useDrawerBackHandler";

const FEATURES = [
  "Watch videos",
  "Download notes",
  "Attempt Mini-Tests",
] as const;


export default function PaymentFailedModal() {
  const { isOpen, data, close, mode, open: openCourseModal } =
    useCourseStore();
  const openGlobalModal = useModalStore((state) => state.open);
  const modalT = useTranslations("payment");
  const isMobile = useIsMobile();
  useDrawerBackHandler();

  /* ---------------------------------- container (stable) ---------------------------------- */
  const Container = useMemo(
    () => (isMobile ? DrawerSheet : Modal),
    [isMobile]
  );

  /* ---------------------------------- derived values ---------------------------------- */
  const examTitle = useMemo(
    () => `${data?.short_name ?? ""} Exam`,
    [data?.short_name]
  );

  const price = useMemo(
    () => Number(data?.price) ?? 0,
    [data?.price]
  );

  /* ---------------------------------- payment hook ---------------------------------- */
  const { handlePayment, loading } = useRazorpayPayment({
    examId: data?.id!,
    examName: data?.short_name!,
    price,
    onClose: close,
    onSuccess: () => openCourseModal("payment-success", data!),
    onFailure: () => openCourseModal("payment-failed", data!),
  });

  /* ---------------------------------- handlers ---------------------------------- */
  const handleBack = useCallback(() => {
    openCourseModal("payment-failed-warning", data!);
  }, [openCourseModal, data]);

  const handleRetryPayment = useCallback(() => {
    handlePayment();
  }, [handlePayment]);

  const handleNeedHelp = useCallback(() => {
    close();
    openGlobalModal("helpsport");
  }, [close, openGlobalModal]);

  /* ---------------------------------- render ---------------------------------- */
  return (
    <AnimatePresence>
      {isOpen && mode === "payment-failed" && (
        <Container
          maxWidth="max-w-[600px] !rounded-t-lg"
          isHeader={false}
          maxHeight="max-h-[95vh]"
          isOpen
          onClose={handleBack}
        >
          <div className="bg-gray-100 h-full flex flex-col min-h-[80vh] justify-between md:gap-2">
            {/* Header */}
            <div className="sticky top-0 z-10 flex gap-4 px-3 py-4 bg-white">
              <button
                type="button"
                onClick={handleBack}
                className="cursor-pointer"
                aria-label="Go back"
              >
                <ArrowIcon />
              </button>

              <div>
                <div className="heading-medium !font-semibold text-surface-gray-normal">
                  {modalT("almostThere")}
                </div>
                <div className="body-small !font-normal text-surface-gray-muted">
                  {modalT("dontMiss", { exam: examTitle })}
                </div>
              </div>
            </div>

            {/* Content */}
            <div className="w-full flex flex-col items-center justify-center gap-4">
              <div className="max-w-[352px] w-full flex flex-col gap-5 bg-white p-4 rounded-lg">
                <div className="flex flex-col gap-8">
                  <div className="flex flex-col items-center gap-4">
                    <AlertCircleIcon size={48} />

                    <div className="text-center">
                      <div className="heading-large !font-semibold text-surface-gray-normal">
                        {modalT("notCompletedTitle")}
                      </div>
                      <p className="body-small text-surface-gray-muted">
                        {modalT("notCompletedDesc")}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="max-w-[352px] w-full flex flex-col gap-5 bg-white p-4 rounded-lg">
                <div className="p-3 flex flex-col items-center bg-[var(--background-gray-subtle)] rounded-md gap-1">
                  <div className="body-small text-surface-gray-muted flex items-center gap-1">
                    {highlightTextUtil(
                      modalT("priceNote", { amount: price }),
                      `₹${price}`,
                      "heading-xlarge !font-semibold text-surface-gray-normal"
                    )}
                  </div>

                  <p className="body-small text-surface-gray-subtle flex items-center gap-2">
                    <div className="w-8 h-8">
                      <TrophyIcon
                        size={20}
                        color="var(--color-surface-gray-subtle)"
                      />
                    </div>

                    <div className="body-small text-surface-gray-subtle">
                      <span>
                        {highlightTextUtil(
                          modalT("benefits.watched", { count: 1 }),
                          [
                            modalT("benefits.watchedHighlight", {
                              count: 1,
                            }),
                          ],
                          "body-small !font-semibold text-surface-gray-subtle"
                        )}
                      </span>{" "}
                      <span>
                        {modalT("benefits.consistency", {
                          exam: examTitle,
                        })}
                      </span>
                    </div>
                  </p>

                  <div className="flex items-center gap-1">
                    <div className="w-5 h-5">
                      <ClockIcon
                        variant="alrem-clock"
                        size={20}
                        color="var(--color-surface-gray-subtle)"
                      />
                    </div>
                    <p className="body-small text-surface-gray-subtle">
                      {modalT("benefits.urgency", { exam: examTitle })}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="sticky bottom-0 z-10 px-3 py-2 bg-white">
              <div className="w-full flex flex-col items-center gap-4">
                <div className="w-full flex flex-col items-center gap-1">
                  <div className="w-full max-w-[400px]">
                    <ShimmerButton
                      onClick={handleRetryPayment}
                      size="lg"
                      loading={loading}
                      iconPosition="right"
                      icon={
                        <LockIcon
                          variant="without-key"
                          size={16}
                          color="white"
                        />
                      }
                      text={modalT("completePayment", {
                        exam: examTitle,
                      })}
                    />
                  </div>

                  <div className="flex body-small items-center gap-2 text-surface-gray-muted">
                    <div className="flex items-center gap-2">
                      <AlertCircleIcon
                        size={16}
                        color="var(--color-surface-gray-muted)"
                      />
                      <p>
                        {modalT("benefits.consistency", {
                          exam: examTitle,
                        })}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="w-full max-w-[400px]">
                  <Button
                    onClick={handleNeedHelp}
                    fullWidth
                    size="sm"
                    sx={{ borderRadius: "50px" }}
                    color="gray"
                    variant="soft"
                  >
                    <div className="flex items-center gap-2">
                      <span>{modalT("needHelp")}</span>
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

import React, { useCallback, useMemo } from "react";
import { useExamModalStore } from "../../store/useExamModalStore";
import { useIsMobile } from "@/hooks/useIsMobile";
import { BottomSheet } from "@/components/features/Sheets/BottomSheet";
import { Modal } from "@/components/features/Sheets/Modal";
import { AnimatePresence } from "framer-motion";
import ModalHeader from "@/components/features/test-series/components/ModalHeader";
import { Button } from "@clearcut/ui/button";
import {
  AlertCircleIcon,
  ArrowIcon,
  ChevronIcon,
  WarningCircleIcon,
} from "@/components/ui/icons";
import Text from "@clearcut/ui/text";
import WarningCirleIcon from "@/components/ui/icons/warning-circle-icon";
import { useExamSubmitStore } from "../../store/useExamSubmitStore";
import { useExamStore } from "../../store/useExamStore";
import { apiFetch } from "@/lib/api/client";
import { useTranslations } from "next-intl";
import { trackTestSubmitted } from "@/lib/analytics/testFunnel";

const endExamApi = async ({ examId }: { examId: string }) => {
  return apiFetch<{ data: { exam: { type: string | null }; result?: Record<string, number> | null } }>(
    `/v2/exam/end-exam/${examId}`,
    {
      method: "POST",
      cache: "no-store",
    },
  );
};

export default function ExamEndConfirmationSheet() {
  const { isOpen, closeModal, stack } = useExamModalStore();
  const isMobile = useIsMobile();
  const t = useTranslations("modals.examSubmission");

  const active = stack[stack.length - 1];
  const { exam, language, getStats } = useExamStore();

  const Container = useMemo(() => (isMobile ? BottomSheet : Modal), [isMobile]);

  const { answered, total, review, visited, notVisited } = getStats();

  const handleClose = useCallback(() => {
    closeModal("end-exam");
  }, [closeModal]);

  const endExam = useCallback(async () => {
    // The "checking your answers" animation (mainContent.tsx) plays while the request below is in flight, then
    // opens the report. begin() refuses when the timer expiry is already submitting.
    const started = useExamSubmitStore
      .getState()
      .begin({ courseCode: exam?.course?.group_code, examId: exam?.uuid, type: exam?.type }, getStats().total);
    handleClose();
    if (!started) return;

    // Reads the type from end-exam's own response, not exam?.type from the store: useGetExam only populates the
    // store once its query for THIS examId resolves, and "End Test" is reachable from the very first paint (it's
    // in the always-mounted layout Topbar, not gated behind MainContent's isLoading). Ending a test quickly could
    // read the PREVIOUS exam's leftover type, sending testType (and therefore which tab/section list renders) to
    // the wrong place after redirect.
    let examType: string | null = exam?.type ?? null;
    try {
      const res = await endExamApi({ examId: exam?.uuid! });
      examType = res.data.exam.type;
      trackTestSubmitted(exam, res, "manual", language);
    } catch (error) {
      console.error("End exam failed:", error);
    }
    useExamSubmitStore.getState().settle(examType);
  }, [handleClose, exam, language, getStats]);

  return (
    <AnimatePresence>
      <Container
        isHeader={false}
        isOpen={isOpen}
        maxWidth="md:max-w-[420px]"
        onClose={() => handleClose()}
      >
        <div className="bg-white min-h-[20dvh] max-h-[90dvh] flex flex-col justify-between">
          {/* Header */}
          <ModalHeader
            title={t("title")}
            subtitle={t("description")}
            onClose={() => handleClose()}
          />

          {/* main content  */}
          <div className="p-3 flex flex-col md:items-center gap-2">
            <Text as="p" variant="body-medium" weight="normal">
              {t("answeredProgress", { answered, total })}
            </Text>
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-2">
                <div>
                  <WarningCircleIcon color="var(--icon-negative-normal)" />
                </div>
                <Text
                  as="p"
                  variant="body-medium"
                  weight="normal"
                  className="!text-[var(--icon-negative-normal)]"
                >
                  {t("unanswered", { count: notVisited })}

                </Text>
              </div>
              <div className="flex items-center gap-2">
                <div>
                  <AlertCircleIcon
                    variant="triangle"
                    color="var(--icon-notice-normal)"
                  />
                </div>
                <Text
                  as="p"
                  variant="body-medium"
                  weight="normal"
                  className="!text-[var(--icon-notice-normal)]"
                >
                  {t("markedForReview", { count: review })}
                </Text>
              </div>
            </div>
          </div>

          {/* Footer  */}
          <Footer
            submitTest={() => {
              endExam();
            }}
            close={() => handleClose()}
          />
        </div>
      </Container>
    </AnimatePresence>
  );
}

const Footer = ({
  submitTest,
  close,
}: {
  submitTest: () => void;
  close: () => void;
}) => {
  const t = useTranslations("modals.examSubmission");

  return (
    <div className="sticky bottom-0 px-3 py-3 bg-white">
      <div className="flex flex-col gap-2 max-w-[336px] mx-auto">
        <div className="flex flex-col gap-1 items-center">
          <div className="max-w-[336px] w-full">
            <Button
              onClick={() => submitTest()}
              fullWidth
              size="lg"
              color="danger"
              sx={{ borderRadius: "50px" }}
            >
              <div className="flex items-center gap-2">
                <span className="">{t("submitButton")}</span>
                <ChevronIcon size={20} type="double" variant="right" />{" "}
              </div>
            </Button>
          </div>

          <div className="flex items-center gap-1">
            <WarningCirleIcon />

            <Text
              as="p"
              variant="body-small"
              weight="normal"
              color="gray-muted"
            >
              {t("reattemptInfo")}
            </Text>
          </div>
        </div>

        <div>
          <Button
            variant="soft"
            color="gray"
            fullWidth
            onClick={() => close()}
            sx={{ borderRadius: "50px" }}
          >
            <div className="flex items-center gap-1">
              <ArrowIcon size={20} variant="left" />{" "}
              <span className="">{t("continueButton")}</span>
            </div>
          </Button>
        </div>
      </div>
    </div>
  );
};

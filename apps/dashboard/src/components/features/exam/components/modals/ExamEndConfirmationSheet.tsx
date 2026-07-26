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
import { useRouter } from "@/i18n/navigation";
import { useExamStore } from "../../store/useExamStore";
import { apiFetch } from "@/lib/api/client";
import { useTranslations } from "next-intl";

const endExamApi = async ({ examId }: { examId: string }) => {
  return apiFetch(`/v2/exam/end-exam/${examId}`, {
    method: "GET",
    cache: "no-store",
  });
};

export default function ExamEndConfirmationSheet() {
  const { isOpen, closeModal, stack } = useExamModalStore();
  const isMobile = useIsMobile();
  const t = useTranslations("modals.examSubmission");
  const router = useRouter();

  const active = stack[stack.length - 1];
  const { exam, language, getStats } = useExamStore();

  const Container = useMemo(() => (isMobile ? BottomSheet : Modal), [isMobile]);

  const { answered, total, review, visited, notVisited } = getStats();

  const handleClose = useCallback(() => {
    closeModal("end-exam");
  }, [closeModal]);

  const endExam = useCallback(async () => {
    handleClose();
    try {
      await endExamApi({ examId: exam?.uuid! });
    } catch (error) {
      console.error("End exam failed:", error);
    }
    const testTypeParam =
      exam?.type === "chapter" ? "chapter-tests" :
      exam?.type === "sectional" ? "sectional-tests" :
      "full-length-papers";
    router.replace(
      `/test-series/${exam?.course?.group_code}?showReport=true&examId=${exam?.uuid}&testType=${testTypeParam}`,
    );
  }, [handleClose, router, exam]);

  return (
    <AnimatePresence>
      <Container
        isHeader={false}
        isOpen={isOpen}
        maxWidth="md:max-w-[420px]"
        onClose={() => handleClose()}
      >
        <div className="bg-white min-h-[20vh] max-h-[90vh] flex flex-col justify-between">
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

"use client";

import Text from "@clearcut/ui/text";
import { useQueryParams } from "@/hooks/useQueryParams/useQueryParam";
import React, { useCallback, useMemo } from "react";
import QuestionStatusLegend from "../cards/QuestionStatusLegend";
import QuestionReportTabs from "../Tabs/QuestionReportTabs";
import QuestionNavigationPanel from "../QuestionNavigationPanel";
import QuestionViewPanel from "../QuestionViewPanel";
import { useExamModalStore } from "../../store/useExamModalStore";
import { useIsMobile } from "@/hooks/useIsMobile";
import { BottomSheet } from "@/components/features/Sheets/BottomSheet";
import ModalHeader from "@/components/features/test-series/components/ModalHeader";
import { Button } from "@clearcut/ui/button";
import { ChevronIcon, LogoutDoorIcon } from "@/components/ui/icons";
import WarningCirleIcon from "@/components/ui/icons/warning-circle-icon";

export default function QuestionNavigatorSheet() {
  const { isOpen, closeModal, stack, open } = useExamModalStore();
  const isMobile = useIsMobile(1020);
  const activeModal = stack[stack.length - 1];

  const { get } = useQueryParams();
  const reportType = get("report");

  /* ======================= ACTIONS ======================= */

  const closeNavigationPanel = useCallback(() => {
    closeModal("exam-navigation-panel");
  }, [closeModal]);

  const handleEndExam = useCallback(() => {
    closeModal("exam-navigation-panel");
    open("end-exam");
  }, [closeModal, open]);

  /* ======================= DERIVED UI ======================= */

  const showNavigationPanel = reportType === "summary-view";
  const showQuestionView = reportType === "question-view";

  /* ======================= HEADER ======================= */

  const Header = useMemo(
    () => (
      <div className="flex flex-col gap-2">
        <Text
          as="p"
          variant="heading-medium"
          weight="semibold"
          color="gray-subtle"
        >
          Progress and Questions
        </Text>

        <QuestionStatusLegend />
      </div>
    ),
    []
  );

  /* ======================= MAIN CONTENT ======================= */

  const MainContent = useMemo(
    () => (
      <>
        <QuestionReportTabs />

        <div className="flex flex-col gap-3">
          <Divider />

          {showNavigationPanel && <QuestionNavigationPanel />}
          {showQuestionView && <QuestionViewPanel />}
        </div>
      </>
    ),
    [showNavigationPanel, showQuestionView]
  );

  /* ======================= MOBILE SHEET ======================= */

  if (isMobile) {
    if (activeModal !== "exam-navigation-panel") return null;

    return (
      <BottomSheet
        isHeader={false}
        isOpen={isOpen}
        maxWidth="md:max-w-[420px]"
        onClose={closeNavigationPanel}
      >
        <div className="bg-white min-h-[20vh] max-h-[95vh] flex flex-col justify-between">
          {/* Header */}
          <ModalHeader
            title="Progress and Questions"
            onClose={closeNavigationPanel}
          />

          {/* Main */}
          <div className="flex flex-col max-h-[90vh] md:items-center gap-2 overflow-scroll">
            <QuestionStatusLegend />
            {MainContent}
          </div>

          {/* Footer */}
          <Footer
            submitTest={closeNavigationPanel}
            close={handleEndExam}
          />
        </div>
      </BottomSheet>
    );
  }

  /* ======================= DESKTOP ======================= */

  return (
    <>
      {Header}
      {MainContent}
    </>
  );
}

/* ======================= UTIL COMPONENTS ======================= */

function Divider() {
  return <div className="h-0.5 bg-gray-300" />;
}

/* ======================= FOOTER ======================= */

const Footer = React.memo(
  ({
    submitTest,
    close,
  }: {
    submitTest: () => void;
    close: () => void;
  }) => {
    return (
      <div className="sticky bottom-0 px-3 py-3 bg-white">
        <div className="flex flex-col gap-2 max-w-[336px] mx-auto">
          {/* Continue */}
          <div className="flex flex-col gap-1 items-center">
            <div className="max-w-[336px] w-full">
              <Button
                onClick={submitTest}
                fullWidth
                size="lg"
                sx={{ borderRadius: "50px" }}
              >
                <div className="flex items-center gap-2">
                  <span>Continue Test</span>
                  <ChevronIcon
                    size={20}
                    type="double"
                    variant="right"
                  />
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
                Re-attempt will not affect your previous score
              </Text>
            </div>
          </div>

          {/* End Test */}
          <Button
            variant="soft"
            color="gray"
            fullWidth
            onClick={close}
            sx={{ borderRadius: "50px" }}
          >
            <div className="flex items-center gap-1">
              <span>End Test</span>
              <LogoutDoorIcon size={16} />
            </div>
          </Button>
        </div>
      </div>
    );
  }
);
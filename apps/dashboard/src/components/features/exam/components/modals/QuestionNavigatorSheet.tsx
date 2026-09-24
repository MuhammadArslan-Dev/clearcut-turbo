"use client";

import Text from "@clearcut/ui/text";
import { useQueryParams } from "@/hooks/useQueryParams/useQueryParam";
import React, { useCallback, useMemo } from "react";
import QuestionStatusLegend from "../cards/QuestionStatusLegend";
import QuestionReportTabs from "../Tabs/QuestionReportTabs";
import QuestionNavigationPanel, { computeQuestionStatusCounts } from "../QuestionNavigationPanel";
import QuestionViewPanel from "../QuestionViewPanel";
import { useExamModalStore } from "../../store/useExamModalStore";
import { useExamStore } from "../../store/useExamStore";
import { useIsMobile } from "@/hooks/useIsMobile";
import { BottomSheet } from "@/components/features/Sheets/BottomSheet";
import ModalHeader from "@/components/features/test-series/components/ModalHeader";
import { Button } from "@clearcut/ui/button";
import StatusCountRow from "@/components/features/attempt-ui/StatusCountRow";
import { ArrowIcon, ChevronIcon, LogoutDoorIcon } from "@/components/ui/icons";
import WarningCirleIcon from "@/components/ui/icons/warning-circle-icon";
import type { AttemptSection } from "../../types/exam";

// Stable fallback reference — `s.exam?.sections ?? []` would create a brand
// new array on every selector call, and zustand's useSyncExternalStore
// treats that as "the snapshot changed" on every render, which threw this
// into an infinite render loop ("Maximum update depth exceeded").
const EMPTY_SECTIONS: AttemptSection[] = [];

export default function QuestionNavigatorSheet() {
  const { isOpen, closeModal, stack, open } = useExamModalStore();
  const isMobile = useIsMobile(1020);
  const active = stack[stack.length - 1];
  const exam = useExamStore((s) => s.exam);
  const sections = exam?.sections ?? EMPTY_SECTIONS;
  // Depend on `exam` (not `sections`): answering/marking a question mutates
  // the question in place and only replaces the top-level `exam` object, so
  // `sections` keeps the same array reference and a memo keyed on it alone
  // would never recompute after the first answer.
  const counts = useMemo(() => computeQuestionStatusCounts(sections), [exam, sections]);

  const { get, set } = useQueryParams();

  const handleClose = useCallback(() => {
    closeModal("exam-navigation-panel");
  }, [closeModal]);
  const endExam = useCallback(() => {
    closeModal("exam-navigation-panel");
    open("end-exam");
  }, [closeModal]);

  // Desktop right-panel header — a "Questions" title over a vertical legend
  // with live counts, matching the Daily Test attempt page's right sidebar
  // (see DailyTestAttemptPage's CountRow). The mobile bottom sheet below
  // keeps its own horizontal QuestionStatusLegend unchanged.
  const header = () => {
    return (
      <div className="flex flex-col gap-3">
        <Text as="p" variant="body-medium" weight="semibold" color="gray-normal">
          Questions
        </Text>
        <div className="flex flex-col gap-2">
          <StatusCountRow label="Not Visited" count={counts.notVisited} color="bg-gray-300" textColor="text-surface-gray-muted" />
          <StatusCountRow
            label="Answered"
            count={counts.answered}
            color="bg-[var(--icon-positive-subtle)]"
            textColor="text-[var(--icon-positive-normal)]"
          />
          <StatusCountRow
            label="Not Answered"
            count={counts.notAnswered}
            color="bg-[var(--icon-negative-normal)]"
            textColor="text-[var(--icon-negative-normal)]"
          />
          <StatusCountRow
            label="Marked for Review"
            count={counts.review}
            color="bg-[var(--icon-notice-subtle)]"
            textColor="text-[var(--icon-notice-normal)]"
          />
        </div>
      </div>
    );
  };

  // `stickyTop`: the desktop card has 16px of padding, and sticky offsets are
  // measured inside it, so the switch needs -top-4 to sit flush at the very top.
  const mainContent = (stickyTop = "top-0") => {
    return (
      <>
        {/* Sticks to the top of the panel's scroll area while the sections scroll under it. */}
        <div className={`sticky ${stickyTop} z-10 bg-white py-2`}>
          <QuestionReportTabs />
        </div>
        <div className="flex flex-col gap-3">
          {/* <QuestionFilter /> */}
          {get("report") === "summary-view" && <QuestionNavigationPanel />}
          {get("report") === "question-view" && <QuestionViewPanel />}
        </div>
      </>
    );
  };

  return (
    <>
      {isMobile ? (
        active === "exam-navigation-panel" && (
          <BottomSheet
            isHeader={false}
            isOpen={isOpen}
            maxWidth="md:max-w-[420px]"
            onClose={() => {
              closeModal("exam-navigation-panel");
            }}
          >
            {" "}
            <div className="bg-white min-h-[20vh] max-h-[95vh] flex flex-col justify-between">
              {/* Header */}
              <ModalHeader
                title={"Progress and Questions"}
                onClose={() => closeModal("exam-navigation-panel")}
              />

              {/* main content  */}
              <div className=" flex flex-col max-h-[90vh] md:items-center gap-2 overflow-scroll">
                {/* Breathing room around the legend inside the bottom sheet */}
                <div className="w-full px-4 py-2">
                  <QuestionStatusLegend />
                </div>
                {mainContent()}
              </div>

              {/* Footer  */}
              <Footer
                submitTest={() => {
                  handleClose();
                }}
                close={() => endExam()}
              />
            </div>
          </BottomSheet>
        )
      ) : (
        <>
          {header()}
          {mainContent("-top-4")}
        </>
      )}
    </>
  );
}

function Divider() {
  return <div className="h-0.5 bg-gray-300" />;
}

const Footer = ({
  submitTest,
  close,
}: {
  submitTest: () => void;
  close: () => void;
}) => {
  return (
    <div className="sticky bottom-0 px-3 py-3 bg-white">
      <div className="flex flex-col gap-2 max-w-[336px] mx-auto">
        <div className="flex flex-col gap-1 items-center">
          <div className="max-w-[336px] w-full">
            <Button
              onClick={() => submitTest()}
              fullWidth
              size="lg"
              sx={{ borderRadius: "50px" }}
            >
              <div className="flex items-center gap-2">
                <span className="">Continue Test</span>
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
              {"Re-attempt will not affect your previous score"}
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
              <span className="">{"End Test"}</span>
              <LogoutDoorIcon size={16} />
            </div>
          </Button>
        </div>
      </div>
    </div>
  );
};

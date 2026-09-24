"use client";

import { memo, useMemo } from "react";
import AttemptSummaryStrip from "@/components/features/attempt-ui/AttemptSummaryStrip";
import LiveTimeLeft from "@/components/features/attempt-ui/LiveTimeLeft";
import AttemptProgress from "@/components/features/attempt-ui/AttemptProgress";
import SectionsTab from "@/components/features/exam/components/Tabs/SectionsTab";
import { useExamStore } from "@/components/features/exam/store/useExamStore";

const TimeLeft = memo(function TimeLeft() {
  const duration = useExamStore((s) => s.timeLeft);
  return <LiveTimeLeft duration={duration} compact />;
});

// Recomputed only when the exam object or the current position changes.
const Progress = memo(function Progress() {
  const exam = useExamStore((s) => s.exam);
  const currentSection = useExamStore((s) => s.currentSection);
  const currentQuestion = useExamStore((s) => s.currentQuestion);

  const { total, answered, position } = useMemo(() => {
    let total = 0;
    let answered = 0;
    let before = 0;
    exam?.sections.forEach((section, si) => {
      if (si < currentSection) before += section.questions.length;
      section.questions.forEach((q) => {
        total++;
        if (q.user_option) answered++;
      });
    });
    return { total, answered, position: before + currentQuestion + 1 };
  }, [exam, currentSection, currentQuestion]);

  const percent = total > 0 ? Math.round((answered / total) * 100) : 0;
  // Desktop only — on mobile the question header already shows "Question n / N".
  return (
    <div className="hidden min-w-0 flex-1 lg:block">
      <AttemptProgress position={position} total={total} percent={percent} compact />
    </div>
  );
});

function TimerStrip() {
  // Multi-section exams show their subject tabs in this slot (instead of the
  // "Stay Focused!" card) — a fixed 700px wide on desktop, not full width.
  const hasSections = useExamStore((s) => (s.exam?.sections.length ?? 0) > 1);

  return (
    <AttemptSummaryStrip
      compact
      // Mobile: full-bleed, square-cornered. Desktop: the inset rounded card.
      className="mt-0 !w-auto !rounded-none max-lg:!py-1.5 lg:mx-4 lg:mt-3 lg:!rounded-xl"
      time={<TimeLeft />}
      progress={<Progress />}
      tip={
        hasSections ? (
          // Mobile: edge to edge (cancels the card padding), no radius. Desktop:
          // 700px, right edge flush with the card's own right edge (cancels the
          // card's 16px right padding the same way `-mx-4` cancels it on mobile).
          <div className="-mx-4 lg:ml-0 lg:mr-[-16px] lg:w-[700px] lg:shrink-0">
            <SectionsTab wrapperClassName="overflow-hidden lg:rounded-l-full" />
          </div>
        ) : undefined
      }
    />
  );
}

export default memo(TimerStrip);

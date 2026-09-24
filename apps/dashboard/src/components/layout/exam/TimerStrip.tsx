"use client";

import { memo, useMemo } from "react";
import { Lightbulb } from "lucide-react";
import AttemptSummaryStrip from "@/components/features/attempt-ui/AttemptSummaryStrip";
import LiveTimeLeft from "@/components/features/attempt-ui/LiveTimeLeft";
import AttemptProgress from "@/components/features/attempt-ui/AttemptProgress";
import TipCard from "@/components/features/attempt-ui/TipCard";
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
  // Single-section exams show the Tip card (not the fluid SectionsTab) next
  // to this, so there's nothing else competing for space — same as Daily
  // Test, where AttemptProgress's own `flex-1` (see AttemptProgress.tsx)
  // just stretches to fill what the tip card leaves. Multi-section exams
  // keep it sized to content so it doesn't squeeze the SectionsTab tip.
  const hasSections = useExamStore((s) => (s.exam?.sections.length ?? 0) > 1);

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
    <div className={`hidden min-w-0 lg:block ${hasSections ? "" : "lg:flex-1"}`}>
      <AttemptProgress position={position} total={total} percent={percent} compact />
    </div>
  );
});

// Single-section exams show the same "Stay Focused!" tip card the Daily
// Test attempt page shows in this slot, instead of leaving it empty.
const Tip = memo(function Tip() {
  const exam = useExamStore((s) => s.exam);
  const answeredCount = useMemo(
    () => exam?.sections.reduce((acc, s) => acc + s.questions.filter((q) => q.user_option).length, 0) ?? 0,
    [exam],
  );

  return (
    <TipCard
      icon={answeredCount > 0 ? <Lightbulb size={24} className="text-[var(--color-warning-strong)]" /> : undefined}
      title={answeredCount > 0 ? "You're Doing Great!" : "Stay Focused!"}
      body={answeredCount > 0 ? "Keep going. Stay consistent!" : "Complete the test and check your performance."}
    />
  );
});

function TimerStrip() {
  // Multi-section exams show their subject tabs in this slot instead of the
  // "Stay Focused!" tip card — a fixed 700px wide on desktop, not full width.
  const hasSections = useExamStore((s) => (s.exam?.sections.length ?? 0) > 1);

  return (
    <AttemptSummaryStrip
      compact
      // Mobile: full width, flush against the screen edges (no side margin,
      // square corners) — only the vertical gap above (`mt-3`) separates it
      // from the topbar and the question card below. Desktop: the inset
      // rounded card, unchanged.
      className="mt-3 !w-auto !rounded-none max-lg:!py-1.5 lg:mx-4 lg:!rounded-xl"
      time={<TimeLeft />}
      progress={<Progress />}
      tip={
        hasSections ? (
          // Mobile: edge to edge (cancels the card padding), no radius.
          // Desktop: fluid (not a fixed 700px) — a fixed width didn't shrink
          // when the strip got tight, squeezing/breaking the Progress bar
          // next to it; `min-w-0` lets it shrink below its content (the tabs
          // scroll internally), capped at 700px so it doesn't hog space when
          // there's room. Right edge flush with the card's own right edge
          // (cancels the card's 16px right padding the same way `-mx-4`
          // cancels it on mobile).
          <div className="-mx-4 lg:ml-0 lg:mr-[-16px] lg:min-w-0 lg:max-w-[700px] lg:flex-1">
            <SectionsTab wrapperClassName="overflow-hidden lg:rounded-l-full" />
          </div>
        ) : (
          <Tip />
        )
      }
    />
  );
}

export default memo(TimerStrip);

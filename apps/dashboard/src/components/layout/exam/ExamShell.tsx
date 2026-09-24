// src/components/layout/DashboardShell.tsx
"use client";
import { useEffect, useMemo, type ReactNode } from "react";
import Sidebar from "./Sidebar";
import TestInfoSidebar from "./TestInfoSidebar";
import Topbar from "./Topbar";
import TimerStrip from "./TimerStrip";
import { useQueryParams } from "@/hooks/useQueryParams/useQueryParam";
import { useExamModalStore } from "@/components/features/exam/store/useExamModalStore";
import { useStreakTracker } from "@/hooks/useStreakTracker";
import dynamic from "next/dynamic";

// Gated the same way as TestSeriesShell/PreparationShell's modals — neither
// sheet is needed until the user opens it, and every byte kept out of the
// initial exam-page bundle matters more here than most routes (a running
// exam timer means load time is directly time the candidate loses).
const ExamEndConfirmationSheet = dynamic(() => import("@/components/features/exam/components/modals/ExamEndConfirmationSheet"), { ssr: false });
const QuestionNavigatorSheet = dynamic(() => import("@/components/features/exam/components/modals/QuestionNavigatorSheet"), { ssr: false });

export default function ExamShell({ children }: { children: ReactNode }) {
  const { get, set } = useQueryParams();

  useStreakTracker();

  useEffect(() => {
    const report = get("report");

    if (report) return;

    set({
      report: "summary-view",
    });
  }, []); // 👈 intentional empty dependency

  const { isOpen, stack } = useExamModalStore();
  const activeModal = useMemo(
    () => (stack.length ? stack[stack.length - 1] : null),
    [stack],
  );

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-[var(--background-gray-subtle)]">
      <Topbar />

      {/* Capped at the same 1280px the Daily Test attempt page uses for its
          own strip + 3-column row, so full-length papers don't stretch
          full-bleed on wide screens while Daily Test stays centered. */}
      <div className="mx-auto flex min-h-0 w-full flex-1 flex-col overflow-hidden lg:max-w-[1280px]">
        <TimerStrip />

        {/* Main column — Test Information (left) / question (center) / question
            navigator (right), matching the Daily Test attempt page's 3-column
            layout instead of the navigator-on-the-left arrangement this used
            to have. */}
        <div className="flex min-h-0 flex-1 overflow-hidden">
          <TestInfoSidebar />

          {/* Only this part scrolls */}
          <main className="flex-1 overflow-y-auto">{children}</main>

          <Sidebar />
          {/* <Footer /> */}
        </div>
      </div>
      {isOpen && activeModal === "end-exam" && <ExamEndConfirmationSheet />}
      {isOpen && activeModal === "exam-navigation-panel" && (
        <QuestionNavigatorSheet />
      )}
    </div>
  );
}

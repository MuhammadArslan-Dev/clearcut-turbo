// src/components/layout/DashboardShell.tsx
"use client";
import { useEffect, useMemo, type ReactNode } from "react";
import Sidebar from "./Sidebar";
import Topbar from "./Topbar";
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
    <div className="flex h-screen flex-col overflow-hidden">
      {/* Sidebar */}
      <Topbar />

      {/* Main column */}
      <div className="flex flex-1 overflow-hidden">
        <Sidebar />

        {/* Only this part scrolls */}
        <main className="flex-1 overflow-y-auto">{children}</main>
        {/* <Footer /> */}
      </div>
      {isOpen && activeModal === "end-exam" && <ExamEndConfirmationSheet />}
      {isOpen && activeModal === "exam-navigation-panel" && (
        <QuestionNavigatorSheet />
      )}
    </div>
  );
}

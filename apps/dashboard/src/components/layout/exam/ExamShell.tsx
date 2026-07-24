// src/components/layout/DashboardShell.tsx
"use client";
import { useEffect, useMemo, type ReactNode } from "react";
import Sidebar from "./Sidebar";
import Topbar from "./Topbar";
import { useQueryParams } from "@/hooks/useQueryParams/useQueryParam";
import { useExamModalStore } from "@/components/features/exam/store/useExamModalStore";
import ExamEndConfirmationSheet from "@/components/features/exam/components/modals/ExamEndConfirmationSheet";
import QuestionNavigatorSheet from "@/components/features/exam/components/modals/QuestionNavigatorSheet";
import { useStreakTracker } from "@/hooks/useStreakTracker";

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

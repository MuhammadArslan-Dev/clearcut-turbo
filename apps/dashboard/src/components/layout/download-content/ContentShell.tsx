// src/components/layout/DashboardShell.tsx
"use client";
import React, { useEffect, useMemo, type ReactNode } from "react";
import Sidebar from "./Sidebar";
import Topbar from "./Topbar";
import { useExamModalStore } from "@/components/features/exam/store/useExamModalStore";
import ExamEndConfirmationSheet from "@/components/features/exam/components/modals/ExamEndConfirmationSheet";
import QuestionNavigatorSheet from "@/components/features/exam/components/modals/QuestionNavigatorSheet";
import { P_QUERY_KEY } from '@/components/features/preparation/hooks/usePreparationData';
import { ExamSyllabusData } from '@/components/features/preparation/types/types';
import { getExamSyllabus } from '@/lib/preparation/preparation';
import { useQuery } from '@tanstack/react-query';
import { useContentDataStore } from "@/components/features/downloadable-content/store/useContentDataStore";

export default function ContentShell({ children, courseId }: { children: ReactNode; courseId: string | number | null }) {

  const { data } = useQuery<ExamSyllabusData>({
    queryKey: P_QUERY_KEY(courseId),
    enabled: !!courseId,

    queryFn: async () => {
      const res = await getExamSyllabus(courseId as number);
      return res.data;
    },

    // staleTime: 5 * 60 * 1000,
    // gcTime: 10 * 60 * 1000,
    refetchOnWindowFocus: false,
    retry: 1,
  });

  const {
  
    setData,
  } = useContentDataStore();


  React.useEffect(() => {
    if (data) {
      setData(data.paper, data.sections);
    }
  }, [data, setData]);

  const { isOpen, stack } = useExamModalStore();
  const activeModal = useMemo(
    () => (stack.length ? stack[stack.length - 1] : null),
    [stack],
  );

  return (
    <div className="w-full flex justify-center bg-black/40 sm:py-6">
      <div className="max-w-[800px] h-[calc(100vh-6px)] sm:h-[calc(100vh-56px)] overflow-y-auto w-full flex flex-col  overflow-hidden bg-[#f1f5fa] sm:rounded-lg">
        {/* Sidebar */}
        <div className="sticky top-0 bg-white z-20">
          <Topbar />
        </div>

        <main className="">{children}</main>

        {isOpen && activeModal === "end-exam" && <ExamEndConfirmationSheet />}
        {isOpen && activeModal === "exam-navigation-panel" && (
          <QuestionNavigatorSheet />
        )}
      </div>
    </div>
  );
}

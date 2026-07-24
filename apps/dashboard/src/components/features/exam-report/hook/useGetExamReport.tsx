"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ExamApiResponse, getExamById } from "@/lib/exam";
import { useEffect } from "react";
import { useExamReportStore } from "../store/useExamReportStore";
import { Exam } from "../../exam/types/exam";
import { sentryApiClient } from "@/lib/sentry/sentry-api-client";

// ===============================
// QUERY KEY
// ===============================

export const EXAM_KEY = (examId: string | number) => ["get-exam", examId];

// ===============================
// HOOK
// ===============================

export function useGetExamReport({
  examId,
}: {
  examId: string | number | undefined;
}) {
  const queryClient = useQueryClient();

  const { setExam } = useExamReportStore();

  const { data, isLoading, isFetching, isError, refetch } = useQuery<Exam>({
    queryKey: EXAM_KEY(examId!),

    queryFn: async () => {
      const res = await sentryApiClient(() => getExamById(examId!), {
        endpoint: "/exams",
        module: "exam-page",
      });

      return res.data;
    },

    enabled: !!examId,

    staleTime: 0,

    gcTime: 0,

    retry: 1,

    refetchOnWindowFocus: false,
  });

  // ===============================
  // SYNC TO STORE
  // ===============================

  useEffect(() => {
    if (isFetching) return;
    if (!data) return;

    // If fresh start → load from API
    if (!data) {
      setExam(data);
      return;
    }

    // // Resume → keep position
    // if (exam.uuid === data.uuid) {
    //   setExam(data); // refresh data
    //   return;
    // }

    // New exam
    setExam(data);
  }, [data, isFetching]);

  // ===============================
  // CACHE CLEAR
  // ===============================

  const clearCache = () => {
    queryClient.removeQueries({
      queryKey: EXAM_KEY(examId!),
    });

    refetch();
  };

  return {
    exam: data,
    isLoading,
    isFetching,
    isError,

    refetch,
    clearCache,
  };
}

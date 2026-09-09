"use client";

import { useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { getChapters } from "@/lib/preparation/preparation";
import { Chapter, ExamSyllabusData } from "../types/types";
import { getMiniTestQuestions } from "@/lib/tests/getMiniTestQuestions";
import { QuestionNew } from "../types/question";
import { useMiniTestStore } from "../store/useMiniTestStore";

/* ----------------------------------
   QUERY KEY
----------------------------------- */
const QUERY_KEY = (topicId?: string | number, courseId?: string | null) => [
  "previous-q",
  topicId,
  courseId,
];

/** Last 4-digit run in an exam_instance_id like "CTET_2023" -> 2023. */
function extractYear(instanceId?: string | null): number {
  const match = instanceId?.match(/\d{4}/g);
  return match ? Number(match[match.length - 1]) : -Infinity;
}

function sortByYearDesc(questions: QuestionNew[]): QuestionNew[] {
  return [...questions].sort((a, b) => {
    const yearA = extractYear(a.exam_context_b?.exam_instance_id ?? a.exam_context_a?.exam_instance_id);
    const yearB = extractYear(b.exam_context_b?.exam_instance_id ?? b.exam_context_a?.exam_instance_id);
    return yearB - yearA;
  });
}

export function usePreviousQuestions(
  topicId?: number,
  courseId?: string | null
) {
  const queryClient = useQueryClient();

  const { data, isLoading, error, refetch } = useQuery<QuestionNew[]>({
    queryKey: QUERY_KEY(topicId, courseId),
    enabled: !!topicId && !!courseId,

    queryFn: async () => {
      const res = await getMiniTestQuestions(
        topicId as number,
        `?topicId=${topicId}&random=true&limit=20&courseId=${courseId}`,
      );
      // API returns random=true order — re-sort so the most recent exam
      // year always shows first, matching what a "previous questions"
      // list is expected to read like.
      return sortByYearDesc(res.data);
    },

    staleTime: 2 * 60 * 1000, // optional (data fresh for 10s)
    gcTime: 2 * 60 * 1000, // ✅ cache removed after 10s of inactivity
    refetchOnWindowFocus: false,
    retry: 1,
  });

  const refetchData = async () => {
    if (!topicId) return;
    await refetch();
  };

  const clearData = () => {
    if (!topicId) return;
    queryClient.removeQueries({
      queryKey: QUERY_KEY(topicId, courseId),
    });
  };

  return {
    questions: data,
    loading: isLoading,
    error: error as Error | null,
    refetchData,
    clearData,
  };
}

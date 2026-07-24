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
const QUERY_KEY = (topicId?: string | number) => ["previous-q", topicId];

export function usePreviousQuestions(
  topicId?: number,
  courseId?: string | null
) {
  const queryClient = useQueryClient();

  const { data, isLoading, error, refetch } = useQuery<QuestionNew[]>({
    queryKey: QUERY_KEY(topicId),
    enabled: !!topicId,

    queryFn: async () => {
      const res = await getMiniTestQuestions(
        topicId as number,
        `?topicId=${topicId}&random=true&limit=20&courseId=${courseId}`,
      );
      return res.data;
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
      queryKey: QUERY_KEY(topicId),
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

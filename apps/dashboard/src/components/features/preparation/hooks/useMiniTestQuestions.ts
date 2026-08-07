"use client";

import { useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { getMiniTestQuestions } from "@/lib/tests/getMiniTestQuestions";
import { QuestionNew } from "../types/question";
import { useMiniTestStore } from "../store/useMiniTestStore";
import { sentryApiClient } from "@/lib/sentry/sentry-api-client";

/* ----------------------------------
   QUERY KEY
----------------------------------- */
const QUERY_KEY = (topicId?: string | number) => ["minitest", topicId];

export function useMiniTestQuestions(
  topicId?: number,
  courseId?: string | null,
) {
  const queryClient = useQueryClient();
  const setQuestions = useMiniTestStore((s) => s.setQuestions);
  const resetStore = useMiniTestStore((s) => s.reset); // ⬅️ assume you have reset()

  /* ------------------------------
     RESET STATE ON OPEN / TOPIC CHANGE
  ------------------------------- */
  useEffect(() => {
    if (!topicId) return;

    // 1. Clear previous questions from store
    resetStore();

    // 2. Remove cached query for previous topic
    queryClient.removeQueries({
      queryKey: QUERY_KEY(topicId),
    });
  }, [topicId, queryClient, resetStore]);

  /* ------------------------------
     FETCH QUESTIONS
  ------------------------------- */
  const { data, isLoading, error, refetch } = useQuery<QuestionNew[]>({
    queryKey: QUERY_KEY(topicId),
    enabled: !!topicId,

    queryFn: async () => {
      const res = await sentryApiClient(
        async () =>
          await getMiniTestQuestions(
            topicId as number,
            `?topicId=${topicId}&random=true&limit=5&courseId=${courseId}`,
          ),
        {
          endpoint: "/mini-test-questions",
          module: "preparation-page",
        },
      );

      return res.data;
    },

    refetchOnWindowFocus: false,
    retry: 1,
  });

  /* ------------------------------
     SET QUESTIONS INTO STORE
  ------------------------------- */
  useEffect(() => {
    if (data?.length) {
      setQuestions(data);
    }
  }, [data, setQuestions]);

  /* ------------------------------
     MANUAL HELPERS
  ------------------------------- */
  const refetchData = async () => {
    if (!topicId) return;
    await refetch();
  };

  const clearData = () => {
    if (!topicId) return;

    resetStore();
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

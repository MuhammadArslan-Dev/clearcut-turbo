"use client";

import { useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { getMiniTestQuestions } from "@/lib/tests/getMiniTestQuestions";
import { startMiniTestAttempt } from "@/lib/dashboard/progressV2";
import { QuestionNew } from "../types/question";
import { useMiniTestStore } from "../store/useMiniTestStore";
import { sentryApiClient } from "@/lib/sentry/sentry-api-client";

/* ----------------------------------
   QUERY KEY
----------------------------------- */
const QUERY_KEY = (topicId?: string | number, serverScoring = false) => [
  "minitest",
  topicId,
  serverScoring ? "server" : "legacy",
];

type MiniTestData = { questions: QuestionNew[]; attemptId: string | null };

/**
 * @param serverScoring Progress Tracker v2: start a server attempt (it returns
 *   the same question shape) so the submit can be scored and stored.
 * @param ready Wait until the backend capabilities are known, so one open
 *   never fetches through both paths.
 */
export function useMiniTestQuestions(
  topicId?: number,
  courseId?: string | null,
  serverScoring = false,
  ready = true,
) {
  const queryClient = useQueryClient();
  const setQuestions = useMiniTestStore((s) => s.setQuestions);
  const setAttemptId = useMiniTestStore((s) => s.setAttemptId);
  const resetStore = useMiniTestStore((s) => s.reset); // ⬅️ assume you have reset()

  /* ------------------------------
     RESET STATE ON OPEN / TOPIC CHANGE
  ------------------------------- */
  useEffect(() => {
    if (!topicId) return;

    // 1. Clear previous questions from store
    resetStore();

    // 2. Remove cached query for previous topic (both modes)
    queryClient.removeQueries({
      queryKey: ["minitest", topicId],
    });
  }, [topicId, queryClient, resetStore]);

  /* ------------------------------
     FETCH QUESTIONS
  ------------------------------- */
  const { data, isLoading, error, refetch } = useQuery<MiniTestData>({
    queryKey: QUERY_KEY(topicId, serverScoring),
    // courseId scopes the questions to the enrolled exam; without it the API 404s.
    enabled: !!topicId && !!courseId && ready,

    queryFn: async () => {
      if (serverScoring) {
        const res = await sentryApiClient(
          async () => await startMiniTestAttempt(courseId as string, topicId as number, 5),
          { endpoint: "/progress/mini-test/start", module: "preparation-page" },
        );
        return { questions: res.questions, attemptId: res.attempt_id };
      }

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

      return { questions: res.data, attemptId: null };
    },

    refetchOnWindowFocus: false,
    // A server attempt must not be created twice by an automatic retry.
    retry: serverScoring ? 0 : 1,
  });

  /* ------------------------------
     SET QUESTIONS INTO STORE
  ------------------------------- */
  useEffect(() => {
    if (data?.questions?.length) {
      setQuestions(data.questions);
      setAttemptId(data.attemptId);
    }
  }, [data, setQuestions, setAttemptId]);

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
      queryKey: ["minitest", topicId],
    });
  };

  return {
    questions: data?.questions,
    loading: isLoading || (!ready && !!topicId),
    error: error as Error | null,
    refetchData,
    clearData,
  };
}

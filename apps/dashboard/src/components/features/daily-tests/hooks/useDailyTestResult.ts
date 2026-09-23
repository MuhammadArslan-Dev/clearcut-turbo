"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { getDailyTestResult, DailyTestResult } from "@/lib/api/dailyTests";

export const DAILY_TEST_RESULT_KEY = (attemptId: string) => ["daily-test-result", attemptId];

/**
 * A completed attempt's result. Cached so re-opening the same result (or
 * coming back to it) renders instantly instead of re-showing a skeleton.
 * Pass a null attemptId while it isn't known (or the test isn't completed)
 * to keep the query disabled.
 */
export function useDailyTestResult(courseId: string, testId: string, attemptId: string | null | undefined) {
  const { data, isLoading, isError } = useQuery<DailyTestResult>({
    queryKey: DAILY_TEST_RESULT_KEY(attemptId ?? "none"),

    queryFn: async () => {
      const res = await getDailyTestResult(courseId, testId, attemptId as string);
      return res.data;
    },

    enabled: attemptId != null,
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
    retry: 1,
    refetchOnWindowFocus: false,
  });

  return { result: data, isLoading, isError };
}

/** Seed the cache with a result we already have (e.g. straight from submit). */
export function useSetDailyTestResult() {
  const queryClient = useQueryClient();
  return (attemptId: string, result: DailyTestResult) =>
    queryClient.setQueryData(DAILY_TEST_RESULT_KEY(attemptId), result);
}

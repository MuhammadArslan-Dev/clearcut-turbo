"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { getDailyTestHistory, DailyTestHistoryResponse } from "@/lib/api/dailyTests";

// ===============================
// QUERY KEY
// ===============================

export const DAILY_TEST_HISTORY_KEY = (courseId: string) => [
  "daily-test-history",
  String(courseId),
];

// ===============================
// HOOK
// ===============================

/**
 * One exam's Daily Test history — same caching approach as
 * useDailyTestExams: stays fresh across a quick "attempt today's test, then
 * come back" round trip, and is explicitly invalidated (see
 * useInvalidateDailyTestHistory) once a submit actually changes it.
 */
export function useDailyTestHistory(courseId: string) {
  const { data, isLoading, isFetching, isError, refetch } = useQuery<DailyTestHistoryResponse>({
    queryKey: DAILY_TEST_HISTORY_KEY(courseId),

    queryFn: async () => {
      const res = await getDailyTestHistory(courseId);
      return res.data;
    },

    enabled: !!courseId,
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
    retry: 1,
    refetchOnWindowFocus: false,
  });

  return {
    history: data,
    isLoading,
    isFetching,
    isError,
    refetch,
  };
}

/** Call after a daily test attempt is submitted for this exam. */
export function useInvalidateDailyTestHistory() {
  const queryClient = useQueryClient();
  return (courseId: string) =>
    queryClient.invalidateQueries({ queryKey: DAILY_TEST_HISTORY_KEY(courseId) });
}

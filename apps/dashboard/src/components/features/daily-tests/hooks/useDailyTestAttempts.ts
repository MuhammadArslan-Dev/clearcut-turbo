"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { getDailyTestAttempts, DailyTestAttemptsResponse } from "@/lib/api/dailyTests";

export const DAILY_TEST_ATTEMPTS_KEY = (courseId: string, testId: string) => [
  "daily-test-attempts",
  courseId,
  testId,
];

/** Every completed attempt of ONE daily test (+ the test's own info). */
export function useDailyTestAttempts(courseId: string, testId: string) {
  const { data, isLoading, isError } = useQuery<DailyTestAttemptsResponse>({
    queryKey: DAILY_TEST_ATTEMPTS_KEY(courseId, testId),
    queryFn: async () => (await getDailyTestAttempts(courseId, testId)).data,
    enabled: !!courseId && !!testId,
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
    retry: 1,
    refetchOnWindowFocus: false,
  });

  return { data, isLoading, isError };
}

/** Call after an attempt is submitted so the history shows the new row. */
export function useInvalidateDailyTestAttempts() {
  const queryClient = useQueryClient();
  return (courseId: string, testId: string) =>
    queryClient.invalidateQueries({ queryKey: DAILY_TEST_ATTEMPTS_KEY(courseId, testId) });
}

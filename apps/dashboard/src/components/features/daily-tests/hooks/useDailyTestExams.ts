"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { getDailyTestExams, DailyTestExam, DailyTestHabitStats } from "@/lib/api/dailyTests";

// ===============================
// QUERY KEY
// ===============================

export const DAILY_TEST_EXAMS_KEY = ["daily-test-exams"];

// ===============================
// HOOK
// ===============================

/**
 * The Daily Tests course list — cached so navigating away (into an attempt)
 * and back doesn't re-show a loading skeleton for data that hasn't
 * meaningfully changed. `invalidateDailyTestExams` (below) is the other
 * half: called once a test is actually submitted, so the next time this
 * list is read it picks up the new "Attempted"/streak/avg-score state
 * instead of serving the stale pre-attempt cache for the full staleTime
 * window.
 */
export function useDailyTestExams() {
  const { data, isLoading, isFetching, isError, refetch } = useQuery<{
    exams: DailyTestExam[];
    stats: DailyTestHabitStats;
  }>({
    queryKey: DAILY_TEST_EXAMS_KEY,

    queryFn: async () => {
      const res = await getDailyTestExams();
      return res.data;
    },

    staleTime: 5 * 60 * 1000, // 5 min — stays cached across a quick attempt-and-back trip
    gcTime: 30 * 60 * 1000,
    retry: 1,
    refetchOnWindowFocus: false,
  });

  return {
    exams: data?.exams,
    stats: data?.stats,
    isLoading,
    isFetching,
    isError,
    refetch,
  };
}

/**
 * Call after a daily test attempt is submitted (see
 * daily-test-attempt/[examId]/[dailyTestId]/page.tsx) — marks this list
 * stale so the next read refetches instead of serving the pre-attempt cache.
 */
export function useInvalidateDailyTestExams() {
  const queryClient = useQueryClient();
  return () => queryClient.invalidateQueries({ queryKey: DAILY_TEST_EXAMS_KEY });
}

"use client";

import { useQuery } from "@tanstack/react-query";
import { getStreak, StreakResponse } from "@/lib/dashboard/streak";
import { sentryApiClient } from "@/lib/sentry/sentry-api-client";

export const STREAK_QUERY_KEY = ["learning-streak"];

export function useLearningStreak() {
  return useQuery<StreakResponse>({
    queryKey: STREAK_QUERY_KEY,
    queryFn: () =>
      sentryApiClient(() => getStreak(), {
        endpoint: "/learning-streak",
        module: "dashboard",
      }),

    staleTime: 1000 * 60 * 5, // 5 minutes → FAST
    gcTime: 1000 * 60 * 10, // 10 minutes in memory
    retry: 1,
    refetchOnWindowFocus: false,
  });
}

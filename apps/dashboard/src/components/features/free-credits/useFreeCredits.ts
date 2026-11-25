"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback } from "react";
import { setAnalyticsUserProperty } from "@/lib/analytics/browser";
import {
  FREE_CREDITS_INACTIVE,
  getFreeCredits,
  type FreeCredits,
} from "@/lib/api/freeCredits";

/** One cache entry per exam, shared by the chip, banner, lock screen and the beacon. */
export const freeCreditsKey = (exam: string | null | undefined) => ["free-credits", exam ?? null] as const;

/**
 * Free-credits status for one exam (CC-196). `data` is always usable: while loading, on any
 * failure, or when the feature is off / control, it is the INACTIVE shape - the screens then
 * render exactly as before. One request per exam per minute (no retry, no refetch on focus);
 * refetch it with `useRefreshFreeCredits` after a test starts / submits and after payment.
 *
 * `skip` is for callers that already know the user is paid (course status "active"): they
 * never see credits, so no request is made.
 */
export function useFreeCredits(exam: string | null | undefined, opts?: { skip?: boolean }) {
  const q = useQuery<FreeCredits>({
    queryKey: freeCreditsKey(exam),
    queryFn: async () => {
      const credits = await getFreeCredits(exam as string);
      // Amplitude user property, once per fetch (CC-196). Only for users in the treatment.
      if (credits.active) setAnalyticsUserProperty("free_credits_remaining", credits.remaining);
      return credits;
    },
    enabled: !!exam && !opts?.skip,
    staleTime: 60_000,
    gcTime: 10 * 60_000,
    retry: false,
    refetchOnWindowFocus: false,
  });
  return { credits: q.data ?? FREE_CREDITS_INACTIVE, isLoading: q.isLoading, isError: q.isError };
}

/** Marks the status stale so the next reader (or the mounted one) refetches once. */
export function useRefreshFreeCredits() {
  const qc = useQueryClient();
  return useCallback(
    (exam?: string | null) =>
      qc.invalidateQueries({ queryKey: exam ? freeCreditsKey(exam) : ["free-credits"] }),
    [qc],
  );
}

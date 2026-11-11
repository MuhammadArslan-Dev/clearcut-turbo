"use client";

import { useQuery, type QueryClient } from "@tanstack/react-query";
import {
  getProgressCapabilities,
  LEGACY_CAPABILITIES,
  type ProgressCapabilities,
} from "@/lib/dashboard/progressV2";

export const PROGRESS_CAPABILITIES_KEY = ["progress-capabilities"] as const;

/**
 * Which Progress Tracker v2 flows the backend has switched on. Any failure
 * (old backend without the route, network) resolves to the legacy flags, so
 * the preparation page always keeps working on the old path.
 */
export function useProgressCapabilities(): { caps: ProgressCapabilities; ready: boolean } {
  const { data, isFetched } = useQuery({
    queryKey: PROGRESS_CAPABILITIES_KEY,
    queryFn: () => getProgressCapabilities().catch(() => LEGACY_CAPABILITIES),
    staleTime: 10 * 60 * 1000,
    gcTime: 60 * 60 * 1000,
    retry: false,
    refetchOnWindowFocus: false,
  });
  return { caps: data ?? LEGACY_CAPABILITIES, ready: isFetched };
}

/**
 * Server-side progress changed: refetch everything that shows it, so the
 * sidebar, course cards and Today Goals never keep a stale number.
 */
export function invalidateProgressQueries(queryClient: QueryClient) {
  for (const key of [
    ["learning-progress-by-topic"],
    ["courses-progress-summary"],
    ["courses-cutoff-meter"],
    ["cutoff-meter"],
    ["today-goals"],
    ["resume-state"],
  ]) {
    queryClient.invalidateQueries({ queryKey: key });
  }
}

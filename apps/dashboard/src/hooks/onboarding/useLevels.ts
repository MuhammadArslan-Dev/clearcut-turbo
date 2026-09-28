"use client";

import { useQuery, type QueryClient } from "@tanstack/react-query";
import { fetchLevels, Level } from "@/lib/api/onboarding";

/* ----------------------------------
   QUERY KEY
----------------------------------- */
// Exported so callers can warm this exact cache entry (see
// MyCoursesWrapTwo's prefetch) without duplicating the key shape and
// silently drifting into a second, never-reused cache entry.
export const LEVELS_QUERY_KEY = (examId: string | number) => ["levels", examId];

const levelsQueryFn = async (examId: string | number) => {
  const res = await fetchLevels(examId);
  return res.data;
};

// Shared staleTime/gcTime so a prefetch and this hook's own useQuery always
// agree on freshness — a mismatch here would make a prefetch technically
// populate the cache but immediately count as stale to the consuming hook.
const STALE_TIME = 5 * 60 * 1000; // 5 minutes
const GC_TIME = 10 * 60 * 1000; // 10 minutes

/* ----------------------------------
   HOOK
----------------------------------- */
export function useLevels(examId?: string | number) {
  const { data, isLoading, error } = useQuery<Level[]>({
    queryKey: examId ? LEVELS_QUERY_KEY(examId) : [],
    enabled: !!examId,

    queryFn: () => levelsQueryFn(examId!),

    // 🔥 replaces getCachedLevels / setCachedLevels
    staleTime: STALE_TIME,
    gcTime: GC_TIME,

    refetchOnWindowFocus: false,
    retry: 1,
  });

  return {
    levels: data ?? [],
    loading: isLoading,
    error: error as Error | null,
  };
}

/**
 * Warm the levels cache ahead of time for an exam whose enrollment isn't
 * finished yet (no paper/subject picked).
 *
 * Both the "New Exam Enrollment" modal (BuySigleCourseModal) and
 * EditCourseModal read this exam's levels via `useLevels` above, but the
 * modals themselves are `next/dynamic`-loaded (deliberately, to keep them
 * out of the initial bundle of high-traffic pages like the Learn dashboard —
 * see MyCoursesWrapTwo). That means the data fetch previously only started
 * *after* the modal's JS chunk had downloaded and the component mounted —
 * a sequential "download code, then fetch data" waterfall that's the main
 * reason the modal felt slow to show its data, even though the query itself
 * is small and already cached server-side.
 *
 * Calling this as soon as the exam is known (e.g. once the courses list
 * loads), rather than only on click, lets the request run in parallel with,
 * and typically well ahead of, the modal's chunk download — so by the time
 * it mounts, `useLevels` above just serves the already-resolved cache entry.
 */
export function prefetchLevels(
  queryClient: QueryClient,
  examId: string | number | null | undefined,
) {
  if (!examId) return;

  return queryClient.prefetchQuery({
    queryKey: LEVELS_QUERY_KEY(examId),
    queryFn: () => levelsQueryFn(examId),
    staleTime: STALE_TIME,
  });
}

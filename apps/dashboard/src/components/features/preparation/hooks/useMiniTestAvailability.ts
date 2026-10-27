"use client";

import { useQuery } from "@tanstack/react-query";
import { getMiniTestCount } from "@/lib/tests/getMiniTestQuestions";

export type MiniTestAvailability = "loading" | "available" | "none";

/**
 * Whether a topic has a mini test in the CURRENT course, from the backend's
 * exact count (the topic's own questions, scoped to the enrolled exam).
 *
 * - "loading": count not known yet (also while the course is not loaded) —
 *   callers reserve the button's space so the bar does not jump.
 * - "available": count > 0.
 * - "none": count is 0 OR the request failed — unavailable never shows a button.
 *
 * The key carries courseId because the same topic id is shared across exams.
 * One hook for the bottom bar, the chapter header, so they cannot disagree.
 */
export function useMiniTestAvailability(
  topicId?: number | null,
  courseId?: string | null,
) {
  const { data, isError, isPending } = useQuery({
    queryKey: ["minitest-count", courseId, topicId],
    queryFn: () => getMiniTestCount(topicId as number, courseId as string),
    enabled: !!topicId && !!courseId,
    staleTime: 1000 * 60 * 10,
    refetchOnWindowFocus: false,
    retry: 1,
  });

  const count = data ?? 0;
  const status: MiniTestAvailability = isError
    ? "none"
    : isPending
      ? "loading"
      : count > 0
        ? "available"
        : "none";

  return { status, count };
}

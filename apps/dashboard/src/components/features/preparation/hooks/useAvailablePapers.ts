"use client";

import { useMemo } from "react";
import { useLevels } from "@/hooks/onboarding/useLevels";

/**
 * How many papers the EXAM offers, vs. how many the user is enrolled in.
 *
 * `usePreparationStore().papers` only ever holds the papers the user already
 * bought (the backend derives them from that user's enrollment rows), so it
 * cannot answer "is there another paper this user could add?". That needs the
 * exam's full level tree, which `useLevels` already fetches and caches.
 *
 * Root levels (`parent_id === null`) are the papers; everything deeper is a
 * subject/level inside a paper. Same filter as the onboarding selection screens
 * and EditCourseModal.
 */
export function useAvailablePapers(examId?: string | number) {
  const { levels, loading, error } = useLevels(examId);

  const rootPapers = useMemo(
    () => levels.filter((level) => level.parent_id == null),
    [levels],
  );

  return {
    rootPapers,
    totalPapers: rootPapers.length,
    loading,
    error,
  };
}

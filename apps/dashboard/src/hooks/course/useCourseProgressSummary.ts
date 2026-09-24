"use client";

import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  getCoursesProgressSummary,
  CourseProgressSummary,
} from "@/lib/dashboard/userInteractions";

export const COURSES_PROGRESS_SUMMARY_KEY = (courseIds: string[]) => [
  "courses-progress-summary",
  courseIds,
];

/**
 * One request for every course's progress summary, keyed by course id.
 * Replaces a per-course hook: each My Courses card used to mount its own
 * query, so N enrolled courses meant N requests on every dashboard load
 * (Sentry CLEARCUTOFF-NEXTJS-APP-56, "N+1 API Call"). The caller reads its
 * course's entry from the returned map.
 */
export function useCoursesProgressSummary(
  courseIds: (string | number | undefined | null)[],
) {
  // Sorted + de-duplicated so the same set of courses in a different order
  // (the active course is moved to the front) shares one cache entry.
  const ids = useMemo(
    () =>
      Array.from(
        new Set(courseIds.filter((id): id is string | number => !!id).map(String)),
      ).sort(),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [courseIds.map((id) => id ?? "").join(",")],
  );

  return useQuery<Record<string, CourseProgressSummary>>({
    queryKey: COURSES_PROGRESS_SUMMARY_KEY(ids),
    queryFn: async () => {
      const res = await getCoursesProgressSummary(ids);
      return res.data ?? {};
    },
    enabled: ids.length > 0,
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 10,
    retry: 1,
    refetchOnWindowFocus: false,
  });
}

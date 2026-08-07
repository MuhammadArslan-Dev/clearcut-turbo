"use client";

import { useQuery } from "@tanstack/react-query";
import {
  getCourseProgressSummary,
  CourseProgressSummary,
} from "@/lib/dashboard/userInteractions";

export const COURSE_PROGRESS_SUMMARY_KEY = (courseId: string | number) => [
  "course-progress-summary",
  String(courseId),
];

export function useCourseProgressSummary(
  courseId: string | number | undefined | null,
) {
  return useQuery<CourseProgressSummary | null>({
    queryKey: COURSE_PROGRESS_SUMMARY_KEY(courseId ?? ""),
    queryFn: async () => {
      const res = await getCourseProgressSummary(courseId!);
      return res.data ?? null;
    },
    enabled: !!courseId,
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 10,
    retry: 1,
    refetchOnWindowFocus: false,
  });
}

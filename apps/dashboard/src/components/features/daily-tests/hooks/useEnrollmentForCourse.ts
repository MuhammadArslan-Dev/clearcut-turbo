"use client";

import { useMyActiveCourses } from "@/hooks/course/useMyActiveCourses";

/**
 * The user's enrollment for the opaque `courseId` (= enrollment uuid) in a
 * Daily Test URL — from the already-cached active courses. Only used for the
 * paywall (it needs the enrollment's group_code); the API independently
 * verifies the user owns that enrollment.
 */
export function useEnrollmentForCourse(courseId: string) {
  const { courses } = useMyActiveCourses();
  return [courses?.active_course, ...(courses?.courses ?? [])].find((c) => c?.uuid === courseId) ?? null;
}

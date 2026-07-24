"use client";

import {
  ExamEnrollmentWithExam,
  getMyActiveCourses,
  MyCoursesResponse,
} from "@/lib/dashboard/learning";
import { sentryApiClient } from "@/lib/sentry/sentry-api-client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { set } from "zod";

// queryKeys.ts
export const MY_COURSES_KEY = ["my-courses"];

export function useMyActiveCourses() {
  const queryClient = useQueryClient();

  const [activeCourse, setActiveCourse] =
    useState<ExamEnrollmentWithExam | null>(null);
  const [allCourses, setAllCourses] = useState<
    ExamEnrollmentWithExam[] | [null]
  >([]);

  const {
    data: courses,
    isLoading,
    isError,
    isFetching,
    refetch,
  } = useQuery<MyCoursesResponse>({
    queryKey: MY_COURSES_KEY,
    queryFn: () =>
      sentryApiClient(() => getMyActiveCourses(), {
        endpoint: "/my-active-courses",
        module: "dashboard",
      }),
    staleTime: 1000 * 60 * 5, // 5 minutes fresh
    gcTime: 1000 * 60 * 10, // 10 minutes cache
    retry: 1,
    refetchOnWindowFocus: false,
  });

  const clearCache = () => {
    setActiveCourse(null);
    setAllCourses([]);
    queryClient.removeQueries({ queryKey: MY_COURSES_KEY });
    refetch();
  };

  useEffect(() => {
    if (isFetching) return; // ✅ wait for fresh data
    if (!courses) return;

    setActiveCourse(courses.active_course ?? null);
    setAllCourses(courses.courses ?? []);
  }, [courses, isFetching]);

  return {
    courses,
    activeCourse: activeCourse ?? null,
    allCourses: allCourses ?? [],
    isLoading,
    isFetching,
    isError,
    refetch,
    clearCache,
  };
}

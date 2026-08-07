"use client";

import {
  CurrentCourseResponse,
  ExamEnrollmentWithExam,
  getCurrentCourse,
  getMyActiveCourses,
  MyCoursesResponse,
} from "@/lib/dashboard/learning";
import { sentryApiClient } from "@/lib/sentry/sentry-api-client";
import { useGetCurrentCourseStore } from "@/store/course/useGetCurrentCourseStore";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { set } from "zod";

// queryKeys.ts
export const MY_COURSES_KEY = (courseId: number | string) => [
  "get-current-course",
  courseId,
];
export function useGetCurrentCourse({
  courseId,
}: {
  courseId: number | string | undefined;
}) {
  const queryClient = useQueryClient();

  const { setCourse, setExam } = useGetCurrentCourseStore();

  const {
    data: courses,
    isLoading,
    isError,
    isFetching,
    refetch,
  } = useQuery<CurrentCourseResponse>({
    queryKey: MY_COURSES_KEY(courseId!),
    queryFn: () =>
      sentryApiClient(() => getCurrentCourse({ courseId }), {
        endpoint: "/current-course",
        module: "dashboard",
      }),
    staleTime: 1000 * 60 * 15, // 5 minutes fresh
    gcTime: 1000 * 60 * 25, // 10 minutes cache
    retry: 1,
    refetchOnWindowFocus: false,
  });

  const clearCache = () => {
    queryClient.removeQueries({ queryKey: MY_COURSES_KEY(courseId!) });
    refetch();
  };

  useEffect(() => {
    if (isFetching) return; // ✅ wait for fresh data
    if (!courses) return;

    setCourse(courses?.data);
    setExam(courses?.data?.exam!);
  }, [courses, isFetching]);

  return {
    isLoading,
    isFetching,
    isError,
    refetch,
    clearCache,
  };
}

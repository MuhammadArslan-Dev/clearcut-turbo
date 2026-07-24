import { Exam, ExamEnrollment } from "@/types/Exam";
import { apiFetch } from "../api/client";
const token = () => {
  return document.cookie
    .split("; ")
    .find(row => row.startsWith("auth_token="))
    ?.split("=")[1];
}
// lib/learning.ts
export async function getMyCourses(userId: string) {
  const res = await fetch(
    `https://api.example.com/users/${userId}/courses`,
    { cache: "no-store" }
  );

  if (!res.ok) throw new Error("Failed to fetch enrolled courses");
  return res.json();
}

export type ExamEnrollmentWithExam = ExamEnrollment & {
  exam: Exam;
};


export type MyCoursesResponse = {
  active_course: ExamEnrollmentWithExam | null;
  courses: ExamEnrollmentWithExam[];
};
export type CourseResponse = {
  data: MyCoursesResponse;
  message: string;
  status: string;
};

export const getMyActiveCourses = async (): Promise<MyCoursesResponse> => {
  const response = await apiFetch<CourseResponse>(
    '/v2/get-my-active-courses',
    {
      method: 'GET',
      cache: 'no-store',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token()}`,
      },
    }
  );

  return response.data;
};

export type CurrentCourseResponse = {
  data: ExamEnrollmentWithExam | null;
  message: string;
  status: string;
};
export const getCurrentCourse = async ({courseId}: {courseId: number | string | undefined }): Promise<CurrentCourseResponse> => {
  const response = await apiFetch<CurrentCourseResponse>(
    `/v2/preparation/get-course/${courseId}`,
    {
      method: 'GET',
      cache: 'no-store',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token()}`,
      },
    }
  );

  return response;
};


export type ChangeCourseResponse = {
  message: string;
  status: string;
};
export const changeCourse = async (course_id: number | string): Promise<ChangeCourseResponse> => {
  const response = await apiFetch<ChangeCourseResponse>(
    `/v2/change-course?course_id=${course_id}`,
    {
      method: 'GET',
      cache: 'no-store',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token()}`,
      },
    }
  );

  return response;
};




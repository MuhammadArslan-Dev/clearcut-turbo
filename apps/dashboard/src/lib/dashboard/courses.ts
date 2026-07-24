import { Exam, MyCourse } from "@/types/Exam";
import { authFetch, serverFetch } from "../server-fetch";

export type CourseResponse = {
    data: Exam[];
    message: string;
    status: string;
};
// lib/courses.ts
export async function getCourses(): Promise<Exam[]> {
    const response = await serverFetch<CourseResponse>("/blog/exam?status=active", {
        next: { revalidate: 300 },
    });
    return response.data; // Return just the data array
}

export type MyCourseResponse = {
    data: MyCourse[];
    message: string;
    status: string;
};
// my courses 
export async function myCourses(): Promise<MyCourse[]> {
    const response = await authFetch<MyCourseResponse>("/v2/get-mycourses", {
        // cache: "no-store", // 🔥 important
        next: { revalidate: 100 },
    });
    return response.data; // Return just the data array
}
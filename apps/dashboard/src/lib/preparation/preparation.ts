import {
  GetChapterResponse,
  GetExamSyllabusResponse,
} from "@/components/features/preparation/types/types";
import { apiFetch } from "../api/client";
import { token } from "../auth-token-client";

/**
 * Get Exam Syllabus Data
 */
export async function getExamSyllabus(
  exam_id?: number,
): Promise<GetExamSyllabusResponse> {
  return apiFetch<GetExamSyllabusResponse>(
    `/v2/preparation/get-sections/${exam_id}`,
    {
      method: "GET",
    },
  );
}
/**
 * Get Exam PYQs Data
 */
export async function getExamPYQs(
  exam_id?: number,
): Promise<{ status: string; message: string; data: any }> {
  return apiFetch<{ status: string; message: string; data: any }>(
    `/v2/preparation/get-pyqs/${exam_id}`,
    {
      method: "GET",
    },
  );
}
/**
 * Lightweight section list for an instance (no questions, just metadata).
 */
export async function getInstanceSections(
  instance_id: string,
  paper_id?: number | string | null,
): Promise<{ status: string; message: string; data: { sections: any[] } }> {
  const query = paper_id ? `?paper_id=${paper_id}` : "";
  console.log("Fetching sections for instance", instance_id, "paper", paper_id);
  return apiFetch<{ status: string; message: string; data: { sections: any[] } }>(
    `/v2/preparation/instance-sections/${instance_id}${query}`,
    { method: "GET" },
  );
}

/**
 * Paginated questions for one section of an instance.
 */
export async function getInstanceQuestions(params: {
  instance_id: string;
  section_id?: string;
  page?: number;
  per_page?: number;
}): Promise<{
  status: string;
  message: string;
  data: {
    questions: any[];
    total: number;
    current_page: number;
    last_page: number;
    per_page: number;
  };
}> {
  const { instance_id, section_id, page = 1, per_page = 20 } = params;
  const qs = new URLSearchParams();
  if (section_id) qs.set("section_id", section_id);
  qs.set("page", String(page));
  qs.set("per_page", String(per_page));

  return apiFetch(
    `/v2/preparation/instance-questions/${instance_id}?${qs.toString()}`,
    { method: "GET" },
  );
}

/**
 * Get Exam Instances from e_instances table
 */
export async function getExamInstances(
  course_id?: string,
): Promise<{ status: string; message: string; data: any[] }> {
  return apiFetch<{ status: string; message: string; data: any[] }>(
    `/v2/preparation/get-instances/${course_id}`,
    {
      method: "GET",
    },
  );
}

/**
 * Get Chapters Data
 */
export async function getChapters(
  section_id?: number,
  exam_id?: number | string,
): Promise<GetChapterResponse> {
  const query = section_id
    ? `?section_id=${section_id}&course_id=${exam_id}`
    : "";

  return apiFetch<GetChapterResponse>(
    `/v2/preparation/get-section-chapters${query}`,
    {
      method: "GET",
    },
  );
}

/**
 * Get Exam Syllabus Data
 */
export async function getSectionNotes(
  section_id: number,
  query?: string,
): Promise<GetChapterResponse> {
  return apiFetch<GetChapterResponse>(
    `/v2/content/get-notes/${section_id}${query}`,
    {
      method: "GET",
    },
  );
}

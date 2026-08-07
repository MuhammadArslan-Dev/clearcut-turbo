import { Exam } from "@/types/Exam";
import { apiFetch } from "./client";

export type TranslationContent = {
  name: string;
  group: string;
  detail: string;
};

export type LevelTranslation = {
  [languageCode: string]: TranslationContent;
};

export type Level = {
  id: string | number;
  entity: string | number;
  exam_id: string | number;
  group: string;
  name: string;
  parent_id: string | number;
  status: string;
  slug: string;
  translation: LevelTranslation;
};

export type LevelResponse = {
  data: Level[];
  status: string;
  message: string;
};
export type purchaseLevelsResponse = {
  data: { uuid: string; exam_id: string; group_code: string };
  status: string;
  message: string;
};

// Example: GET /exams?language=en
export async function fetchExams(language: string): Promise<Exam[]> {
  if (!language) return [];
  const res = await fetch(
    `https://apptest.clearcutoff.in/api/blog/exam?status=active`,
  );
  if (!res.ok) {
    throw new Error("Failed to fetch exams");
  }
  return res.json();
}

// Example: GET /levels?examId=123
export async function fetchLevels(
  examId: string | number,
): Promise<LevelResponse> {
  if (!examId) return { data: [], status: "error", message: "No examId" };
  return apiFetch<LevelResponse>(`/v1/exam/all-levels/${examId}`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  });
}

export async function purchaseLevels(formData: {
  language?: string | null;
  exam_id: string | number;
  selections: Record<number, number[]>;
  course_lang?: string | null;
}): Promise<purchaseLevelsResponse> {
  return apiFetch<purchaseLevelsResponse>(`/v1/exam/selectedexam`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(formData),
  });
}
export async function enrolledToCourse(formData: {
  exam_id: string | number;
  selections?: Record<number, number[]>;
  course_lang?: string | null;
}): Promise<purchaseLevelsResponse> {
  return apiFetch<purchaseLevelsResponse>(`/v2/enrollment/create`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(formData),
  });
}

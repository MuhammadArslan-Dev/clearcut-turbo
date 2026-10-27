import { QApiResponse, QuestionNew } from "@/components/features/preparation/types/question";
import { apiFetch } from "../api/client";

type QuestionsResponse = QApiResponse<QuestionNew[]>;

// lib/api/getMiniTestQuestions.ts
export async function getMiniTestQuestions(
  topicId?: number,
  query?: string,
): Promise<QuestionsResponse> {
  return apiFetch<QuestionsResponse>(`/v2/mini-test/get${query}`, {
    method: "GET",
  });
}

// Exact number of mini-test questions for one topic in the enrolled course's
// exam. Same exam scoping as the questions endpoint, so a count > 0 guarantees
// the test can actually start.
export async function getMiniTestCount(
  topicId: number,
  courseId: string,
): Promise<number> {
  const res = await apiFetch<QApiResponse<{ count: number }>>(
    `/v2/mini-test/count?topicId=${topicId}&courseId=${encodeURIComponent(courseId)}`,
    { method: "GET" },
  );
  return Number(res.data?.count ?? 0);
}

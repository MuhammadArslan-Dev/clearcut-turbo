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

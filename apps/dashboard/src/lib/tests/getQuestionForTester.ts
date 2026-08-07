import { apiFetch } from "../api/client";
import { QuestionTesterResponse } from "@/components/features/question-tester/types";

/**
 * Fetch a single question (by primary key `id` OR external `question_id`)
 * with all its translations, for the question tester / preview page.
 */
export async function getQuestionForTester(
  id: string,
): Promise<QuestionTesterResponse> {
  return apiFetch<QuestionTesterResponse>(
    `/v2/question-tester/${encodeURIComponent(id)}`,
    { method: "GET" },
  );
}

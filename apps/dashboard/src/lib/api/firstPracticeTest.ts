import { apiFetch } from "./client";
import { token as tokenApi } from "../auth-token-client";

// The one-time practice test between subject selection and Preparation.
// {courseId} is the enrolment's group_code (the id the /preparation URL uses);
// the backend re-verifies the enrolment is the caller's own and already has
// subjects, and answers 404 otherwise.

export interface PracticeQuestionTranslation {
  locale: string;
  question: string | null;
  question_image?: string | null;
  options: Record<"1" | "2" | "3" | "4", string | null>;
}

export interface PracticeQuestion {
  question_id: number;
  /** The subject (section) this question comes from. */
  subject: string | null;
  question: string | null;
  question_image?: string | null;
  options: Record<"1" | "2" | "3" | "4", string | null>;
  translations?: PracticeQuestionTranslation[];
}

/** One question's outcome — only returned after the test is submitted. */
export interface PracticeAnswerCheck {
  question_id: number;
  selected_option: number | null;
  correct_option: number;
  is_correct: boolean;
  explanation: string | null;
  translations?: { locale: string; explanation: string | null }[];
}

/** One question's explanation, asked for during the test ("Show Explanation"). Read-only: never completes the test. */
export interface PracticeExplanation {
  question_id: number;
  correct_option: number;
  explanation: string | null;
  translations?: { locale: string; explanation: string | null }[];
}

export const PRACTICE_TEST_QUESTION_COUNT = 5;

const base = (courseId: string) => `/v2/first-practice-test/${encodeURIComponent(courseId)}`;
const authHeaders = () => ({ Authorization: `Bearer ${tokenApi()}` });

export async function getPracticeTestQuestions(
  courseId: string,
  count = PRACTICE_TEST_QUESTION_COUNT,
): Promise<PracticeQuestion[]> {
  const res = await apiFetch<{ data: { questions: PracticeQuestion[] } }>(`${base(courseId)}?count=${count}`, {
    method: "GET",
    headers: authHeaders(),
  });
  return res.data.questions;
}

/**
 * Submits the finished test in one request and gets every question's correct
 * option + explanation back. Answers and explanations are never available
 * before this call. `selectedOption` null/absent = skipped.
 */
export async function submitPracticeTest(
  courseId: string,
  answers: { question_id: number; selected_option?: number | null }[],
): Promise<PracticeAnswerCheck[]> {
  const res = await apiFetch<{ data: { results: PracticeAnswerCheck[] } }>(`${base(courseId)}/submit`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...authHeaders() },
    body: JSON.stringify({ answers }),
  });
  return res.data.results;
}

/** The explanation (and correct option) of ONE question, for the "Show Explanation" button. Does not record a result. */
export async function getPracticeExplanation(courseId: string, questionId: number): Promise<PracticeExplanation> {
  const res = await apiFetch<{ data: PracticeExplanation }>(`${base(courseId)}/explanation`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...authHeaders() },
    body: JSON.stringify({ question_id: questionId }),
  });
  return res.data;
}

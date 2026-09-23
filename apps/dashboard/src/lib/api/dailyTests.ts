import { apiFetch } from "./client";
import { token as tokenApi } from "../auth-token-client";
import { ExamTranslation } from "@/types/Exam";

export interface DailyTestExam {
  /** Opaque id for Daily Test URLs (the user's own enrollment uuid). */
  course_id: string | null;
  name: string;
  short_name: string;
  logo_url: string | null;
  // Same two fields Exam carries — lets this list reuse useCourseFilters'
  // "Select your state" filtering as-is (see /dashboard/my-courses).
  state: string;
  translation?: ExamTranslation;
  expected_cutoff: string | null;
  daily_tests_count: number;
  attempted_today: boolean;
  has_todays_test: boolean;
  todays_test_id: string | null;
}

export interface DailyTestHabitStats {
  tests_attempted: number;
  avg_score_percent: number;
  day_streak: number;
}

export interface DailyTestHistoryItem {
  /** Opaque public id of the test (uuid). */
  test_id: string;
  test_date: string;
  total_questions: number;
  locked: boolean;
  attempted: boolean;
  in_progress: boolean;
  /** How many times this test has been completed (retakes included). */
  attempts_count?: number;
  /** Highest-scoring completed attempt of this test. */
  best_score?: { score: number; total_questions: number } | null;
  /** ISO time of the most recent completed attempt. */
  last_attempt_at?: string | null;
  score: number | null;
  attempt_id: string | null;
  topic_meta?: { section_name?: string | null; chapter_name?: string | null } | null;
}

export interface DailyTestHistoryExam {
  name: string;
  short_name: string;
  logo_url: string | null;
}

export interface DailyTestBestScore {
  score: number;
  total_questions: number;
}

export interface DailyTestHistoryResponse {
  exam: DailyTestHistoryExam;
  is_paid: boolean;
  total_tests: number;
  best_score: DailyTestBestScore | null;
  avg_time_minutes: number | null;
  tests: DailyTestHistoryItem[];
}

export interface DailyTestQuestionTranslation {
  locale: string;
  question: string | null;
  question_image?: string | null;
  options: Record<"1" | "2" | "3" | "4", string | null>;
}

export interface DailyTestQuestion {
  question_id: number;
  question: string | null;
  question_image?: string | null;
  options: Record<"1" | "2" | "3" | "4", string | null>;
  translations?: DailyTestQuestionTranslation[];
}

export interface DailyTestStartResponse {
  status: "in_progress";
  attempt_id: string;
  test_date: string;
  topic_meta?: { section_name?: string | null; chapter_name?: string | null } | null;
  questions: DailyTestQuestion[];
}

export interface DailyTestResultQuestion extends DailyTestQuestion {
  selected_option: number | null;
  correct_option: number;
  is_correct: boolean;
  explanation: string | null;
}

export interface DailyTestResult {
  status: "completed";
  attempt_id: string;
  attempt_number?: number;
  score: number;
  total_questions: number;
  is_paid: boolean;
  questions?: DailyTestResultQuestion[];
}

export interface DailyTestAttemptSummary {
  attempt_id: string;
  attempt_number: number;
  started_at: string | null;
  completed_at: string | null;
  time_taken_seconds: number | null;
  score: number;
  total_questions: number;
}

export interface DailyTestAttemptsResponse {
  test_id: string;
  test_date: string | null;
  is_today: boolean;
  is_paid: boolean;
  locked: boolean;
  exam: { name: string; short_name: string; logo_url: string | null } | null;
  section_name: string | null;
  chapter_name: string | null;
  total_questions: number;
  /** Newest attempt first. */
  attempts: DailyTestAttemptSummary[];
}

export type DailyTestStartOrResult = DailyTestStartResponse | DailyTestResult;

export async function getDailyTestExams(): Promise<{
  data: { exams: DailyTestExam[]; stats: DailyTestHabitStats };
}> {
  return apiFetch<{ data: { exams: DailyTestExam[]; stats: DailyTestHabitStats } }>(
    "/v2/daily-tests/exams",
    { method: "GET", headers: { Authorization: `Bearer ${tokenApi()}` } },
  );
}

// Every call is scoped by opaque ids — {courseId} is the user's enrollment
// uuid, {testId}/{attemptId} are uuids — and the backend re-verifies
// enrollment, test assignment and attempt ownership on each request (the ids
// in the URL are lookup keys, never authorization).
const dt = (courseId: string) => `/v2/daily-tests/${encodeURIComponent(courseId)}`;
const dtTest = (courseId: string, testId: string) => `${dt(courseId)}/tests/${encodeURIComponent(testId)}`;
const authHeaders = () => ({ Authorization: `Bearer ${tokenApi()}` });
const jsonHeaders = () => ({ "Content-Type": "application/json", ...authHeaders() });

export async function getDailyTestHistory(courseId: string): Promise<{ data: DailyTestHistoryResponse }> {
  return apiFetch<{ data: DailyTestHistoryResponse }>(`${dt(courseId)}/history`, {
    method: "GET",
    headers: authHeaders(),
  });
}

/**
 * `retake: true` starts a NEW numbered attempt of an already-completed test
 * (same DailyTest, same questions). Without it, start() resumes an unfinished
 * attempt or — for a completed test — just returns the latest result.
 */
export async function startDailyTest(
  courseId: string,
  testId: string,
  options?: { retake?: boolean },
): Promise<{ data: DailyTestStartOrResult }> {
  return apiFetch<{ data: DailyTestStartOrResult }>(`${dtTest(courseId, testId)}/start`, {
    method: "POST",
    headers: jsonHeaders(),
    body: JSON.stringify({ retake: options?.retake === true }),
  });
}

export async function getDailyTestAttempts(
  courseId: string,
  testId: string,
): Promise<{ data: DailyTestAttemptsResponse }> {
  return apiFetch<{ data: DailyTestAttemptsResponse }>(`${dtTest(courseId, testId)}/attempts`, {
    method: "GET",
    headers: authHeaders(),
  });
}

export async function submitDailyTest(
  courseId: string,
  testId: string,
  attemptId: string,
  answers: Record<number, number>,
): Promise<{ data: DailyTestResult }> {
  return apiFetch<{ data: DailyTestResult }>(
    `${dtTest(courseId, testId)}/attempts/${encodeURIComponent(attemptId)}/submit`,
    { method: "POST", headers: jsonHeaders(), body: JSON.stringify({ answers }) },
  );
}

export async function getDailyTestResult(
  courseId: string,
  testId: string,
  attemptId: string,
): Promise<{ data: DailyTestResult }> {
  return apiFetch<{ data: DailyTestResult }>(
    `${dtTest(courseId, testId)}/attempts/${encodeURIComponent(attemptId)}/result`,
    { method: "GET", headers: authHeaders() },
  );
}

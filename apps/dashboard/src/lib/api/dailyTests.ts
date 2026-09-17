import { apiFetch } from "./client";
import { token as tokenApi } from "../auth-token-client";
import { ExamTranslation } from "@/types/Exam";

export interface DailyTestExam {
  id: number;
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
  todays_test_id: number | null;
}

export interface DailyTestHabitStats {
  tests_attempted: number;
  avg_score_percent: number;
  day_streak: number;
}

export interface DailyTestHistoryItem {
  daily_test_id: number;
  test_date: string;
  total_questions: number;
  locked: boolean;
  attempted: boolean;
  in_progress: boolean;
  score: number | null;
  attempt_id: number | null;
}

export interface DailyTestHistoryExam {
  id: number;
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

export interface DailyTestQuestion {
  question_id: number;
  question: string | null;
  question_image?: string | null;
  options: Record<"1" | "2" | "3" | "4", string | null>;
}

export interface DailyTestStartResponse {
  status: "in_progress";
  attempt_id: number;
  test_date: string;
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
  attempt_id: number;
  score: number;
  total_questions: number;
  is_paid: boolean;
  questions?: DailyTestResultQuestion[];
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

export async function getDailyTestHistory(
  examId: number | string,
): Promise<{ data: DailyTestHistoryResponse }> {
  return apiFetch<{ data: DailyTestHistoryResponse }>(`/v2/daily-tests/${examId}/history`, {
    method: "GET",
    headers: { Authorization: `Bearer ${tokenApi()}` },
  });
}

export async function startDailyTest(
  dailyTestId: number | string,
): Promise<{ data: DailyTestStartOrResult }> {
  return apiFetch<{ data: DailyTestStartOrResult }>(`/v2/daily-tests/${dailyTestId}/start`, {
    method: "POST",
    headers: { Authorization: `Bearer ${tokenApi()}` },
  });
}

export async function submitDailyTest(
  attemptId: number | string,
  answers: Record<number, number>,
): Promise<{ data: DailyTestResult }> {
  return apiFetch<{ data: DailyTestResult }>(`/v2/daily-tests/attempts/${attemptId}/submit`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${tokenApi()}`,
    },
    body: JSON.stringify({ answers }),
  });
}

export async function getDailyTestResult(
  attemptId: number | string,
): Promise<{ data: DailyTestResult }> {
  return apiFetch<{ data: DailyTestResult }>(`/v2/daily-tests/attempts/${attemptId}/result`, {
    method: "GET",
    headers: { Authorization: `Bearer ${tokenApi()}` },
  });
}

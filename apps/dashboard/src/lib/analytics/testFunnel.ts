import { trackEvent } from "./browser";
import type { Exam } from "@/components/features/exam/types/exam";

/**
 * Test completion funnel (CC-103): Test Started -> Test Submitted ->
 * Performance Report Viewed / Performance Report Tab Viewed, plus
 * Test Abandoned. All but Test Abandoned are the catalog's existing events;
 * "Test Submitted" and the report events were defined but never sent.
 */

type EndExamResult = {
  total_questions?: number;
  correct?: number;
  wrong?: number;
  unanswered?: number;
  percentage?: number;
};

type EndExamResponse = {
  data?: {
    result?: EndExamResult | null;
    exam?: { type?: string | null; started_at?: string | null; submitted_at?: string | null } | null;
  };
};

function onceForExam(kind: string, examUuid: string | undefined): boolean {
  if (!examUuid) return false;
  const key = `cc-${kind}:${examUuid}`;
  try {
    if (sessionStorage.getItem(key)) return false;
    sessionStorage.setItem(key, "1");
  } catch {
    // Storage blocked: send anyway.
  }
  return true;
}

function sectionName(exam: Exam | null): string | undefined {
  const sections = exam?.sections ?? [];
  if (sections.length !== 1) return undefined;
  const s = sections[0] as unknown as { section?: { name?: string } };
  return s.section?.name ?? undefined;
}

/** After /v2/exam/end-exam succeeded: the attempt is saved on the server. */
export function trackTestSubmitted(
  exam: Exam | null,
  response: EndExamResponse | null,
  reason: "manual" | "time_up",
  language: string,
) {
  const result = response?.data?.result;
  if (!exam || !result || !onceForExam("test_submitted", exam.uuid)) return;

  const startedAt = response?.data?.exam?.started_at ?? exam.started_at;
  const submittedAt = response?.data?.exam?.submitted_at ?? new Date().toISOString();
  const seconds =
    startedAt && submittedAt
      ? Math.max(0, Math.round((Date.parse(submittedAt) - Date.parse(startedAt)) / 1000))
      : undefined;
  const correct = Number(result.correct ?? 0);

  trackEvent("Test Submitted", {
    test_id: exam.uuid,
    test_type: response?.data?.exam?.type ?? exam.type ?? "unknown",
    // The attempt's own id: there is no separate session id for a test.
    test_session_id: exam.uuid,
    correct_count: correct,
    incorrect_count: Number(result.wrong ?? 0),
    unattempted_count: Number(result.unanswered ?? 0),
    // One mark per question in these tests.
    score: correct,
    percent_score: Number(result.percentage ?? 0),
    submission_reason: reason,
    time_taken_seconds: Number.isFinite(seconds) ? seconds : undefined,
    exam: exam.course?.exam?.short_name ?? exam.course?.short_name ?? undefined,
    course_id: exam.course?.group_code ?? undefined,
    section_name: sectionName(exam),
    total_questions: Number(result.total_questions ?? 0),
    language,
  });
}

/** The student left an in-progress test (page closed) or went idle for 30 min. */
export function trackTestAbandoned(exam: Exam | null, reason: "page_closed" | "idle_30m", answered: number) {
  if (!exam || exam.status !== "in_progress" || !onceForExam("test_abandoned", exam.uuid)) return;
  trackEvent("Test Abandoned", {
    test_id: exam.uuid,
    test_type: exam.type ?? "unknown",
    course_id: exam.course?.group_code ?? undefined,
    reason,
    answered,
  });
}

type ReportExam = { uuid?: string; type?: string | null; result?: { correct?: number } | null } | null | undefined;

/** Report opened (once per opening) — the existing "Performance Report Viewed". */
export function trackReportOpened(testId: string, exam: ReportExam) {
  trackEvent("Performance Report Viewed", {
    test_id: testId,
    test_type: exam?.type ?? "unknown",
    score: Number(exam?.result?.correct ?? 0),
    entry_point: "test_series",
  });
}

/** A report tab was opened — the existing "Performance Report Tab Viewed". */
export function trackReportTab(testId: string, tab: string) {
  trackEvent("Performance Report Tab Viewed", { test_id: testId, tab_name: tab });
}

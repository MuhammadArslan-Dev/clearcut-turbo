import { canTrackEvents, trackEvent, trackEventOnExit } from "./browser";
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
  // canTrackEvents first: never burn the once-per-attempt guard when nothing can be sent.
  if (!exam || exam.status !== "in_progress" || !canTrackEvents() || !onceForExam("test_abandoned", exam.uuid)) return;
  // Fired from pagehide, so it must be flushed before the page is gone.
  trackEventOnExit("Test Abandoned", {
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

// ---------------------------------------------------------------------------
// Practice Test (first enrolment) and Daily Test: the same three events as a
// test-series exam, told apart by test_type. Neither has a server-side Exam
// object, so the payloads are built from what each screen knows.
// ---------------------------------------------------------------------------

export type LiteTestKind = "practice_test" | "daily_test";

type LiteTestBase = {
  kind: LiteTestKind;
  /** Stable id of the test (practice: the course; daily: the test). */
  testId: string;
  /** One value per attempt (retakes get their own); also the once-per-attempt key. */
  sessionId: string;
  /** The course's group_code, like a test-series exam's course.group_code. */
  courseId?: string;
  /** Exam short name (e.g. "CTET"). */
  exam?: string;
  sectionName?: string;
  totalQuestions: number;
};

export type LiteTestOutcome = {
  correct: number;
  /** Questions left without an answer; the rest of the wrong ones are derived. */
  unattempted: number;
  timeTakenSeconds?: number;
  reason: "manual" | "time_up";
  language: string;
};

/** Pure: the Test Submitted payload for a practice/daily test. */
export function buildLiteSubmittedPayload(base: LiteTestBase, outcome: LiteTestOutcome) {
  const total = Math.max(0, base.totalQuestions);
  const correct = Math.min(Math.max(0, outcome.correct), total);
  const unattempted = Math.min(Math.max(0, outcome.unattempted), total - correct);
  return {
    test_id: base.testId,
    test_type: base.kind,
    test_session_id: base.sessionId,
    correct_count: correct,
    incorrect_count: total - correct - unattempted,
    unattempted_count: unattempted,
    // One mark per question, as in the test series.
    score: correct,
    percent_score: total > 0 ? Math.round((correct / total) * 10000) / 100 : 0,
    submission_reason: outcome.reason,
    time_taken_seconds:
      outcome.timeTakenSeconds != null && Number.isFinite(outcome.timeTakenSeconds)
        ? Math.max(0, Math.round(outcome.timeTakenSeconds))
        : undefined,
    exam: base.exam,
    course_id: base.courseId,
    section_name: base.sectionName,
    total_questions: total,
    language: outcome.language,
  };
}

/** Existing "Test Started", once per attempt (a refresh/resume does not repeat it). */
export function trackLiteTestStarted(base: LiteTestBase) {
  if (!onceForExam(`test_started_${base.kind}`, base.sessionId)) return;
  trackEvent("Test Started", {
    test_id: base.testId,
    test_type: base.kind,
    test_session_id: base.sessionId,
    section_name: base.sectionName,
    course_id: base.courseId,
    exam: base.exam,
    total_questions: base.totalQuestions,
  });
}

/** Existing "Test Submitted", once per attempt. Call only after the submit succeeded. */
export function trackLiteTestSubmitted(base: LiteTestBase, outcome: LiteTestOutcome) {
  if (!onceForExam(`test_submitted_${base.kind}`, base.sessionId)) return;
  trackEvent("Test Submitted", buildLiteSubmittedPayload(base, outcome));
}

/** Existing "Test Abandoned", once per attempt. */
export function trackLiteTestAbandoned(base: LiteTestBase, reason: "page_closed" | "idle_30m", answered: number) {
  if (!canTrackEvents() || !onceForExam(`test_abandoned_${base.kind}`, base.sessionId)) return;
  // Fired from pagehide, so it must be flushed before the page is gone.
  trackEventOnExit("Test Abandoned", {
    test_id: base.testId,
    test_type: base.kind,
    course_id: base.courseId,
    reason,
    answered,
  });
}

/**
 * Same triggers as the exam page (mainContent.tsx): the page is closed, or 30
 * minutes without a tap/key while the test is in progress. Returns the cleanup.
 * Only `pagehide` counts as "closed": switching tabs/apps fires visibilitychange
 * but not pagehide, so a student who comes back is never marked abandoned.
 */
export function watchTestAbandoned(onAbandon: (reason: "page_closed" | "idle_30m") => void): () => void {
  const IDLE_MS = 30 * 60 * 1000;
  let idleTimer = window.setTimeout(() => onAbandon("idle_30m"), IDLE_MS);
  const onActivity = () => {
    window.clearTimeout(idleTimer);
    idleTimer = window.setTimeout(() => onAbandon("idle_30m"), IDLE_MS);
  };
  const onPageHide = () => onAbandon("page_closed");
  window.addEventListener("pointerdown", onActivity, { passive: true });
  window.addEventListener("keydown", onActivity);
  window.addEventListener("pagehide", onPageHide);
  return () => {
    window.clearTimeout(idleTimer);
    window.removeEventListener("pointerdown", onActivity);
    window.removeEventListener("keydown", onActivity);
    window.removeEventListener("pagehide", onPageHide);
  };
}

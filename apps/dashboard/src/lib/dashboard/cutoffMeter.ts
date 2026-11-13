import { apiFetch } from "../api/client";

/** One course's meter, as the My Courses card needs it (BE `CutoffMeterController::summary`). */
export interface CutoffMeterSummary {
  locked: boolean;
  meter: number | null;
  max_marks: number;
  pass_mark: number;
  gap: number | null;
  colour: "red" | "yellow" | "green" | null;
  confidence: "low" | "medium" | "high" | null;
  counted_answers: number;
  unlock_answers: number;
  /** Unlock rule (client, 2026-11-12): any test with at least this many questions unlocks the meter. */
  unlock_min_test_questions?: number;
  change: number | null;
  model_version: string;
  computed_at: string | null;
  // Display state (phase 98) — computed on the server, never stored.
  zone: "needs_work" | "almost_there" | "clear_zone" | "safe_zone" | null;
  /** Few answers yet (confidence low) → pill reads "Early estimate". */
  early: boolean;
  idle_days: number | null;
  last_answer_at: string | null;
  /** Display-only decay while idle (studio "Cooling down"); the next test restores it. */
  cooling: { active: boolean; decay: number };
  /** Meter after cooling — what the card shows. */
  display_meter: number | null;
  display_gap: number | null;
  /** "Range ±N" (phase 99; from confidence). */
  band?: number | null;
  /** distinct tests behind the counted answers ("based on N tests"). */
  tests_count?: number;
}

/**
 * Meter summaries for several courses in ONE request, keyed by course id
 * (enrollment group_code) — same reason as getCoursesProgressSummary (no N+1).
 * Courses that aren't the caller's are simply absent from the map.
 */
export async function getCoursesCutoffMeter(
  courseIds: (string | number)[],
): Promise<Record<string, CutoffMeterSummary>> {
  const qs = courseIds.map((id) => `courses[]=${encodeURIComponent(String(id))}`).join("&");
  const res = await apiFetch<{ data: Record<string, CutoffMeterSummary> }>(`/v2/cutoff-meter?${qs}`, {
    method: "GET",
  });
  return res?.data ?? {};
}

/** One subject (exam section) on the Target tab: predicted marks out of its total. */
export interface CutoffMeterSection {
  section_id: number;
  name: string;
  total_marks: number;
  section_marks: number;
  /** Smoothed accuracy the marks use: (correct + prior_correct) / (attempted + prior_attempts). */
  accuracy: number;
  /** The student's own accuracy (correct / attempted); null before any answer. */
  raw_accuracy?: number | null;
  marks_lost: number;
  attempted: number;
  correct: number;
}

export type CutoffMeterActionType = "ONBOARDING_TEST" | "TOPIC_TEST" | "LEARN" | "SECTIONAL_TEST" | "FULL_LENGTH_TEST";

/** A "Today's plan" row (NBA, BE `NextBestActionService`). */
export interface CutoffMeterAction {
  id: string;
  rank: number;
  action_type: CutoffMeterActionType;
  section_id: number | null;
  topic_id: number | null;
  chapter_id?: number | null;
  test_id: number | null;
  locked: boolean;
  title: string;
  reason_key: string;
  params: Record<string, string | number>;
  est_time_min: number;
  /** "+N marks" estimate (phase 99 D2); null for unlock / full-length. */
  expected_gain?: number | null;
  clicked: boolean;
  completed: boolean;
}

/**
 * Target tab "Today's goals" (phase 111, BE TodayGoalsService): next topic, sectional test and
 * full-length test of the student's current paper — all from real progress / attempts.
 */
export interface TodayGoalBase {
  key: "next_topic" | "sectional_test" | "full_length_test";
  /** todo, locked (the plan does not include it) or none (nothing left to offer). */
  status: "todo" | "locked" | "none";
  locked: boolean;
  /** Activity of this kind today (IST). */
  completed_today: boolean;
  today_count: number;
  progress: { done: number; total: number };
  paper_id?: number;
  section_id?: number;
  test_id?: number;
}
export interface NextTopicGoal extends TodayGoalBase {
  key: "next_topic";
  topic_id?: number;
  chapter_id?: number;
  topic?: string;
  chapter?: string;
  section?: string;
}
export interface SectionalGoal extends TodayGoalBase {
  key: "sectional_test";
  test_number?: number;
  questions?: number;
  section?: string;
}
export interface FullLengthGoal extends TodayGoalBase {
  key: "full_length_test";
  test_number?: number;
}
export interface TodayGoals {
  next_topic: NextTopicGoal;
  sectional_test: SectionalGoal;
  full_length_test: FullLengthGoal;
}

/** Full meter for one course (`GET /v2/cutoff-meter/{course}`) — the Target tab. */
export interface CutoffMeterDetail extends CutoffMeterSummary {
  pass_mark_source: string;
  sections: CutoffMeterSection[];
  /** Latest generated actions (regenerated after every submit). */
  actions: CutoffMeterAction[];
  /** Today's first list (IST), so done rows stay ticked. Empty before today's first generation. */
  plan: CutoffMeterAction[];
  band: number | null;
  /** last saved meter per IST week, oldest first ("Last 5 weeks"). */
  trend?: number[];
  /** Today's goals (phase 111); absent from an older backend. */
  goals?: TodayGoals;
  /** The documented marks formula (spec 1.1) — used to explain a subject's marks, never to recompute them. */
  scoring?: { prior_correct: number; prior_attempts: number; estimate_below: number };
}

export async function getCutoffMeter(courseId: string | number): Promise<CutoffMeterDetail> {
  const res = await apiFetch<{ data: CutoffMeterDetail }>(`/v2/cutoff-meter/${encodeURIComponent(String(courseId))}`, {
    method: "GET",
  });
  return res.data;
}

/**
 * A topic test that ran on the legacy browser flow (the server attempt could not
 * start): send its answers so the Cutoff Meter counts them too — every test type
 * feeds the meter. The server decides right/wrong; `attemptRef` (one per open)
 * makes a retry idempotent.
 */
export async function sendLegacyTopicAnswers(payload: {
  course_id: string;
  topic_id: number;
  attempt_ref: string;
  answers: Record<number, number | null>;
  locale?: string;
}): Promise<void> {
  await apiFetch(`/v2/cutoff-meter/topic-answers`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}

/** Questions a single test needs to unlock the meter (backend config; 5 when an older backend omits it). */
export function unlockMinQuestions(m: Pick<CutoffMeterSummary, "unlock_min_test_questions">): number {
  return m.unlock_min_test_questions ?? 5;
}

/** Fire-and-forget: the student tapped a plan row / the Start CTA (`nba_log.clicked_at`). */
export async function markCutoffMeterActionClicked(actionId: string): Promise<void> {
  await apiFetch(`/v2/cutoff-meter/actions/${encodeURIComponent(actionId)}/click`, { method: "POST" });
}

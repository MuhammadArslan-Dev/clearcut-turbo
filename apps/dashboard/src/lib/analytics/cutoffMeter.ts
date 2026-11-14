import { trackEvent } from "./browser";
import { type CutoffMeterAction, type CutoffMeterSummary } from "@/lib/dashboard/cutoffMeter";
import type { CutoffMeterBaseProps, CutoffMeterSurface } from "./events/cutoff_meter";

/**
 * Cutoff Meter analytics (phase 108) — the one place that builds the payloads, so every
 * surface (Learn card, Target tab, info sheet) sends identical property names and values.
 * Everything is read from the backend meter response; nothing is invented here.
 */
export interface MeterCtx {
  surface: CutoffMeterSurface;
  /** The course's group_code. */
  courseId?: string | null;
  examName?: string | null;
  level?: string | null;
  paper?: string | null;
  /** Backend user uuid — scopes the saved snapshot so two accounts on one browser never mix. */
  userId?: string | null;
}

export function meterProps(m: CutoffMeterSummary, ctx: MeterCtx): CutoffMeterBaseProps {
  const locked = m.locked || m.meter === null;
  const score = locked ? undefined : Math.round(m.display_meter ?? m.meter ?? 0);
  const gap = locked ? undefined : (m.display_gap ?? m.gap ?? undefined);
  return {
    surface: ctx.surface,
    course_id: ctx.courseId ?? undefined,
    exam_name: ctx.examName ?? undefined,
    level: ctx.level ?? undefined,
    paper: ctx.paper ?? undefined,
    meter_status: locked ? "locked" : "unlocked",
    zone: locked ? undefined : (m.zone ?? undefined),
    colour: locked ? undefined : (m.colour ?? undefined),
    score,
    max_marks: m.max_marks,
    cutoff_value: Math.round(m.pass_mark),
    gap: gap == null ? undefined : Math.round(gap),
    percent: score == null || !m.max_marks ? undefined : Math.round((score / m.max_marks) * 1000) / 10,
    confidence: locked ? undefined : (m.confidence ?? undefined),
    is_early_estimate: !locked && !!m.early,
    is_cooling: !locked && !!m.cooling?.active,
    tests_count: m.tests_count,
    counted_answers: m.counted_answers,
    model_version: m.model_version,
  };
}

export function trackMeterClicked(m: CutoffMeterSummary, ctx: MeterCtx) {
  trackEvent("Cutoff Meter Clicked", { ...meterProps(m, ctx), click_target: "info_sheet" });
}

export function trackMeterInfoViewed(m: CutoffMeterSummary, ctx: MeterCtx, openedFrom: "learn_card" | "target_page") {
  trackEvent("Cutoff Meter Info Viewed", {
    ...meterProps(m, { ...ctx, surface: "info_sheet" }),
    opened_from: openedFrom,
  });
}

export function trackMeterActionClicked(
  m: CutoffMeterSummary,
  ctx: MeterCtx,
  action: Omit<CutoffMeterAction, "est_time_min"> & { est_time_min?: number },
  planPosition?: number,
) {
  trackEvent("Cutoff Meter Action Clicked", {
    ...meterProps(m, ctx),
    action_id: action.id,
    action_type: action.action_type,
    rank: action.rank,
    plan_position: planPosition && planPosition > 0 ? planPosition : undefined,
    section_id: action.section_id,
    topic_id: action.topic_id,
    test_id: action.test_id,
    expected_gain: action.expected_gain,
    est_time_min: action.est_time_min,
    is_locked_plan: !!(m.locked || m.meter === null),
  });
}

// ── What caused the next meter change ────────────────────────────────────────────────
// Each submit path tells us which test it just saved (next to `invalidateCutoffMeterQueries`);
// the next score / zone / unlock change for that course carries it. A change nobody here
// caused (another device, a reload, a recompute) is reported as `refresh`.
export interface MeterTrigger {
  test_type?: string;
  test_id?: string;
  course_id?: string | null;
}
const TRIGGER_TTL_MS = 10 * 60 * 1000;
let pendingTrigger: (MeterTrigger & { at: number }) | null = null;

export function noteMeterTrigger(t: MeterTrigger) {
  pendingTrigger = { ...t, at: Date.now() };
}

function takeTrigger(courseId?: string | null) {
  const t = pendingTrigger;
  if (!t || Date.now() - t.at > TRIGGER_TTL_MS) return null;
  if (t.course_id && courseId && t.course_id !== courseId) return null;
  pendingTrigger = null;
  return t;
}

// ── Change detection ─────────────────────────────────────────────────────────────────
// A per-browser snapshot of the last meter this student SAW for a course. A change is
// reported only against that snapshot and only once per backend computation (`computed_at`),
// so the Learn card and the Target tab (or a remount) never report the same change twice.
interface Snapshot {
  sig: string;
  locked: boolean;
  zone: string | null;
  colour: string | null;
  score: number | null;
}

const snapKey = (userId: string | null | undefined, courseId: string) => `cc-meter-snap:${userId ?? "anon"}:${courseId}`;

function readSnap(key: string): Snapshot | null {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as Snapshot) : null;
  } catch {
    return null;
  }
}
function writeSnap(key: string, s: Snapshot) {
  try {
    localStorage.setItem(key, JSON.stringify(s));
  } catch {
    // Storage blocked: change events are skipped, never faked.
  }
}

const ZONE_RANK: Record<string, number> = { needs_work: 0, almost_there: 1, clear_zone: 2, safe_zone: 3 };

/**
 * Call with every meter the student is shown. First sight only stores the snapshot (no
 * fake "change"); afterwards sends Unlocked / Score Updated / Zone Changed when a NEW
 * computation differs from what was last seen. Cooling-only changes never fire (the
 * comparison uses the stored `meter`, not the display value).
 */
export function observeMeterState(m: CutoffMeterSummary, ctx: MeterCtx) {
  if (!ctx.courseId || typeof window === "undefined") return;
  const key = snapKey(ctx.userId, ctx.courseId);
  const locked = m.locked || m.meter === null;
  const next: Snapshot = {
    sig: `${m.computed_at ?? ""}|${locked ? "L" : "U"}`,
    locked,
    zone: locked ? null : (m.zone ?? null),
    colour: locked ? null : (m.colour ?? null),
    score: locked ? null : Math.round(m.meter ?? 0),
  };
  const prev = readSnap(key);
  if (!prev) {
    writeSnap(key, next);
    return;
  }
  if (prev.sig === next.sig) return; // this computation was already seen / reported
  writeSnap(key, next);

  const trig = takeTrigger(ctx.courseId);
  const cause = {
    trigger: trig ? ("test_submit" as const) : ("refresh" as const),
    trigger_test_type: trig?.test_type,
    trigger_test_id: trig?.test_id,
  };
  const base = meterProps(m, ctx);

  if (prev.locked && !locked) {
    trackEvent("Cutoff Meter Unlocked", { ...base, previous_status: "locked", current_status: "unlocked", ...cause });
    return;
  }
  if (prev.locked || locked) return; // stayed locked, or re-locked: nothing to compare
  if (prev.score != null && next.score != null && prev.score !== next.score) {
    trackEvent("Cutoff Meter Score Updated", {
      ...base,
      previous_score: prev.score,
      current_score: next.score,
      score_change: next.score - prev.score,
      previous_zone: (prev.zone ?? undefined) as never,
      current_zone: (next.zone ?? undefined) as never,
      ...cause,
    });
  }
  if (prev.zone && next.zone && prev.zone !== next.zone) {
    trackEvent("Cutoff Meter Zone Changed", {
      ...base,
      previous_zone: prev.zone as never,
      current_zone: next.zone as never,
      previous_colour: (prev.colour ?? undefined) as never,
      current_colour: (next.colour ?? undefined) as never,
      direction: (ZONE_RANK[next.zone] ?? 0) > (ZONE_RANK[prev.zone] ?? 0) ? "up" : "down",
      ...cause,
    });
  }
}

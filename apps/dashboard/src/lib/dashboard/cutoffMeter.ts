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

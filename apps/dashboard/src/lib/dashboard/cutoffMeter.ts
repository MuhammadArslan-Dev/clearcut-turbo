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

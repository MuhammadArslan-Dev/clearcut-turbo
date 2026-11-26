import type { QueryClient } from "@tanstack/react-query";
import type { CutoffMeterSummary } from "@/lib/dashboard/cutoffMeter";

/**
 * The student's Cutoff Meter gap for a course, read from what My Courses already fetched
 * (no extra request). null = no usable meter (feature off, still locked, never loaded).
 * Used for the `gap` property of the Test Locked event.
 */
export function meterGapFromCache(qc: QueryClient, groupCode: string | number | null | undefined): number | null {
  if (!groupCode) return null;
  const entries = qc.getQueriesData<Record<string, CutoffMeterSummary>>({ queryKey: ["courses-cutoff-meter"] });
  for (const [, byCourse] of entries) {
    const m = byCourse?.[String(groupCode)];
    if (!m || m.locked || m.meter === null) continue;
    const gap = m.display_gap ?? m.gap;
    if (gap != null && Number.isFinite(gap)) return gap;
  }
  return null;
}

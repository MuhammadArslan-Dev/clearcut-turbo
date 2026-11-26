import type { QueryClient } from "@tanstack/react-query";
import type { CutoffMeterSummary } from "@/lib/dashboard/cutoffMeter";

/**
 * The student's Cutoff Meter gap for a course, read from what My Courses already fetched
 * (no extra request). null = no usable meter (feature off, still locked, never loaded).
 */
export function meterGapFromCache(qc: QueryClient, groupCode: string | number | null | undefined): number | null {
  return meterFromCache(qc, groupCode)?.gap ?? null;
}

/** Gap and pass mark (cutoff) from the same cached meter. */
export function meterFromCache(
  qc: QueryClient,
  groupCode: string | number | null | undefined,
): { gap: number; pass: number | null } | null {
  if (!groupCode) return null;
  const entries = qc.getQueriesData<Record<string, CutoffMeterSummary>>({ queryKey: ["courses-cutoff-meter"] });
  for (const [, byCourse] of entries) {
    const m = byCourse?.[String(groupCode)];
    if (!m || m.locked || m.meter === null) continue;
    const gap = m.display_gap ?? m.gap;
    if (gap != null && Number.isFinite(gap)) return { gap, pass: Number.isFinite(m.pass_mark) ? m.pass_mark : null };
  }
  return null;
}

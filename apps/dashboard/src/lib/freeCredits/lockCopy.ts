/**
 * Lock-screen copy variant (CC-196), from the Cutoff Meter gap:
 *  - "gap"   gap > 0   "You're {gap} marks from the {exam} cutoff."
 *  - "above" gap <= 0  already over the cutoff
 *  - "none"  null      no meter (off / locked / not loaded) -> no meter sentence at all
 */
export type LockCopyVariant = "gap" | "above" | "none";

export function lockCopyVariant(gap: number | null | undefined): LockCopyVariant {
  if (gap == null || !Number.isFinite(gap)) return "none";
  return gap > 0 ? "gap" : "above";
}

/** Whole marks, rounded up so "0.4 marks short" never reads as "0 marks" under a "gap" message. */
export function gapMarks(gap: number): number {
  return Math.max(1, Math.ceil(gap));
}

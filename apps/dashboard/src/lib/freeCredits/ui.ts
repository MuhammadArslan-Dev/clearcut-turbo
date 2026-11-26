import type { FreeCredits } from "@/lib/api/freeCredits";

/**
 * Pure UI decisions for the free-credits screens (CC-196, approved designs). Kept here, not in
 * the components, so the thresholds and copy choices are unit-tested.
 */

/** Fixed marketing copy of the approved designs: "₹99/month" (one constant, never a computed price). */
export const FREE_CREDITS_PLAN_PRICE = 99;

/** Info bar above the test lists: shown from this many credits left, down to the last one. */
export const INFO_BAR_FROM_REMAINING = 3;

export type InfoBarKind = "none" | "left" | "last";

export function infoBarKind(c: FreeCredits): InfoBarKind {
  if (!c.active || c.limit <= 0) return "none";
  if (c.remaining <= 0 || c.remaining > INFO_BAR_FROM_REMAINING) return "none";
  return c.remaining === 1 ? "last" : "left";
}

/** One boolean per credit: true = still left (filled dot). Capped so a bad `limit` cannot render hundreds. */
export function creditDots(limit: number, remaining: number): boolean[] {
  const n = Math.max(0, Math.min(10, Math.floor(limit)));
  const left = Math.max(0, Math.min(n, Math.floor(remaining)));
  return Array.from({ length: n }, (_, i) => i < left);
}

/** Start sheet note: nothing when inactive, no credits left, or the test was already started (free re-open). */
export type StartNoteKind = "none" | "uses" | "last";

export function isTestHeld(c: FreeCredits, testType: string, testRef: string | number | null | undefined): boolean {
  if (testRef == null) return false;
  return c.heldTests.some((h) => h.testType === testType && h.testRef === String(testRef));
}

export function startNoteKind(c: FreeCredits, held: boolean): StartNoteKind {
  if (!c.active || c.remaining <= 0 || held) return "none";
  return c.remaining === 1 ? "last" : "uses";
}

/** My Courses card row. */
export type LearnRowKind = "none" | "left" | "last" | "used";

export function learnRowKind(c: FreeCredits): LearnRowKind {
  if (!c.active || c.limit <= 0) return "none";
  if (c.remaining <= 0) return "used";
  return c.remaining === 1 ? "last" : "left";
}

/** Cutoff box on the finished modal: only for a known positive gap (never "0 marks away"). */
export function cutoffBox(gap: number | null | undefined, pass: number | null | undefined): { gap: number; pass: number | null } | null {
  if (gap == null || !Number.isFinite(gap) || gap <= 0) return null;
  return { gap: Math.max(1, Math.ceil(gap)), pass: pass != null && Number.isFinite(pass) && pass > 0 ? Math.round(pass) : null };
}

/** Checkout test_type of the list tab the info bar sits on. */
export function testTypeOfTab(tab: string | null | undefined): string {
  return tab === "chapter-tests" ? "chapter" : tab === "sectional-tests" ? "sectional" : tab === "full-length-papers" ? "full-length" : "unknown";
}

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

/** Checkout test_type of the list tab the info bar sits on. */
export function testTypeOfTab(tab: string | null | undefined): string {
  return tab === "chapter-tests" ? "chapter" : tab === "sectional-tests" ? "sectional" : tab === "full-length-papers" ? "full-length" : "unknown";
}

/**
 * What the Variant B modal says. "used" = the lock screen (all credits spent, every dot gray);
 * "left" / "last" = the info modal opened from the info bar, sidebar card or Learn row (dots: as
 * many blue dots as credits left).
 */
export type FinishedView = { kind: "used" | "last" | "left"; limit: number; remaining: number; filled: number };

export function finishedView(limit: number, remaining: number): FinishedView {
  const lim = Math.max(0, Math.floor(limit));
  const rem = Math.max(0, Math.min(lim, Math.floor(remaining)));
  const kind = rem <= 0 ? "used" : rem === 1 ? "last" : "left";
  return { kind, limit: lim, remaining: rem, filled: rem };
}

/** Where the info modal was opened from (sent as the existing `property_source` of Payment Paywall Rendered). */
export type InfoSurface = "info_bar" | "sidebar" | "learn_row";

/**
 * Payload of the EXISTING "Continue Free Clicked" event when the student taps "Continue Free" in the
 * credits modal (lock screen or info modal). Same PayContext properties as the other credits events;
 * `source` = where the modal came from (credits_locked | info_bar | sidebar | learn_row).
 */
export function continueFreePayload(args: {
  exam: string | null | undefined;
  surface: string | null | undefined;
  info: boolean;
  testType: string;
  creditsUsed: number | null | undefined;
  variant: string | null | undefined;
}) {
  return {
    reason: "skipped" as const,
    trigger: "link" as const,
    exam: args.exam ?? undefined,
    source: args.info ? (args.surface ?? "credits_info") : "credits_locked",
    test_type: args.testType,
    ...(args.creditsUsed != null ? { credits_used: args.creditsUsed } : {}),
    ...(args.variant ? { free_credits_variant: args.variant } : {}),
  };
}

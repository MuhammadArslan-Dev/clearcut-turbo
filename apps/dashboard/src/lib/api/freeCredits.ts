import { apiFetch } from "./client";
import { ApiError } from "./api-error";

/**
 * Free test credits (CC-196, phase 132). HTET experiment: a treatment user gets N free
 * credited tests, then the test cards lock. Everything here is tolerant on purpose: any
 * missing field, a failing request or `enabled: false` / `control` means "behave exactly
 * as before" (no chip, no banner, no lock) - the feature must never block a test.
 *
 * Contract (backend phase-132 branch): GET /v2/free-credits?exam=<short name>,
 * POST /v2/free-credits/abandon, 403 error_code "free_credits_exhausted" on test start.
 * Paths live in ONE place (below) so a contract change is a one-line edit.
 */
export const FREE_CREDITS_PATH = "/v2/free-credits";
export const FREE_CREDITS_ABANDON_PATH = "/v2/free-credits/abandon";
export const FREE_CREDITS_EXHAUSTED_CODE = "free_credits_exhausted";
/** Server refunds a started credited test left within this window (seconds). */
export const FREE_CREDITS_REFUND_WINDOW_SEC = 120;

export type FreeCreditsRaw = {
  enabled?: boolean;
  variant?: string | null;
  limit?: number | null;
  used?: number | null;
  remaining?: number | null;
  first_test_free_available?: boolean;
  daily_free_available_today?: boolean;
  locked?: boolean;
  /** Tests already started (re-opening one is free). */
  held_tests?: { test_type?: string; test_ref?: string | number }[] | null;
  /** Backend sends { plan, amount: null }; the price shown always comes from getPriceForVariant. */
  price_hint?: unknown;
};

export type FreeCredits = {
  /** enabled AND treatment. false = the dashboard is exactly as today. */
  active: boolean;
  /** "control" | "treatment" - sent as `free_credits_variant` on the events. */
  variant: string | null;
  limit: number;
  used: number;
  remaining: number;
  firstTestFreeAvailable: boolean;
  dailyFreeAvailableToday: boolean;
  locked: boolean;
  /** Tests already started: re-opening one costs no credit. */
  heldTests: { testType: string; testRef: string }[];
  priceHint: number | null;
};

export const FREE_CREDITS_INACTIVE: FreeCredits = {
  active: false,
  variant: null,
  limit: 0,
  used: 0,
  remaining: 0,
  firstTestFreeAvailable: false,
  dailyFreeAvailableToday: false,
  locked: false,
  heldTests: [],
  priceHint: null,
};

const num = (v: unknown, fallback = 0) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
};

/** Pure: raw API payload -> the shape the UI reads. Never throws. */
export function normalizeFreeCredits(raw: FreeCreditsRaw | null | undefined): FreeCredits {
  if (!raw || raw.enabled !== true || raw.variant !== "treatment") {
    return { ...FREE_CREDITS_INACTIVE, variant: raw?.variant ?? null };
  }
  const limit = Math.max(0, num(raw.limit));
  const used = Math.max(0, num(raw.used));
  const remaining =
    raw.remaining == null ? Math.max(0, limit - used) : Math.max(0, num(raw.remaining));
  return {
    active: true,
    variant: "treatment",
    limit,
    used,
    remaining,
    firstTestFreeAvailable: raw.first_test_free_available === true,
    dailyFreeAvailableToday: raw.daily_free_available_today === true,
    locked: raw.locked === true,
    heldTests: Array.isArray(raw.held_tests)
      ? raw.held_tests
          .filter((h) => h && h.test_type != null && h.test_ref != null)
          .map((h) => ({ testType: String(h.test_type), testRef: String(h.test_ref) }))
      : [],
    priceHint: typeof raw.price_hint === "number" ? raw.price_hint : null,
  };
}

export async function getFreeCredits(exam: string): Promise<FreeCredits> {
  const res = await apiFetch<{ data?: FreeCreditsRaw } & FreeCreditsRaw>(
    `${FREE_CREDITS_PATH}?exam=${encodeURIComponent(exam)}`,
    { method: "GET" },
    undefined,
    { retries: 0 },
  );
  // Both `{ data: {...} }` (ApiResponse envelope) and a bare object are accepted.
  return normalizeFreeCredits(res?.data ?? res);
}

export type FreeCreditsLock = {
  creditsUsed: number | null;
  creditsLimit: number | null;
  /** Marks short of the cutoff; null = no Cutoff Meter; <= 0 = already above it. */
  meterGap: number | null;
  exam: string | null;
  testType: string | null;
};

/** The 403 body of a refused test start, or null when `err` is not that error. */
export function parseFreeCreditsLock(err: unknown): FreeCreditsLock | null {
  if (!(err instanceof ApiError) || err.status !== 403 || !err.responseBody) return null;
  try {
    const body = JSON.parse(err.responseBody);
    if (body?.error_code !== FREE_CREDITS_EXHAUSTED_CODE) return null;
    const d = body?.data ?? body?.meta ?? body;
    const gap = d?.meter_gap ?? d?.meter?.gap ?? null;
    return {
      creditsUsed: d?.credits_used == null ? null : num(d.credits_used),
      creditsLimit: d?.credits_limit == null ? null : num(d.credits_limit),
      meterGap: gap == null || !Number.isFinite(Number(gap)) ? null : Number(gap),
      exam: typeof d?.exam === "string" ? d.exam : null,
      testType: typeof d?.test_type === "string" ? d.test_type : null,
    };
  } catch {
    return null;
  }
}

/** Backend values (FreeTestCreditService::abandon). */
export type AbandonAttemptType = "exam_attempt" | "daily_test_attempt";

/**
 * Tell the server a just-started credited test was left, so it can refund the credit (it
 * decides: within the window, nothing answered, once per test). `keepalive` lets the request
 * finish after the page is gone (sendBeacon cannot carry the bearer header). Never throws.
 */
export function sendFreeCreditsAbandon(payload: {
  attempt_type: AbandonAttemptType;
  attempt_id: string;
  test_type?: string;
}): void {
  try {
    void apiFetch(
      FREE_CREDITS_ABANDON_PATH,
      { method: "POST", body: JSON.stringify(payload), keepalive: true },
      undefined,
      { retries: 0 },
    ).catch(() => {});
  } catch {
    // best effort
  }
}

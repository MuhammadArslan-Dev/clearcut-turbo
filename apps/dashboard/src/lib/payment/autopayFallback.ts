import { apiFetch } from "../api/client";
import { getFlagVariant, type FlagOptions } from "../experiments/experimentFlag";
import type { Subscription } from "./payment";

/**
 * CC-168: a one-time payment offered when an autopay mandate didn't go through.
 *
 * Amplitude flag `autopay_fallback`: variant `on` sees the sheet, variant
 * `holdout` keeps today's flow but is still counted, so both arms can be
 * compared. Anything else (flag off, no answer) means no experiment at all.
 */
export const AUTOPAY_FALLBACK_FLAG_KEY = "autopay_fallback";
export type AutopayFallbackArm = "on" | "holdout";
export type AutopayFallbackTrigger = "dismissed" | "pending_timeout" | "failed_page";

/** Sent with the one-time order; the backend saves it on the transaction. */
export const AUTOPAY_FALLBACK_SOURCE = "autopay_fallback";

/** Seconds a student gets to finish the mandate after coming back from the UPI app (D2). */
export const PENDING_TIMEOUT_MS = 60 * 1000;

export async function getAutopayFallbackArm(
  userId: string | null | undefined,
  options: FlagOptions = {},
): Promise<AutopayFallbackArm | null> {
  const variant = await getFlagVariant(AUTOPAY_FALLBACK_FLAG_KEY, userId, options);
  return variant === "on" || variant === "holdout" ? variant : null;
}

/* The open autopay attempt, remembered across a page that dies in the UPI app. */

export type AutopayAttempt = {
  subscriptionId: number;
  courseId: string;
  at: number;
  /** CC-70: the "approve the autopay" waiting sheet was closed; don't reopen it for this attempt. */
  waitClosed?: boolean;
};

const ATTEMPT_KEY = "cc-autopay-attempt-v1";
const ATTEMPT_MAX_AGE_MS = 30 * 60 * 1000;

export function saveAutopayAttempt(attempt: Omit<AutopayAttempt, "at">, now = Date.now()) {
  try {
    localStorage.setItem(ATTEMPT_KEY, JSON.stringify({ ...attempt, at: now }));
  } catch {
    // Private mode / blocked storage: no return check, the other triggers still work.
  }
}

export function readAutopayAttempt(courseId: string, now = Date.now()): AutopayAttempt | null {
  try {
    const raw = localStorage.getItem(ATTEMPT_KEY);
    if (!raw) return null;
    const attempt = JSON.parse(raw) as AutopayAttempt;
    if (attempt.courseId !== courseId || now - attempt.at > ATTEMPT_MAX_AGE_MS) return null;
    return attempt;
  } catch {
    return null;
  }
}

/** CC-70: remember the waiting sheet was closed (same `at`, so the attempt still expires on time). */
export function markAutopayWaitClosed() {
  try {
    const raw = localStorage.getItem(ATTEMPT_KEY);
    if (!raw) return;
    localStorage.setItem(ATTEMPT_KEY, JSON.stringify({ ...(JSON.parse(raw) as AutopayAttempt), waitClosed: true }));
  } catch {
    // ignore
  }
}

export function clearAutopayAttempt() {
  try {
    localStorage.removeItem(ATTEMPT_KEY);
  } catch {
    // ignore
  }
}

export async function getSubscriptionStatus(subscriptionId: number): Promise<Subscription["status"]> {
  const res = await apiFetch<{ subscription: Subscription }>(`/v2/subscription/${subscriptionId}`);
  return res.subscription.status;
}

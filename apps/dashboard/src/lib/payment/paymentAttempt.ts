import { apiFetch } from "../api/client";
import { isApiError } from "../api/api-error";
import type { MetaPurchase } from "./payment";

/**
 * The open one-time payment attempt, remembered across a page that dies
 * (CC-59). Facebook/Instagram's in-app browsers kill the page while the
 * student is in PhonePe/GPay, so Razorpay's success handler never runs; on
 * coming back the payment page asks the backend about this attempt instead.
 */
export type PaymentAttempt = {
  transactionId: number;
  examId: number;
  at: number;
};

const ATTEMPT_KEY = "cc-payment-attempt-v1";
const ATTEMPT_MAX_AGE_MS = 30 * 60 * 1000;

export function saveAttempt(attempt: Omit<PaymentAttempt, "at">) {
  try {
    localStorage.setItem(ATTEMPT_KEY, JSON.stringify({ ...attempt, at: Date.now() }));
  } catch {
    // Private mode / blocked storage: the in-page handler still works.
  }
}

export function readAttempt(examId: number): PaymentAttempt | null {
  try {
    const raw = localStorage.getItem(ATTEMPT_KEY);
    if (!raw) return null;
    const attempt = JSON.parse(raw) as PaymentAttempt;
    if (attempt.examId !== examId || Date.now() - attempt.at > ATTEMPT_MAX_AGE_MS) return null;
    return attempt;
  } catch {
    return null;
  }
}

export function clearAttempt() {
  try {
    localStorage.removeItem(ATTEMPT_KEY);
  } catch {
    // ignore
  }
}

export type AttemptStatusResponse = {
  success: boolean;
  state: "paid" | "pending" | "failed" | "none";
  transaction_id: number | null;
  meta_purchase?: MetaPurchase;
};

export function getAttemptStatus(transactionId: number) {
  return apiFetch<AttemptStatusResponse>(
    `/v2/payment/attempt-status?transaction_id=${transactionId}`,
  );
}

/** `/v2/payment/create` answered 409: this course was paid a moment ago (CC-71). */
export function isAlreadyPaidError(error: unknown): boolean {
  if (!isApiError(error) || error.status !== 409 || !error.responseBody) return false;
  try {
    return JSON.parse(error.responseBody)?.already_paid === true;
  } catch {
    return false;
  }
}

/** Facebook / Instagram in-app browser (the CC-59 drop-off). */
export function isInAppBrowser(): boolean {
  if (typeof navigator === "undefined") return false;
  return /FBAN|FBAV|FB_IAB|Instagram/i.test(navigator.userAgent);
}

/**
 * Razorpay redirect mode target. The backend verifies the signature and
 * sends the student to the dashboard success/failed page with these params.
 */
export function checkoutReturnUrl(params: Record<string, string | number | undefined | null>) {
  const base =
    process.env.NEXT_PUBLIC_LARAVEL_MAIN_BACKEND ?? "http://clearcutoff-main-backend.test/api";
  const query = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") query.set(key, String(value));
  });
  return `${base}/v2/payment/checkout-return?${query.toString()}`;
}

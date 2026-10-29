import { trackEvent } from "./browser";
import type { AnalyticsEventName, AnalyticsEventPayload } from "./types";

/**
 * The checkout funnel (CC-69) uses the EXISTING payment events —
 * Purchase Intent Initiated (page open), Plan Switched, Payment Initiated
 * (pay tap), Payment Outcome (paid / failed / cancelled) — with the extra
 * properties of `PayContext`. Only moments no event covered got a new one,
 * in the same naming style: Checkout Opened, Continue Free Clicked.
 * The backend's Payment Completed is the paid source an in-app browser
 * can't lose.
 *
 * `trackPaymentEvent` sends the event to Amplitude as usual and mirrors the
 * same name to Clarity, so a recording can be found from a funnel step.
 */
export type PayContext = {
  exam?: string;
  /** "149_autopay" / "229_onetime" / "799_annual". */
  plan?: string;
  price?: number;
  /** Where the student came from (`?source=` on the payment page). */
  source?: string;
  language?: string;
  in_app_browser?: "fb" | "ig" | "none";
  /**
   * ₹99 autopay offer (phase 66): "price-99" for users shown the ₹99 plan
   * (allow-list or A/B treatment), "control" for the A/B control group (default
   * price). Absent for everyone else, so every funnel event can be split.
   */
  price_offer?: "price-99" | "control";
};

export function trackPaymentEvent<TName extends AnalyticsEventName>(
  name: TName,
  payload: AnalyticsEventPayload<TName>,
) {
  trackEvent(name, payload);

  try {
    if (typeof window === "undefined" || !window.clarity) return;
    window.clarity("event", name);
    const ctx = payload as PayContext;
    if (ctx.plan) window.clarity("set", "pay_plan", ctx.plan);
    if (ctx.exam) window.clarity("set", "pay_exam", ctx.exam);
    if (ctx.in_app_browser) window.clarity("set", "in_app_browser", ctx.in_app_browser);
  } catch {
    // Clarity is best-effort.
  }
}

/** "149_autopay", "229_onetime", "799_annual" — same labels as the backend. */
export function payPlanLabel(variant: string, price: number | string | undefined): string {
  const rupees = Math.round(Number(price) || 0);
  if (variant === "1month") return `${rupees}_autopay`;
  if (variant === "1year" || variant === "12months") return `${rupees}_annual`;
  return `${rupees}_onetime`;
}

export function inAppBrowserKind(): NonNullable<PayContext["in_app_browser"]> {
  if (typeof navigator === "undefined") return "none";
  const ua = navigator.userAgent;
  if (/Instagram/i.test(ua)) return "ig";
  if (/FBAN|FBAV|FB_IAB/i.test(ua)) return "fb";
  return "none";
}

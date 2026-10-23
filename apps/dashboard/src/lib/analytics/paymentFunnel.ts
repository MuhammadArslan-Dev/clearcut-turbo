import { trackEvent } from "./browser";
import type { PayFunnelEventName, PayFunnelProps } from "./events/monetization";

/**
 * The checkout funnel (CC-69): the same event names in Amplitude and in
 * Clarity, so a session recording can be found from a funnel step and the
 * other way round. These sit next to the older events (Payment Initiated,
 * Payment Outcome, Plan Switched…), which keep firing unchanged. `paid`
 * itself comes from the backend webhook (BE PaymentAnalytics), the one
 * source an in-app browser killing the page can't lose.
 */
export function trackPayFunnel(name: PayFunnelEventName, props: PayFunnelProps) {
  trackEvent(name, props);

  try {
    if (typeof window === "undefined" || !window.clarity) return;
    window.clarity("event", name);
    window.clarity("set", "pay_plan", props.plan);
    if (props.exam) window.clarity("set", "pay_exam", props.exam);
    window.clarity("set", "in_app_browser", props.in_app_browser);
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

export function inAppBrowserKind(): PayFunnelProps["in_app_browser"] {
  if (typeof navigator === "undefined") return "none";
  const ua = navigator.userAgent;
  if (/Instagram/i.test(ua)) return "ig";
  if (/FBAN|FBAV|FB_IAB/i.test(ua)) return "fb";
  return "none";
}

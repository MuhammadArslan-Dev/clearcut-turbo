import type { PaymentType } from "./payment";

// Ads optimize on Meta's "Purchase" event only, and value a renewing
// subscription higher than a one-time payment since it's expected to keep
// billing via autopay. Kept here (not inlined at each call site) so the
// multiplier can change without touching useRazorpayPayment.ts or
// payment/initiated/page.tsx. Meta's Purchase/Subscribe `value` param is
// typed "Integer or float" (developers.facebook.com/docs/meta-pixel/
// reference) — both multipliers are plain numbers, not percentages.
export const SUBSCRIPTION_VALUE_MULTIPLIER = 1.85;
export const ONE_TIME_VALUE_MULTIPLIER = 1.0;

// Custom (non-Meta-defined) param sent alongside the standard value/currency
// params — same pattern already used for content_id/content_category/
// content_name elsewhere in this app's Meta event calls.
export type MetaPurchasePlan = "monthly_autopay" | "monthly_onetime" | "annual";

export function getMetaPurchasePlan(
  type?: PaymentType,
): MetaPurchasePlan | undefined {
  switch (type) {
    case "1month":
      return "monthly_autopay";
    case "1month-onetime":
      return "monthly_onetime";
    case "1year":
      return "annual";
    default:
      // "6months"/"15months" are legacy (replaced by "1year" — see
      // payment.ts), and some useRazorpayPayment callers (single-course
      // purchase modals) pass no `type` at all. Neither maps to one of the
      // three named plans, so no `plan` param is sent rather than guessing.
      return undefined;
  }
}

export function getMetaPurchaseMultiplier(type?: PaymentType): number {
  return type === "1month"
    ? SUBSCRIPTION_VALUE_MULTIPLIER
    : ONE_TIME_VALUE_MULTIPLIER;
}

// amountPaid must already be the real, final charged amount (after any
// discount) — never a list price. Rounded to a whole rupee per spec.
export function computeMetaPurchaseValue(
  amountPaid: number,
  type?: PaymentType,
): number {
  return Math.round(amountPaid * getMetaPurchaseMultiplier(type));
}

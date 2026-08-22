import { PaymentPricing, PaymentType } from "./payment";

// Per-exam overrides for the two one-time price tiers ("1month-onetime" and
// "1year"). Both tiers are priced purely on the frontend — the amount is
// sent as-is to the backend when creating the Razorpay order — so this is
// the single place that decides them. Keyed by exam `short_name` (uppercased
// for a case-insensitive match); exams with no entry here fall through to
// the global `pricing` values from GET /v2/payment/pricing, unaffected.
//
// `planId` + `recurringMonthly` (optional, come as a pair) cover the
// "1month" recurring subscription tier — a Razorpay recurring Plan
// (subscription_plans table row). `recurringMonthly` must match that row's
// `amount` (in rupees) — it's display/tracking only, the actual charge is
// whatever the Razorpay Plan behind `planId` bills. Exams with neither here
// fall through to the default plan (id 1, ₹99/month).
//
// Single source of truth: every place in the app that charges or displays
// a course price (payment/initiated, MainPaywall, PreparationPaywall,
// PaywallFloatingWidget, MyCourseCard, ...) must import from here instead
// of re-hardcoding ₹99/₹139/₹599 independently — that drift is exactly the
// bug this module exists to prevent.
export const EXAM_PRICE_OVERRIDES: Record<
  string,
  {
    onetime1Month: number;
    oneYear: number;
    planId?: number;
    recurringMonthly?: number;
  }
> = {
  HPTET: { onetime1Month: 229, oneYear: 799, planId: 2, recurringMonthly: 149 },
};

export const DEFAULT_SUBSCRIPTION_PLAN_ID = 1;

export function getSubscriptionPlanId(examShortName?: string): number {
  const override = examShortName
    ? EXAM_PRICE_OVERRIDES[examShortName.toUpperCase()]
    : undefined;

  return override?.planId ?? DEFAULT_SUBSCRIPTION_PLAN_ID;
}

// Shared by every price display/charge across the app — one place to change
// the numbers. `pricing` (the GET /v2/payment/pricing response) is optional:
// callers that don't fetch it (paywalls, cards) still get a correct override
// or the same hardcoded fallback the app has always used for those tiers.
export function getPriceForVariant(
  variant: PaymentType,
  pricing: PaymentPricing | null | undefined,
  examShortName?: string,
) {
  const override = examShortName
    ? EXAM_PRICE_OVERRIDES[examShortName.toUpperCase()]
    : undefined;

  if (variant === "1month") return override?.recurringMonthly ?? 99;
  if (variant === "1month-onetime") {
    return override?.onetime1Month ?? pricing?.onetime_1month_price ?? 139;
  }
  return override?.oneYear ?? pricing?.onetime_1year_price ?? 599;
}

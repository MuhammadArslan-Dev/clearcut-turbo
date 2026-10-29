import { PaymentPricing, PaymentType } from "./payment";

// One price list for every exam (phase 67). The three tiers are the same for
// everybody, so there is no per-exam table any more:
//
//   "1month"         recurring autopay   -> subscription_plans id 1 (₹99/month)
//   "1month-onetime" one-time, 1 month   -> ₹139
//   "1year"          one-time, 12 months -> ₹699
//
// How each one becomes a real charge:
//  - "1month": the amount billed is the Razorpay Plan behind `plan_id` (the
//    subscription_plans row), NOT the number below. `AUTOPAY_MONTHLY_PRICE`
//    must equal plan 1's `amount` (9900 paise) — it is display/tracking only.
//  - the two one-time tiers: the amount sent to POST /v2/payment/create is
//    exactly what these constants return, so this file is also the charge.
//
// Single source of truth: every place that displays or charges a course price
// (payment/initiated, MainPaywall, PreparationPaywall, PaywallFloatingWidget,
// MyCourseCard, the locked-test cards, plan analytics) imports from here.
// Never re-hardcode a price elsewhere.
//
// History: HTET/HPTET/MAHATET used plan 2 (₹149), UGC plan 3 (₹249), with
// one-time ₹229/₹449 and a year of ₹799/₹1999. Learners already subscribed
// to those plans keep them (their Razorpay mandate is unchanged); only new
// purchases use the list below.
export const DEFAULT_SUBSCRIPTION_PLAN_ID = 1;
export const AUTOPAY_MONTHLY_PRICE = 99;
export const ONETIME_1MONTH_PRICE = 139;
export const ONETIME_1YEAR_PRICE = 699;

// Struck-through "original" prices on the plan cards (promotional only — never
// charged, never sent to the backend): ₹299 beside the autopay card, ₹499
// beside the one-time 1-month card, ₹999 beside the 1-year card.
export const ORIGINAL_AUTOPAY_PRICE = 299;
export const ORIGINAL_1MONTH_PRICE = 499;
export const ORIGINAL_1YEAR_PRICE = 999;

// `_examShortName` is accepted (and ignored) so every call site keeps working
// if an exam-specific price ever comes back; nothing varies by exam today.
export function getSubscriptionPlanId(_examShortName?: string): number {
  return DEFAULT_SUBSCRIPTION_PLAN_ID;
}

// `_pricing` (GET /v2/payment/pricing) is deliberately not used: the backend
// `payment.onetime_*` settings are kept equal to these constants by hand, but
// a stale setting must never change what the UI shows or charges.
export function getPriceForVariant(
  variant: PaymentType,
  _pricing?: PaymentPricing | null,
  _examShortName?: string,
): number {
  if (variant === "1month") return AUTOPAY_MONTHLY_PRICE;
  if (variant === "1month-onetime") return ONETIME_1MONTH_PRICE;
  return ONETIME_1YEAR_PRICE;
}

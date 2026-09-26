import { getPriceForVariant } from "./examPriceOverrides";
import type { PaymentPricing, PaymentType } from "./payment";

export type PlanBillingType = "auto_renew" | "one_time";

export type PlanAnalytics = {
  /** `<course>_<months>m_<price>`, e.g. `ctet_1m_99` (analytics sheet format). */
  plan_id: string;
  /** Rupees actually shown to the user (the discounted price, not the MRP). */
  price: number;
  duration_months: number;
  billing_type: PlanBillingType;
};

// Only the plans the payment page actually offers. The legacy "6months" /
// "15months" PaymentType values are deliberately absent — they are no longer
// selectable, so they have no analytics meaning.
const PLAN_META: Partial<
  Record<PaymentType, { durationMonths: number; billingType: PlanBillingType }>
> = {
  "1month": { durationMonths: 1, billingType: "auto_renew" },
  "1month-onetime": { durationMonths: 1, billingType: "one_time" },
  "1year": { durationMonths: 12, billingType: "one_time" },
};

/** "CTET" → "ctet", "UP PGT" → "up_pgt". */
function slugify(name: string): string {
  return name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

/**
 * Plan facts for the `Plan Switched` event. The price comes from the same
 * `getPriceForVariant` the payment page displays and charges, so the id/price
 * can never drift from what the user saw. Returns null for a plan that is not
 * offered (nothing to report).
 */
export function getPlanAnalytics(
  variant: PaymentType,
  pricing: PaymentPricing | null,
  examShortName: string | undefined,
  courseName: string,
): PlanAnalytics | null {
  const meta = PLAN_META[variant];
  if (!meta) return null;

  const price = getPriceForVariant(variant, pricing, examShortName);

  return {
    plan_id: `${slugify(courseName)}_${meta.durationMonths}m_${price}`,
    price,
    duration_months: meta.durationMonths,
    billing_type: meta.billingType,
  };
}

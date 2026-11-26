import type { PayContext } from "@/lib/analytics/paymentFunnel";

/**
 * Properties the free-credits lock screen puts on the checkout URL (`test_type`,
 * `credits_used`, `free_credits_variant`) so the existing payment events can carry them
 * (CC-196). All optional: a checkout opened from anywhere else has none of them and its
 * events are byte-identical to before. Values are validated, never trusted blindly.
 */
export type CreditsCheckoutContext = Pick<PayContext, "test_type" | "credits_used" | "free_credits_variant">;

const TEST_TYPES = new Set(["sectional", "chapter", "full-length", "daily_test", "unknown"]);

export function parseCreditsCheckoutContext(
  get: (key: string) => string | number | null | undefined,
): CreditsCheckoutContext {
  const out: CreditsCheckoutContext = {};
  const testType = get("test_type");
  if (typeof testType === "string" && TEST_TYPES.has(testType)) out.test_type = testType;
  const used = get("credits_used");
  if (used != null && used !== "" && Number.isInteger(Number(used)) && Number(used) >= 0 && Number(used) <= 1000) {
    out.credits_used = Number(used);
  }
  const variant = get("free_credits_variant");
  if (variant === "treatment" || variant === "control") out.free_credits_variant = variant;
  return out;
}

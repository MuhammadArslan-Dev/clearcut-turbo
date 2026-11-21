/**
 * Razorpay's `payment.failed` payload → the `failure_reason` sent on the
 * `Payment Outcome` event. The analytics sheet names two reasons
 * (`insufficient_funds`, `cancelled`); anything else keeps Razorpay's own
 * `reason` so a real failure is never flattened into "unknown".
 */
export function getPaymentFailureReason(error?: {
  reason?: string;
  code?: string;
  description?: string;
}): string {
  const text = `${error?.reason ?? ""} ${error?.code ?? ""} ${error?.description ?? ""}`.toLowerCase();

  if (text.includes("insufficient")) return "insufficient_funds";
  if (text.includes("cancel")) return "cancelled";
  return error?.reason || "unknown";
}

/**
 * Where a one-time checkout stopped BEFORE Razorpay opened (no payment.failed / dismiss callback can fire then):
 * sdk = checkout.js did not load, order = POST /v2/payment/create failed, open = Razorpay itself threw on open.
 * Sent as the failure_reason of Payment Outcome, so those learners no longer vanish after Payment Initiated.
 */
export type CheckoutStage = "sdk" | "order" | "open";

export function checkoutNotOpenedReason(stage: CheckoutStage): "sdk_failed" | "order_create_failed" | "checkout_open_failed" {
  if (stage === "sdk") return "sdk_failed";
  if (stage === "order") return "order_create_failed";
  return "checkout_open_failed";
}

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

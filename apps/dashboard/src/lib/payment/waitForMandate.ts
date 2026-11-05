import { getSubscriptionStatus } from "@/lib/payment/autopayFallback";

export type MandateWait = "confirmed" | "pending";

const CONFIRMED = new Set(["authenticated", "active"]);

/**
 * Phase 77: Razorpay's subscription handler fires when the student approves the mandate, but access
 * is only granted by the backend's webhook. Wait (bounded) until the backend says the subscription
 * is authenticated or active, so the success page is never shown before that is true.
 *
 * "pending" = not confirmed in time (webhook late, or the status call failed): the caller shows the
 * "payment received, activating" state and keeps checking, it never claims access is unlocked.
 */
export async function waitForMandate(
  subscriptionId: number,
  { timeoutMs = 20_000, intervalMs = 2_000 }: { timeoutMs?: number; intervalMs?: number } = {},
): Promise<MandateWait> {
  const deadline = Date.now() + timeoutMs;
  for (;;) {
    try {
      const status = await getSubscriptionStatus(subscriptionId);
      if (CONFIRMED.has(status)) return "confirmed";
    } catch {
      // A failed status call is not a failed payment: keep trying until the deadline.
    }
    if (Date.now() + intervalMs > deadline) return "pending";
    await new Promise((resolve) => setTimeout(resolve, intervalMs));
  }
}

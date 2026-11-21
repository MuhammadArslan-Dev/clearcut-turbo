// pnpm --filter dashboard test
import { describe, expect, it } from "vitest";
import { checkoutNotOpenedReason, getPaymentFailureReason } from "./paymentAnalytics";

describe("checkoutNotOpenedReason", () => {
  it("names where a checkout stopped before Razorpay opened", () => {
    expect(checkoutNotOpenedReason("sdk")).toBe("sdk_failed");
    expect(checkoutNotOpenedReason("order")).toBe("order_create_failed");
    expect(checkoutNotOpenedReason("open")).toBe("checkout_open_failed");
  });
});

describe("getPaymentFailureReason (unchanged)", () => {
  it("keeps the sheet's names and Razorpay's own reason", () => {
    expect(getPaymentFailureReason({ description: "Insufficient balance" })).toBe("insufficient_funds");
    expect(getPaymentFailureReason({ reason: "payment_cancelled" })).toBe("cancelled");
    expect(getPaymentFailureReason({ reason: "payment_timed_out" })).toBe("payment_timed_out");
    expect(getPaymentFailureReason()).toBe("unknown");
  });
});

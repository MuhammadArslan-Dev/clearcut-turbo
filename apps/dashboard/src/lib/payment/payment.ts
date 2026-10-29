import { apiFetch } from "../api/client";
import { isApiError } from "../api/api-error";

/* ---------------------------------- */
/* Utils */
/* ---------------------------------- */
const token = () =>
  document.cookie
    .split("; ")
    .find((row) => row.startsWith("auth_token="))
    ?.split("=")[1];

/* ---------------------------------- */
/* Types */
/* ---------------------------------- */

// "6months" and "15months" replaced by "1year" plan
export type PaymentType = "1month" | "6months" | "15months" | "1year" | "1month-onetime";

export type RazorpayOrder = {
  id: string;
  amount: number;
  currency: string;
  notes: {
    transaction_id: number;
    group_code: string;
    userId: number;
    userEmail?: string;
    userName?: string | null;
    userPhone?: string;
    exam_id?: number;
  };
};

export type CreateOrderResponse = {
  success: boolean;
  razorpay: boolean;
  key: string;
  order: RazorpayOrder;
  transaction_id: number;
};

/**
 * What to send to Meta for a payment, decided by the backend (CC-53):
 * `send` only for the user's first successful payment on that course;
 * `value` = amount charged x the server-side multiplier, rounded.
 */
export type MetaPurchase = {
  send: boolean;
  event_id: string;
  value: number;
  amount_paid: number;
  plan: "monthly_autopay" | "monthly_onetime" | "annual" | null;
  currency: string;
};

export type VerifyPaymentResponse = {
  success: boolean;
  message: string;
  /** Not final yet (the webhook hasn't arrived): keep polling. */
  pending?: boolean;
  meta_purchase?: MetaPurchase;
};

export type CreateOrderPayload = {
  payment_type: string;
  course_id: number;
  amount: string; // paise
  type: PaymentType; // type
};

export type CreateSubscriptionPayload = {
  course_id: string;
  plan_id: number;
};

export type CreateSubscriptionResponse = {
  success: boolean;
  key: string;
  subscription: {
    user_id: number;
    group_code: string;
    plan_id: number;
    razorpay_subscription_id: string;
    razorpay_short_url: string;
    status: string;
    uuid: string;
    updated_at: string;
    created_at: string;
    id: number;
  };
  short_url: string;
  message: string;
};

export type SubscriptionStatus =
  | "created"
  | "authenticated"
  | "active"
  | "paused"
  | "cancelled"
  | "completed"
  | "expired";

export type SubscriptionPlan = {
  id: number;
  name: string;
  amount: number;
  currency: string;
  interval: string;
};

export type Subscription = {
  id: number;
  uuid: string;
  user_id: number;
  group_code: string;
  plan_id: number;
  razorpay_subscription_id: string;
  razorpay_short_url: string;
  status: SubscriptionStatus;
  current_start: string | null;
  current_end: string | null;
  next_billing_at: string | null;
  paid_count: number;
  failed_attempts: number;
  cancelled_at: string | null;
  ended_at: string | null;
  created_at: string;
  updated_at: string;
  plan: SubscriptionPlan | null;
  /** The course's exam short name (e.g. "HTET"), when the backend sends it. */
  course_name?: string | null;
};

export type GetSubscriptionsResponse = {
  success: boolean;
  subscriptions: Subscription[];
};

export type SubscriptionActionResponse = {
  success: boolean;
  message: string;
};

/* ---------------------------------- */
/* APIs */
/* ---------------------------------- */

/**
 * Create Razorpay Order
 */
export async function createOrder(
  payload: CreateOrderPayload,
): Promise<CreateOrderResponse> {
  return apiFetch<CreateOrderResponse>("/v2/payment/create", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token()}`,
    },
    body: JSON.stringify(payload),
  });
}

/**
 * Create Razorpay Subscription (1-month plan)
 */
export async function createSubscription(
  payload: CreateSubscriptionPayload,
): Promise<CreateSubscriptionResponse> {
  return apiFetch<CreateSubscriptionResponse>("/v2/subscription/create", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

/**
 * Verify payment (webhook-backed)
 */
export async function verifyPayment(
  transaction_id: number,
): Promise<VerifyPaymentResponse> {
  return apiFetch<VerifyPaymentResponse>("/v2/payment/verify", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ transaction_id }),
  });
}

/**
 * List all subscriptions for the current user
 */
/** One successful payment (one-time purchase or autopay charge), CC-100. */
export type PaymentHistoryItem = {
  id: string;
  type: "one_time" | "autopay";
  /** Rupees. */
  amount: number;
  currency: string;
  paid_at: string | null;
  /** Razorpay payment id ("pay_…"), when stored. */
  payment_id: string | null;
  /** "upi", "card", "netbanking", …, when stored. */
  method: string | null;
  purchase_type: string | null;
  course: { group_code: string; name: string; short_name: string } | null;
};

export type GetPaymentHistoryResponse = {
  success: boolean;
  payments: PaymentHistoryItem[];
};

/** The signed-in student's successful payments, newest first. */
export async function getPaymentHistory(): Promise<GetPaymentHistoryResponse> {
  return apiFetch<GetPaymentHistoryResponse>("/v2/payment/history");
}

export async function getSubscriptions(): Promise<GetSubscriptionsResponse> {
  return apiFetch<GetSubscriptionsResponse>("/v2/subscription");
}

/**
 * Cancel a subscription
 */
export async function cancelSubscription(
  id: number,
): Promise<SubscriptionActionResponse> {
  return apiFetch<SubscriptionActionResponse>(`/v2/subscription/${id}/cancel`, {
    method: "POST",
  });
}

/**
 * Pause an active subscription
 */
export async function pauseSubscription(
  id: number,
): Promise<SubscriptionActionResponse> {
  return apiFetch<SubscriptionActionResponse>(`/v2/subscription/${id}/pause`, {
    method: "POST",
  });
}

/**
 * Resume a paused subscription
 */
export async function resumeSubscription(
  id: number,
): Promise<SubscriptionActionResponse> {
  return apiFetch<SubscriptionActionResponse>(`/v2/subscription/${id}/resume`, {
    method: "POST",
  });
}

export type PaymentPricing = {
  success: boolean;
  onetime_1month_price: number;
  onetime_1year_price: number;
};

export async function getPaymentPricing(): Promise<PaymentPricing> {
  return apiFetch<PaymentPricing>("/v2/payment/pricing");
}

/** Outcome of polling /v2/payment/verify. */
export type VerifyPollResult =
  | { success: true; metaPurchase?: MetaPurchase }
  /** The webhook marked the order failed: the money was not taken. */
  | { success: false; failed: true }
  /** Still not final when the polling window ended (webhook late). */
  | { success: false; pending: true };

/** The backend's "transaction is failed" answer (PaymentController::verifyPayment). */
function isFinalFailure(error: unknown): boolean {
  if (!isApiError(error) || error.status !== 400 || !error.responseBody) return false;
  try {
    return JSON.parse(error.responseBody)?.message === "Payment not successful";
  } catch {
    return false;
  }
}

/**
 * Polls /v2/payment/verify until the webhook has marked the order. A "not
 * final yet" answer keeps polling: newer backends send 200 + pending, older
 * ones a 400 that apiFetch throws, which used to end the loop on the first
 * try and report a paid order as failed (CC-60 / CC-53). A network error
 * keeps polling too. Stops early on a final failure ("Payment not
 * successful"); a 404 (unknown transaction) throws.
 *
 * Ending without either is `pending` — NOT a failure: Razorpay only calls
 * the checkout handler after the payment went through, so the caller should
 * tell the user the course is being activated, never "payment failed".
 */
export async function pollVerifyPaymentResult(
  transactionId: number,
  retries = 10,
  delay = 2000,
): Promise<VerifyPollResult> {
  for (let i = 0; i < retries; i++) {
    try {
      const res = await verifyPayment(transactionId);
      if (res.success) return { success: true, metaPurchase: res.meta_purchase };
    } catch (error) {
      if (isApiError(error) && error.status === 404) throw error;
      if (isFinalFailure(error)) return { success: false, failed: true };
    }

    await new Promise((resolve) => setTimeout(resolve, delay));
  }

  return { success: false, pending: true };
}

export async function pollVerifyPayment(
  transactionId: number,
  retries = 10,
  delay = 2000,
): Promise<boolean> {
  return (await pollVerifyPaymentResult(transactionId, retries, delay)).success;
}

/** Meta Subscribe/Purchase decision for an autopay subscription's checkout (CC-53). */
export async function getSubscriptionMetaPurchase(
  subscriptionId: number,
): Promise<{ success: boolean; meta_purchase: MetaPurchase }> {
  return apiFetch<{ success: boolean; meta_purchase: MetaPurchase }>(
    `/v2/subscription/${subscriptionId}/meta-purchase`,
  );
}

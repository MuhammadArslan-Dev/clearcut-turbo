import { apiFetch } from "../api/client";

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

// "6months" and "15months" replaced by "1year" plan at ₹599
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

export type VerifyPaymentResponse = {
  success: boolean;
  message: string;
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

export async function pollVerifyPayment(
  transactionId: number,
  retries = 6,
  delay = 2000,
): Promise<boolean> {
  for (let i = 0; i < retries; i++) {
    const res = await verifyPayment(transactionId);

    if (res.success) {
      return true;
    }

    await new Promise((resolve) => setTimeout(resolve, delay));
  }

  return false;
}

// src/lib/analytics/events/monetization.ts

export type MonetizationEventName =
  | 'Payment Paywall Rendered'
  | 'Plan Switched'
  | 'Purchase Intent Initiated'
  | 'Payment Initiated'
  | 'Payment Outcome'
  | 'Subscription Status Updated'
  | 'Support Contacted'
  | 'cancel_started'
  | 'cancel_reason_selected'
  | 'save_offer_shown'
  | 'save_offer_accepted'
  | 'subscription_cancelled'
  | 'subscription_paused';

export interface MonetizationEventPayloads {
  'Payment Paywall Rendered': {
    property_source: string;
    is_user_premium: boolean;
    object_id?: string;
  };

  // payment/initiated: user selected a plan different from the current one.
  // Plan ids look like `ctet_1m_99` (course + months + discounted price) — see
  // lib/payment/planAnalytics.ts.
  'Plan Switched': {
    exam_id: string;
    course_name: string;
    from_plan_id: string;
    from_price: number;
    from_duration_months: number;
    from_billing_type: 'auto_renew' | 'one_time';
    to_plan_id: string;
    to_price: number;
    to_duration_months: number;
    to_billing_type: 'auto_renew' | 'one_time';
    // The plan preselected when the paywall loaded; constant for the visit.
    default_plan_id: string;
    // 1 for the first switch on this page visit, 2 for the second, …
    switch_number: number;
    currency: 'INR';
  };

  // Cancel flow on the Subscriptions tab (CC-97).
  'cancel_started': { subscription_id: string; course_name: string };
  'cancel_reason_selected': { subscription_id: string; course_name: string; reason: string };
  'save_offer_shown': { subscription_id: string; course_name: string; reason: string; offer: string };
  'save_offer_accepted': { subscription_id: string; course_name: string; reason: string; offer: string };
  'subscription_cancelled': { subscription_id: string; course_name: string; reason: string; note?: string };
  'subscription_paused': { subscription_id: string; course_name: string; reason?: string };

  // Student opened WhatsApp/phone support (e.g. from /payment/failed, CC-64).
  'Support Contacted': {
    source: string;
    channel: 'whatsapp' | 'phone';
  };

  'Purchase Intent Initiated': {
    entry_point: string;
    product_id: string;
  };

  'Payment Initiated': {
    exam_name: string;
    payment_flow: 'new_attempt' | 'retry_attempt';
    final_price: number;
    payment_attempt?: number;
  };

  'Payment Outcome': {
    outcome: 'payment_successful' | 'payment_failed';
    final_price: number;
    // auto_renew = Razorpay subscription (payment/initiated "1 month" plan);
    // one_time = a single Razorpay order (everything else, incl. useRazorpayPayment).
    billing_type: 'auto_renew' | 'one_time';
    // insufficient_funds / cancelled are the sheet's values; any other Razorpay
    // `reason` (or verification_failed) is sent as-is.
    failure_reason?: 'insufficient_funds' | 'cancelled' | (string & {});
    payment_session_id: string;
    exam_name?: string;
  };

  'Subscription Status Updated': {
    new_status: 'active' | 'expired' | 'cancelled';
    plan_name: string;
    exam_id: string;
    exam_name: string;
  };
}

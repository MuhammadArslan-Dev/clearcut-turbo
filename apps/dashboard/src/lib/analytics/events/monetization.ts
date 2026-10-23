// src/lib/analytics/events/monetization.ts

import type { PayContext } from '../paymentFunnel';

export type MonetizationEventName =
  | 'Payment Paywall Rendered'
  | 'Plan Switched'
  | 'Purchase Intent Initiated'
  | 'Payment Initiated'
  | 'Payment Outcome'
  | 'Subscription Status Updated'
  | 'Support Contacted'
  | 'Cancel Started'
  | 'Cancel Reason Selected'
  | 'Save Offer Shown'
  | 'Save Offer Accepted'
  // New moments with no existing event (CC-69 / CC-63), same naming style.
  | 'Checkout Opened'
  | 'Continue Free Clicked';


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
  } & PayContext;

  // Cancel flow on the Subscriptions tab (CC-97). The cancel/pause itself is
  // the existing 'Subscription Status Updated' (source: app).
  'Cancel Started': { subscription_id: string; course_name: string };
  'Cancel Reason Selected': { subscription_id: string; course_name: string; reason: string };
  'Save Offer Shown': { subscription_id: string; course_name: string; reason: string; offer: string };
  'Save Offer Accepted': { subscription_id: string; course_name: string; reason: string; offer: string };

  // Student opened WhatsApp/phone support (e.g. from /payment/failed, CC-64).
  'Support Contacted': {
    source: string;
    channel: 'whatsapp' | 'phone';
  };

  // Payment page opened. PayContext added for the CC-69 funnel.
  'Purchase Intent Initiated': {
    entry_point: string;
    product_id: string;
  } & PayContext;

  // Pay tap (one-time) / autopay checkout created. PayContext: CC-69.
  'Payment Initiated': {
    exam_name: string;
    payment_flow: 'new_attempt' | 'retry_attempt' | 'resumed_session';
    final_price: number;
    payment_attempt?: number;
  } & PayContext;

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
    // return_check = the payment page came back (in-app browser killed it
    // during UPI) and the backend confirmed the payment (CC-59).
    confirmed_via?: 'return_check';
    // Razorpay's own error.code / error.reason on a failed payment (CC-69).
    error_code?: string;
    error_reason?: string;
  } & PayContext;

  // Razorpay checkout actually opened (no existing event covered it, CC-69).
  'Checkout Opened': {
    billing_type: 'auto_renew' | 'one_time';
  } & PayContext;

  // "Continue free learning" → "Why not now?" (CC-63). One event when the
  // sheet resolves; 'closed' = sheet dismissed, student stayed on the page.
  'Continue Free Clicked': {
    reason: 'expensive' | 'exploring' | 'later' | 'payment_issue' | 'skipped' | 'closed';
    // link = the "Continue free learning" link; back = browser back / swipe back.
    trigger?: 'link' | 'back';
  } & PayContext;

  // A subscription's status changed. source app = the student did it in the
  // Subscriptions tab (CC-97, with the reason); the backend sends the ones
  // Razorpay reports (CC-98).
  'Subscription Status Updated': {
    new_status: 'active' | 'expired' | 'cancelled' | 'paused';
    plan_name: string;
    exam_id: string;
    exam_name: string;
    subscription_id?: string;
    source?: 'app';
    reason?: string;
    note?: string;
  };

}

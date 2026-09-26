// src/lib/analytics/events/monetization.ts

export type MonetizationEventName =
  | 'Payment Paywall Rendered'
  | 'Plan Switched'
  | 'Purchase Intent Initiated'
  | 'Payment Initiated'
  | 'Payment Outcome'
  | 'Subscription Status Updated';

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
    failure_reason?: 'insufficient_funds' | 'cancelled';
    payment_session_id: string;
  };

  'Subscription Status Updated': {
    new_status: 'active' | 'expired' | 'cancelled';
    plan_name: string;
    exam_id: string;
    exam_name: string;
  };
}

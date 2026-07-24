// src/lib/analytics/events/monetization.ts

export type MonetizationEventName =
  | 'Payment Paywall Rendered'
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

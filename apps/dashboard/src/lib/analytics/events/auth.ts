// src/lib/analytics/events/auth.ts

// --- Event names ---

export type AuthEventName =
  | 'Authentication Initiated'
  | 'Authentication Options Viewed'
  | 'Authentication Method Selected'
  | 'Authentication Form Interacted'
  | 'Verification Sent'
  | 'Verification Resent'
  | 'Authentication Outcome'
  | 'Signed Up';

// --- Payloads ---

export interface AuthEventPayloads {
  'Authentication Initiated': {
    element_location: string;
    element_type: string;
  };

  'Authentication Options Viewed': {
    options_available: string[];
  };

  'Authentication Method Selected': {
    auth_method: 'phone_otp' | 'google_auth' | 'email_otp';
  };

  'Authentication Form Interacted': {
    form_field: 'input_phone_number' | 'input_otp';
  };

  'Verification Sent': {
    verification_method: 'Number' | 'Email';
    verification_mode: 'SMS' | 'RCS' | 'WhatsApp' | 'Missed Call' | 'Voice Call';
  };

  'Verification Resent': {
    verification_method: 'Number' | 'Email';
    resend_count: number;
  };

  'Authentication Outcome': {
    outcome: 'login_successful' | 'signup_successful' | 'verification_failed';
    auth_method: 'phone_otp' | 'google_auth' | 'email_otp';
    failure_reason?: 'incorrect_otp' | 'social_auth_failed';
  };

  'Signed Up': {
    signup_method: 'phone_otp' | 'google_auth' | 'email_otp';
  };
}

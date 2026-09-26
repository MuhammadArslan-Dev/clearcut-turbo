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
    user_phone: string;
    verification_method: 'Number' | 'Email';
    verification_mode: 'SMS' | 'RCS' | 'WhatsApp' | 'Missed Call' | 'Voice Call';
    verification_purpose: 'Login';
  };

  'Verification Resent': {
    user_phone: string;
    verification_method: 'Number' | 'Email';
    verification_mode: 'SMS' | 'RCS' | 'WhatsApp' | 'Missed Call' | 'Voice Call';
    verification_purpose: 'Login';
    resend_count: number;
  };

  // Fired by blog/landing/tools/onboarding on the final OTP-verify result
  // (packages/auth verification-events.ts) — not from the dashboard itself.
  'Authentication Outcome': {
    outcome: 'successful' | 'failed';
    auth_method: 'phone_otp' | 'google_auth';
    // Only when outcome is 'failed'. The OTP flows send incorrect_otp,
    // too_many_attempts, server_error, network_error or unknown_error.
    failure_reason?:
      | 'incorrect_otp'
      | 'social_auth_failed'
      | 'too_many_attempts'
      | 'server_error'
      | 'network_error'
      | 'unknown_error';
  };

  // SERVER-SIDE: sent by the Laravel backend (AuthController::login, after a new
  // user row is created) through SendAmplitudeEvent — not by any web app.
  // signup_date is a user property; initial_utm_source / initial_utm_campaign
  // are user properties the Amplitude web SDK collects on the first visit.
  'Signed Up': {
    signup_method: 'phone_otp' | 'google_auth' | 'email_otp';
  };
}

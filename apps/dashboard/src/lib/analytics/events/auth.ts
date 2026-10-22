// src/lib/analytics/events/auth.ts

// --- Event names ---

export type AuthEventName =
  | 'Authentication Initiated'
  | 'Authentication Options Viewed'
  | 'Authentication Method Selected'
  | 'Authentication Form Interacted'
  | 'Verification Sent'
  | 'Verification Resent'
  | 'Verification Failed'
  | 'Authentication Outcome'
  | 'Signed Up';

// Mirrors packages/auth verification-events.ts (dashboard does not import
// @clearcut/auth). incorrect_otp / otp_expired come from the backend's 422
// error_code; timeout / network_error when no response; client_error when
// our own code threw.
export type AuthFailureReason =
  | 'incorrect_otp'
  | 'otp_expired'
  | 'too_many_attempts'
  | 'server_error'
  | 'network_error'
  | 'timeout'
  | 'invalid_request'
  | 'client_error'
  | 'truecaller_expired'
  | 'truecaller_failed'
  | 'social_auth_failed'
  | 'unknown_error';

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
    auth_method: 'phone_otp' | 'truecaller' | 'google_auth';
    // Only when outcome is 'failed' (packages/auth getAuthFailureReason).
    failure_reason?: AuthFailureReason;
  };

  // The OTP could not be sent (login request failed) — blog/landing/tools.
  'Verification Failed': {
    user_phone: string;
    verification_method: 'Number' | 'Email';
    verification_mode: 'SMS' | 'RCS' | 'WhatsApp' | 'Missed Call' | 'Voice Call';
    verification_purpose: 'Login';
    failure_reason: AuthFailureReason;
    is_resend: boolean;
  };

  // SERVER-SIDE: sent by the Laravel backend (AuthController::login, after a new
  // user row is created) through SendAmplitudeEvent — not by any web app.
  // signup_date is a user property; initial_utm_source / initial_utm_campaign
  // are user properties the Amplitude web SDK collects on the first visit.
  'Signed Up': {
    signup_method: 'phone_otp' | 'google_auth' | 'email_otp';
  };
}

/**
 * The one definition of the `Verification Sent` / `Verification Resent`
 * analytics events (sheet: Acquisition → verification events).
 *
 * Every OTP-login entry point calls these instead of hand-building the
 * payload, so the property set can't drift between apps again:
 *   - packages/auth screens (login-screen, otp-screen, inline-auth-flow) — used
 *     by blog, landing's AuthModal/onboarding, and tools
 *   - apps/landing's own StartAuthForm
 *
 * Pure module (no React, no SDK): the caller passes its own tracker
 * (`onEvent` / `logAmplitudeEvent`), so it is safe to import from any app —
 * the same kind of exception as `@clearcut/auth/token`.
 *
 * `Authentication Outcome` lives here too: fired once per OTP-verify attempt,
 * `successful` or `failed` (+ `failure_reason`), never both for one attempt.
 *
 * Rules the callers must keep:
 *   - "Sent" only after the OTP-send API succeeded, once per login attempt.
 *   - "Resent" only after a *resend* API call succeeded, and never as a second
 *     "Sent". `resendCount` is the running count of successful resends for the
 *     current login flow (1, 2, 3…) — the caller resets it to 0 on every "Sent".
 */

export type VerificationTracker = (
  name: string,
  properties?: Record<string, unknown>,
) => void;

const VERIFICATION_METHOD = "Number";
const VERIFICATION_MODE = "SMS";
const VERIFICATION_PURPOSE = "Login";

export function trackVerificationSent(
  track: VerificationTracker | undefined,
  userPhone: string,
  extra?: Record<string, unknown>,
): void {
  track?.("Verification Sent", {
    user_phone: userPhone,
    verification_method: VERIFICATION_METHOD,
    verification_mode: VERIFICATION_MODE,
    verification_purpose: VERIFICATION_PURPOSE,
    ...extra,
  });
}

export function trackVerificationResent(
  track: VerificationTracker | undefined,
  userPhone: string,
  resendCount: number,
): void {
  track?.("Verification Resent", {
    user_phone: userPhone,
    verification_method: VERIFICATION_METHOD,
    verification_mode: VERIFICATION_MODE,
    verification_purpose: VERIFICATION_PURPOSE,
    resend_count: resendCount,
  });
}

export type AuthFailureReason =
  | "incorrect_otp"
  | "too_many_attempts"
  | "server_error"
  | "network_error"
  | "unknown_error";

/**
 * Maps a failed verify request to the reason sent with `Authentication
 * Outcome`. 422/401 is what the backend returns for a wrong/expired OTP
 * (AuthController::varifyOtp → validationError); the screens show the same
 * split to the user.
 */
export function getAuthFailureReason(err: unknown): AuthFailureReason {
  const status = (err as { response?: { status?: number } })?.response?.status;
  if (status === 422 || status === 401) return "incorrect_otp";
  if (status === 429) return "too_many_attempts";
  if (status && status >= 500) return "server_error";
  if (typeof navigator !== "undefined" && navigator.onLine === false) return "network_error";
  return "unknown_error";
}

export function trackAuthSuccess(track: VerificationTracker | undefined): void {
  track?.("Authentication Outcome", {
    outcome: "successful",
    auth_method: "phone_otp",
  });
}

export function trackAuthFailure(
  track: VerificationTracker | undefined,
  failureReason: AuthFailureReason,
): void {
  track?.("Authentication Outcome", {
    outcome: "failed",
    auth_method: "phone_otp",
    failure_reason: failureReason,
  });
}

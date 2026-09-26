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

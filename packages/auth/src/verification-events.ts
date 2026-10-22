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
 * `Authentication Outcome` lives here too: fired once per OTP-verify attempt
 * (and once per finished Truecaller login, `auth_method: "truecaller"`),
 * `successful` or `failed` (+ `failure_reason`), never both for one attempt.
 * `Verification Failed` is the send-side counterpart: the OTP never went out.
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
  | "otp_expired"
  | "too_many_attempts"
  | "server_error"
  | "network_error"
  | "timeout"
  | "invalid_request"
  | "client_error"
  | "truecaller_expired"
  | "truecaller_failed"
  | "unknown_error";

export type AuthMethod = "phone_otp" | "truecaller";

/**
 * HTTP status of a failed request. Every web client built with
 * @clearcut/api's createApiClient rejects with an `ApiError` that carries
 * `.status` and no `.response` — reading only `err.response?.status` (as
 * this module used to) made every web failure "unknown_error" (CC-87).
 * `.response.status` is still read for a raw AxiosError.
 */
export function getHttpStatus(err: unknown): number | undefined {
  const e = err as { status?: unknown; response?: { status?: unknown } } | null;
  const status = typeof e?.status === "number" ? e.status : e?.response?.status;
  return typeof status === "number" ? status : undefined;
}

/** The backend's machine-readable `error_code` (+ `message`) from an error body. */
function getErrorBody(err: unknown): { code?: string; message?: string } {
  const e = err as { data?: unknown; response?: { data?: unknown } } | null;
  const body = (e?.data ?? e?.response?.data) as
    | { error_code?: unknown; message?: unknown }
    | undefined;
  return {
    code: typeof body?.error_code === "string" ? body.error_code : undefined,
    message: typeof body?.message === "string" ? body.message : undefined,
  };
}

function isNetworkFailure(err: unknown): "timeout" | "network_error" | undefined {
  const e = err as { code?: unknown; isNetworkError?: unknown; response?: unknown } | null;
  if (e?.code === "ECONNABORTED" || e?.code === "ETIMEDOUT") return "timeout";
  if (typeof navigator !== "undefined" && navigator.onLine === false) return "network_error";
  if (e?.isNetworkError === true || e?.code === "ERR_NETWORK") return "network_error";
  return undefined;
}

/**
 * Maps a failed verify request to the reason sent with `Authentication
 * Outcome` — and the screens pick their message from the same value.
 * Backend (AuthController::varifyOtp): 422 + error_code otp_invalid /
 * otp_expired / otp_check_failed; 400 for a bad request or unknown user;
 * 429 when rate-limited; 500. The "OTP has expired" message is matched too,
 * for a backend from before error_code.
 */
export function getAuthFailureReason(err: unknown): AuthFailureReason {
  const status = getHttpStatus(err);
  if (status === 422 || status === 401) {
    const { code, message } = getErrorBody(err);
    if (code === "otp_expired" || (!code && message === "OTP has expired")) return "otp_expired";
    return "incorrect_otp";
  }
  if (status === 429) return "too_many_attempts";
  if (status && status >= 500) return "server_error";
  if (status === 400) return "invalid_request";
  if (status) return "unknown_error";
  const network = isNetworkFailure(err);
  if (network) return network;
  // No response and not a network failure: thrown in our own code (an
  // unexpected response shape, a validation error before the request).
  return "client_error";
}

export function trackAuthSuccess(
  track: VerificationTracker | undefined,
  authMethod: AuthMethod = "phone_otp",
): void {
  track?.("Authentication Outcome", {
    outcome: "successful",
    auth_method: authMethod,
  });
}

export function trackAuthFailure(
  track: VerificationTracker | undefined,
  failureReason: AuthFailureReason,
  authMethod: AuthMethod = "phone_otp",
): void {
  track?.("Authentication Outcome", {
    outcome: "failed",
    auth_method: authMethod,
    failure_reason: failureReason,
  });
}

/**
 * `Verification Failed`: the OTP could not be SENT (CC-87/D4) — the login
 * request was rejected (rate limit, server, network, or a 200 whose status
 * isn't "success"). Fired once per failed send or resend; never together
 * with Verification Sent/Resent for the same request.
 */
export function trackVerificationFailed(
  track: VerificationTracker | undefined,
  userPhone: string,
  failureReason: AuthFailureReason,
  isResend = false,
): void {
  track?.("Verification Failed", {
    user_phone: userPhone,
    verification_method: VERIFICATION_METHOD,
    verification_mode: VERIFICATION_MODE,
    verification_purpose: VERIFICATION_PURPOSE,
    failure_reason: failureReason,
    is_resend: isResend,
  });
}

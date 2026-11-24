// Phase 127: before a config-gated download (config/downloadVerification.ts) is
// released, ask the main backend whether the local session token is still
// valid — a token in localStorage alone is not enough. Reuses the existing
// authenticated endpoint GET /v1/auth-user (auth:sanctum) through
// authedRequest, which already clears the local token on a 401.
import { authedRequest, SessionExpiredError } from "./authedRequest";

/**
 * - "valid":   the backend accepted the token → download at once.
 * - "expired": no token, or the backend answered 401 (token cleared) → phone + OTP.
 * - "error":   offline, timeout, 5xx, 403, bad JSON → nothing downloads, the token is
 *              kept and the visitor gets "Try again" (never locked out, never a bypass).
 */
export type SessionCheck = "valid" | "expired" | "error";

export const VERIFY_SESSION_TIMEOUT_MS = 10_000;

export async function verifySession(
  request: typeof authedRequest = authedRequest,
  timeoutMs = VERIFY_SESSION_TIMEOUT_MS,
): Promise<SessionCheck> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    await request<unknown>("/v1/auth-user", { method: "GET", signal: controller.signal });
    return "valid";
  } catch (err) {
    return err instanceof SessionExpiredError ? "expired" : "error";
  } finally {
    clearTimeout(timer);
  }
}

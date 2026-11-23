import { isApiError } from "@/lib/api/api-error";
import { SessionExpiredError } from "@/lib/api/client";

/**
 * Should this failure of the session check (`GET /v1/auth-user`) log the user out?
 * Only an explicit 401 from the backend (phase 124). A network failure, timeout,
 * 429, 5xx and 403 keep the stored token (localStorage + `auth_token` cookie): a
 * blip must not end the session — in the RN app it used to trigger a native logout,
 * because the redirect to clearcutoff.in is how the app detects a logout.
 * 403 is a paywall / content signal in this backend, never an auth one.
 */
export function isSessionRejected(error: unknown): boolean {
  return error instanceof SessionExpiredError || (isApiError(error) && error.status === 401);
}

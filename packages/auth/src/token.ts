import { safeGetItem, safeRemoveItem, safeSetItem } from "@clearcut/utils/safe-storage";

/**
 * Shared session-token storage key. Deliberately a fixed constant, not a
 * per-app configurable value — landing/blog/dashboard are expected to
 * recognize the same session, and divergent keys per app would break that.
 */
export const TOKEN_KEY = "CSRF_TOKEN";

// Storage can be blocked (SecurityError in Facebook/Instagram in-app browsers, some private modes; Sentry
// CLEARCUTOFF-PUBLIC-4/5/8). That must never crash a page or fail a login: reads give null, writes are skipped. The
// post-login hand-off does not depend on the stored copy: the token travels in the dashboard redirect's `?token=`.
// When storage works these behave exactly as before.

export function getToken(): string | null {
  return safeGetItem(TOKEN_KEY);
}

export function setToken(token: string): void {
  safeSetItem(TOKEN_KEY, token);
}

export function clearToken(): void {
  safeRemoveItem(TOKEN_KEY);
}

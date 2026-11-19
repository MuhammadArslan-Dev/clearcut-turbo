/**
 * Shared session-token storage key. Deliberately a fixed constant, not a
 * per-app configurable value — landing/blog/dashboard are expected to
 * recognize the same session, and divergent keys per app would break that.
 */
export const TOKEN_KEY = "CSRF_TOKEN";

// Storage access can throw (SecurityError) in browsers that block it: Facebook/Instagram in-app
// browsers, some private modes. A blocked storage must never crash the page, so reads return null
// and writes are skipped (the dashboard hand-off carries the token in the URL anyway).
export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

export function setToken(token: string): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(TOKEN_KEY, token);
  } catch {
    // storage blocked: nothing to persist
  }
}

export function clearToken(): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(TOKEN_KEY);
  } catch {
    // storage blocked: nothing to clear
  }
}

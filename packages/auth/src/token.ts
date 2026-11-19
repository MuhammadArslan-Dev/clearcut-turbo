/**
 * Shared session-token storage key. Deliberately a fixed constant, not a
 * per-app configurable value — landing/blog/dashboard are expected to
 * recognize the same session, and divergent keys per app would break that.
 */
export const TOKEN_KEY = "CSRF_TOKEN";

export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearToken(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(TOKEN_KEY);
}

// lib/auth-token-client.ts
export const AUTH_TOKEN_KEY = "auth_token";
const CACHED_USER_KEY = "auth_user_cache";
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

type CachedUserEntry<T> = { data: T; cachedAt: number };

export function setCachedUser(user: unknown): void {
  if (typeof window === "undefined") return;
  const entry: CachedUserEntry<unknown> = { data: user, cachedAt: Date.now() };
  localStorage.setItem(CACHED_USER_KEY, JSON.stringify(entry));
}

export function getCachedUser<T>(): T | null {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem(CACHED_USER_KEY);
  if (!raw) return null;
  try {
    const entry = JSON.parse(raw) as CachedUserEntry<T>;
    if (Date.now() - entry.cachedAt > CACHE_TTL_MS) {
      localStorage.removeItem(CACHED_USER_KEY);
      return null;
    }
    return entry.data;
  } catch {
    return null;
  }
}

export function clearCachedUser(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(CACHED_USER_KEY);
}

export function setAuthToken(token: string) {
  if (typeof window === "undefined") return;

  // LocalStorage for easy access in client
  localStorage.setItem(AUTH_TOKEN_KEY, token);

  // Cookie so middleware + server components can see it
  document.cookie = `${AUTH_TOKEN_KEY}=${token}; path=/; max-age=${
    60 * 60 * 24 * 7
  }; SameSite=Lax`;
}

export function clearAuthToken() {
  if (typeof window === "undefined") return;

  localStorage.removeItem(AUTH_TOKEN_KEY);
  // expire cookie
  document.cookie = `${AUTH_TOKEN_KEY}=; path=/; max-age=0; SameSite=Lax`;
}

/**
 * Backend rejected the stored token (401 "Unauthenticated"). Clear local
 * auth state and send the user back to login, same target the middleware
 * uses when there's no session cookie at all.
 */
export function redirectToLogin(): void {
  if (typeof window === "undefined") return;

  clearAuthToken();
  clearCachedUser();
  window.location.href = "https://clearcutoff.in";
}

export function getAuthTokenClient(): string | null {
  if (typeof window === "undefined") return null;
  // return '39|t3TJH5e5LQCemiH78g3rmo8NItUJqEii3kg7EKKW79c706c3';
  return localStorage.getItem(AUTH_TOKEN_KEY);
}
export const token = () => {
  if (typeof window === "undefined") return null;
  // return '39|t3TJH5e5LQCemiH78g3rmo8NItUJqEii3kg7EKKW79c706c3';
  return localStorage.getItem(AUTH_TOKEN_KEY);
};


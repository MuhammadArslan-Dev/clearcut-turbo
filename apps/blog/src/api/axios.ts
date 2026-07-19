// src/api/axios.ts
//
// Phase 2 (API & Data Layer): now built on @clearcut/api's createApiClient
// instead of a raw axios.create() — mirrors apps/landing/src/api/axios.ts.
// Same base URL env var and fallback as before (NEXT_PUBLIC_API_URL), same
// "attach Bearer token from localStorage" behavior — just reading the token
// via the shared TOKEN_KEY constant instead of a duplicated "CSRF_TOKEN"
// string literal. New: errors normalize to ApiError, and a 401 now clears
// the stored token automatically (previously unhandled entirely).
import { createApiClient } from "@clearcut/api/client";
import { TOKEN_KEY } from "@clearcut/auth/token";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "https://apptest.clearcutoff.in/api";

const api = createApiClient({
  baseURL: API_URL,
  getAuthToken: () =>
    typeof window !== "undefined" ? localStorage.getItem(TOKEN_KEY) : null,
  onUnauthorized: () => {
    if (typeof window !== "undefined") {
      localStorage.removeItem(TOKEN_KEY);
    }
  },
});

export default api;

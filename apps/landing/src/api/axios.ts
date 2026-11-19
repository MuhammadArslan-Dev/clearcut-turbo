// src/api/axios.ts
import { createApiClient } from "@clearcut/api/client";
// getToken/clearToken swallow a blocked localStorage (SecurityError), so the OTP calls below
// still work in in-app browsers that deny storage.
import { clearToken, getToken } from "@clearcut/auth/token";

const API_URL = process.env.NEXT_API_URL || "https://apptest.clearcutoff.in/api";

const api = createApiClient({
  baseURL: API_URL,
  getAuthToken: () => getToken(),
  onUnauthorized: () => clearToken(),
});

export default api;

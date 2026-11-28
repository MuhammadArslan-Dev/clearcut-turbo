// src/api/axios.ts
import { createApiClient } from "@clearcut/api/client";
// getToken/clearToken never throw on a blocked localStorage (SecurityError in Facebook/Instagram in-app browsers): this
// interceptor runs on every request, so an unguarded read failed the OTP send/verify calls themselves there.
import { clearToken, getToken } from "@clearcut/auth/token";

const API_URL = process.env.NEXT_API_URL || "https://apptest.clearcutoff.in/api";

const api = createApiClient({
  baseURL: API_URL,
  getAuthToken: () => getToken(),
  onUnauthorized: () => clearToken(),
});

export default api;

// src/api/axios.ts
import { createApiClient } from "@clearcut/api/client";
import { TOKEN_KEY } from "@clearcut/auth/token";

const API_URL = process.env.NEXT_API_URL || "https://apptest.clearcutoff.in/api";

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

import {
  getAuthTokenClient,
  token as tokenApi,
  redirectToLogin,
} from "../auth-token-client";
import { fetchWithRetry } from "./fetchWithRetry";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_LARAVEL_MAIN_BACKEND ??
  "http://clearcutoff-main-backend.test/api";

export async function apiFetch<T>(
  path: string,
  options: RequestInit = {},
  token?: string,
): Promise<T> {
  let headers: Headers;

  if (options.headers instanceof Headers) {
    headers = new Headers(options.headers);
  } else if (Array.isArray(options.headers)) {
    headers = new Headers(options.headers);
  } else if (options.headers && typeof options.headers === "object") {
    headers = new Headers(options.headers as Record<string, string>);
  } else {
    headers = new Headers();
  }

  headers.set("Content-Type", "application/json");

  const authToken = token ?? tokenApi() ?? getAuthTokenClient();
  if (authToken) {
    headers.set("Authorization", `Bearer ${authToken}`);
  }

  const res = await fetchWithRetry(`${API_BASE_URL}${path}`, {
    ...options,
    headers,
  });

  if (res.status === 401) {
    redirectToLogin();
    throw new Error("Redirecting due to expired session");
  }

  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || `API error: ${res.status}`);
  }

  return res.json() as Promise<T>;
}

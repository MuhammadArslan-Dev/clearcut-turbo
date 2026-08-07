import * as Sentry from "@sentry/nextjs";

import {
  getAuthTokenClient,
  token as tokenApi,
  redirectToLogin,
} from "../auth-token-client";
import { fetchWithRetry } from "./fetchWithRetry";
import { ApiError, truncateBody } from "./api-error";

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

  const method = (options.method ?? "GET").toUpperCase();
  const url = `${API_BASE_URL}${path}`;
  // Path without the query string: keeps Sentry grouping by endpoint rather
  // than splitting one issue across every distinct set of query params.
  const endpoint = path.split("?")[0];
  const startedAt = Date.now();

  let res: Response;

  try {
    res = await fetchWithRetry(url, { ...options, headers });
  } catch (cause) {
    // Server unreachable: DNS failure, connection refused, CORS, offline.
    // Previously this surfaced as a bare "TypeError: Failed to fetch" with no
    // indication of which call failed.
    const error = new ApiError({
      status: 0,
      method,
      endpoint,
      url,
      isNetworkError: true,
      cause,
    });

    Sentry.addBreadcrumb({
      category: "api",
      type: "http",
      level: "error",
      message: `${method} ${endpoint} — unreachable`,
      data: { url, durationMs: Date.now() - startedAt },
    });

    throw error;
  }

  Sentry.addBreadcrumb({
    category: "api",
    type: "http",
    level: res.ok ? "info" : "error",
    message: `${method} ${endpoint} → ${res.status}`,
    data: { url, status: res.status, durationMs: Date.now() - startedAt },
  });

  if (res.status === 401) {
    redirectToLogin();
    // Control flow, not a fault — `IGNORE_ERRORS` filters this out of Sentry.
    throw new Error("Redirecting due to expired session");
  }

  if (!res.ok) {
    const text = await res.text().catch(() => "");

    throw new ApiError({
      status: res.status,
      method,
      endpoint,
      url,
      responseBody: text ? truncateBody(text) : undefined,
    });
  }

  return res.json() as Promise<T>;
}

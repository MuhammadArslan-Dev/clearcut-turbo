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
  retryOptions?: { retries?: number; delayMs?: number },
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
    res = await fetchWithRetry(
      url,
      { ...options, headers },
      retryOptions?.retries,
      retryOptions?.delayMs,
    );
  } catch (cause) {
    // An intentionally cancelled request (caller's AbortController) isn't a
    // server-unreachable failure — don't brand it as one or breadcrumb it,
    // just let the caller's own abort handling deal with it silently.
    if (cause instanceof DOMException && cause.name === "AbortError") {
      throw cause;
    }

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

    const unreachableDurationMs = Date.now() - startedAt;

    Sentry.addBreadcrumb({
      category: "api",
      type: "http",
      level: "error",
      message: `${method} ${endpoint} — unreachable`,
      data: { url, durationMs: unreachableDurationMs },
    });
    // Modern replacement for the deprecated Sentry.metrics.distribution() —
    // attaches to the current active span so response times show up in
    // Sentry's Performance UI, filterable/graphable by endpoint via tags.
    Sentry.setMeasurement("api_response_time", unreachableDurationMs, "millisecond");

    throw error;
  }

  const durationMs = Date.now() - startedAt;

  Sentry.addBreadcrumb({
    category: "api",
    type: "http",
    level: res.ok ? "info" : "error",
    message: `${method} ${endpoint} → ${res.status}`,
    data: { url, status: res.status, durationMs },
  });
  Sentry.setMeasurement("api_response_time", durationMs, "millisecond");

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

  try {
    return (await res.json()) as T;
  } catch (cause) {
    // Same reasoning as the fetchWithRetry catch above: the caller's own
    // AbortController firing while res.json() was still reading the body
    // (status/headers had already arrived, so we're past the first catch —
    // e.g. the user navigated away from /preparation/:courseId right as a
    // 200 response for setResumeState was streaming in) isn't a server
    // failure, just a cancelled request. Without this, it fell through to
    // the generic ApiError wrap below with isNetworkError left false (an
    // AbortError isn't a TypeError), which meant neither this function's
    // own abort handling NOR callers' own `instanceof DOMException` abort
    // checks (e.g. Sidebar.tsx's setResumeState catch) could recognize it —
    // the wrapped ApiError's name is "ApiError", not "AbortError" — so it
    // surfaced as a reported error instead of being silently ignored
    // (Sentry CLEARCUTOFF-NEXTJS-APP-A8, the "API 200 ... AbortError"
    // pattern — status 200 because the response itself was fine; only the
    // body read was cut short by the abort).
    if (cause instanceof DOMException && cause.name === "AbortError") {
      throw cause;
    }

    // res.ok was already true above — headers/status arrived fine, but the
    // body read/parse itself failed. This was previously an un-wrapped
    // `return res.json()`, so a body-read failure (the connection dropping
    // mid-stream, e.g. an in-app browser backgrounding the tab — Safari
    // phrases this "Load failed", not "Failed to fetch") skipped apiFetch's
    // own error handling entirely and reached the caller as a raw TypeError
    // with none of the endpoint/status context below (Sentry
    // CLEARCUTOFF-NEXTJS-APP-A9).
    //
    // A dropped connection mid-read throws a TypeError; a backend that sent
    // genuinely malformed JSON throws a SyntaxError from JSON.parse — kept
    // distinct here (isNetworkError only for the former) so a real backend
    // bug can't get miscategorized as a shrug-worthy network blip and hidden
    // from view by a network-failure suppression check downstream.
    const parseDurationMs = Date.now() - startedAt;
    const error = new ApiError({
      status: res.status,
      method,
      endpoint,
      url,
      isNetworkError: cause instanceof TypeError,
      cause,
    });

    Sentry.addBreadcrumb({
      category: "api",
      type: "http",
      level: "error",
      message: `${method} ${endpoint} → body read failed`,
      data: { url, status: res.status, durationMs: parseDurationMs },
    });

    throw error;
  }
}

/**
 * Options shared by all three Sentry runtimes (browser, node server, edge).
 *
 * Each runtime has its own `Sentry.init` — the browser's lives in
 * `src/instrumentation-client.ts`, the other two in `sentry.server.config.ts` /
 * `sentry.edge.config.ts`. Everything that must stay identical between them
 * (environment naming, sampling, what counts as noise) lives here so the three
 * cannot silently drift apart.
 *
 * Safe to import from any runtime: it only reads env vars, no runtime APIs.
 */

const isProduction = process.env.NODE_ENV === "production";

/**
 * Which deployment an event came from. Falls back to NODE_ENV so local runs
 * show up as "development" instead of being lumped in with production.
 */
export const SENTRY_ENVIRONMENT =
  process.env.NEXT_PUBLIC_SENTRY_ENVIRONMENT ??
  process.env.NODE_ENV ??
  "development";

/**
 * The DSN is public by design (it ships inside the browser bundle), but it
 * still belongs in env so staging and production can point at different
 * projects. Server and edge fall back to the public one because they report
 * into the same Sentry project.
 */
export const SENTRY_DSN =
  process.env.NEXT_PUBLIC_SENTRY_DSN ?? process.env.SENTRY_DSN ?? "";

/**
 * Performance tracing is billed per transaction. Full sampling locally where
 * volume is tiny and it is genuinely useful; 10% in production.
 */
export const TRACES_SAMPLE_RATE = isProduction ? 0.1 : 1.0;

/**
 * Noise that is never actionable.
 *
 * Deliberately absent: "Failed to fetch", "Network Error", "fetch failed",
 * "Load failed". Those were previously ignored, which hid every
 * backend-unreachable failure — the exact class of error this setup exists to
 * surface. They are now reported, tagged by endpoint via ApiError.
 */
export const IGNORE_ERRORS: (string | RegExp)[] = [
  // Benign layout-loop warning browsers emit; never a real bug.
  "ResizeObserver loop limit exceeded",
  "ResizeObserver loop completed with undelivered notifications",
  // Thrown on purpose by apiFetch on a 401 to unwind into the login redirect.
  "Redirecting due to expired session",
  // Next.js control-flow exceptions, not failures.
  "NEXT_REDIRECT",
  "NEXT_NOT_FOUND",
  // Browser-extension and injected-script noise.
  /^chrome-extension:\/\//,
  /^moz-extension:\/\//,
  "ResizeObserver is not defined",
  // Android WebView host apps (Instagram/Facebook in-app browser) inject a
  // native performance-logging bridge that throws once its Java-side object
  // has been garbage collected — happens on navigation/backgrounding, not
  // triggered by our code.
  /Error invoking .*: Java object is gone/,
  // Classic React/browser-extension DOM race (e.g. Google Translate mutating
  // nodes React still tracks) on unmount; already caught by an error
  // boundary (`handled: true`) where it occurs.
  "Failed to execute 'removeChild' on 'Node'",
  // Benign pointer-capture race on fast pointerup/pointercancel sequences —
  // observed originating from Next's own dev-mode devtools overlay as well
  // as third-party pointer-event libraries; not actionable.
  "Failed to execute 'releasePointerCapture' on 'Element'",
];

/** Third-party scripts we cannot fix and do not want reports from. */
export const DENY_URLS: RegExp[] = [
  /extensions\//i,
  /^chrome(-extension)?:\/\//i,
  /^moz-extension:\/\//i,
  /googletagmanager\.com/i,
  /connect\.facebook\.net/i,
  // Facebook/Instagram's in-app browser injects its own internal WebView
  // frame (breadcrumbs alongside it show its own "hxp-chat-suppression" /
  // "FBNavLargestContentfulPaint" instrumentation, not our code) — its
  // errors surface as `app://iab_inner_frame_ota` in the stack, on the same
  // global error handler as real app errors, with none of our code on the
  // stack at all. Scoped to that exact frame name, not the whole `app://`
  // scheme, since that's also how OUR OWN real bundle paths are reported
  // (`app:///_next/static/chunks/...`) — those must keep reporting normally.
  /iab_inner_frame/i,
];

/**
 * Query params that carry credentials. The cross-host login handoff lands on
 * `/dashboard?token=<sanctum token>` (see AuthProvider), so that token is in
 * `window.location`, the request URL and any navigation breadcrumb for as
 * long as the landing URL is live — Sentry's own scrubbing only looks at
 * header/body field names, not URL query strings.
 */
const SENSITIVE_PARAMS = new Set([
  "token",
  "access_token",
  "auth_token",
  "refresh_token",
  "id_token",
  "api_key",
  "apikey",
  "key",
  "secret",
  "password",
  "pass",
  "otp",
  "code",
  "session",
  "signature",
]);

/** Replaces the value of any sensitive query param in a URL/path; returns other input untouched. */
export function redactUrl<T extends string | undefined>(raw: T): T {
  if (!raw || !raw.includes("?")) return raw;
  try {
    const url = new URL(raw, "http://redact.local");
    let changed = false;
    for (const key of [...url.searchParams.keys()]) {
      if (SENSITIVE_PARAMS.has(key.toLowerCase())) {
        url.searchParams.set(key, "[redacted]");
        changed = true;
      }
    }
    if (!changed) return raw;
    const absolute = /^[a-z][a-z0-9+.-]*:/i.test(raw);
    return (absolute ? url.toString() : url.pathname + url.search + url.hash) as T;
  } catch {
    return raw;
  }
}

/** Same as redactUrl, for a bare `?a=b` search string (window.location.search). */
export function redactSearch<T extends string | undefined>(search: T): T {
  if (!search) return search;
  const hadPrefix = search.startsWith("?");
  const redacted = redactUrl(`/${hadPrefix ? search : `?${search}`}`) as string;
  // Keep the caller's shape: window.location.search has the "?", a
  // request.query_string does not.
  return redacted.slice(hadPrefix ? 1 : 2) as T;
}

/**
 * Strips credentials from an event before it leaves the process. Sentry's own
 * scrubbing does not know about our header/body shapes, nor about tokens in
 * URL query strings (see SENSITIVE_PARAMS).
 */
export function scrubSensitiveData<T extends Record<string, any>>(event: T): T {
  const headers = event?.request?.headers;
  if (headers) {
    delete headers.authorization;
    delete headers.Authorization;
    delete headers.cookie;
    delete headers.Cookie;
    if (typeof headers.referer === "string") headers.referer = redactUrl(headers.referer);
    if (typeof headers.Referer === "string") headers.Referer = redactUrl(headers.Referer);
  }

  if (event?.request) {
    if (typeof event.request.url === "string") event.request.url = redactUrl(event.request.url);
    if (typeof event.request.query_string === "string") {
      event.request.query_string = redactSearch(event.request.query_string);
    }
  }

  if (event?.extra) {
    for (const key of ["url", "referrer"]) {
      if (typeof event.extra[key] === "string") event.extra[key] = redactUrl(event.extra[key]);
    }
    if (typeof event.extra.search === "string") event.extra.search = redactSearch(event.extra.search);
  }

  // Contexts carry URLs under assorted keys — `url`, and `request_path` from
  // Next's captureRequestError (which includes the raw query string).
  if (event?.contexts) {
    for (const ctx of Object.values(event.contexts) as Record<string, any>[]) {
      if (!ctx || typeof ctx !== "object") continue;
      for (const [key, value] of Object.entries(ctx)) {
        if (typeof value === "string" && /^(\/|https?:)/.test(value)) ctx[key] = redactUrl(value);
      }
    }
  }

  // Navigation/fetch breadcrumbs record full URLs (`to`/`from`/`url`).
  for (const crumb of event?.breadcrumbs ?? []) {
    const data = crumb?.data;
    if (!data) continue;
    for (const key of ["url", "to", "from"]) {
      if (typeof data[key] === "string") data[key] = redactUrl(data[key]);
    }
  }

  return event;
}

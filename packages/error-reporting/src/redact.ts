// Sensitive-value redaction for anything that is about to reach Sentry.
//
// Pure functions, no Sentry import: this package deliberately does NOT depend
// on @sentry/nextjs (blog/landing pin ^9, dashboard ^10), so each app passes
// its own SDK in. Same rules as apps/dashboard/src/lib/sentry/sentry-shared.ts.

/**
 * Query params that carry credentials. The cross-host login handoff lands on
 * `/dashboard?token=<sanctum token>`, OTP/reset flows use `otp`/`code`, and
 * Sentry's own scrubbing only inspects header/body field names — never URL
 * query strings.
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
export function redactUrl<T extends string | undefined | null>(raw: T): T {
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

/** Same as redactUrl, for a bare search string (`?a=b` from window.location, `a=b` from request.query_string). */
export function redactSearch<T extends string | undefined | null>(search: T): T {
  if (!search) return search;
  const hadPrefix = search.startsWith("?");
  const redacted = redactUrl(`/${hadPrefix ? search : `?${search}`}`) as string;
  return redacted.slice(hadPrefix ? 1 : 2) as T;
}

type AnyEvent = Record<string, any>;

/**
 * Strips credentials from a Sentry event before it leaves the process: auth
 * headers/cookies, and sensitive query values in the request URL, query
 * string, referer, extras and breadcrumbs. Use as / inside `beforeSend`.
 */
export function scrubSensitiveData<T extends AnyEvent>(event: T): T {
  const headers = event?.request?.headers;
  if (headers) {
    for (const key of ["authorization", "Authorization", "cookie", "Cookie", "x-api-key", "X-Api-Key"]) {
      delete headers[key];
    }
    for (const key of ["referer", "Referer"]) {
      if (typeof headers[key] === "string") headers[key] = redactUrl(headers[key]);
    }
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
    for (const ctx of Object.values(event.contexts) as AnyEvent[]) {
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

/**
 * Redacts span attributes in place: query attributes (`http.query`,
 * `url.query`) and any URL-looking value (`url`, `http.url`, `url.full`, …).
 */
function scrubAttributes(data: AnyEvent | undefined): void {
  if (!data || typeof data !== "object") return;
  for (const [key, value] of Object.entries(data)) {
    if (typeof value !== "string" || (!value.includes("?") && !/query/i.test(key))) continue;
    if (/query/i.test(key)) data[key] = redactSearch(value);
    else if (/^(\/|[a-z][a-z0-9+.-]*:)/i.test(value)) data[key] = redactUrl(value);
  }
}

/** Redacts a span's description (e.g. `GET /dashboard?token=…`) and attributes. Use as `beforeSendSpan` (CC-143). */
export function scrubSpan<T extends AnyEvent>(span: T): T {
  if (typeof span?.description === "string" && span.description.includes("?")) {
    // Descriptions are "<METHOD> <url>" for http spans, or just the URL.
    const match = /^(\S+ )?([\s\S]*)$/.exec(span.description);
    if (match) (span as AnyEvent).description = (match[1] ?? "") + redactUrl(match[2]);
  }
  scrubAttributes(span?.data);
  return span;
}

/**
 * `beforeSend` only sees errors. Page-load/navigation transactions carry the
 * landing URL — `?token=` included — in the request, the root span and the
 * `browser.request`/`resource.*` child spans, so they need this (CC-143).
 */
export function scrubTransaction<T extends AnyEvent>(event: T): T {
  scrubSensitiveData(event);
  if (typeof event?.transaction === "string") (event as AnyEvent).transaction = redactUrl(event.transaction);
  scrubAttributes(event?.contexts?.trace?.data);
  for (const span of event?.spans ?? []) scrubSpan(span);
  return event;
}

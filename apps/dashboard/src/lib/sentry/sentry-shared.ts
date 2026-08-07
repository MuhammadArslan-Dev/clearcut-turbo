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
];

/** Third-party scripts we cannot fix and do not want reports from. */
export const DENY_URLS: RegExp[] = [
  /extensions\//i,
  /^chrome(-extension)?:\/\//i,
  /^moz-extension:\/\//i,
  /googletagmanager\.com/i,
  /connect\.facebook\.net/i,
];

/**
 * Strips credentials from an event before it leaves the process. Sentry's own
 * scrubbing does not know about our header/body shapes.
 */
export function scrubSensitiveData<T extends Record<string, any>>(event: T): T {
  const headers = event?.request?.headers;
  if (headers) {
    delete headers.authorization;
    delete headers.Authorization;
    delete headers.cookie;
    delete headers.Cookie;
  }
  return event;
}

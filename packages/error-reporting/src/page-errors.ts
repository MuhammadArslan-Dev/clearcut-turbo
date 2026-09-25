// Browser-side glue: turns a 404 / error-boundary hit into a Sentry event,
// without this package depending on any Sentry SDK.
//
// Each app passes `loadSentry` — a function that dynamically imports ITS OWN
// SDK version (@sentry/nextjs ^9 in blog/landing, @sentry/browser in tools)
// and initialises it if nothing else has (with `scrubSensitiveData` as
// beforeSend). Returning null means "monitoring is off" (no DSN), in which case
// nothing is loaded and nothing is sent.

import { classifyNotFound, type NotFoundOptions } from "./not-found";
import { redactSearch, redactUrl } from "./redact";

/** The slice of the Sentry SDK these helpers use — satisfied by both @sentry/nextjs and @sentry/browser. */
export type SentryLike = {
  withScope(callback: (scope: ScopeLike) => void): void;
  captureMessage(message: string): unknown;
  captureException(error: unknown): unknown;
};

export type ScopeLike = {
  setLevel(level: "warning" | "info" | "error" | "fatal"): unknown;
  setTags(tags: Record<string, string>): unknown;
  setFingerprint(fingerprint: string[]): unknown;
  setContext(name: string, context: Record<string, unknown> | null): unknown;
  setExtras(extras: Record<string, unknown>): unknown;
};

export type PageErrorReporterOptions = {
  loadSentry: () => Promise<SentryLike | null> | null;
  locales: readonly string[];
  defaultLocale: string;
  ignorePrefixes?: readonly string[];
};

export type BoundaryName = "route-error" | "global-error";

export function createPageErrorReporter({ loadSentry, locales, defaultLocale, ignorePrefixes }: PageErrorReporterOptions) {
  const reportedNotFound = new Set<string>();

  /** Call from a not-found page's client effect. Only 404s that point at a defect are sent. */
  function reportNotFound(): void {
    if (typeof window === "undefined") return;

    const nav = performance.getEntriesByType?.("navigation")?.[0] as PerformanceNavigationTiming | undefined;
    const options: NotFoundOptions = {
      env: { href: window.location.href, referrer: document.referrer, loadedUrl: nav?.name ?? null },
      locales,
      defaultLocale,
      ignorePrefixes,
    };
    const report = classifyNotFound(options);
    if (report.action === "ignore" || reportedNotFound.has(report.dedupeKey)) return;
    reportedNotFound.add(report.dedupeKey);

    const pending = loadSentry();
    if (!pending) return;
    void pending.then((sentry) => {
      if (!sentry) return;
      sentry.withScope((scope) => {
        scope.setLevel(report.level);
        scope.setTags(report.tags);
        scope.setFingerprint(report.fingerprint);
        scope.setContext("not_found", report.context);
        sentry.captureMessage(report.message);
      });
    });
  }

  /**
   * Call from error.tsx / global-error.tsx. Always reports the ORIGINAL error
   * (never a wrapper) so the stack survives; `digest` links a browser event to
   * the matching server-side one (server component errors are also captured by
   * onRequestError with the real message).
   */
  function reportBoundaryError(error: Error & { digest?: string }, boundary: BoundaryName): void {
    const pending = loadSentry();
    if (!pending) return;
    void pending.then((sentry) => {
      if (!sentry) return;
      sentry.withScope((scope) => {
        scope.setLevel(boundary === "global-error" ? "fatal" : "error");
        scope.setTags({ boundary, digest: error.digest ?? "none", runtime: "browser" });
        scope.setExtras({
          digest: error.digest,
          pathname: window.location.pathname,
          // Redacted: login handoffs / OTP flows can put credentials in the query string.
          url: redactUrl(window.location.href),
          search: redactSearch(window.location.search),
          referrer: redactUrl(document.referrer) || undefined,
        });
        sentry.captureException(error);
      });
    });
  }

  return { reportNotFound, reportBoundaryError };
}

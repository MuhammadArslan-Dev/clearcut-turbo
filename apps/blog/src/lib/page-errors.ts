import { createPageErrorReporter } from "@clearcut/error-reporting/page-errors";
import { scrubSensitiveData } from "@clearcut/error-reporting/redact";
import { routing } from "@/i18n/routing";

// Page-level error reporting (404s, error boundaries) for the public blog.
//
// The Sentry SDK is imported lazily and only when NEXT_PUBLIC_SENTRY_DSN is
// set (the branch below is dead-code-eliminated otherwise), so with no DSN
// nothing is bundled or sent. If instrumentation-client.ts already
// initialised Sentry, that client is reused; otherwise it is initialised
// here, the first time a page error actually happens.
const DSN = process.env.NEXT_PUBLIC_SENTRY_DSN;

let loading: Promise<typeof import("@sentry/nextjs")> | null = null;

/**
 * The ONE place this app's browser Sentry is loaded and initialised (Phase
 * 17): instrumentation-client.ts calls it once the page is loaded and idle,
 * and the 404/crash reporter below calls it when an error comes first. One
 * init, so the config (tracing included) no longer depends on which caller
 * happened to win.
 */
export function loadSentry() {
  if (!DSN) return null;
  loading ??= import("@sentry/nextjs").then((Sentry) => {
    if (!Sentry.getClient()) {
      Sentry.init({
        dsn: DSN,
        environment: process.env.NEXT_PUBLIC_SENTRY_ENVIRONMENT ?? process.env.NODE_ENV,
        sendDefaultPii: false,
        // Page-load tracing + Web Vitals. The SDK starts after the page has
        // loaded; the vitals still arrive (buffered PerformanceObserver).
        tracesSampleRate: Number(process.env.NEXT_PUBLIC_SENTRY_TRACES_SAMPLE_RATE ?? 0.1),
        beforeSend(event) {
          scrubSensitiveData(event);
          event.tags = { ...event.tags, runtime: "browser", app: "blog" };
          return event;
        },
      });
    }
    return Sentry;
  });
  return loading;
}

export const { reportNotFound, reportBoundaryError } = createPageErrorReporter({
  loadSentry,
  locales: routing.locales,
  defaultLocale: routing.defaultLocale,
});

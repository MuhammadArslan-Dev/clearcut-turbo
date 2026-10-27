import { createPageErrorReporter } from "@clearcut/error-reporting/page-errors";
import { scrubSensitiveData, scrubSpan, scrubTransaction } from "@clearcut/error-reporting/redact";
import { DENY_URLS, IGNORE_ERRORS } from "@clearcut/error-reporting/noise";
import { PUBLIC_SENTRY_DSN, publicSentryAllowedHere } from "@clearcut/error-reporting/public-project";
import { tagPage } from "@clearcut/error-reporting/page-tags";
import { landingTrafficTags } from "@clearcut/error-reporting/traffic-tags";
import { routing } from "@/i18n/routing";

// Page-level error reporting (404s, error boundaries) for the public landing site.
//
// The Sentry SDK is imported lazily and only when NEXT_PUBLIC_SENTRY_DSN is
// set (the branch below is dead-code-eliminated otherwise), so with no DSN
// nothing is bundled or sent. If instrumentation-client.ts already
// initialised Sentry, that client is reused; otherwise it is initialised
// here, the first time a page error actually happens.
// clearcutoff-public (see @clearcut/error-reporting/public-project).
const DSN = PUBLIC_SENTRY_DSN;

// exam / utm_campaign / has_fbclid / in_app_browser of the landing URL,
// read now (module load) before anything strips the query (CC-144).
const TRAFFIC_TAGS = landingTrafficTags();

let loading: Promise<typeof import("@sentry/nextjs")> | null = null;

/**
 * The ONE place this app's browser Sentry is loaded and initialised (Phase
 * 17): instrumentation-client.ts calls it once the page is loaded and idle,
 * and the 404/crash reporter below calls it when an error comes first. One
 * init, so the config (tracing included) no longer depends on which caller
 * happened to win.
 */
export function loadSentry() {
  // Real sites only: localhost, maintest and previews never report.
  if (!DSN || !publicSentryAllowedHere()) return null;
  loading ??= import("@sentry/nextjs").then((Sentry) => {
    if (!Sentry.getClient()) {
      Sentry.init({
        dsn: DSN,
        environment: process.env.NEXT_PUBLIC_SENTRY_ENVIRONMENT ?? process.env.NODE_ENV,
        sendDefaultPii: false,
        // In-app-browser / extension noise (CC-112).
        ignoreErrors: IGNORE_ERRORS,
        denyUrls: DENY_URLS,
        // Page-load tracing + Web Vitals. The SDK starts after the page has
        // loaded; the vitals still arrive (buffered PerformanceObserver).
        tracesSampleRate: Number(process.env.NEXT_PUBLIC_SENTRY_TRACES_SAMPLE_RATE ?? 0.1),
        // CC-143: transactions/spans carry the page URL and its query string.
        beforeSendTransaction(event) {
          scrubTransaction(event);
          event.tags = { ...event.tags, ...TRAFFIC_TAGS, app: "landing" };
          return event;
        },
        beforeSendSpan: scrubSpan,
        beforeSend(event) {
          scrubSensitiveData(event);
          // page + language tags for the signup funnel (CC-95).
          tagPage(event, routing.locales, routing.defaultLocale);
          event.tags = { ...event.tags, ...TRAFFIC_TAGS, runtime: "browser", app: "landing" };
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

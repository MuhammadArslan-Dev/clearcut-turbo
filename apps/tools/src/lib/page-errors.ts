import { createPageErrorReporter } from "@clearcut/error-reporting/page-errors";
import { scrubSensitiveData, scrubSpan, scrubTransaction } from "@clearcut/error-reporting/redact";
import { DENY_URLS, IGNORE_ERRORS } from "@clearcut/error-reporting/noise";
import { PUBLIC_SENTRY_DSN, publicSentryAllowedHere } from "@clearcut/error-reporting/public-project";
import { landingTrafficTags } from "@clearcut/error-reporting/traffic-tags";

// Page-level error reporting (404s, error boundaries) for the tools app.
//
// Tools is a static export with no backend calls, so there is no server-side
// Sentry to configure — every 404 / crash is observed in the browser. The SDK
// is imported lazily and only when NEXT_PUBLIC_SENTRY_DSN was set at BUILD time
// (static export bakes env vars in; the branch below is dead-code-eliminated
// otherwise), so normal page views download none of it and, with no DSN,
// nothing is bundled or sent. It is initialised the first time a page error
// actually happens.
// clearcutoff-public (see @clearcut/error-reporting/public-project).
const DSN = PUBLIC_SENTRY_DSN;

// exam / utm_campaign / has_fbclid / in_app_browser of the landing URL,
// read now (module load) before anything strips the query (CC-144).
const TRAFFIC_TAGS = landingTrafficTags();

/**
 * Static export: no Next route info reaches @sentry/browser, so page loads
 * would be named by their raw URL (one bucket per exam page). Name them by
 * route instead, e.g. "/:locale?/tools/resizer/:slug" (CC-144).
 */
export function toolsTransactionName(pathname: string): string {
  const path = pathname.replace(/\/+$/, "") || "/";
  const locale = /^\/(hi|mr)(?=\/)/.test(path) ? "/:locale" : "";
  const bare = locale ? path.replace(/^\/(hi|mr)/, "") : path;
  const named = bare
    .replace(/^\/tools\/resizer\/[^/]+$/, "/tools/resizer/:slug")
    .replace(/^\/tools\/age-eligibility-calculator\/(?!all$)[^/]+$/, "/tools/age-eligibility-calculator/:examSlug");
  return `${locale}${named}`;
}

let loading: Promise<typeof import("@sentry/browser")> | null = null;

/**
 * The one place tools' browser Sentry is loaded (Phase 17): after load +
 * idle from instrumentation-client.ts, or at once by the 404/crash reporter
 * below. A static export, so the DSN must be set at BUILD time.
 */
export function loadSentry() {
  // Real sites only: localhost, maintest and previews never report.
  if (!DSN || !publicSentryAllowedHere()) return null;
  loading ??= import("@sentry/browser").then((Sentry) => {
    if (!Sentry.getClient()) {
      Sentry.init({
        dsn: DSN,
        environment: process.env.NEXT_PUBLIC_SENTRY_ENVIRONMENT ?? process.env.NODE_ENV,
        sendDefaultPii: false,
        // In-app-browser / extension noise (CC-112).
        ignoreErrors: IGNORE_ERRORS,
        denyUrls: DENY_URLS,
        // Page-load tracing + Web Vitals (Phase 17); they still arrive though
        // the SDK starts after the page has loaded (buffered observers).
        integrations: [
          Sentry.browserTracingIntegration({
            beforeStartSpan: (context) => ({ ...context, name: toolsTransactionName(window.location.pathname) }),
          }),
        ],
        tracesSampleRate: Number(process.env.NEXT_PUBLIC_SENTRY_TRACES_SAMPLE_RATE ?? 0.1),
        // CC-143: transactions/spans carry the page URL and its query string.
        beforeSendTransaction(event) {
          scrubTransaction(event);
          event.tags = { ...event.tags, ...TRAFFIC_TAGS, app: "tools" };
          return event;
        },
        beforeSendSpan: scrubSpan,
        beforeSend(event) {
          scrubSensitiveData(event);
          event.tags = { ...event.tags, ...TRAFFIC_TAGS, runtime: "browser", app: "tools" };
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
  // Public URLs are /tools/…, /hi/tools/… and /mr/tools/… (see lib/seo.ts).
  locales: ["en", "hi", "mr"],
  defaultLocale: "en",
  ignorePrefixes: ["tools"],
});

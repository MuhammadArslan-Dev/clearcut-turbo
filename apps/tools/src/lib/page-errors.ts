import { createPageErrorReporter } from "@clearcut/error-reporting/page-errors";
import { scrubSensitiveData } from "@clearcut/error-reporting/redact";
import { DENY_URLS, IGNORE_ERRORS } from "@clearcut/error-reporting/noise";
import { PUBLIC_SENTRY_DSN, publicSentryAllowedHere } from "@clearcut/error-reporting/public-project";

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
        integrations: [Sentry.browserTracingIntegration()],
        tracesSampleRate: Number(process.env.NEXT_PUBLIC_SENTRY_TRACES_SAMPLE_RATE ?? 0.1),
        beforeSend(event) {
          scrubSensitiveData(event);
          event.tags = { ...event.tags, runtime: "browser", app: "tools" };
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

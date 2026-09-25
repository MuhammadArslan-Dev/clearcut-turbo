import { createPageErrorReporter } from "@clearcut/error-reporting/page-errors";
import { scrubSensitiveData } from "@clearcut/error-reporting/redact";
import { routing } from "@/i18n/routing";

// Page-level error reporting (404s, error boundaries) for the public landing site.
//
// The Sentry SDK is imported lazily and only when NEXT_PUBLIC_SENTRY_DSN is
// set (the branch below is dead-code-eliminated otherwise), so with no DSN
// nothing is bundled or sent. If instrumentation-client.ts already
// initialised Sentry, that client is reused; otherwise it is initialised
// here, the first time a page error actually happens.
const DSN = process.env.NEXT_PUBLIC_SENTRY_DSN;

let loading: Promise<typeof import("@sentry/nextjs")> | null = null;

function loadSentry() {
  if (!DSN) return null;
  loading ??= import("@sentry/nextjs").then((Sentry) => {
    if (!Sentry.getClient()) {
      Sentry.init({
        dsn: DSN,
        environment: process.env.NEXT_PUBLIC_SENTRY_ENVIRONMENT ?? process.env.NODE_ENV,
        sendDefaultPii: false,
        tracesSampleRate: 0,
        beforeSend(event) {
          scrubSensitiveData(event);
          event.tags = { ...event.tags, runtime: "browser", app: "landing" };
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

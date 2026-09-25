import { createPageErrorReporter } from "@clearcut/error-reporting/page-errors";
import { scrubSensitiveData } from "@clearcut/error-reporting/redact";

// Page-level error reporting (404s, error boundaries) for the tools app.
//
// Tools is a static export with no backend calls, so there is no server-side
// Sentry to configure — every 404 / crash is observed in the browser. The SDK
// is imported lazily and only when NEXT_PUBLIC_SENTRY_DSN was set at BUILD time
// (static export bakes env vars in; the branch below is dead-code-eliminated
// otherwise), so normal page views download none of it and, with no DSN,
// nothing is bundled or sent. It is initialised the first time a page error
// actually happens.
const DSN = process.env.NEXT_PUBLIC_SENTRY_DSN;

let loading: Promise<typeof import("@sentry/browser")> | null = null;

function loadSentry() {
  if (!DSN) return null;
  loading ??= import("@sentry/browser").then((Sentry) => {
    if (!Sentry.getClient()) {
      Sentry.init({
        dsn: DSN,
        environment: process.env.NEXT_PUBLIC_SENTRY_ENVIRONMENT ?? process.env.NODE_ENV,
        sendDefaultPii: false,
        tracesSampleRate: 0,
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

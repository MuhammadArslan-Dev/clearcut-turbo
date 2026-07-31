// Browser-side Sentry initialization.
//
// With @sentry/nextjs v10 this file — NOT the legacy `sentry.client.config.ts`
// — is what the SDK loads for the browser. See that file's header for details.
// https://docs.sentry.io/platforms/javascript/guides/nextjs/

import * as Sentry from "@sentry/nextjs";
import {
  DENY_URLS,
  IGNORE_ERRORS,
  SENTRY_DSN,
  SENTRY_ENVIRONMENT,
  TRACES_SAMPLE_RATE,
  scrubSensitiveData,
} from "@/lib/sentry/sentry-shared";

const isProduction = process.env.NODE_ENV === "production";

Sentry.init({
  dsn: SENTRY_DSN,
  environment: SENTRY_ENVIRONMENT,

  // With no DSN the SDK no-ops anyway; being explicit makes a missing env var
  // obvious rather than mysterious.
  enabled: Boolean(SENTRY_DSN),

  integrations: [
    Sentry.replayIntegration({
      // Recordings are for diagnosing, not for reading user data back.
      maskAllText: true,
      blockAllMedia: true,
    }),
    // Turns fetch/XHR calls, clicks and route changes into breadcrumbs, so an
    // event shows the steps that led up to it rather than just the throw site.
    Sentry.breadcrumbsIntegration({
      console: true,
      dom: true,
      fetch: true,
      history: true,
      xhr: true,
    }),
  ],

  tracesSampleRate: TRACES_SAMPLE_RATE,
  enableLogs: true,

  // Session replays are expensive; sample a slice of ordinary sessions but
  // always keep the one where an error actually happened.
  replaysSessionSampleRate: isProduction ? 0.05 : 0,
  replaysOnErrorSampleRate: 1.0,

  // Off: we attach the fields we actually need (user id/email via
  // setSentryUser, endpoint/status via ApiError) instead of shipping
  // everything Sentry can scrape.
  sendDefaultPii: false,

  ignoreErrors: IGNORE_ERRORS,
  denyUrls: DENY_URLS,

  beforeSend(event) {
    scrubSensitiveData(event);

    event.tags = {
      ...event.tags,
      runtime: "browser",
    };

    // Where it happened, in terms a human can act on.
    if (typeof window !== "undefined") {
      event.extra = {
        ...event.extra,
        url: window.location.href,
        pathname: window.location.pathname,
        search: window.location.search,
        referrer: document.referrer || undefined,
        viewport: `${window.innerWidth}x${window.innerHeight}`,
      };
    }

    return event;
  },
});

// Unhandled promise rejections (a fire-and-forget API call whose promise nobody
// caught) never reach a React error boundary. Without this they only show up as
// a dev-overlay warning and never reach Sentry.
if (typeof window !== "undefined") {
  window.addEventListener("unhandledrejection", (event) => {
    Sentry.captureException(event.reason, {
      tags: { type: "unhandled_rejection", runtime: "browser" },
      extra: { pathname: window.location.pathname },
    });
  });
}

export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;

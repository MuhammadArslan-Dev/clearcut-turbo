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
  SENTRY_ENABLED,
  SENTRY_ENVIRONMENT,
  TRACES_SAMPLE_RATE,
  redactSearch,
  redactUrl,
  scrubSensitiveData,
  tagPage,
} from "@/lib/sentry/sentry-shared";
import { whenIdleAfterLoad } from "@/lib/sentry/when-idle";
import { applyLegacyPolyfills } from "@/lib/legacy-polyfills";

// `.at()` for old phones' browsers, before anything else runs (CC-112).
applyLegacyPolyfills();

const isProduction = process.env.NODE_ENV === "production";

Sentry.init({
  dsn: SENTRY_DSN,
  environment: SENTRY_ENVIRONMENT,

  // With no DSN the SDK no-ops anyway; being explicit makes a missing env var
  // obvious rather than mysterious.
  enabled: SENTRY_ENABLED,

  // Session Replay is added later, once the page is idle — see the end of
  // this file (Phase 17).
  integrations: [
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
    tagPage(event);

    event.tags = {
      ...event.tags,
      runtime: "browser",
    };

    // Where it happened, in terms a human can act on.
    if (typeof window !== "undefined") {
      event.extra = {
        ...event.extra,
        // Redacted: the login handoff puts `?token=<sanctum token>` in the URL.
        url: redactUrl(window.location.href),
        pathname: window.location.pathname,
        search: redactSearch(window.location.search),
        referrer: redactUrl(document.referrer) || undefined,
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

// Session Replay (~40 KB gzip) is not part of the first page load (Phase 17):
// its own chunk is fetched once the page has loaded and the browser is idle,
// then added to the running client. Errors and page-speed data don't need it.
// Trade-off: an error in the first ~1-3 s of a visit has no replay attached.
if (SENTRY_DSN) {
  whenIdleAfterLoad(() => {
    void import("@/lib/sentry/sentry-replay")
      .then(({ createReplayIntegration }) => Sentry.addIntegration(createReplayIntegration()))
      .catch(() => {
        // A failed chunk load (offline, deploy in between) only costs the replay.
      });
  });
}

export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;

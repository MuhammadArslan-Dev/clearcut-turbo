import * as Sentry from "@sentry/nextjs";

// Inert by design: see instrumentation.ts for why an empty DSN is safe.
Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  tracesSampleRate: 1,
});

export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;

import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.SENTRY_DSN,

  tracesSampleRate: 1.0,
  environment: process.env.NODE_ENV,

  integrations: [Sentry.httpIntegration()],

  beforeSend(event) {
    // ✅ Remove sensitive data
    if (event.request?.headers?.authorization) {
      delete event.request.headers.authorization;
    }

    // ✅ Add global tags
    event.tags = {
      ...event.tags,
      module: "nextjs-server",
      env: process.env.NODE_ENV,
    };

    return event;
  },

  ignoreErrors: [
    "ResizeObserver loop limit exceeded",
    "Network Error",
    "Failed to fetch",
    "Load failed",
    "fetch failed",
  ],
});
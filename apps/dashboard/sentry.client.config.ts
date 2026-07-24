import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,

  tracesSampleRate: 1.0,
  debug: true,

  ignoreErrors: [
    "ResizeObserver loop limit exceeded",
    "Network Error",
    "Failed to fetch",
    "Load failed",
    "Redirecting due to expired session",
  ],

  beforeSend(event) {
    // ✅ Add global tags
    event.tags = {
      ...event.tags,
      module: "frontend",
      env: process.env.NODE_ENV,
    };

    // ✅ Add route + URL
    if (typeof window !== "undefined") {
      event.extra = {
        ...event.extra,
        url: window.location.href,
        pathname: window.location.pathname,
      };
    }

    return event;
  },
});
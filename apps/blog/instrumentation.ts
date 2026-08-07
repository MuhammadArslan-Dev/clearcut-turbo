import * as Sentry from "@sentry/nextjs";

// Inert by design: NEXT_PUBLIC_SENTRY_DSN is empty until a real DSN is
// added to .env (see .env.example). Sentry.init() with no dsn safely
// no-ops — nothing is captured or sent anywhere until then.
export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    Sentry.init({
      dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
      tracesSampleRate: 1,
    });
  }

  if (process.env.NEXT_RUNTIME === "edge") {
    Sentry.init({
      dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
      tracesSampleRate: 1,
    });
  }
}

export const onRequestError = Sentry.captureRequestError;

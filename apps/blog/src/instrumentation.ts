import * as Sentry from "@sentry/nextjs";
import { scrubSensitiveData, scrubSpan, scrubTransaction } from "@clearcut/error-reporting/redact";
import { PUBLIC_SENTRY_DSN, PUBLIC_SENTRY_SERVER_ENABLED } from "@clearcut/error-reporting/public-project";

// Server/edge Sentry for the public blog — inert until NEXT_PUBLIC_SENTRY_DSN
// (or SENTRY_DSN) is set. Must live in src/ (not the project root): with
// `src/app`, Next only looks for instrumentation.ts next to the app dir.
const DSN = process.env.SENTRY_DSN || PUBLIC_SENTRY_DSN;

export async function register() {
  // Production builds only (clearcutoff-public project).
  if (!DSN || !PUBLIC_SENTRY_SERVER_ENABLED) return;
  if (process.env.NEXT_RUNTIME !== "nodejs" && process.env.NEXT_RUNTIME !== "edge") return;

  Sentry.init({
    dsn: DSN,
    environment: process.env.NEXT_PUBLIC_SENTRY_ENVIRONMENT ?? process.env.NODE_ENV,
    sendDefaultPii: false,
    tracesSampleRate: Number(process.env.NEXT_PUBLIC_SENTRY_TRACES_SAMPLE_RATE ?? 0.1),
    // CC-143: transactions/spans carry the request URL and its query string.
    beforeSendTransaction: scrubTransaction,
    beforeSendSpan: scrubSpan,
    beforeSend(event) {
      scrubSensitiveData(event);
      event.tags = { ...event.tags, runtime: `nextjs-${process.env.NEXT_RUNTIME}`, app: "blog" };
      return event;
    },
  });
}

// Reports server-render / route-handler errors with the request path & route.
export const onRequestError = Sentry.captureRequestError;

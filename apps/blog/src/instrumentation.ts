import * as Sentry from "@sentry/nextjs";
import { scrubSensitiveData } from "@clearcut/error-reporting/redact";

// Server/edge Sentry for the public blog — inert until NEXT_PUBLIC_SENTRY_DSN
// (or SENTRY_DSN) is set. Must live in src/ (not the project root): with
// `src/app`, Next only looks for instrumentation.ts next to the app dir.
const DSN = process.env.NEXT_PUBLIC_SENTRY_DSN ?? process.env.SENTRY_DSN;

export async function register() {
  if (!DSN) return;
  if (process.env.NEXT_RUNTIME !== "nodejs" && process.env.NEXT_RUNTIME !== "edge") return;

  Sentry.init({
    dsn: DSN,
    environment: process.env.NEXT_PUBLIC_SENTRY_ENVIRONMENT ?? process.env.NODE_ENV,
    sendDefaultPii: false,
    tracesSampleRate: Number(process.env.NEXT_PUBLIC_SENTRY_TRACES_SAMPLE_RATE ?? 0.1),
    beforeSend(event) {
      scrubSensitiveData(event);
      event.tags = { ...event.tags, runtime: `nextjs-${process.env.NEXT_RUNTIME}`, app: "blog" };
      return event;
    },
  });
}

// Reports server-render / route-handler errors with the request path & route.
export const onRequestError = Sentry.captureRequestError;

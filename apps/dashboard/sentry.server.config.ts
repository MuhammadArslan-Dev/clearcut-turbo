// Node-runtime Sentry initialization — Server Components, route handlers under
// src/app/api/*, and server-side rendering. Loaded by src/instrumentation.ts.

import * as Sentry from "@sentry/nextjs";
import {
  IGNORE_ERRORS,
  SENTRY_DSN,
  SENTRY_ENABLED,
  SENTRY_ENVIRONMENT,
  TRACES_SAMPLE_RATE,
  scrubSensitiveData,
  scrubSpan,
  scrubTransaction,
  tagPage,
} from "@/lib/sentry/sentry-shared";

Sentry.init({
  // Reads NEXT_PUBLIC_SENTRY_DSN first, then SENTRY_DSN — both runtimes report
  // into the same project. This used to read only SENTRY_DSN, which was never
  // set anywhere, so every server-side error went unreported.
  dsn: SENTRY_DSN,
  environment: SENTRY_ENVIRONMENT,
  enabled: SENTRY_ENABLED,

  tracesSampleRate: TRACES_SAMPLE_RATE,
  enableLogs: true,

  integrations: [Sentry.httpIntegration()],

  // The server sees raw auth headers and request bodies; keep them out.
  sendDefaultPii: false,

  ignoreErrors: IGNORE_ERRORS,

  // CC-143: transactions/spans carry the landing URL (`?token=` handoff).
  beforeSendTransaction: scrubTransaction,
  beforeSendSpan: scrubSpan,

  beforeSend(event) {
    scrubSensitiveData(event);
    tagPage(event);

    event.tags = {
      ...event.tags,
      runtime: "nextjs-server",
    };

    return event;
  },
});

// Node-runtime Sentry initialization — Server Components, route handlers under
// src/app/api/*, and server-side rendering. Loaded by src/instrumentation.ts.

import * as Sentry from "@sentry/nextjs";
import {
  IGNORE_ERRORS,
  SENTRY_DSN,
  SENTRY_ENVIRONMENT,
  TRACES_SAMPLE_RATE,
  scrubSensitiveData,
} from "@/lib/sentry/sentry-shared";

Sentry.init({
  // Reads NEXT_PUBLIC_SENTRY_DSN first, then SENTRY_DSN — both runtimes report
  // into the same project. This used to read only SENTRY_DSN, which was never
  // set anywhere, so every server-side error went unreported.
  dsn: SENTRY_DSN,
  environment: SENTRY_ENVIRONMENT,
  enabled: Boolean(SENTRY_DSN),

  tracesSampleRate: TRACES_SAMPLE_RATE,
  enableLogs: true,

  integrations: [Sentry.httpIntegration()],

  // The server sees raw auth headers and request bodies; keep them out.
  sendDefaultPii: false,

  ignoreErrors: IGNORE_ERRORS,

  beforeSend(event) {
    scrubSensitiveData(event);

    event.tags = {
      ...event.tags,
      runtime: "nextjs-server",
    };

    return event;
  },
});

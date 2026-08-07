// Edge-runtime Sentry initialization — proxy.ts (Next 16's middleware) and any
// edge route handlers. Loaded by src/instrumentation.ts.
// https://docs.sentry.io/platforms/javascript/guides/nextjs/

import * as Sentry from "@sentry/nextjs";
import {
  IGNORE_ERRORS,
  SENTRY_DSN,
  SENTRY_ENVIRONMENT,
  TRACES_SAMPLE_RATE,
  scrubSensitiveData,
} from "@/lib/sentry/sentry-shared";

Sentry.init({
  dsn: SENTRY_DSN,
  environment: SENTRY_ENVIRONMENT,
  enabled: Boolean(SENTRY_DSN),

  tracesSampleRate: TRACES_SAMPLE_RATE,
  enableLogs: true,

  // Edge requests carry the auth cookie; keep it out of events.
  sendDefaultPii: false,

  ignoreErrors: IGNORE_ERRORS,

  beforeSend(event) {
    scrubSensitiveData(event);

    event.tags = {
      ...event.tags,
      runtime: "nextjs-edge",
    };

    return event;
  },
});

// Session Replay, kept out of the first page load (Phase 17).
//
// instrumentation-client.ts imports this module with a dynamic import() once
// the page has loaded and the browser is idle, then adds the integration to
// the already-running client. Replay is ~40 KB gzip of the dashboard's ~91 KB
// Sentry; nothing else needs it up front. The session (5%) and on-error
// (100%) sample rates stay in Sentry.init's options.
import { replayIntegration } from "@sentry/nextjs";

export function createReplayIntegration() {
  return replayIntegration({
    // Recordings are for diagnosing, not for reading user data back.
    maskAllText: true,
    blockAllMedia: true,
  });
}

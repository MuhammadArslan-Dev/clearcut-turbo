// Session Replay, kept out of the first page load (Phase 17).
//
// instrumentation-client.ts imports this module with a dynamic import() once
// the page has loaded and the browser is idle, then adds the integration to
// the already-running client - and only for sessions that replay-sampling.ts
// sampled (5%), so most visitors never download it. Replay is ~40 KB gzip of
// the dashboard's ~91 KB Sentry; nothing else needs it up front.
import { replayIntegration } from "@sentry/nextjs";

export function createReplayIntegration() {
  return replayIntegration({
    // Recordings are for diagnosing, not for reading user data back.
    maskAllText: true,
    blockAllMedia: true,
  });
}

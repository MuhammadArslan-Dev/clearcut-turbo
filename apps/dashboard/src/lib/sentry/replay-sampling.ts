// Which sessions record a Session Replay (CC-150 D2).
//
// Replay used to buffer EVERY session (replaysOnErrorSampleRate: 1.0) so an
// error could ship the seconds before it. That buffering is the expensive part:
// measured on /test-series at 4x CPU, merely loading Replay turned the worst
// long task from 1.2 s into 3.0 s, on top of its ~37 KB gzip download.
//
// Now only a sampled slice of sessions record at all, and every other session
// never even downloads the Replay chunk (instrumentation-client.ts checks this
// before importing it). Errors outside the sampled slice therefore have no
// replay attached; their stack trace, breadcrumbs and tags are unaffected.
//
// The roll is made ONCE per browser session and kept in sessionStorage. Rolling
// per page load would re-roll on every full reload and push the real rate well
// above the number below.
//
// Dependency-free on purpose: instrumentation-client.ts imports it statically,
// so it must not pull the Replay code into the first load.

export const REPLAY_SESSION_SAMPLE_RATE = process.env.NODE_ENV === "production" ? 0.05 : 0;

const STORAGE_KEY = "cc_replay_sampled";

export function isReplaySampledThisSession(): boolean {
  if (REPLAY_SESSION_SAMPLE_RATE <= 0) return false;
  try {
    const stored = window.sessionStorage.getItem(STORAGE_KEY);
    if (stored === "1" || stored === "0") return stored === "1";
    const sampled = Math.random() < REPLAY_SESSION_SAMPLE_RATE;
    window.sessionStorage.setItem(STORAGE_KEY, sampled ? "1" : "0");
    return sampled;
  } catch {
    // Storage blocked (private mode, in-app browsers): do not record rather
    // than roll on every load.
    return false;
  }
}

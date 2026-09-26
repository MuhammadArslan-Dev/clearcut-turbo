// Tools-side view of the shared login session. The session token is the same
// `CSRF_TOKEN` localStorage key every other app uses (@clearcut/auth/token —
// this import is the tiny token module only, not the login UI, which stays
// lazy: see toolsAuthFeature.ts). Nothing here redirects anywhere; a Tools
// page that logs in stays exactly where it was.
import { useSyncExternalStore } from "react";
import { clearToken, getToken } from "@clearcut/auth/token";

const SESSION_EVENT = "cc-tools-session-change";

/** Tell every subscriber (this tab) the token was set/cleared. Other tabs get
 * the native `storage` event instead. */
export function notifySessionChange() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event(SESSION_EVENT));
}

function hasSession(): boolean {
  return Boolean(getToken());
}

/** Drops the local token (does NOT call the backend — see logout() in
 * api/syllabusTrackerApi.ts for that). Local tracker data is untouched. */
export function endSession() {
  clearToken();
  notifySessionChange();
}

function subscribe(onChange: () => void) {
  window.addEventListener(SESSION_EVENT, onChange);
  window.addEventListener("storage", onChange);
  return () => {
    window.removeEventListener(SESSION_EVENT, onChange);
    window.removeEventListener("storage", onChange);
  };
}

/** False on the server and on the first client render (matches the static
 * export's HTML — no hydration mismatch), then reflects the real token. */
export function useHasSession(): boolean {
  return useSyncExternalStore(subscribe, hasSession, () => false);
}

// Client-side calls to clearcutoff-main-backend's per-user Syllabus Tracker
// endpoints (routes/Apis/Tools/syllabus-tracker.php there, auth:sanctum).
// Only ever called from an explicit "Save for Future" click or right after a
// login/page load to list what's already saved — never on chapter toggles.
// Plain fetch (like syllabusApi.ts) rather than axios, so the anonymous
// tracker doesn't pull in the auth bundle just to be able to call these.
import { getToken } from "@clearcut/auth/token";
import type { TrackedExamEntry } from "../syllabusTracker";
import { endSession } from "../toolsSession";
import { authedRequest, SessionExpiredError } from "./authedRequest";
import { MAIN_BACKEND_URL } from "./mainBackend";

// Re-exported: the tracker UI tells "session ended" apart from other failures.
export { SessionExpiredError };

// `locale` (en | hi | mr) makes the backend return names in the page's language:
// the account copy stores only ids + progress and derives every display name
// from the current syllabus.
export function fetchSavedTrackers(locale: string = "en"): Promise<TrackedExamEntry[]> {
  return authedRequest<TrackedExamEntry[]>(`/tools/syllabus-tracker?locale=${locale}`);
}

/** Create-or-update this entry on the account (identity: exam + paper). */
export function saveTracker(entry: TrackedExamEntry, locale: string = "en"): Promise<TrackedExamEntry> {
  // Explicit field list rather than sending the entry as-is: the server
  // validates a fixed shape, and `updatedAt` (server-only) must not go back.
  const payload = {
    exam: entry.exam,
    paper: entry.paper,
    level: entry.level,
    subjects: entry.subjects,
    crossCompletions: entry.crossCompletions,
    trackedAt: entry.trackedAt,
  };
  return authedRequest<TrackedExamEntry>(`/tools/syllabus-tracker?locale=${locale}`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

/** Revokes the session token on the server (best effort — the local token is
 * dropped either way, which is what actually logs this browser out). Local
 * tracker data is left untouched. */
export async function logout(): Promise<void> {
  const token = getToken();
  if (token) {
    try {
      await fetch(`${MAIN_BACKEND_URL}/v1/logout`, {
        method: "POST",
        headers: { Accept: "application/json", Authorization: `Bearer ${token}` },
      });
    } catch {
      // Offline / server down — still log out locally below.
    }
  }
  endSession();
}

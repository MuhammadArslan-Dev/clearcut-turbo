// Local-only persistence for an in-progress Daily Test attempt.
//
// Daily Test has no "Resume Test" feature backed by the server beyond the
// backend already returning the SAME attempt_id/questions for an
// `in_progress` attempt (see startDailyTest's `status: "in_progress"`) — it
// never persists per-answer progress, only the final submit. This module
// fills that gap entirely client-side: every answer/nav change is mirrored
// to localStorage so a refresh (or an accidental tab close) restores the
// exact question/answers/flags instead of losing them, without adding any
// new backend traffic per keystroke. Scoped to Daily Test only — Full-Length/
// Sectional/Chapter tests are untouched and don't import this.
//
// Keyed by attempt_id (stable across refreshes for the same in-progress
// attempt, per the backend contract above), so a genuinely different
// attempt — a "Start Again" retake, or a different day's test — never reads
// another attempt's saved answers.

const PREFIX = "dailyTestAttempt";
// Generous but bounded: an attempt abandoned for longer than this (e.g. the
// user started yesterday's test, never finished, and is now well into a new
// day) is stale rather than resumable, and is swept on the next load instead
// of accumulating in storage forever.
const MAX_AGE_MS = 24 * 60 * 60 * 1000;

export type StoredDailyTestState = {
  attemptId: string;
  answers: Record<number, number>;
  visited: number[];
  markedForReview: number[];
  currentIndex: number;
  savedAt: number;
};

const keyFor = (courseId: string, testId: string, attemptId: string) =>
  `${PREFIX}:${courseId}:${testId}:${attemptId}`;

const keyPrefixFor = (courseId: string, testId: string) => `${PREFIX}:${courseId}:${testId}:`;

export function saveDailyTestState(
  courseId: string,
  testId: string,
  attemptId: string,
  state: Omit<StoredDailyTestState, "attemptId" | "savedAt">,
): void {
  if (typeof window === "undefined") return;
  try {
    const entry: StoredDailyTestState = { ...state, attemptId, savedAt: Date.now() };
    localStorage.setItem(keyFor(courseId, testId, attemptId), JSON.stringify(entry));
  } catch {
    // Storage full/blocked (private mode, quota) — local resume is a nice-to-
    // have, never worth surfacing an error over.
  }
}

/** Returns the saved state only if it matches this exact attempt and isn't stale. */
export function loadDailyTestState(
  courseId: string,
  testId: string,
  attemptId: string,
): StoredDailyTestState | null {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem(keyFor(courseId, testId, attemptId));
  if (!raw) return null;
  try {
    const entry = JSON.parse(raw) as StoredDailyTestState;
    if (entry.attemptId !== attemptId || Date.now() - entry.savedAt > MAX_AGE_MS) {
      localStorage.removeItem(keyFor(courseId, testId, attemptId));
      return null;
    }
    return entry;
  } catch {
    localStorage.removeItem(keyFor(courseId, testId, attemptId));
    return null;
  }
}

/** Called right after a successful submit — the backend is now the source of truth. */
export function clearDailyTestState(courseId: string, testId: string, attemptId: string): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(keyFor(courseId, testId, attemptId));
  } catch {
    // Ignore — nothing meaningful to recover from here either.
  }
}

/**
 * Sweeps every OTHER saved attempt of this same test (a previous attempt_id
 * that was abandoned mid-way, then superseded by a retake or a fresh day's
 * attempt) plus anything past `MAX_AGE_MS`, so incomplete/stale entries don't
 * quietly accumulate. Called once the current attempt_id is known, right
 * before restoring/persisting it.
 */
export function clearStaleDailyTestState(
  courseId: string,
  testId: string,
  currentAttemptId: string,
): void {
  if (typeof window === "undefined") return;
  try {
    const prefix = keyPrefixFor(courseId, testId);
    const staleKeys: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (!key || !key.startsWith(prefix)) continue;
      if (key === keyFor(courseId, testId, currentAttemptId)) continue;
      staleKeys.push(key);
    }
    staleKeys.forEach((key) => localStorage.removeItem(key));
  } catch {
    // Best-effort cleanup only.
  }
}

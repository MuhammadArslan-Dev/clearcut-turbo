import { apiFetch } from "./client";
import { token as tokenApi } from "../auth-token-client";

// Generic per-user (and per-course) state kept on the backend (`user_states`):
// onboarding progress, the first-enrolment practice test, the Preparation guide,
// the topic tour, and whatever comes next. The backend is the single source of
// truth and validates every key, status and transition (UserStateRegistry), so
// a claim can be won by exactly one session, the first final answer wins, and
// nothing is ever decided from browser storage.
//
// Exam-scoped keys take `course` = the enrolment's group_code (the id the
// /preparation URL uses); the backend answers 404 for a course that is not the
// caller's own. Add a new feature's state on the backend registry first, then a
// typed helper here.

export type UserStateKey = "onboarding" | "practice_test" | "prep_guide" | "topic_tour";

export interface UserState<D = Record<string, number> | null> {
  key: UserStateKey;
  scope: "user" | "exam";
  status: string;
  data: D;
  acted_at: string | null;
}

const BASE = "/v2/user-state";
const authHeaders = () => ({ Authorization: `Bearer ${tokenApi()}` });
const json = () => ({ "Content-Type": "application/json", ...authHeaders() });

export async function getUserStates(keys: UserStateKey[], course?: string): Promise<Partial<Record<UserStateKey, UserState>>> {
  const qs = new URLSearchParams();
  keys.forEach((k) => qs.append("keys[]", k));
  if (course) qs.set("course", course);
  const res = await apiFetch<{ data: { states: Partial<Record<UserStateKey, UserState>> } }>(`${BASE}?${qs.toString()}`, {
    method: "GET",
    headers: authHeaders(),
  });
  return res.data.states;
}

/** `claimed` is true for exactly one caller, once, per (user, scope, key). */
export async function claimUserState(key: UserStateKey, course?: string): Promise<{ claimed: boolean; state: UserState }> {
  const res = await apiFetch<{ data: { claimed: boolean; state: UserState } }>(`${BASE}/${key}/claim`, {
    method: "POST",
    headers: json(),
    body: JSON.stringify(course ? { course } : {}),
  });
  return res.data;
}

/** `changed` is false when the transition was not allowed (already final, lost race): harmless to retry. */
export async function transitionUserState(
  key: UserStateKey,
  status: string,
  course?: string,
  data?: Record<string, number>,
): Promise<{ changed: boolean; state: UserState }> {
  const res = await apiFetch<{ data: { changed: boolean; state: UserState } }>(`${BASE}/${key}/transition`, {
    method: "POST",
    headers: json(),
    body: JSON.stringify({ status, ...(course ? { course } : {}), ...(data ? { data } : {}) }),
  });
  return res.data;
}

// ---- typed helpers for the course features ---------------------------------

export type GuideStatus = "not_shown" | "shown" | "completed" | "skipped";
// "offered" = the prompt was shown and not answered yet (so it may be shown again).
export type PracticeTestStatus = "not_taken" | "offered" | "completed" | "skipped";

export interface CourseState {
  guide_status: GuideStatus;
  topic_tour_shown: boolean;
  practice_test_status: PracticeTestStatus;
  practice_test_score: number | null;
  practice_test_total: number | null;
}

export async function getCourseState(course: string): Promise<CourseState> {
  const s = await getUserStates(["prep_guide", "topic_tour", "practice_test"], course);
  return {
    guide_status: (s.prep_guide?.status ?? "not_shown") as GuideStatus,
    topic_tour_shown: (s.topic_tour?.status ?? "not_shown") === "shown",
    practice_test_status: (s.practice_test?.status ?? "not_taken") as PracticeTestStatus,
    practice_test_score: s.practice_test?.data?.score ?? null,
    practice_test_total: s.practice_test?.data?.total ?? null,
  };
}

/** `claimed` is true for exactly one caller, once, per course: only that session may auto-open the Preparation guide. */
export const claimGuide = (course: string) => claimUserState("prep_guide", course);

/** How the guide ended. The first final answer wins on the server. */
export const finishGuide = (course: string, status: "completed" | "skipped") => transitionUserState("prep_guide", status, course);

export const claimTopicTour = (course: string) => claimUserState("topic_tour", course);

/** The first-enrolment prompt was shown: remember it so it can be resumed after a refresh or re-entry. */
export const offerPracticeTest = (course: string) => transitionUserState("practice_test", "offered", course);

/** The learner chose to go straight to Preparation (the backend never overwrites a completed test). */
export const skipPracticeTest = (course: string) => transitionUserState("practice_test", "skipped", course);

/** One retry for a write that matters but may hit a dropped mobile connection. */
export async function withRetry<T>(fn: () => Promise<T>, retries = 1): Promise<T> {
  try {
    return await fn();
  } catch (err) {
    if (retries <= 0) throw err;
    await new Promise((resolve) => setTimeout(resolve, 600));
    return withRetry(fn, retries - 1);
  }
}

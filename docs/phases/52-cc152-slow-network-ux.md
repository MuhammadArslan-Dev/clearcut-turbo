# Phase 52 — Slow-network UX on browse screens

**Tickets:** CC-152 (Medium)
**Repos:** CM dashboard
**Status:** Built on 4 screens; retry bug found, fixed and **re-verified** on the Learn screen (not committed)

## Playwright run 1 (2026-10-27) — found a real bug, now fixed

Mobile 390x844, hi locale, all four screens, with the API request artificially delayed.

| Check | Result |
|---|---|
| (a) notice appears ~10 s into the wait, disappears when content arrives | **PASS** on all 4 (9.0–10.3 s after the request) |
| (b) "Try again" sends a new request | **FAIL** on all 4 — zero new requests |
| (c) normal speed: no notice within 20 s | **PASS** on all 4 |
| Layout at 390: no h-scroll, 44 px button, notice not covered, fully in viewport | **PASS** on all 4 |
| Analytics: "Slow Load Shown" (`seconds_waited` 10) / "Slow Load Retried" (12), nothing on the fast path | **PASS** (Learn payloads inspected in full) |

**The (b) bug.** `refetch()` / `refetchQueries()` does **not** re-request while a query is
still fetching with `data === undefined` — which is precisely the state this notice is shown
in. react-query's `Query.fetch()` only cancels-and-refetches when `data !== undefined`;
otherwise it hands back the in-flight promise, so `cancelRefetch` (true by default) never
applies on a first load. The notice hid and "Slow Load Retried" fired, but nothing was
re-requested; content only appeared when the *original* delayed response landed.

**Fix.** `useSlowLoad` now takes query KEYS instead of the caller's `refetch`, and awaits
`queryClient.cancelQueries` before `refetchQueries` — cancelling reverts the query to idle so
the refetch opens a genuinely new request. Owning it in the hook means no call site can get it
wrong. Call sites now pass: Learn `[MY_COURSES_KEY]`, Preparation `[["preparation"],["chapter"]]`,
Test series `[chapterTestQueryOptions(courseId, explicitPaperId).queryKey]`, Content
`[P_QUERY_KEY(courseId)]`. `refetch`/`queryClient` locals that this freed up were removed.

Not covered by run 1: the request-fails-then-retry path, and a Learn user with zero courses
(no such account available; code review only — the gate is `!data`, not `!exam`).

Screenshots: `…/scratchpad/cc152/rollout/<screen>-<mode>-<width>.png`.

## Re-test of the retry fix (2026-10-27, run directly, not by an agent)

Learn screen, with the `/v2/get-my-active-courses` request artificially hung (40 s):

| Check | Result |
|---|---|
| Notice appears after the threshold | **PASS** — exactly 10 s |
| "Try again" sends a **new** request | **PASS** — 1 → **2** (was stuck at 1 before the fix) |
| The retry goes through while request #1 is still hung | **PASS** — notice hides, real content renders |
| Network stays slow (every request hangs): one click = one request | **PASS** — 1 → 2 → 3, nothing sent while waiting |
| Notice reappears only after another full threshold | **PASS** — 10,022 ms after the click |

The other three screens share the same hook, and the keys they pass were checked against the real
query keys in the code (`["preparation", id]` and `["chapter", id]` by prefix; the test-series and
content keys are the very factories their `useQuery` calls use), so a wrong key cannot silently
refetch nothing. They were not re-driven in the browser individually.

The two console errors seen were the known `500` from `/v2/daily-tests/<id>/history`, a backend
issue unrelated to this change.

## Rollout (2026-10-27)
- `SlowLoadNotice` button is `size="lg"` (44 px tap target).
- New hook `src/hooks/useSlowLoad.ts`. `SLOW_LOAD_MS = 10_000`. It sends "Slow Load Shown" once per wait; `retry()` sends "Slow Load Retried", restarts the clock and runs ONE refetch (no auto retry).
- New events in `lib/analytics/events/system.ts`: `page_context`, `seconds_waited`.
- Screens:
  - Learn (`MyCoursesWrapTwo`): while `!data`, not `!exam`, so a student with zero courses never sees it. One notice under the card area; retry refetches `["my-courses"]`.
  - Preparation (`layout/preparation/Sidebar`): while `!chapters`, above `TopicListSkeleton`. Retry refetches the active `["preparation"]` + `["chapter"]` queries (the chained gates).
  - Test series (`ChapterTest`): while `isLoading`, above `ChapterTestSkeleton`; retry = `refetch`.
  - Content (`ContentShell`): under `MainLoader` while the syllabus loads (the wrapper becomes `flex-col`); retry = `refetch`.
- Temporary preview route deleted.
- Checks: tsc 95 = baseline, check:colors OK. ESLint shows only pre-existing errors on untouched lines of those files.
- Not covered (from the mapping): Sectional/Full test tabs, the notes/PYQ inner skeletons, and the Learn widgets — lower traffic; same hook can be added later.
**Created:** 2026-10-27 (wave 2, Arslan's list)

## Mock (2026-10-27)
- `src/components/ui/SlowLoadNotice.tsx`: `Card` (white, gray-200 border, 12 px radius) + `SandTimerIcon` (brand) + `Text` title/body + outlined primary `Button` "Try again". `role=status`. Presentational: the caller passes `onRetry` (refetch, no auto retry).
- Copy (`slowLoad` namespace, messages/en|hi|mr.json):
  - en: "Taking longer than usual" / "Your internet seems slow. Wait a little more, or try again." / "Try again"
  - hi and mr: same meaning.
- TEMPORARY preview route `src/app/[locale]/slow-load-preview/page.tsx` — **delete before commit**.

## Goal
No blank screen > 1s on dashboard, preparation, test-series and content lists; a slow request shows a message + Retry within 10s.

## Already in place (do not redo)
- Skeletons exist in places (`@/components/ui/skeleton`); phase 19 fixed CLS on Learn; CC-104/CC-63 own their buttons (do not redo).

## Steps
1. [ ] Map each screen's loading state today (Slow 4G recordings).
2. [ ] Skeletons where missing (reuse Skeleton, match final layout).
3. [ ] Generic slow-request message + Retry (no auto-retry storm).
4. [ ] Slow-path event — reuse an existing event if one fits.
5. [ ] Test matrix recordings.

## Decisions needed (🛑 stop here until the user answers)
- **D1 design:** the slow-request message (look, place, copy en/hi/mr) is new UI — approve the mock first.
- **D2:** threshold (8s or 10s) and event name (reuse rule).

## Decision log
| Date | Decision | By |
|---|---|---|
| 2026-10-27 | Build a screenshot mock first (existing components, en/hi, 390 px), approve, then roll out | User |
| 2026-10-27 | Mock approved with a 44 px button; threshold 10 s; new event "Slow Load Shown" (no existing event covers it) | User |

## Verification
Recordings at Slow 4G + 4x CPU; screenshots en + hi, mobile + desktop.

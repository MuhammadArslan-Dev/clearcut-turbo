# Phase 58 — Generic `user_states` (onboarding, practice test, Preparation guide, topic tour)

**Repos:** CM dashboard + backend (`clearcutoff-main-backend`) · **Branch:** `feature/first-enrollment-practice-test` (both) — not committed, not pushed
**Status:** Built and verified 2026-10-28 (English only; desktop 1440 + mobile 390). Supersedes the short-lived `user_course_states` table in phase 57 (never released).

## Why
The guide was remembered on `u_exam_enrollments.study_guide_seen` (enrolment rows are deleted and recreated on paper edits) and in localStorage (per device). Neither holds across devices or concurrent sessions. `users.metadata` is a read-modify-write JSON blob (lost updates), `u_preferences` has no unique key or course scope. A new generic table is justified.

## Schema (`2026_10_28_110000_create_user_states_table`)
`user_states(id, user_id FK cascade, scope_type 'user'|'exam', scope_id default 0, key, status, data json null, acted_at, timestamps)` · UNIQUE `(user_id, scope_type, scope_id, key)` · INDEX `(key, status)`.
No row = default state. `scope_id` is NOT NULL (0 = user-wide) so the unique key works. Migration also `dropIfExists('user_course_states')` (a no-op wherever it was never created).

## Registry (`App\Support\UserStates\UserStateRegistry`)
| key | scope | statuses | client may set | claim |
|---|---|---|---|---|
| `onboarding` | user | not_started → in_progress → completed | in_progress, completed | – |
| `practice_test` | exam | not_taken → skipped → completed | skipped (completed only from the test's own `submit`, with server-computed score) | – |
| `prep_guide` | exam | not_shown → shown → completed \| skipped | completed, skipped | not_shown → shown |
| `topic_tour` | exam | not_shown → shown | – | not_shown → shown |

Each definition also carries a data whitelist (integers, ranges, client-writable or not), an optional legacy fallback and an after-transition hook.

## Concurrency
`UserStateService` is the only writer: `INSERT IGNORE` for the row, one conditional `UPDATE … WHERE status IN (allowed from)` per change (first answer wins; late/duplicate = `changed:false`, never an error), JSON merged in SQL with `JSON_MERGE_PATCH`. Verified: 15 parallel claims → exactly 1 `true`; 6 parallel completed/skipped → exactly 1 `changed`; one row.

## API (`/v2/user-state`, auth:sanctum, throttle 30/min on writes)
`GET ?course=&keys[]=` · `POST /{key}/claim {course?}` → `{claimed,state}` · `POST /{key}/transition {status,course?,data?}` → `{changed,state}`.
Exam-scoped keys take `course` = the caller's own enrolment `group_code`; resolved to the exam on the server (other user's / unknown course → 404, missing → 422, unknown key 404/422, server-only status → 403). `POST /first-practice-test/{course}/submit` records `practice_test` completed.

## Compatibility
- `users.onboarding_complete` unchanged: read while no row exists; completing `onboarding` sets it (one way, never back to false). Nothing else in the app writes it.
- `study_guide_seen = true` ⇒ `prep_guide` reads as completed (no row needed); completing/skipping the guide also sets the flag; legacy `POST /v2/action/start-course` settles the new state.
- `topic_tour` has no legacy fallback (it was only ever per device).
- Frontend: `lib/api/userState.ts` replaces `courseState.ts`. Guide auto-opens only through `claim` (fail closed on any error, incl. 429); "Start Learning" = completed, ✕/backdrop/back = skipped (no tour); the start tour runs only straight after "Start Learning" in that session; the topic tour is claimed right before it opens; "How to use this page" always reopens the tour manually.

## Verification (2026-10-28, `/en`)
Pest `UserStateTest`: 27 tests / 142 assertions (DatabaseTransactions; needs a MySQL DB — never run the unfiltered suite on the dev DB, see DEVELOPMENT_RULES §10). `tsc`, `eslint`, `check:colors`, `check:tour`, Pint clean.
Playwright (real user, desktop + mobile): guide first visit / reload / skip / complete / manual replay / start + topic tour; two tabs at once (1 winner), other browser context, logout → login; claim abort + HTTP 500 (fail closed, then shown once); course switching; practice-test prompt (modal / bottom sheet), take, pick/change/clear (no reveal, no network during the attempt), resume incl. timer, double-click Finish (1 submit), results, fixed footers, completed ⇒ redirect + no prompt, skip recorded + prompt returns, submit failure (inline error, retry), retake, Skip + Back.
Known limit: the backend's general 60 req/min limit (429) can hit the Preparation page; the guide then simply does not open on that visit.

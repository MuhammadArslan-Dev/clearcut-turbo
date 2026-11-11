# TESTING — strategy

House rules, which apply to every phase:
- Every phase file §8 runs the DEVELOPMENT_RULES §8.1 break-it pass and keeps a **"Not verified:"** list.
- **Never run backend tests against a real DB.** `RefreshDatabase` tests have wiped `clearcut` once (memory `feedback_backend_tests_wipe_db`). Use a throwaway DB, run `php artisan test --list-tests` with the filter first, and give every new test an explicit `--filter`.
- Browser tests use Playwright, delegated to a Sonnet subagent (memory `feedback_playwright_tests_sonnet`). Keep the fixture user and its token afterwards (memory `feedback_keep_playwright_session`).
- Measure a **baseline on the old code first**: request counts, query counts, latency and the current wrong numbers. "After" only means something against a "before".

## 1. Unit tests (BE, Pest/PHPUnit, no DB where possible)

| Area | Cases |
|---|---|
| Completion rule | Every combination of has_video / has_notes / has_mini_test × done flags; sub-topic rule (D4); topic with no activities |
| Monotonic merge | First-seen timestamps never move later; counters never go down; status is only recomputed, never taken from the client |
| Learning-key resolution | Identity; an approved equivalence; rejected/proposed ignored; chain refused |
| Test summary selection | first / best / latest; ties; expired attempts excluded from "submitted" |
| Shrink guard | 0 rows, more than 5% removed, more than 20% of chapters emptied → abort |
| Fingerprint | Change detected; quiet-period wait; unchanged → no dispatch |

## 2. Integration and feature tests (throwaway DB)

- **New endpoints:** happy path; ownership (another user's enrollment uuid or group_code → **404**); unauthenticated → 401; topic outside the enrolled syllabus → 422; invalid payloads; `ApiResponse` envelope shape.
- **Legacy endpoints in `dual` mode:** byte-compare responses with `legacy` mode on fixture data (`progress-summary`, `by-topic`, test lists), except for categories that were fixed on purpose.
- **Enrollment hook:** creating an enrollment queues a rollup recount. The hook throwing never breaks enrollment (same pattern as the daily-test hook).
- **`endExam`:** a failure while writing the summary never fails the submit; the submit stays idempotent.
- **Syllabus index:** a golden test against `PreparationService::getSectionChapters` for 3 exams (one with sub-topics, one with shared chapters, one with an area filter).

## 3. Regression (existing behaviour must stay the same)

| Flow | How |
|---|---|
| Preparation page: ticks, next/prev, resume | Playwright on fixture user, compare against a pre-change baseline screenshot and request log |
| Course cards (client-approved) | Pixel compare of `MyCourseCard` before/after at 390 px and 1440 px |
| Test series: start, answer, submit, report, retry | Playwright; check the same attempt count and score as the DB |
| Daily tests, practice tests, payments, onboarding, login | Smoke test suite (unchanged areas, run on every PT deploy) |
| Amplitude | Event names and properties unchanged; new properties only additive (check in the Amplitude debugger, test project) |
| RN app | One smoke pass in the WebView app (the user runs it on a device) |

## 4. Concurrency tests

| Scenario | Expected |
|---|---|
| 20 parallel `topic-activity` calls for the same user and topic, mixed activities | 1 `user_topic_progress` row, every activity recorded, correct status |
| Same `client_event_id` sent 5 times | 1 interaction row |
| Double-tap `createExam` / mini-test start / submit | 1 open attempt; 1 submit result |
| Rebuild index while a rollup recount runs | Both finish; the reconcile diff is 0 |
| Two rebuild jobs dispatched together | Only one runs (lock); the other no-ops |
| Backfill running while dual-write is live | Rows converge; parity is 0 |

Implementation: `pcntl` / parallel HTTP requests against `php artisan serve` on the throwaway DB, as in phase-64's race tests.

## 5. Migration tests (on the production-like copy)

- Each cleanup step (C1–C6): dry-run counts match the hand-written SQL; the real run gives the expected after-counts; the **restore-from-snapshot script** brings back exactly the previous values (checksum of the affected columns).
- Every migration: `up` → `down` → `up` on the copy; lock duration measured on the biggest tables (`exam_attempts`, `user_learning_progress`, `exam_attempt_questions`).
- Backfill: idempotent (run twice, identical table checksums); resumable (kill mid-run, resume, same result); total runtime recorded.
- Parity report: every difference categorised, with 0 unexplained.

## 6. Synchronization tests

- Replay sync on the copy: run each existing sync pipeline (read-only BigQuery credentials or recorded fixtures, 🛑 D9) twice. The index rebuild after each run gives the expected diff, and a second rebuild gives 0/0/0.
- **Student data untouched:** checksums of every student table before and after a sync plus rebuild are identical.
- Partial sync simulation: topics synced before chapters (`chapter_id` NULL) → the shrink guard trips and the old index is kept.
- Content move: a topic moved to another chapter → its placement updates and the user's progress follows it.
- Duplicate-PK simulation: insert a second `s_topics` row with the same code → reconcile flags it; the runbook merge re-points the student rows correctly.

## 7. Performance tests (production-sized copy)

| Query / endpoint | Target |
|---|---|
| `progress-summary` for 20 courses | 1–3 queries, p95 < 100 ms (baseline today: ~120 queries; record the time) |
| `by-topic` for an exam | 1 query, p95 < 80 ms |
| `topic-activity` write | p95 < 150 ms including the sync rollup recount |
| Full syllabus index rebuild | < 60 s; per exam < 10 s |
| Rollup recount, one user and exam | < 50 ms |
| Backfill full table | Record it; must run in chunks without holding a lock > 1 s |

`EXPLAIN ANALYZE` for every new query, saved in the phase file.

## 8. Production-safety checks (after each rollout step, PT-11)

- [ ] Sentry error rate on the touched endpoints is flat compared with the 7-day baseline.
- [ ] p95 latency within +10% of baseline.
- [ ] Queue lag under 15 minutes; no new `failed_jobs`.
- [ ] Newest `syllabus_index_builds` row succeeded; reconcile drift is 0.
- [ ] Amplitude volumes of `Topic Status Changed` and `Test Submitted` within the normal daily range.
- [ ] 5 real users: course card, sidebar and test-list numbers equal the hand-run SQL.
- [ ] Rollback flag flipped once in production on the allow-list, to confirm the switch works (planned, user-run).

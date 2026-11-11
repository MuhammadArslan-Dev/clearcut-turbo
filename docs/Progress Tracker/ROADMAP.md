# ROADMAP — phases PT-0 … PT-13

Every phase is small, can be reviewed on its own, lives on **its own branch** in the canonical repo, and has its own phase file `docs/phases/NN-progress-tracker-ptX-<slug>.md` written from `_TEMPLATE.md` **before** any code. Nothing merges to `main` without verification and the user's go-ahead, because a push to `main` deploys BE and the dashboard.

Effort figures are focused dev days for one developer, including tests and the break-it pass. They are estimates, not commitments.

Repos:
- **BE** = `clearcutoff-main-backend`
- **CM** = `clearcut-master/apps/dashboard`

## 0. Status board

| Phase | Title | Repo | Depends on | Effort | Status |
|---|---|---|---|---|---|
| PT-0 | Security fixes (separate track) | BE | — (S2 needs D10) | 2–3 d | Not Started |
| PT-1 | Production facts verification (read-only) | BE / prod (user-run) | — | 1–2 d | Not Started |
| PT-2 | Sync hardening (optional, opt-in) | BE | PT-1 | 2–3 d | Not Started — 🛑 D14 |
| PT-3 | Data hygiene and unique keys on existing tables | BE | PT-1 | 3–4 d | Not Started |
| PT-4 | Syllabus index (`exam_syllabus_topics`) | BE | PT-1 | 4–5 d | Not Started |
| PT-5 | Topic equivalence (curated) | BE | PT-4 | 3 d (+ curation time) | Not Started — 🛑 D7 |
| PT-6 | Global topic progress and history (dual-write and backfill) | BE | PT-3, PT-4 | 6–8 d | Not Started — 🛑 D1, D3, D4 |
| PT-7 | Accurate activity reporting and server-scored mini-tests | BE + CM | PT-6 | 5–6 d | Not Started — 🛑 D2, D6 |
| PT-8 | Test-series tracking | BE (+ CM types) | PT-3 | 4–5 d | Not Started — 🛑 D5 |
| PT-9 | Rollups and read switch | BE (+ CM invalidation) | PT-6, PT-8 | 5–6 d | Not Started |
| PT-10 | Staging / full rehearsal and performance validation | BE + CM | PT-3…PT-9 | 3–4 d | Not Started — 🛑 D9 |
| PT-11 | Production rollout and monitoring | user-run + BE/CM | PT-10 | 2 d active + 2–4 weeks observation | Not Started |
| PT-12 | Cross-exam UI ("completed in HTET", history) | CM | PT-11 | 3–4 d | Not Started — needs design approval |
| PT-13 | Legacy retirement | BE + CM | PT-11 plus 30 days stable | 2–3 d | Not Started — separate approval |

Execution order:
- **PT-0** runs in parallel with everything.
- **PT-1** gates the rest.
- After PT-1: **PT-3 ∥ PT-4 ∥ PT-8-schema**, then **PT-5 ∥ PT-6**, then **PT-7**, then **PT-9**, **PT-10**, **PT-11**, then **PT-12** and **PT-13**.

Total build effort is about 45–55 dev days, plus the rollout observation windows.

---

## PT-0 — Security fixes (separate track)

- **Why:** AUDIT R1–R7. These are not part of the progress feature and are shipped first, each as its own tiny branch and phase file.
- **May change (BE):**
  - `app/Http/Controllers/API/V2/Tests/MiniTestController.php` (R1: whitelist `lang` to `English|Hindi`, use a parameter binding in `orderByRaw`)
  - `routes/Apis/V2/sectional-test.php` (R3: re-enable `auth:sanctum` on generation, or `automation.key` if n8n calls it, see D10)
  - `app/Http/Controllers/API/V2/ExamController.php::heartbeat` (R4: add `where('user_id', auth()->id())`, return 404)
  - `routes/Apis/V2/practice-test.php` + `PracticeTestRepository::getResult` (R5: result by `uuid` + owner; create/update/delete restricted to admins)
  - `UserLearningInteractionController.php:341` + `V1/Analytics/AnalyticsController.php` (R6: scope to the user)
  - `routes/Apis/V1/dataapi.php:152` (R2: add `automation.key` middleware **only after D10 confirms the caller** and it has the header; escape or validate `?date=` as a strict date)
- **Must stay untouched:**
  - Response shapes.
  - Sync logic (only the route middleware changes).
  - Any other route.
- **Tests:**
  - Feature tests per fix: an attacker payload for R1, other-user token gets 404, unauthenticated gets 401.
  - Regression: an existing caller with valid credentials still works.
  - Use a throwaway DB.
- **Rollback:** revert the single commit. Every fix is independent.
- **Done when:**
  - Each exploit request fails in production.
  - Legitimate flows (mini-test, sectional generation via its caller, heartbeat, practice test) pass a smoke test.
  - Sentry shows no new 401/403 spikes from legitimate clients for 48 h.
- **R7 (secret fallbacks):** remove the fallbacks from config. Rotating the secrets is the user's decision (D15).

## PT-1 — Production facts verification (read-only)

- **Why:** Turn every **[U]/[V-local]** item into a fact before any write (AUDIT §9).
- **Changes:** none to code. The deliverable is an updated AUDIT.md (facts marked [V-prod]).
- **Steps** (SQL provided by us, run by the user on production or a fresh production dump):
  1. `SHOW CREATE TABLE` for `user_learning_progress`, `user_learning_interactions`, `exam_attempts`, `user_course_resume_states`, and the syllabus and mapping tables.
  2. Repeat every data-quality count in AUDIT §3.5 and §4, plus the business-key duplicate checks (BIGQUERY-SYNC §6.2).
  3. Confirm the scheduler and worker are running (Coolify: process list; `jobs` / `failed_jobs` age; last run of `cache:prune-expired`).
  4. Find who calls `/api/v1/bigquery/*` from proxy access logs or n8n (D10).
  5. Check V1 progress-endpoint traffic in the logs.
  6. Find which client writes mapping-id `chapter_id` (user agent of recent rows' requests if logs allow; otherwise RN app source check).
  7. Choose and prepare the rehearsal copy and a throwaway test DB (D9).
- **Done when:** AUDIT §9 is fully answered or explicitly marked "cannot verify", and D9/D10 are decided.

## PT-2 — Sync hardening (optional, separate approval 🛑 D14)

- **Why:** Prevent duplicate-PK topics (R12) and noisy events. **This touches sync code**, so it needs its own approval and a run with the content team present.
- **May change (BE):**
  - Sync jobs: `SyncTopicsChunkJob`, `SyncContentChunkJob`, `SyncTopicContentJob`, `SyncQuestionsJobNew` → dedicated `sync` queue with `retry_after` > timeout; `ShouldBeUnique` / `Cache::lock` per pipeline.
  - Set `uuid` only on create (stop rotation): `ExamRepository.php:725,757,1081,1260,…` and `SyncTopicsChunkJob.php:59`, `SyncContentChunkJob.php:51`.
  - Migrations adding UNIQUE on business keys, **only if PT-1 shows 0 duplicates in production**.
  - Optional: dispatch `RebuildSyllabusIndexJob` at the end of each pipeline.
- **Must stay untouched:**
  - Field mappings, matching keys and write semantics (still upsert-only, no deletes).
  - Endpoint URLs.
  - `FlushCacheAfterSync` (separate topic).
- **Tests:**
  - Run every sync twice against a copy with a BigQuery read-only service account (or recorded fixtures). Row counts and PKs must be identical; no new rows on the second run.
  - Concurrency: two workers on the same chunk produce no duplicates.
- **Rollback:**
  - Revert the code.
  - Unique indexes drop via `down()`.
  - Queue config is reverted by env.
- **Done when:** a full sync run in production by the content team completes with identical PK sets and zero `SyncError` rows caused by the change.

## PT-3 — Data hygiene and unique keys on existing tables

- **May change (BE):**
  - New migrations: `UNIQUE(user_id, course_id, topic_id)` on `user_learning_progress`; `exam_attempts` additive columns plus the `active_key` virtual column and index.
  - `UserLearningInteractionController::updateProgress` (atomic upsert, same contract) and `::byTopic` (`whereNull('deleted_at')`).
  - `V2/ExamController::createExam` (return the existing open attempt).
  - `SectionalTestService::latestAttempts` and `FullLengthExam` list queries (count submitted only; show the latest submitted result).
  - New command `progress:cleanup {step} {--dry-run}`.
- **Must stay untouched:** response shapes, the dashboard and the sync.
- **Steps:**
  - C1–C6 from [MIGRATION.md §3](MIGRATION.md), each with a dry run on the copy, then the snapshot plus the real run.
  - ⚠️ The list fix changes what students see: an unfinished retry no longer hides the earlier score. That is a visible behaviour change, so the user approves it.
- **Tests:**
  - Dedupe preserves the OR of the flags.
  - The unique key prevents the double-tap duplicate (parallel requests).
  - `createExam` double tap creates 1 attempt.
  - Lists show the submitted result while a retry is open.
  - Snapshot restore script rehearsed.
- **Rollback:** restore from the snapshot tables; `migrate:rollback`; revert the commit.
- **Done when:**
  - In production: 0 duplicate groups, 0 uuid-format `course_id`s, 0 root-topic `chapter_id` mismatches, 0 duplicate open attempts.
  - Error rate on the progress and exam endpoints is unchanged for 48 h.

## PT-4 — Syllabus index

- **May change (BE, new files only, plus the scheduler and the automation route):**
  - Migrations for `exam_syllabus_topics` and `syllabus_index_builds`.
  - `App\Services\Progress\SyllabusIndexService`, `RebuildSyllabusIndexJob`.
  - Commands `syllabus:rebuild`, `syllabus:check`.
  - `routes/console.php`: add 2 schedules.
  - `routes/Apis/V2/automation.php`: add 1 route behind `automation.key`.
  - `config/progress.php`, `config/queue.php`: a new `syllabus` queue entry (additive).
  - `Dockerfile.queue-worker` or the worker command, to also listen on the new queue (⚠️ SYSTEM IMPACT: deploy config, user approves).
- **Must stay untouched:** every BigQuery-owned table, the sync code, and `SyllabusTreeService` (Tools keeps using it; unifying them is a later option).
- **Tests:**
  - Golden test: for 3 exams, the index equals what `PreparationService::getSectionChapters` shows.
  - Idempotency: two rebuilds give 0/0/0.
  - Shrink guard: simulate topics with NULL chapters, then abort.
  - Fingerprint detection and the quiet-period logic.
  - Lock against concurrent rebuilds.
  - Full rebuild time on the production copy is under 60 s.
- **Rollback:** turn off `SYLLABUS_INDEX_AUTO_REBUILD`. Tables can be dropped with no student impact.
- **Done when:**
  - Production index built.
  - Nightly reconcile shows 0 index diff for 3 nights.
  - A real content sync is followed by an automatic rebuild within 15 minutes with sensible counts.

## PT-5 — Topic equivalence (curated)

- **May change (BE):** `topic_equivalences` migration, `TopicEquivalenceService`, `topic-equivalence:report` (read-only CSV), `topic-equivalence:apply {file}` (approved rows only); `learning_key` in the index rebuild.
- **Must stay untouched:** `s_topics` and all BigQuery-owned tables.
- **Steps:**
  1. Generate the candidate report (multi-signal).
  2. Hand it to the curator (🛑 D7).
  3. Apply only approved rows.
  4. Rebuild the index and recount the affected rollups.
- **Tests:**
  - A name-only match never becomes a candidate.
  - No chains.
  - Revoking restores the separate keys (rekey test).
  - Cross-exam completion appears for a mapped pair.
- **Rollback:** delete or mark the rows rejected, rebuild, rekey.
- **Done when:** approved list applied in production, and a spot check of 10 pairs by the curator is correct.

## PT-6 — Global topic progress and history (dual-write and backfill)

- **May change (BE):**
  - Migrations: `user_topic_progress`, `user_topic_study_contexts`, plus the new nullable columns on `user_learning_interactions`.
  - `App\Services\Progress\ProgressService`.
  - `UserLearningInteractionController::updateProgress` becomes an adapter onto the service in `dual` mode, with the same request and response.
  - `V2/ProgressController` (`topic-activity`, `topic/{id}/history`).
  - Commands `progress:backfill`, `progress:parity`, `progress:rekey`.
  - `config/progress.php`.
- **Must stay untouched:**
  - The legacy `user_learning_progress` semantics while in dual mode.
  - The dashboard.
  - V1 endpoints.
- **Steps:**
  1. Migrations deployed.
  2. Turn on `dual` for the allow-list, then for all.
  3. Run the backfill.
  4. Run parity for 7 days.
- **Tests:**
  - Completion-rule matrix (D1/D4).
  - Monotonic upsert under parallel pings (20 concurrent requests produce 1 row with correct flags).
  - `client_event_id` idempotency.
  - Ownership: another user's enrollment gets 404.
  - Topic not in the syllabus gets 422.
  - Dual-write failure does not fail the request.
  - Backfill is resumable and idempotent (running it twice produces the same rows).
  - A cross-exam merge of the 441 multi-course pairs gives 1 row per (user, key).
- **Rollback:** `PROGRESS_WRITE_MODE=legacy`; new tables can be dropped (legacy is intact).
- **Done when:** 0 unexplained parity differences on the copy, and on production for 7 days.

## PT-7 — Accurate activity reporting and server-scored mini-tests

- **May change:**
  - **BE:** mini-test start/submit (in `V2/Tests/MiniTestController` or as `exam_attempts` type `topic`, D6); `ProgressService` activity types.
  - **CM:**
    - `features/preparation/components/MainVideo/VideoWrapper.tsx`, `VideoCard.tsx` (video progress throttled to 30 s and on the ended event; no more Start-click = watched)
    - `RelatedContent/Content.tsx` (separate view and download; one shared reporter)
    - `components/modal/MiniTest.tsx` (remove the mount-time ping; start/submit calls; keep the UI and motion untouched)
    - `downloadable-content/components/section-notes.tsx` (report the view)
    - `lib/dashboard/userInteractions.ts` (+ `reportTopicActivity`)
    - React Query invalidation for `learning-progress-by-topic`, `courses-progress-summary`, `resume-state`
    - i18n for the hard-coded strings touched (en/hi/mr)
- **Must stay untouched:**
  - Visual design: `MyCourseCard`, the motion library and test screens.
  - Analytics event names: reuse `Topic Status Changed`, `Video Started` (fix the hard-coded duration), and `Test Started/Submitted` with `test_type=topic_test` (DEVELOPMENT_RULES §2.5).
- **Rollout:**
  - BE first, with `MINI_TEST_SERVER_SCORING` off.
  - Then the dashboard, which reads the capability flag from the API and falls back to the old flow while the flag is off.
- **Tests:**
  - Playwright through a Sonnet subagent (memory `feedback_playwright_tests_sonnet`): video 80% → tick; opening the mini-test modal → no tick; submitting → tick and score stored.
  - Notes view vs download.
  - Double-tap submit → 1 attempt.
  - Offline → retry +1 request.
  - en/hi/mr at 390 px.
  - Request counts.
  - Numbers vs DB.
- **Rollback:** flag off; revert the dashboard deploy (the old reporting still works against BE).
- **Done when:**
  - In production, new mini-test attempts carry answers and scores.
  - "Mini-test done" without a submitted attempt = 0 for new data.
  - Amplitude events are unchanged in name and shape, plus the new property.

## PT-8 — Test-series tracking

- **May change (BE):**
  - `exam_attempts` additive columns (from PT-3).
  - `user_test_progress` migration.
  - `ExamController::endExam` (after commit: write the score columns and the summary; try/catch).
  - `SectionalTestService::getTestListForCourse` and `FullLengthExam` (read summaries behind `PROGRESS_READ_SOURCE`).
  - `progress:backfill --tests`.
- **Must stay untouched:** the attempt flow, scoring rule, timer, `result` JSON and the list response shapes.
- **Tests:**
  - Best/latest/first selection.
  - Retry while one is open.
  - Expired attempts.
  - Counts equal the hand-run SQL.
  - Cross-exam chapter-test behaviour per D5.
  - Submit-path failure isolation (summary write throws, submit still succeeds).
- **Rollback:** flag back to legacy; the summary table can be dropped.
- **Done when:** list counts on the new source equal the corrected legacy counts for 100% of sampled users.

## PT-9 — Rollups and read switch

- **May change:**
  - **BE:**
    - `user_progress_rollups` migration, `ProgressRollupService`, `RecomputeUserRollupsJob`.
    - `progress:reconcile` plus its schedule.
    - The `UExamEnrollment` created/updated hook gains a try/catch dispatch (same pattern as the daily-test hook).
    - `progress-summary` and `by-topic` read from new behind the flag/allow-list.
  - **CM:**
    - Invalidate `courses-progress-summary` after test submit and after topic reports.
    - Show the server percent where the sidebar recomputes today. Same visuals.
- **Must stay untouched:** response shapes, card visuals.
- **Tests:**
  - Property test: random event sequences give rollup = from-scratch recount.
  - Enrollment of a new exam shows existing cross-exam progress immediately (HTET → UPTET scenario).
  - Syllabus change triggers a recount.
  - Course-card query count = 1 (DB query log).
  - p95 < 100 ms on the production-sized copy.
- **Rollback:** `PROGRESS_READ_SOURCE=legacy`, `PROGRESS_ROLLUPS_ENABLED=false`.
- **Done when:** the allow-list users' numbers are verified against SQL, then 10% → 50% → 100% with no error or latency regression (TESTING §8).

## PT-10 — Staging / full rehearsal and performance validation

- **Steps:**
  1. Restore a fresh production dump into the rehearsal environment (D9).
  2. Run the **whole** MIGRATION §6 sequence end to end, with timings and lock durations recorded.
  3. Run the dashboard against it and go through the full Playwright suite.
  4. Run the performance tests (TESTING §7).
  5. Rehearse the catastrophic restore once and record how long it takes.
- **Done when:**
  - Every step succeeded with recorded timings.
  - No migration locks a hot table for more than 5 s (otherwise switch to a pt-online-schema-change or gh-ost plan, decided by the user).
  - The runbook is updated with the real commands and timings.

## PT-11 — Production rollout and monitoring

- **Steps:** exactly as MIGRATION §6. Each step is separate, run by the user, and has the verification below.
- **Post-deployment verification, after every step:**
  - Sentry error rate on `/v2/interactions/*`, `/v2/progress/*`, `/v2/exam/*` and `/v2/test/*` is flat.
  - p95 latency of those endpoints.
  - The `syllabus_index_builds` and reconcile reports.
  - Queue lag.
  - 5 real users' cards and sidebars compared with SQL.
  - Amplitude event volumes unchanged (`Topic Status Changed`, `Test Submitted`).
- **Observation windows:** dual-write 7 days; rollups 3 nights; each read-percentage step at least 2 days.
- **Rollback:** MIGRATION §7. The rule is: on doubt, flip the flag first and investigate after.

## PT-12 — Cross-exam UI (later)

- "Completed in HTET" badge and the topic history view, using `completedIn` and `/history`.
- Needs a design from the user. Reuse `StatusChip` and existing tokens.
- No card restyle.

## PT-13 — Legacy retirement (separate approval)

- After 30 days stable on `new`:
  - Stop dual-writing.
  - Freeze `user_learning_progress` (keep it read-only, don't drop it).
  - Remove the V1 progress and legacy test routes after confirming 0 traffic.
  - Delete the stale `* copy.php` / `* copy.tsx` files.
- Dropping legacy tables is a **separate, later** decision, after a final archive dump.

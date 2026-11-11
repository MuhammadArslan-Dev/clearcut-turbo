# Phase 95 — Progress Tracker implementation (PT-0, PT-3 … PT-9)

**Tickets:** (new, from user, 2026-11-11)
**Repos:** BE · CM (apps/dashboard)
**Branches:**
- BE `fix/pt0-security-hotfixes` (PT-0, pushed)
- BE `feature/progress-tracker` (PT-3 … PT-9)
- CM `feature/progress-tracker` (dashboard reporting)
- None of these is merged to main.

**Created / start date:** 2026-11-11
**Status:** In Progress

> Blueprint: `docs/Progress Tracker/` (README → ARCHITECTURE → ROADMAP). This file tracks the actual work.

## 1. Problem / objective
Build the approved cross-exam, precomputed progress system without breaking the live LMS: the same response shapes, flags defaulting to legacy, and everything additive.

## 2. Scope
- **In:**
  - PT-0 safe security fixes.
  - PT-3 cleanup commands and unique keys.
  - PT-4 syllabus index.
  - PT-6 topic progress (dual-write, backfill, parity).
  - PT-7 accurate reporting and server-scored mini-tests (BE + dashboard).
  - PT-8 test-series summaries.
  - PT-9 rollups and read switch.
  - End-to-end tests on `clearcut_pt`.
- **Out:**
  - PT-1 (prod checks, run by the user).
  - PT-2 (sync hardening, D14).
  - PT-5 curation data (D7; the table and service are built, but no equivalences are applied).
  - PT-10/11 production.
  - PT-12 UI.
  - PT-13 retirement.
  - Any merge to main or deploy.

## 3. Implementation plan
- [x] Test DB `clearcut_pt` (copy of local `clearcut`)
- [x] PT-0: R1 SQLi, R4 heartbeat owner, R6 progress-summary scoping, with tests that fail on old code
- [ ] PT-4: `exam_syllabus_topics` + `syllabus_index_builds`, `SyllabusIndexService`, `syllabus:rebuild` / `syllabus:check`, schedule
- [ ] PT-3: `progress:cleanup` (C1–C5 dry-run and run, with snapshots), `createExam` idempotent, lists count submitted only
- [ ] PT-6: `user_topic_progress`, `user_topic_study_contexts`, interactions columns, `ProgressService`, dual-write adapter, `POST /v2/progress/topic-activity`, history endpoint, `progress:backfill`, `progress:parity`
- [ ] PT-7: `topic_test_attempts` + mini-test start/submit; dashboard: video 80%/ended, notes view vs download, mini-test start/submit, invalidations
- [ ] PT-8: `exam_attempts` score columns + `user_test_progress`, written after `endExam`
- [ ] PT-9: `user_progress_rollups`, recount service and job, read switch for progress-summary / by-topic
- [ ] E2E: Playwright (Sonnet subagent) against local BE on `clearcut_pt` plus dashboard dev

## 4. Progress / completed changes
- 2026-11-11:
  - Created `clearcut_pt`.
  - PT-0 commit `a55b46a` on BE `fix/pt0-security-hotfixes`. Files: `V2/Tests/MiniTestController.php`, `V2/ExamController.php`, `V2/UserLearningInteractionController.php`, `tests/Feature/ProgressTrackerSecurityTest.php`.
- 2026-11-11, BE `feature/progress-tracker` (`e655543`, plus a follow-up commit):
  - **Migrations** (additive): `2026_11_11_100000_create_syllabus_index_tables`, `…100100_create_topic_progress_tables`, `…100200_create_test_progress_and_rollups`.
  - **Services** (`app/Services/Progress/`): `SyllabusIndexService`, `ProgressService`, `ProgressRollupService`, `ProgressReadService`, `TestProgressService`, `MiniTestAttemptService`.
  - **Jobs** (`app/Jobs/Progress/`): `RebuildSyllabusIndexJob`, `RecomputeUserRollupsJob`.
  - **Commands** (`app/Console/Commands/Progress/`): `syllabus:rebuild`, `syllabus:check`, `progress:cleanup`, `progress:backfill`, `progress:parity`, `progress:reconcile`.
  - **Controller**: `V2/ProgressController`.
  - **Config**: `config/progress.php`.
  - **Hooks into existing code**:
    - `updateProgress` dual-write.
    - `progressByTopic` / `progressSummary` read switch, with a batched summary.
    - `createExam` 10 s double-tap guard and `exam_id`.
    - `endExam` test summary after commit.
    - `UExamEnrollment::saved` rollup recount.
  - **Routes**:
    - `/v2/progress/*` (auth).
    - `/v2/automation/syllabus-index/rebuild` (automation.key).
    - Schedules `syllabus:check` (10 min) and `progress:reconcile` (04:30).
- 2026-11-11, CM `feature/progress-tracker` (`302380f`, plus the double-start fix):
  - New files: `lib/dashboard/progressV2.ts`, `preparation/hooks/useProgressCapabilities.ts`.
  - Changed: `VideoCard` (optional `onProgress` / `onEnded`), `VideoWrapper`, `RelatedContent/Content`, `modal/MiniTest`, `useMiniTestQuestions`, `useMiniTestStore` (`attemptId`), `progressTracker.isTopicCompleted`, `usePreparationDataStore.markTopicFieldDone` (creates a missing entry).
  - Every new path runs only when `/v2/progress/capabilities` says so.
- Rehearsal on `clearcut_pt` (full local data):
  - **Cleanup:** c1 2,722, c2 4,340, c3 6 groups / 7 rows, c5 754 closed. Restore was proven; re-running is a no-op.
  - **Topic backfill:** 19,016 legacy rows became 18,490 global rows (cross-exam merge). 2,062 rows have orphan course ids (kept without context). 4 min 24 s. Idempotent: identical checksum on re-run.
  - **Test backfill:** 10,871 attempts → 8,113 summaries (2 min).
  - **Rollups:** 12,109 pairs, 7 min 43 s.
  - **Parity:** 19,016 / 19,016 OK, 0 unexplained.
  - **Reconcile:** index diff 0, duplicates 0, orphans 0, drift 0.

## 5. Decision log
| Date | Question | Answer (who) |
|---|---|---|
| 2026-11-11 | D1/D2 completion | Available activities; video ≥ 80% or ended; mini-test = 1 submitted attempt (user) |
| 2026-11-11 | D3 old flags | Not counted as completed (user) |
| 2026-11-11 | D4 sub-topics | Parent completes when all children complete; only parents counted (user) |
| 2026-11-11 | D9 test DB | New local `clearcut_pt` (user) |
| 2026-11-11 | D6 mini-test storage | New `topic_test_attempts` table (developer, lowest risk) |

## 6. Blockers / risks
- 🛑 **D17: visible changes when `PROGRESS_READ_SOURCE=new`** (all intended by D1/D3, but the user must accept them before any rollout):
  1. **Course card "tests":** the total now counts only topics that really have mini-test questions in that exam. UTET showed 0/277 before and shows 0/0 now. Attempted counts only *submitted* tests, so old "opened" flags drop, e.g. CTET 3 → 0.
  2. **Ticks:**
     - The video tick needs ≥ 80% / end. Old "Start clicked" ticks disappear on the new read source.
     - The mini-test tick needs a submitted test.
     - Topics without a video or mini-test can now complete.
     - Chapters with sub-topics can now complete.
  3. **Today Goals:** "videos" now counts completed videos, not starts.
  4. **c5 cleanup:** older duplicate open test attempts become `expired`, so they drop out of the "attempts" list. Submitted attempts are untouched.
- Enrollments whose level belongs to another exam (bad data, e.g. the phase-66 `pw66*` fixtures) show 0 chapters on the new source. The legacy source showed totals for them.
- R2 (BigQuery routes auth), R3 (sectional generation auth) and R5 (practice-test result IDOR) are waiting on D10: who calls those endpoints.
- All production facts in AUDIT §9 are still unverified (PT-1).

## 7. Dependencies / packages added
- No new packages.
- New env flags with safe defaults: `PROGRESS_WRITE_MODE=legacy`, `PROGRESS_READ_SOURCE=legacy`, `PROGRESS_READ_ALLOWLIST=`, `PROGRESS_ROLLUPS_ENABLED=false`, `SYLLABUS_INDEX_AUTO_REBUILD=false`, `MINI_TEST_SERVER_SCORING=false`.
- New migrations: additive only.

## 8. Tests and verification
- [x] PT-0: `DB_CONNECTION=mysql DB_DATABASE=clearcut_pt php artisan test --filter=ProgressTrackerSecurityTest` gives 5/5 pass. Baseline on the old code: 3 fail (heartbeat, SQLi, summary scoping), as expected.
- [x] **Baseline on old code:** progress-summary for 11 courses took 77 queries / 127 ms. The new batched read takes 3 queries / 28 ms (local, `clearcut_pt`).
- [x] **`ProgressTrackerTest`: 13/13 pass:**
  - index idempotency and shrink guard (it caught a real bug: `+` instead of `array_merge`, which would have wiped an exam)
  - 404 for another user's course and 422 for a topic outside the course
  - video at 80% only
  - D1 completion
  - `client_event_id` replay
  - cross-exam by-topic plus history
  - server mini-test scoring with an idempotent submit
  - legacy dual-write never completing (D3)
  - summary shape
  - rollup = full recount
  - createExam double tap gives 1 attempt, and submit fills the summary
- [x] **Live HTTP concurrency:** 20 parallel distinct events plus 6 parallel replays left 1 row, count 21, and 1 interaction. Other user's course gives 404, no token gives 401.
- [x] **E2E with Playwright (Sonnet):**
  - Start Video sends 1 `video_started` and shows no tick; legacy calls are gone.
  - Notes View sends 1 request and the tick appears.
  - Mini-test score 3/5 matches the DB; a double Finish sends 1 submit.
  - CTET completion shows as completed in UTET (cross-exam).
  - A network block causes no crash.
  - 390 px en/hi has no overflow.
- [x] **Bug found by the E2E run:** 2× `mini-test/start` per open. Fixed: concurrent starts are shared.
- [ ] **Not verified:**
  - production
  - RN app on a device
  - real YouTube 80% / ended (simulated through the API)
  - a production `next build`
  - Marathi
  - the CTET card on screen
  - pre-existing untranslated hi strings (Start Video, Completed, Easy, Next Topic; not from this change)
  - the pre-existing 500 on `/v2/daily-tests/{uuid}/history` seen in the console

## 9. Next steps
PT-4 syllabus index on BE `feature/progress-tracker`.

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

## 5. Decision log
| Date | Question | Answer (who) |
|---|---|---|
| 2026-11-11 | D1/D2 completion | Available activities; video ≥ 80% or ended; mini-test = 1 submitted attempt (user) |
| 2026-11-11 | D3 old flags | Not counted as completed (user) |
| 2026-11-11 | D4 sub-topics | Parent completes when all children complete; only parents counted (user) |
| 2026-11-11 | D9 test DB | New local `clearcut_pt` (user) |
| 2026-11-11 | D6 mini-test storage | New `topic_test_attempts` table (developer, lowest risk) |

## 6. Blockers / risks
- R2 (BigQuery routes auth), R3 (sectional generation auth) and R5 (practice-test result IDOR) are waiting on D10: who calls those endpoints.
- All production facts in AUDIT §9 are still unverified (PT-1).

## 7. Dependencies / packages added
- No new packages.
- New env flags with safe defaults: `PROGRESS_WRITE_MODE=legacy`, `PROGRESS_READ_SOURCE=legacy`, `PROGRESS_READ_ALLOWLIST=`, `PROGRESS_ROLLUPS_ENABLED=false`, `SYLLABUS_INDEX_AUTO_REBUILD=false`, `MINI_TEST_SERVER_SCORING=false`.
- New migrations: additive only.

## 8. Tests and verification
- [x] PT-0: `DB_CONNECTION=mysql DB_DATABASE=clearcut_pt php artisan test --filter=ProgressTrackerSecurityTest` gives 5/5 pass. Baseline on the old code: 3 fail (heartbeat, SQLi, summary scoping), as expected.
- [ ] Baseline measured on the old code for the progress endpoints (query counts, numbers)
- [ ] Break-it pass
- [ ] **Not verified:** production, RN app on a device

## 9. Next steps
PT-4 syllabus index on BE `feature/progress-tracker`.

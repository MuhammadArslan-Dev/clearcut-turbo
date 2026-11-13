# Phase 106 â€” Last-active level/paper on the My Course card + Cutoff Meter (AUDIT, plan awaiting review)

Date: 2026-11-12. No code changed yet.

## 1. Ask
The My Course card (and its Cutoff Meter) must always show the level/paper the user was last ACTIVE in, per course. Enrol in Paper 1 + Paper 2, take a test in Paper 2 â†’ card + meter = Paper 2 only; later act in Paper 1 â†’ it switches back. Real timestamps, scoped by course/level/paper; no mixing; handle new enrolments, no activity, equal timestamps, course switching, existing rows. Reuse tables; no duplicate tracking.

## 2. How it works today (audited)
- A **paper = one `u_exam_enrollments` row** (`stage_id`); a course = rows sharing `group_code` (`PreparationService::getPaperData` does `firstWhere('stage_id', $paperId)`). 894 of 13,280 local groups have 2â€“3 rows.
- `active_level` is NOT a usable "current paper" flag: in multi-row groups it is `1` on every row (160 groups) or `0` on every row (734 groups); none has exactly one.
- **Card** (`CourseRepository::getMyActiveCourses`): groups by `exam_id`, keeps the row with the latest `last_accessed_at`, falls back to the first row by `created_at`.
- `last_accessed_at` is written only by enrolment and by `DashboardController::changeCourse`, which stamps **every row of the group with the same `now()`**. It carries no per-paper information, so a tie is broken by list order (oldest row), and no test ever updates it.
- **Cutoff Meter** (`CutoffMeterController::index/show`, `CutoffMeterRefresh::enrollment`, `CutoffMeterBackfillAnswers`): picks `orderByDesc('active_level')->orderByDesc('id')` = the **newest enrolled** row.
- So the card and the meter can pick **different papers of the same course** (card: oldest/tied row, meter: newest row) and neither follows the user's activity. Root cause: no per-paper "last activity" signal and three different "which row" rules.

## 3. Existing activity records (reuse, nothing new)
| Source | Scope key | Time |
|---|---|---|
| `meter_history` (`trigger='TEST_SUBMIT'`, written once per submit of EVERY test type since phase 104) | user, exam, stage | `created_at` |
| `exam_attempts` (full/sectional, v2) | user, exam, `paper_id` | `submitted_at` |
| `topic_test_attempts` (mini tests) | user, exam, `navigation_id` (= stage) | `submitted_at` |
| `exam_test_attempts` (legacy) | user, `paper_id` | `submitted_at` |
| `user_course_resume_states` | user, course (group_code), `paper_id` | `last_accessed_at` (last opened content) |
| `daily_test_attempts` | user, daily_test (no stage column) | feeds the meter through `meter_history` |

## 4. Proposed design
- One backend resolver, `App\Services\Enrollment\LastActivePaper`: for a user's rows of one course, activity(row) = MAX over the sources above for that row's `(exam, stage)`; winner = latest activity; ties â†’ the row the resume state points at, then most recent `last_accessed_at`, then newest `id`; no activity at all â†’ today's behaviour (unchanged for new enrolments).
- Used by the card endpoint, `CutoffMeterController` (index + show), `CutoffMeterRefresh::enrollment` fallback and the cards' progress summary, so card, meter, Target tab and progress always agree.
- Computed at read time, indexed by user: works for existing users immediately (no migration, no new table, no backfill).
- Frontend: the card already renders whatever stage the API returns; verify it shows the paper name and re-fetches after a test (`invalidateCutoffMeterQueries` already refetches the courses list).

## 5. Decisions (user, 2026-11-12)
1. Activity = tests of every type **and** opening/learning content in a paper.
2. Tie or no activity â†’ the paper the resume state points at, else the newest enrolment.

## 6. Implemented
- Backend `app/Services/Enrollment/LastActivePaper.php` (+ `user_learning_interactions` as a content source), used by `CourseRepository` (`getMyActiveCourses`, `getMyCourses`), `CutoffMeterController` (`index`, `show`, `topicAnswers`) and `CutoffMeterRefresh::enrollment`. An explicit enrolment uuid still means that exact paper. The picked row carries the course's most recent `last_accessed_at`, so the active-course ordering is unchanged.
- Frontend: `["my-courses"]` is invalidated with the meter/progress queries so the card re-picks right after a submit.

## 7. Verification (real API + local `clearcut` DB, user 16404)
- Old code: last real activity Home Science (stage 24, meter 41/131) but the card showed Hindi (stage 18) â€” card and meter disagreed.
- New code, HTET Hindi (18) + Home Science (24): HS test â†’ card 24; Hindi test â†’ 18; HS again â†’ 24; the meter is always that paper's (counted 126â†’131 vs 161, never mixed).
- HTET Level 1 (15) + Level 2 (18, 24): Level 1 test â†’ card "Level 1 (PRT)", meter 55/123; Level 2 meters untouched (42/161, 41/131).
- UTET two papers with no activity â†’ newest enrolment (117); single-paper courses unchanged; tie-break rules checked on real rows (equal time, resume paper, newer activity wins over resume).
- Not verified: Hindi/Marathi card, paid/expired enrolments, a user with 3 edits (UI cap), production data volume.
- Open: the card title shows the level (`stagesNames[0]`) only; two papers under the same level show the same title (the meter number differs).

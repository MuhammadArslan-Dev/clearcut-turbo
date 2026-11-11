# Phase 97 — Cutoff Meter v1: backend + DB only

**Tickets:** Confluence PM "Cutoff Meter - Logic & Path to Elo" (page 29360129, by Rohit, "v1 ready to build", HPTET / HTET / CTET first)
**Repos:** BE only. **No frontend change in this phase** (user, 2026-11-11). The motion design is phase 96.
**Branch:** BE `feature/cutoff-meter`. Not merged.
**Created / start date:** 2026-11-11
**Status:** In Progress

## 1. Problem / objective
Build the spec's "do now" scope on the backend:
- **Part 1:** the Cutoff Meter.
- **Part 2:** Next Best Action, max 3 actions per day.
- **Part 3:** all numbers in config.
- **Part 4:** data plus the 2 tables.
- **§5.4:** the Elo preparation items:
  - every answer stored permanently
  - one `get_mastery()` function
  - topic-level accuracy
  - `model_version`
  - config

Everything ships behind a flag that is off by default, and only additive DB changes are made.

## 2. Scope
- **In:**
  1. **Answer log** `user_question_answers`, append-only: one row per answered question with user, `question_new.id` (already language-independent: one row per question, translations separate), exam, level, section, topic, selected option, correct, time spent, source, source attempt, answered_at.
     - Written by: test submit (`endExam`, all three types), mini-test submit, onboarding (first practice test) submit.
     - **Onboarding answers are not stored today**, so this is new.
     - Plus a backfill from `exam_attempt_questions` and `topic_test_attempts`.
  2. **`meter_history`** and **`nba_log`**, exactly as in spec §4.2.
  3. **`config/cutoff_meter.php`** with every Part 3 key, plus `CUTOFF_METER_ENABLED` (default false), counted sources, and the default pass ratio.
  4. **`CutoffMeterService`**:
     - Sections of the student's level (`mapping_navigation_sections` → `e_sections.total_marks`).
     - Pass mark (§3 decisions).
     - Counted answers: first attempt per question, guesses dropped, last 40 per section.
     - `get_mastery(user, exam_stage, section)` as the ONLY mastery function: `(correct + 1.5) / (attempted + 3)`.
     - Meter = round(Σ mastery × section marks).
     - Unlock at 5 answers; colour (red / yellow / green, band 15); confidence (30 / 150); gap; change vs previous; topic accuracy.
     - Saves a `meter_history` row with `model_version = v1` and the per-section JSON.
  5. **`NextBestActionService`**: §2.1–2.5 exactly.
     - Rank sections by marks_lost.
     - Topic state: NOT_STARTED, WEAK, OKAY, STRONG (all first attempts on the topic).
     - Topic importance = PYQ count of the topic in the exam's instances, cached daily.
     - Rules 1–4, one action per section, full-length due (≥ 50 answers, gap 7 days, 3 in the final 14), final-14-days strategic skip of the bottom 20% importance, unseen tests, `NBA_INCLUDE_LOCKED` flag.
     - Writes `nba_log` rows (rank, action_type, section, topic, test, rule_matched, model_version).
  6. **Triggers** (§1.5, §2.7): after every test submit (after commit, try/catch), after mini-test submit, after onboarding submit, after a main video completes (actions only), and daily 00:00 IST for users active in the last 30 days.
  7. **Backend API** (no client yet; 404 while the flag is off):
     - `GET /v2/cutoff-meter/{course}`: meter plus today's actions.
     - `POST /v2/cutoff-meter/actions/{id}/click`
     - `POST /v2/cutoff-meter/actions/{id}/complete`: `nba_log` clicked_at / completed_at. "Completed" is also set server-side when the target test is submitted.
  8. **Commands:**
     - `cutoff-meter:backfill-answers`
     - `cutoff-meter:recompute {--users=}`
     - `cutoff-meter:check-data`: levels whose section marks don't add up, missing pass marks, exam dates in the past, sections without questions.
     - `cutoff-meter:accuracy`: §4.3, meter just before each full-length test vs its score.
  9. **Tests:**
     - The spec's worked example (§1.6 must give 88) and the §2.8 example.
     - Rules 1–4, first attempt, guess, window, unlock.
     - Idempotent recompute, ownership 404, flag off = inert.
- **Out:**
  - Any frontend or dashboard change.
  - Elo itself (§5.5, later).
  - Storing per-question time for mini-tests. The dashboard does not send it, and sending it is a frontend change.
  - Content data fixes (see §6).

## 3. Implementation plan
- [x] Migration `2026_11_11_200000_create_cutoff_meter_tables` (additive)
- [x] `config/cutoff_meter.php`
- [x] `App\Services\CutoffMeter\{AnswerLogService, ExamPatternService, CutoffMeterService (get_mastery = the one mastery function), NextBestActionService, CutoffMeterRefresh}`
- [x] Hooks: `ExamController::endExam` (after commit), `MiniTestAttemptService::submit`, `FirstPracticeTestController::submit`, `ProgressService::record` (video completed). All are no-ops while disabled and never throw.
- [x] `V2/CutoffMeterController`:
  - `GET /v2/cutoff-meter/{course}`
  - `POST /v2/cutoff-meter/actions/{uuid}/click|complete`
- [x] Commands: `cutoff-meter:backfill-answers`, `:recompute`, `:daily` (scheduled 00:00 IST), `:check-data`, `:accuracy`
- [x] Tests: `CutoffMeterTest` 8/8 on `clearcut_pt`; flags-off suite 6/6 on `clearcut_premig` (un-migrated)
- [x] Rehearsal on `clearcut_pt`

## 4. Progress / completed changes
- 2026-11-11: spec read; DB readiness checked (see the chat summary). Findings recorded in §6.
- 2026-11-11 (BE `feature/cutoff-meter`), rehearsal on `clearcut_pt`:
  - **Backfill:** 8,044 submitted tests → 211,018 answers in 1 min 20 s. A re-run writes 0 rows.
  - **Recompute:** 1,297 enrollments in 1 min 5 s.
    - 393 locked (fewer than 5 answers).
    - Colours: green 110, yellow 305, red 489.
    - Confidence: low 208, medium 578, high 118.
  - **Actions:** max 3 per list; 0 lists with two actions from one section.
    - Rule mix: TOPIC_TEST (rule 2) 1,707, of which 1,599 are locked; LEARN (rule 1) 586; FULL_LENGTH 407; ONBOARDING 393.
    - No sectional tests yet, because rule 2 matches first while most topics are NOT_STARTED.
  - **`check-data`:** 22 issues (§6).
  - **`accuracy`:** 0 comparable tests yet. A meter must exist *before* a full-length test; this starts once the meter is live.

## 5. Decision log
| Date | Question | Answer (who) |
|---|---|---|
| 2026-11-11 | Scope | Backend + DB only, no frontend (user) |
| 2026-11-11 | Where answers come from | One new append-only `user_question_answers` table, filled at every submit and by a backfill. Spec §5.4 #1; the onboarding test stores nothing per question today (developer) |
| 2026-11-11 | Language-independent key | `question_new.id`. The sync already stores one row per question with translations separate, so the spec's composite key isn't needed (developer, verified: 0 language suffixes in 37,252 rows) |
| 2026-11-11 | Max marks | Sum of the level's section marks, as configured in the syllabus. `check-data` flags levels where the sum ≠ the exam total (developer) |
| 2026-11-11 | Pass mark | Latest `e_instances.pass_marks.general` for the exam; else `exams.metadata.cutoff` ("90+ / 150"); else `CUTOFF_DEFAULT_PASS_RATIO` × max. The student category is not stored anywhere, so General is used (developer, 🛑 confirm) |
| 2026-11-11 | Chapter tests | Counted like topic and sectional tests (they are tests of the same questions). Daily tests are not counted (not in the spec's source list). Both are configurable in `COUNTED_SOURCES` (developer, 🛑 confirm) |
| 2026-11-11 | Answers without time (mini-test, onboarding) | Counted. The guess rule can only apply where time is known (developer) |

## 6. Blockers / risks
- 🛑 **Spec arithmetic:** the §1.6 table says "16 answers", but the rows add up to 15. The meter (88) is right.
- 🛑 **Locked recommendations:** with `NBA_INCLUDE_LOCKED = true` (spec: TBD), 94% of topic-test actions for free users point at locked topics. Decide true or false.
- **Sections with no questions** (HTET Urdu, Punjabi, Sociology, Psychology, Chemistry; CTET Science) can never be practised, so they sit at the 50% prior forever and pull the meter toward half marks.
- 🛑 **Spec inconsistency:** §1.2 says ignore answers under 5 s, but Part 3 has `MIN_TIME_SEC = 3`. The config value (3) is used; change one env var to switch to 5.
- 🛑 **Design vs spec** (affects UI only, not this backend): zones (4 vs 3), ± band vs Low/Med/High, "+X marks", cooling, live tick. The backend follows the spec; the UI decision is for the client.
- **Data (content team):**
  - Several levels' section marks don't add up to the paper: CTET Maths & Science / Social Studies 180, HPTET JBT 240, HTET Maths 120, HTET Chemistry 210 (Chemistry mapped twice). The meter max follows the data until fixed.
  - HPTET has no `pass_marks` or `exam_pattern`.
  - HTET (04 July 2026) and CTET (06 Sep 2026) exam dates are in the past, and HPTET is "Upcoming", so the final-14-days rules are off everywhere.
  - Student category is not collected.
- `time_spent` is > 0 on only 38% of `exam_attempt_questions` rows; unvisited questions are 0. Answers with `time_spent = 0` are treated as unknown, not as guesses.

## 7. Dependencies / packages added
- No packages.
- New env vars: `CUTOFF_METER_*` (default off).
- New migration (additive).

## 8. Tests and verification
- [x] **Spec worked example §1.6: meter 88, pass 90, gap 2, yellow, low confidence.** The spec says "16 answers", but its own rows add up to 15 (5 onboarding + 10 topic test). Reported to the client.
- [x] §2.8 list: topic tests in Maths → GS → EVS, reason "Mathematics is losing you 19 marks."
- [x] Rules tested:
  - first attempt only
  - guess (< 3 s) dropped
  - answers without a time counted
  - non-counted source (daily) dropped
  - window = last 40
  - unlock at 5, with the onboarding action only below 5
- [x] NBA:
  - rule 1 LEARN for a WEAK topic with its video unwatched
  - rule 2 → 3 once the video is watched
  - one action per section
  - persisted batch
  - click / complete
- [x] A real chapter test submit logs every question and writes a `TEST_SUBMIT` meter row
- [x] Ownership: another user's course or action gives 404. Flag off: API 404, nothing written; un-migrated copy works
- [x] Backfill idempotent; timings above
- [ ] **Not verified:**
  - production
  - the full-length and final-14-days paths with real dates (all exam dates are past or unset)
  - onboarding submit end-to-end through the dashboard (covered at service level)
  - no frontend exists yet by decision

## 9. Next steps
Implement section 3 in order.

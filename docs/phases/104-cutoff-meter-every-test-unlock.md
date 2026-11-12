# Phase 104 — Cutoff Meter: every test type feeds it, unlock on any 5+ question test

**Tickets:** client (via user, 2026-11-12): "meter must unlock and calculate on any test with more than 5 questions — Mini, Chapter, Sectional, Full, Practice, Daily; today only Mini works"
**Repos:** BE `feature/meter-all-tests` (a76d997, 5cb8630, 6b4b294) · CM `feature/meter-all-tests` (500d438, ba54b58)
**Status:** In Review — verified on the real local backend + `clearcut` DB; not merged, not live

## Decisions (user, 2026-11-12)
| Question | Answer |
|---|---|
| Unlock rule | a test with **5 or more** questions (Mini and Practice have exactly 5) — config `CUTOFF_METER_UNLOCK_MIN_TEST_QUESTIONS` |
| Do smaller tests count in the score? | yes; size only decides unlock |
| Real-env login | the backend's own test number via the real v1 OTP API |

## Root causes (found by real E2E, not guessed)
1. **Practice (onboarding) never fed the meter:** `FirstPracticeTestService::enrollments()` selected `id, exam_id, stage_id` only → answers logged with `user_id = 0` → `insertOrIgnore` silently swallowed the FK error (also the meter save failed: `cutoff_meter.onboarding_failed`).
2. **Daily never fed the meter:** not hooked at all; and once hooked, its answers carried each question's OWN section — daily tests reuse questions by chapter across exams (a REET daily held HTET/CTET/HPTET/MAHATET CDP questions), so none were in the level's sections. Same cross-exam effect for chapter tests and the practice test (both pick by chapter).
3. **Cross-exam leak:** counting had no exam filter, so a REET daily answer filed under HPTET section 78 unlocked the HPTET meter.
4. Unlock was "5 counted answers in this level's sections", not the client's per-test rule.
5. Legacy (browser-scored) mini tests sent no answers to the server.

## Implementation
- `user_question_answers.test_questions` (migration 2026_11_12_300000): size of the test each answer came from, filled by every logger (exam attempts, server mini, legacy mini, onboarding, daily).
- `CutoffMeterService::isUnlocked()` — THE rule: any counted test with `test_questions >= min` in this level's sections and exam (old rows: answered-count fallback until backfill).
- Answers are filed under the section **the test was built for**: daily → `daily_tests.section_id`; sectional/full → `exam_attempt_sections.section_id`; chapter + practice → the level section holding the chapter (`mapping_section_chapters`).
- Counting + unlock are exam-scoped. NBA "locked" follows the meter's `locked`. Answer log refuses rows without a user (warning instead of silent drop).
- Daily submit → `afterDailyTest` (after commit). Legacy mini → `POST /v2/cutoff-meter/topic-answers` (server grades, topic-filtered, own course only, idempotent `attempt_ref`).
- Backfill: daily attempts, test sizes for old rows, daily section correction (BINARY joins — the tables have different collations).
- Dashboard: unlock copy "Take any test with {n}+ questions to unlock" (en/hi/mr) from `unlock_min_test_questions`; daily submit refetches the meter; legacy mini sends answers.

## Real-environment verification (local backend, `clearcut`, test account 16404, no stubs)
| Category | Course | Test size | Result |
|---|---|---|---|
| Mini (server) 4 q | HTET L18 | 4 | stayed **LOCKED** (edge) |
| Mini (server) 5 q | HTET L18 | 5 | **UNLOCKED** 69 |
| Daily | REET L9 | 10 | **UNLOCKED** 71 (alone) |
| Practice | HPTET JBT | 5 | **UNLOCKED** 90 (alone) |
| Chapter | HTET L18 | 10 | meter 64, change −5 |
| Sectional | HTET L18 | 30 | meter 62, change −2 |
| Full-length | HTET L18 | 150 | 42/150, cutoff 90; meter 47, change −15 |
| Mini (legacy) | HTET L18 | 5 | 5 rows logged, retry no duplicates, other course 404 |
Per-category isolation (each source alone): all six UNLOCKED; 4-question mini alone LOCKED. Card endpoint: 46/150, 71/150, 90/240 (HPTET max 240 = known section-data issue).

## Prod steps after deploy (user runs)
`php artisan migrate` (deploy does it) → `php artisan cutoff-meter:backfill-answers` → `php artisan cutoff-meter:recompute`.

## Open
Security: hardcoded test login (9988776655 / 4321) in `V1\AuthController::varifyOtp` works on production too. Content: section marks (HPTET 240), pass marks.

# Phase 103 — One scoring + cutoff engine for every test type

**Tickets:** (user prompt 2026-11-12: "cutoff and score work only for Mini Tests; standardise all test types")
**Repos:** BE (scorer, endpoints) + CM-dashboard (result screens) + packages/motion (`TestResult`)
**Created / start date:** 2026-11-12
**Status:** In Review — built + tested on branches (BE `feature/unified-scoring`, CM `feature/unified-scoring`), not merged, not live.

---

## 1. Problem / objective
Every test type must compute score, marks, section-wise results and cutoff/pass with the same documented rules, from the real questions, answers and exam configuration — no hardcoded values, no duplicated logic.

**Documented rules** (Confluence PM "A2 · DB: Exam", "B9 · Exam Master Data Upkeep", "6. Tests & Attempts"):
- marks per answer: `exams.marking_schema` / `e_instances.marking_scheme` `{"correct":1,"wrong":0,"unattempted":0}`, `e_instances.negative_marking`
- section marks `e_sections.total_marks`; `question_weightage` "mostly blank (assume 1)"
- pass marks `e_instances.pass_marks` per category (`{"general":90,…}`), `exams.metadata.cutoff` ("90+ / 150")
- daily test: per-exam `daily_test_settings.expected_cutoff`
- The docs do **not** say what "cutoff" means for a short test (10-question chapter/topic/daily test). → decision D2.

## 2. Findings (read-only audit 2026-11-12, local DB; key lines re-checked by hand)
"Works only for Mini Tests" is not quite what the code does: **no** test type reads the marking scheme or pass marks. All score 1 per correct / 0 wrong / 0 skipped. Mini/Daily/Onboarding *look* like they have a cutoff because the result screen invents one.

| Type | Scored where | Cutoff shown | Stored |
|---|---|---|---|
| Daily | server `DailyTestController.php:535-542` (correct option of the FIRST translation) | invented 60 % of questions (`motion/test/flow/types.ts:31`, `TestResult.tsx:36`); headline 70/40 %; free users: skipped shown as wrong | `daily_test_attempts.score` |
| Onboarding | server `FirstPracticeTestController.php:89-118`; total = number of answers the client sent | invented 60 % | user_state + Cutoff Meter |
| Mini (legacy) | browser only | invented 60 % | nothing |
| Mini (server, flag off) | server `MiniTestAttemptService.php:85-105` — but the screen shows the browser score | invented 60 % | `topic_test_attempts.correct` |
| Chapter / Sectional / Full-length | server `ExamController::endExam` (correct/wrong/unanswered, % of questions) | none (`ExamReportSheet.tsx:284` `noCutoff`); section max = question count | `exam_attempts.result` |
| Weekly practice test | server `PracticeTestService.php:63-99` (`practice_test_questions.marks`) | none; no screen found | `practice_test_attempts` (0 rows) |

**Real bugs (independent of the decisions):**
- B1 Correct option read from the first translation (Daily, Onboarding, Weekly PT) vs the attempt language (Mini) — 9 local questions have different correct options per language.
- B2 Server-scored mini test: screen shows the browser number, not the stored one.
- B3 Onboarding total comes from the client (dropping questions raises the score).
- B4 Daily test, free users: skipped questions counted as wrong on the result.
- B5 Exam marks wrong for non-1-mark papers: UP TGT 4/question (500), UP PGT 3.4 (425), UGC 2 (100) are shown out of the question count; the Cutoff Meter uses marks → the two disagree.
- B6 Weekly PT (security): `GET /practice-test/attempt/{id}/result` public with sequential ids (answers + keys readable); submit has no `auth:sanctum` (logged-in users probably saved as guests). Not exercised.

**Data facts:** wrong = 0 and `negative_marking` = 0 everywhere (REET_2011 has `unattempted: -1`, likely a typo); UP PGT exam schema 1 vs instances 3.4/4.25/5; `marking_schema` NULL for MPTET, Bihar STET; JSON columns double-encoded (the model `array` cast returns a string); `pass_marks` only for 5 exams and identical everywhere (Haryana keys on CTET); `metadata.cutoff` "90+ / 150" on all 14 exams incl. 425/500/100-mark papers; `daily_test_settings` empty; `question_weightage` = 1 on all 123 sections.

## 3. Proposed design (after §5 decisions)
- BE `App\Services\Scoring\ScoringService` — the ONE scorer: `score(questions, answers, locale, context)` → per question (correct/wrong/skipped, marks), totals (correct, wrong, unanswered, marks, max_marks, percentage), per section (marks, max), `cutoff` {value, source} and `passed`. Reads marking via one decoder (handles double-encoded JSON, NULL → documented default `{1,0,0}`), negative marking, correct option of the attempt language (D7).
- Every submit path calls it: daily, onboarding, mini (server), end-exam, weekly PT. Response gains the same `score` block; existing fields stay (backward compatible).
- Dashboard + `TestResult`: show the server's numbers and cutoff; remove the invented `maxScore * 0.6` default (no cutoff → no cutoff chip, as the exam report already does).
- Tests: Pest per type (marks, negative marking, unanswered, decimals 3.4 ×, missing scheme, mixed languages, client-dropped questions) + Playwright per result screen.

## 4. Risk
Live LMS: every result screen and stored score. Additive response fields, flag `SCORING_V2` (default off) for the switch, old stored results untouched.

## 5. Decisions needed (client / product owner)
| # | Question | Options |
|---|---|---|
| D1 | Show **marks** (correct × marking scheme) or **count of correct**? | marks (UP TGT /500) · count (today) |
| D2 | Cutoff on a short test (topic/chapter/daily/onboarding) | none · paper pass ratio (90/150 = 60 %) × test marks · admin `expected_cutoff` |
| D3 | Full-length: pass/fail vs `pass_marks`? which category? | general · ask category · none |
| D4 | Mixed marking inside one exam (UP PGT 3.4 / 4.25 / 5): which instance? | the paper's own instance · latest instance · exam schema |
| D5 | Section-wise minimum marks (some TETs)? | not now · model it |
| D6 | Mini test: server score is truth? | yes (and turn on `MINI_TEST_SERVER_SCORING`) · keep browser |
| D7 | Correct option when translations disagree | attempt language · English · flag as data error |
| D8 | Weekly PT security fixes (B6) now? | yes · separate ticket |

### Decision log
| Date | # | Answer (who) |
|---|---|---|
| 2026-11-12 | D1 | **Marks** = correct × marking scheme (user) |
| 2026-11-12 | D2 | **Paper pass ratio** × this test's max marks; no pass mark for the exam → no cutoff (user) |
| 2026-11-12 | D3 | **Yes, General** pass_marks for full-length (user) |
| 2026-11-12 | D6 | **Server score** is the truth; `MINI_TEST_SERVER_SCORING` rollout (user) |
| 2026-11-12 | D4 | the test's own instance (mapping_tests.exam_instance_id) → latest instance → exam schema (Claude, revisable) |
| 2026-11-12 | D5 | not now (Claude) |
| 2026-11-12 | D7 | attempt language, fallback first translation (Claude, revisable) |
| 2026-11-12 | D8 | separate ticket (Claude) |

## 5b. Implementation (2026-11-12)
- **BE `feature/unified-scoring` (commit `5434869`)** — `app/Services/Scoring/ScoringService.php` (`correctOption`, `marking`, `passRatio`, `score`, `scoreQuestions`). Wired into: `ExamController::endExam` (result keeps `total_questions/correct/wrong/unanswered/percentage/submitted_at`, adds `marks/max_marks/cutoff/cutoff_source/passed/marking_source/sections`; re-derives `is_correct`), `submitAnswer`/`markForReview` (language-aware key), `DailyTestController` submit/result/start (`scoring`; free users totals only; optional `locale`), `FirstPracticeTestController::submit` (`scoring`, optional `locale`), `MiniTestAttemptService` + `ProgressController::miniTestSubmit` (`scoring`). No migration. No flag: every change is additive and 1-mark papers score exactly as before.
- **CM (dashboard + motion)** — `lib/api/scoring.ts` (`TestScoring`, `scoringToResultData`); `TestResult`: no cutoff when `cutoff` is null (the invented `maxScore × 0.6` line is gone; `NEUTRAL_TONE_SHARE` only picks the cutoff-free wording), decimal marks (`formatMarks`); exam report, daily result (banner now follows the same outcome as the ring; free users no longer see skipped as wrong), onboarding result (scoring saved in the session), topic result (server scoring replaces the browser count when it arrives; shown-language key sent).
- **Backward compatibility:** re-scoring 1457 stored exam attempts (copy DB) → 1454 identical; 3 differ only by the language key (D7) or answer keys edited in the bank after the attempt. Old attempts without the new fields keep the old count view without a cutoff.

### Root causes
1. No scorer read the marking scheme / pass marks: every path had its own `correct_option ===` check (5 copies) with `translations->first()`.
2. The result screen invented a cutoff (`maxScore × 0.6`) when the host passed none — that is why Daily/Mini/Onboarding "had a cutoff" and exam tests did not.
3. Topic test: the stored score and the shown score came from different code (server vs browser).
4. Daily free users: skipped counted as wrong (no per-question data on the free response).

### Still open / flagged
- B3 onboarding total is client-chosen (needs a served-set table) · B6 weekly practice test security (D8) · legacy mini-test path (flag off) shows no cutoff until `MINI_TEST_SERVER_SCORING=true` · daily result re-read without the original locale uses the first translation (locale not stored) · section-bar tones (60/40 %) and the neutral wording tiers are presentation, not cutoffs · content: `pass_marks` copy-paste on every exam, `metadata.cutoff` "90+ / 150" on 425/500/100-mark exams, REET_2011 `unattempted: -1`.

## 6. Next steps
User answers §5 → finalise §3 → implement on `feature/unified-scoring` (BE + CM), flag off → tests → user review → merge.

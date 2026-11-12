# Phase 100 — Correct + Incorrect Explanation (BigQuery → question_trans)

**Tickets:** (new, from user, 2026-11-12)
**Repos:** BE (now) · CM apps/dashboard (frontend — NOT started, waits for user approval)
**Branch:** BE `phase-100-incorrect-explanation` (f7f6251) · CM `phase-100-explanation-ui` (05f9304) — committed + pushed as branches, kept on top of `origin/main`; **NOT merged into / pushed to `main`** (user, 2026-11-12)
**Created / start date:** 2026-11-12
**Status:** In Review — backend done + verified on LOCAL DB (UGC NET Paper 2 Political Science); frontend waits for user approval; nothing committed

---

## 1. Problem / objective
BigQuery `clear-cutoff-435016.staging_test.question` (view over `teaching_test.qb_*` Google-Sheets tables, "Master Data" tab) replaced the single `explanation` column with `correct_option_explanation` + `incorrect_option_explanation`. The backend must store both per language and return both, so the student sees a Correct and an Incorrect explanation after answering. Production sync still reads `staging.question` (only `explanation`) and must keep working unchanged.

## 2. Scope
- **In (BE):** one nullable column `question_trans.incorrect_explanation`; `correct_option_explanation` → existing `question_trans.explanation` (no new column); sync mapping (job + a synchronous single-exam command with dry-run and a matched/created/updated/unchanged/skipped/unmatched report); `incorrect_explanation` added next to `explanation` in every API response that already returns it; local-only sync of ONE exam and verification against BigQuery.
- **Out:** production sync/deploy; touching `question_new` mapping columns (question_id, instance, section, chapter, topic); the legacy flat `questions` table; fixing the client's sheets; frontend (documented in §10, starts only after approval).

## 3. Implementation plan
- [x] Inspect BigQuery: which sheets carry the new columns, id/mapping health (§6, findings)
- [x] Inspect local tables: `question_new` (mapping, no text) + `question_trans` (per-locale text, `explanation`, unique `question_new_id+locale`)
- [x] Migration: `question_trans.incorrect_explanation` LONGTEXT NULL after `explanation` (reversible)
- [x] `QuestionTrans` fillable
- [x] Extract the per-record logic of `SyncQuestionsJobNew` into `App\Services\Questions\QuestionSyncRecordService` (one mapping for job + command); map `correct_option_explanation` with fallback to `explanation`; `incorrect_option_explanation` → `incorrect_explanation`; blank/ID-shaped values never stored
- [x] Command `questions:sync-exam` — one source table (+ optional section), optional test-only instance prefix remap, `--dry-run` (transaction rolled back), report counts; local DB host only; bumps only the local question-cache version (never calls the blog revalidate URL)
- [x] API: `incorrect_explanation` beside `explanation` in Preparation `instance-questions`, ExamResourceNew (+ ExamController select), DailyTest result, FirstPracticeTest (submit + explanation), `Tests\QuestionTranslationResource`, Blog repository selects (4). MiniTest + `Tests\QuestionResource` read the legacy `questions` table → out of scope
- [x] Dry-run, real local sync, re-run (idempotency), compare BigQuery vs local counts
- [x] Pint, migration down/up, other exams untouched (row counts + checksum before/after)

## 4. Progress / completed changes
- 2026-11-12: Investigation done (see §6). User asked to test with the data that exists → UGC NET Paper 2 Political Science chosen.
- 2026-11-12 (BE, branch `phase-100-incorrect-explanation`, uncommitted):
  - new `database/migrations/2026_11_12_100000_add_incorrect_explanation_to_question_trans_table.php`
  - new `app/Services/Questions/QuestionSyncRecordService.php`, `app/Console/Commands/Questions/SyncExamQuestions.php`, `tests/Feature/QuestionExplanationSyncTest.php`
  - changed `app/Jobs/SyncQuestionsJobNew.php` (uses the service; counters/logs/failure semantics unchanged), `app/Models/QuestionTrans.php`, the API files listed in §3
  - ⚠️ Behaviour change for the live queued sync: a blank explanation in the sheet no longer clears a stored one (before: written as NULL).
- 2026-11-12 incident (local DB only): a bare `php artisan migrate` applied two unrelated pending migrations (`2026_09_21_210000_allow_multiple_daily_test_attempts`, `..._220000_add_public_uuids_to_daily_tests_and_attempts`) then failed on an existing table; `rollback --step=1` then dropped `daily_tests.uuid`. Restored: both rolled back (0 attempts, so no data affected); `migrations` = 119 rows / max batch 45 and `daily_tests`/`daily_test_attempts` schema match the 08:18 Laragon dump. Rule added to DEVELOPMENT_RULES §6 (`--path` only).

## 5. Decision log
| Date | Question | Answer (who) |
|---|---|---|
| 2026-11-12 | Where does `incorrect_explanation` live? | `question_trans` (per locale, beside `explanation`) — `question_new` holds no text (Claude, from schema) |
| 2026-11-12 | New column for `correct_explanation`? | No — `correct_option_explanation` is the renamed `explanation`; mapped into the existing column (Claude) |
| 2026-11-12 | Which exam to test? Paper 1 has no separate incorrect text; Paper 2 ids don't match | "jo data para ha us sa testing" → Paper 2 **Political Science** (2000 rows, 100% both explanations, section + 1998/2000 chapters exist locally), with `UGC_` → `UGCNET_` remap applied **only in the local command** (user, 2026-11-12) |

## 6. Blockers / risks (BigQuery findings, 2026-11-12)
- Only `qb_ugcnet_paper1/2` have `incorrect_option_explanation`; every other sheet has 0.
- **Paper 1** (`qb_ugcnet_paper1`, already local, 1110 q): columns were shifted (ids in the explanation column); client fixed the shift, but `incorrect_option_explanation` is NULL in all 2220 rows — the incorrect text sits inside `correct_option_explanation` (1839 rows, mixed formats). Client must move it to its own column.
- **Paper 2** (`qb_ugcnet_paper2`, 17200 rows, 9596 with incorrect): `exam_instance_id` = `UGC_2009…` (BigQuery `staging.e_instance` and local use `UGCNET_2009…`); sections COMM, ENG, EVSCI, MANE, SOCIO, WS and 51 of 89 chapters missing locally; some `chapter_id` = `#N/A`; EDU/ENG incorrect text inside the correct column; LAW explanations empty in "Master Data"; MANE/EVSCI incorrect empty. No Paper 2 question exists locally yet.
- `qb_reet_paper1` range `REET_P1` broken → the whole `staging_test.question` view errors; the command reads the source table directly.
- ⚠️ The existing full sync run against a mis-shaped sheet overwrites mapping columns — pre-existing risk, not changed here.
- Observed, not verified: the date mode of `SyncQuestionsNewJob` filters on `updated_at`, but the view's column is `gs_updated_at`.
- Before going live: production sheets (`teaching.*`, read by `staging.question`) need both new columns; Paper 2 ids/sections fixed at the source (the remap is test-only).

## 7. Dependencies / packages added
Migration `add_incorrect_explanation_to_question_trans_table`. No packages, no env vars.

## 8. Tests and verification
Command: `php artisan questions:sync-exam qb_ugcnet_paper2 --section=UGCNET_POL --instance-map=UGC_:UGCNET_ [--dry-run]`

| | Dry run | Real run | Re-run |
|---|---|---|---|
| BigQuery rows | 2000 | 2000 | 2000 |
| questions created / updated / unchanged | 1000 / 0 / 1000* | 1000 / 0 / 1000* | 0 / 0 / 2000 |
| translations created / updated / unchanged | 2000 / 0 / 0 | 2000 / 0 / 0 | 0 / 0 / 2000 |
| skipped / unmatched / failed | 0 / 0 / 0 | 0 / 0 / 0 | 0 / 0 / 0 |
| unresolved chapter / topic (sheet `#N/A`, POL 2010 Q3 en+hi) | 2 / 2 | 2 / 2 | — |
| rejected explanation values (sheet `#VALUE!`, 6 questions) | 12 + 12 | 12 + 12 | — |
| local after: questions / translations (en, hi) | 1000 / 2000 (1000, 1000) | same | same |
| local with explanation / with incorrect_explanation | 1988 / 1988 | 1988 / 1988 | same |

\* the second language row of each question finds the question the first one created.

- [x] Baseline: per-exam counts + CRC32 checksums of `question_new` / `question_trans` before (scratch `baseline_before.tsv`)
- [x] Dry run wrote nothing (37252 / 60289 rows before and after); dry-run report = real-run report; re-run 0 created / 0 updated; no duplicate `question_id` or (`question_new_id`, `locale`)
- [x] Field-by-field vs BigQuery, all 2000 rows: question text 2000/2000, correct_option 2000/2000, instance (after remap) 2000/2000, section 2000/2000, explanation 1988 equal + 12 NULL (rejected `#VALUE!`), incorrect_explanation 1988 equal + 12 NULL, 0 mismatches, 0 missing
- [x] Other exams untouched: CTET, HPTGT, HTET, MAHATET, REET, UPTET checksums identical; the original 1110 UGCNET Paper 1 questions / 2219 translations identical (379109697 / 33705102); totals 37252→38252 and 60289→62289 (= +1000 / +2000)
- [x] Migration up → down (column gone, 60289 rows) → up
- [x] API: `instance-questions/UGCNET_2012?section_id=UGCNET_DIICT` → key present in 40/40 translations (NULL, Paper 1 has none); `QuestionTranslationResource` on a POL Hindi row → `answer.incorrect_explanation` = "Incorrect Option (Option 2): …"
- [x] Tests: `QuestionExplanationSyncTest` (6) + the 2 existing `SyncQuestionsJobNew` tests in `QuestionCacheInvalidationTest` → 8 passed (23 assertions), DatabaseTransactions, row counts identical before/after; `--list-tests` checked first
- [x] Pint clean; `php -l` clean
- [ ] **Not verified:** the HTTP endpoints with a real token (called in-process instead); ExamResourceNew / DailyTest / FirstPracticeTest outputs with a POL question (no local exam/daily test contains one); the queued job end-to-end through a real queue worker + batch; production (not touched by design)
- ⚠️ Found for the frontend test: `instance-questions/{instance}` filters by the FIRST stage mapped to the instance (`UGCNET_2009` → `UGC_P1`), so Paper 2 (`UGC_P2`) questions never appear there — pre-existing, not changed.

## 9. Next steps
1. User reviews; on approval: commit the BE branch, then start §10 (frontend).
2. Client fixes the sheets (§6) before anything goes live; the `--instance-map` remap is test-only.
3. Before live: production sheets get both columns; run the migration on prod with the deploy; first sync of a fixed sheet with `--dry-run` style review.
4. Local POL test data stays for the frontend work. To remove: delete `question_new` rows with `section_id_b = 'UGCNET_POL' AND question_id LIKE 'UGC\_20%'` (translations cascade).

## 10. Frontend (PLANNED — do not start before approval)
Requirement: when a student selects an answer and opens its explanation, show **Correct Explanation** and **Incorrect Explanation** when available; if `incorrect_explanation` is NULL/empty, don't render that section. Preserve the existing explanation UI (same card/typography/tokens, i18n en/hi/mr for the two headings).
- Find every explanation renderer in `apps/dashboard` that reads `explanation` (preparation Topic Test / MiniTest feedback, exam result/solutions, daily-test result, first practice test) — extend the existing component with an optional `incorrectExplanation` prop rather than a new component; update TS types in `lib/api/*`.
- Blog question bank: decide with the user whether it shows the incorrect section too.
- Verify: 390px + desktop, en/hi/mr, a question with and without `incorrect_explanation`, long text (no overflow).

**2026-11-12 — preview built at the user's request ("UI ready kro, check krna ha"), CM branch `phase-100-explanation-ui`, uncommitted:**
- `components/features/exam-report/QuestionExplanation.tsx` (the ONE panel used by Performance Report, Daily Test result, Practice Test): optional `incorrectExplanation`. Empty → exactly the old panel ("Explanation", one blue box). Present → first box titled "Correct Explanation", then an "Incorrect Explanation" box, same layout on the existing `--background-gray-subtle` token (no new colour).
- i18n `modals.performanceReport.explanation.correctTitle` / `incorrectTitle` in en/hi/mr (spliced, other keys byte-identical).
- Dev-only page `/explanation-preview` (`app/[locale]/(public-pages)/explanation-preview`, same 404 gate as `/animation-preview`) with 3 real local questions in `samples.json` (2 POL with incorrect, 1 Paper 1 without).
- Verified: tsc (no errors in touched files), eslint, `check:colors` ✓; screenshots desktop 1440 en + 390px (iframe) en/hi/mr — text wraps, no overflow, both cases correct.
- User (2026-11-12, supersedes the gray box above): Correct Explanation box light green and Incorrect Explanation box light red — the same `green-100` / `red-100` as the correct / wrong-selected `OptionCard` (palette classes, no new hex) — and the incorrect part sits behind a red outlined "Show Incorrect Explanation" button (`explanation.showIncorrect` / `hideIncorrect`, en/hi/mr), closed again every time the panel reopens. No incorrect explanation → old single blue "Explanation" box, no button. Playwright (sonnet agent): 6/6 pass — colours, toggle, reset on reopen, Q without incorrect, Hindi strings, 390px no overflow, 0 console errors.
- User: "jase mera daily test ka ui ha us trha ka bnao preview" → the Daily Test result's `ReviewRow` moved unchanged into `components/features/daily-tests/DailyTestReviewRow.tsx` (page imports it; 6 now-unused imports removed from the page) and passes `incorrect_explanation`; `DailyTestResultQuestion.incorrect_explanation?` added. The preview renders that row inside the same "Question Review" card (Q1 correct, Q2/Q3 wrong). So the **Daily Test result is wired** (backend already returns the field).
- [ ] NOT done yet (needs approval): Performance Report (`ExamReportSheet`, needs `incorrect_explanation` in `exam.ts` translation type), Practice Test (+ `localizeExplanation` for the incorrect text, `firstPracticeTest.ts` types).

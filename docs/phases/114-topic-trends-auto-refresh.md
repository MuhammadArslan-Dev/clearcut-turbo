# Phase 114 — Topic trends: calculate from our own questions, refresh after every question sync

**Tickets:** (new, from user)
**Repos:** BE (`C:\laragon\www\clearcutoff-main-backend`) · CM (`apps/dashboard` label + docs)
**Branch:** `feature/topic-trends-auto-refresh` in BE and CM — **not committed, not pushed, not deployed**
**Created / start date:** 2026-11-14
**Status:** In Review — built and verified on the local DB; UI check (Playwright) pending, nothing deployed. Reference doc: [`docs/TOPIC_TRENDS.md`](../TOPIC_TRENDS.md) (data flow, tagging rules, API).

---

## 1. Problem / objective
`mapping_topic_trends` (the Trends tab) was filled by hand from a CSV produced by a BigQuery SQL ("SQL Query for Trends"). It had gone stale: against the current `question_new`, 1,443 trend rows were missing and hundreds of values differed. Wanted: trends **calculated from the latest questions in our own DB** (never from BigQuery), refreshed automatically after every successful question sync, and re-creatable on demand through a dedicated endpoint, without deleting data or creating duplicates.

## 2. Scope
- **In:** `TopicTrendService` (calculation + upsert), `RefreshTopicTrendsJob`, auto-run from the sync batch `then()`, `POST/GET /api/v2/automation/topic-trends/*`, migration (unique key + `last_computed_at`), cache-version bump, CSV-import uuid fix, tests, "Questions Asked" label (en/hi/mr), docs.
- **Out:** changing the SQL logic or thresholds (8 / 3, moved to `config/topic_trends.php` unchanged); deleting/pruning stale rows; authentication of the old `bigquery/*` endpoints; the paper-preference limitation (sec. 6); analytics enhancements (sec. 6).

## 3. Implementation plan
- [x] 1. Migration `2026_11_14_100000_…`: unique `(topic_id, exam_id, stage_id)` + `last_computed_at`; refuses (no change) when duplicates exist.
- [x] 2. `config/topic_trends.php` (thresholds, English locale, chunk, lock).
- [x] 3. `app/Services/Preparation/TopicTrendService.php`.
- [x] 4. `app/Jobs/RefreshTopicTrendsJob.php` (lock, failure handling, cache bump only on change) + `QuestionCacheService::bumpVersion()`.
- [x] 5. `SyncQuestionsNewJob::afterBatchSucceeded()` called from the batch `then()`.
- [x] 6. `TopicTrendController` + routes `GET|POST /api/v1/bigquery/refreshTopicTrends` and `/status` in `routes/Apis/V1/dataapi.php` (no key, like `syncQuestionsNew` — user decision after go-live; first built behind `X-Api-Key` in the automation group, then moved).
- [x] 7. `TopicTrendImportService`: uuid set on create only; `buildSource` shared with the new service.
- [x] 8. Frontend: label/unit "Questions Asked" (`Content.tsx` + `messages/{en,hi,mr}/relatedContent.json`).
- [x] 9. Tests `tests/Feature/TopicTrendRefreshTest.php` (14).
- [~] 10. Playwright check of the Trends tab (en/hi/mr, 390px) — delegated to a Sonnet subagent, result pending.
- [ ] 11. Commit/merge/deploy — only on the user's go-ahead.

## 4. Progress / completed changes (2026-11-14)
Backend (new): `config/topic_trends.php`, `database/migrations/2026_11_14_100000_add_unique_key_and_computed_at_to_mapping_topic_trends.php`, `app/Services/Preparation/TopicTrendService.php`, `app/Jobs/RefreshTopicTrendsJob.php`, `app/Http/Controllers/API/Admin/TopicTrendController.php`, `tests/Feature/TopicTrendRefreshTest.php`.
Backend (edited): `app/Jobs/SyncQuestionsNewJob.php`, `app/Services/Blog/QuestionCacheService.php`, `app/Services/Preparation/TopicTrendImportService.php`, `routes/Apis/V2/automation.php`.
Dashboard (edited): `RelatedContent/Content.tsx` (Trends), `messages/{en,hi,mr}/relatedContent.json` (`labels.questionsAsked`, `values.questionsRange`, `values.questionsExact`; the unused `marksAsked`/`marksRange` keys were replaced).
Docs: this file, `docs/TOPIC_TRENDS.md`.

**Found while validating (changed the implementation):** the SQL's `language_code = 'English'` is *not* dropped in our schema — it means "the question has an English version" (`question_trans.locale='en'`). Without it, Hindi/Sanskrit language-section questions inflated every exam total (first dry run gave 3,329 rows; with the filter 2,774). Also, 206 tagged questions carry the spreadsheet errors `#N/A`/`#REF!` as topic id: treated as untagged.

## 5. Decision log
| Date | Question | Answer (who) |
|---|---|---|
| 2026-11-14 | D1 old rows | Keep, never delete; log and report (`stale_kept`) — user |
| 2026-11-14 | D2 "Marks Asked" | Keep calculation, rename label to "Questions Asked" — user |
| 2026-11-14 | D3 topic id | Prefer `topic_id_b`, but verify against `s_topics` first — user. **Verified:** `s_topics.topic_id` unique (9,000/9,000); numeric `question_new.topic_id` is only the number in `T_00885` (not `s_topics.id`: 885 vs 6264, 2,753 topics differ); 0 question/topic chapter conflicts; 206 unmapped tags are `#N/A`/`#REF!`; every stage id maps to `e_stages` |
| 2026-11-14 | D4 scope | Auto sync: touched exams only; endpoint: all or selected — user |
| 2026-11-14 (later) | Remove authentication from the refresh endpoint | **Done — user:** the endpoint now lives in the `bigquery` group like `syncQuestionsNew`, no key, GET or POST. Risk accepted: anyone with the URL can start a (harmless, idempotent) refresh. |
| 2026-11-14 | D5 auth | Identify callers, protect backward-compatibly — user. **Finding:** old `bigquery/*` routes (sync, `importTopicTrends`) have **no** auth (only `api` + cache-flush middleware); docs (`Progress Tracker/BIGQUERY-SYNC.md`) list the caller as unknown. The n8n-facing `/api/v2/automation/*` group already uses `X-Api-Key` (same middleware as `question-cache/invalidate` and `syllabus-index/rebuild`, which n8n calls after a BigQuery sync). **Chosen:** the new endpoints live in that group, so nothing existing changes or breaks. Recommended separately: protect the old `bigquery/*` routes the same way, but only after finding out who calls them (`automation.key:soft` mode logs unauthenticated calls first, as phase 77 did) |

## 6. Blockers / risks / recommendations
- ⚠️ **Paper preference never matches (pre-existing, not changed):** `PreparationService::getSectionChapters` prefers the trend row with `stage_id` = the enrollment's `stage_id`, but enrollments hold an `e_navigations.id` (53 = "English and Hindi") and trends an `e_stages.id` (6/7 = CTET P1/P2). 759 topic/exam pairs have trends in more than one paper; those students get the first row, not their paper's. Fix needs a navigation → paper mapping — a business decision.
- ⚠️ First production run changes about 1,000 existing rows (values drift from July's CSV) and adds ~900 (HPTGT, MAHATET, UGCNET, HTET, UPTET, CTET). Run `dry_run` first.
- Residual differences vs the July table are data drift (1,500 of 1,897 matched rows have identical question totals; 1,416 are within 0.1 % on the percentage); the new numbers equal an independent SQL recomputation exactly (sec. 8).
- Stale rows: 577 locally (REET, HTET_L3, …) stay as they are, with `last_computed_at` NULL.
- Run time locally ~1.2 s for all exams; unverified on the production dataset.
- Failure handling: failed refresh → logged + status `failed`, sync untouched; queue worker down → waits in queue; lock held → retries every 60 s.
- **Recommendations (not implemented):** count exams where the topic did *not* appear ("3 of 7 exams"); show tagging coverage and fix the 31 % untagged questions and the `#N/A` tags at the source sheet; importance normalised by exam length; real marks (D2 follow-up); rising/falling badge over the last 3 years; auth for the old `bigquery/*` endpoints; i18n for the remaining hard-coded English Trends labels.

## 7. Dependencies / packages added
None. One migration, one config file, no env vars (the endpoint uses the existing `AUTOMATION_API_KEY`). ⚠️ Default `BLOG_REVALIDATE_URL` in `config/services.php` is the **production** blog: any local test that calls `QuestionCacheService::invalidate()` must override it (done for the checks below).

## 8. Tests and verification
Backend, local `clearcut` DB (a production import), table dumped first to the session scratchpad:
- [x] **Baseline (old code/data):** table 2,474 rows; SQL logic on `question_new` gave 3,340 combinations, 1,443 missing, 577 only in table, 357/248/45/53/401 value differences (avg/exams/importance/year/total).
- [x] `php artisan test --filter=TopicTrendRefreshTest` → **14 passed (108 assertions)**: SQL-logic values, English-only filter, `#N/A` ignored, unmapped topic skipped, idempotent 2nd run (no write, uuid/updated_at kept), changed question → only affected rows, stale kept, legacy `TRD_` row adopted without duplicate, dry-run writes nothing, scope, DB unique key, cache bump only on change, sync batch dispatch (touched exams only), API key 401/422/200/202, failure path releases lock, lock contention, CSV import keeps uuid. No test rows left behind. (`CutoffMeterTest` has 2 failures that exist without my changes — confirmed by stashing.)
- [x] **Real run on local data** (job via queue, all exams): computed 2,774 · created 877 · updated 1,001 · unchanged 896 · stale_kept 577 · skipped 0 · 163 untagged ignored · 1.21 s; table 2,474 → 3,351 rows, 0 duplicates; **2nd run: 0 created / 0 updated / 2,774 unchanged**.
- [x] **Independent check:** a separate pure-SQL recomputation (2,774 rows) joined to the table: 0 differences in avg, %, exams, total questions, min, max, last year, importance, years list.
- [x] **Automatic flow:** `afterBatchSucceeded(['htet'])` with the real DB queue → one `RefreshTopicTrendsJob` → `queue:work` ran it, scope `htet`, status stored, nothing failed, 0 jobs left (blog URL pointed at a dead port).
- [x] Spot check: CTET Paper 2 "Growth & Development" = 1-2 per exam, avg 1.67, 3 exams, 2024, "(2019-2024)" — equals the screenshot.
- [x] `tsc`/`eslint` on `Content.tsx`: only errors that already existed (lines 92, 167, 328, 865, none in the changed lines); `pnpm check:colors` ok; Pint run on the new files.
- [x] Playwright (Sonnet subagent, local dashboard, temporary local token — deleted afterwards): Trends tab shows "Questions Asked | 1-5 questions" (en), "पूछे गए प्रश्न | 1-5 प्रश्न" (hi), "विचारलेले प्रश्न | 1-5 प्रश्न" (mr); single value "1 question", range "2-3 questions"; "Marks Asked" gone; other rows unchanged; 0 MISSING_MESSAGE console errors; 3 Notes↔Trends switches = 0 extra requests; 390px and 1280px. (The first attempt aborted when a landing redirect left localhost; nothing was sent to production.)
- [ ] **Not verified (UI):** the dash value for a trend without min/max, the importance flames (all seen were "Low"), hi/mr for single-value topics, visual wrapping of the long hi/mr label at 390px (checked by DOM text only; a modal covered the screenshots).
- [ ] **Not verified:** run time / duplicates / queue worker on **production**; production `date`-branch of `SyncQuestionsNewJob` (`updated_at` vs the view's `gs_updated_at`); real `syncQuestionsNew` end to end (needs BigQuery, the view timed out earlier); the n8n side (key header) once deployed.

## 9. Next steps
1. Finish the Playwright check and record it here.
2. On the user's go-ahead: commit both branches, deploy backend, `php artisan migrate`, then `dry_run` → real run → check Trends for a CTET/HPTGT topic; decide on the paper-preference fix and protecting the old `bigquery/*` endpoints.

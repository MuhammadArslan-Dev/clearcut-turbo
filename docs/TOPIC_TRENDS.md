# Topic trends — how they are calculated, refreshed and shown

Phase 114. Backend: `C:\laragon\www\clearcutoff-main-backend`. UI: `apps/dashboard` → Preparation → topic → **Trends** tab (`RelatedContent/Content.tsx`, `Trends`).

## 1. Data flow
```
BigQuery staging.question ──(GET /api/v1/bigquery/syncQuestionsNew)──► SyncQuestionsNewJob
        └─ Bus::batch(SyncQuestionsJobNew × 1000 rows) ─► question_new + question_trans   (unchanged)
              then()  — only when EVERY chunk succeeded
                 SyncQuestionsNewJob::afterBatchSucceeded($exams, $batchId)
                    1. QuestionCacheService::invalidate($exams)        (unchanged: caches + blog)
                    2. RefreshTopicTrendsJob::dispatch($exams)         (new, separate queued job)
                          └─ TopicTrendService::refresh($exams)  → mapping_topic_trends
                          └─ QuestionCacheService::bumpVersion()  (only if a row changed)

GET|POST /api/v1/bigquery/refreshTopicTrends   (no key, like syncQuestionsNew) → same job, all exams or the given ones
```
Trends are **never read from BigQuery**; they are calculated from `question_new` (+ `question_trans`) in our DB. Read path: `STopic::trends` (hasOne) → `PreparationService::getSectionChapters` scopes it to the enrolled exam → `section_chapters_*` cache (30 min, keyed by `QuestionCacheService` version) → Trends tab.

## 2. Calculation rules (the client's SQL, ported unchanged)
Source rows: `question_new` questions that
1. have a **well-formed topic tag** `topic_id_b` = `T_<digits>` (spreadsheet errors `#N/A`, `#REF!` and blanks = *not tagged*: left out of every total, counted as `ignored_untagged_questions`);
2. have an **English version** (`question_trans.locale = 'en'`) — this is what the SQL's `language_code = 'English'` means in our schema (one `question_new` row per question, one `question_trans` row per language). Questions that exist only in Hindi/Sanskrit (language sections) are not counted;
3. have an exam instance (`exam_instance_id_b`, e.g. `CTET_2024`) and a paper (`stage_id_b`, e.g. `CTET_P2`).

Per (topic, paper), over the exam instances the topic appeared in:
| Column | Rule |
|---|---|
| `total_exams` | number of distinct instances |
| `total_questions_in_pyq` | sum of the topic's questions over those instances |
| `weightage_marks_min` / `_max` | min / max questions in one instance (they are **question counts**, UI label "Questions Asked") |
| `avg_questions_per_instance` | `ROUND(avg, 2)` |
| `estimated_weightage_percent` | `ROUND(avg(ROUND(questions × 100 ÷ tagged questions of that instance+paper, 1)), 2)` |
| `last_appeared_year`, `pyq_distribution` | max / sorted list of the 4-digit year in the instance id |
| `topic_importance` | avg ≥ 8 **High**, ≥ 3 **Medium**, else **Low** (`config/topic_trends.php`) |
| `source` | `Based on <EXAM> PYQs (<min year>-<max year>)`, `<EXAM>` = letters before the first `_` of the instance id |
| `topic_trend_id` | `<topic_id>_<stage_id>` |

Mapping to our tables uses the **business ids**: `topic_id_b → s_topics.topic_id`, `stage_id_b → e_stages.stage_id` (the stage gives the exam). The numeric `question_new.topic_id` is only the numeric suffix of the business id (e.g. `T_00885` = 885, while `s_topics.id` is 6264) and is **not** used. Verified: 0 chapter conflicts between a question's chapter and its topic's chapter.

## 3. Write rules
- Insert missing rows, update rows whose values changed, **never delete**. A stored row the calculation no longer produces is kept, logged (`topic_trends.stale_rows_kept`) and reported as `stale_kept`; its `last_computed_at` stays old.
- Only changed rows are written (`updated_at` untouched otherwise); `uuid` is set on create only; unique key `(topic_id, exam_id, stage_id)`; a legacy row with another `topic_trend_id` (`TRD_…`) is adopted by that key.
- One DB transaction per exam; the whole run is serialised by the lock `topic_trends_refresh`; a failure is logged (`topic_trends.failed`), stored for `status`, and never affects the question sync.

## 4. API
Called the same way as the question sync: in the `bigquery` route group, **no key**, GET or POST, and it does not flush the cache store (`withoutMiddleware(flush.cache.after.sync)`). Routes: `routes/Apis/V1/dataapi.php`.
- `GET|POST /api/v1/bigquery/refreshTopicTrends` — params `exams` (`ctet,htet` or an array; omitted = all exams) and `dry_run` (`true`).
  - `dry_run=true` → `200`, calculates and diffs, **writes nothing**, returns the counts.
  - otherwise → `202 {queued:true, scope}`, the job runs on the queue.
  - unknown exam code → `422` listing the valid codes (letters before `_` in the instance id, lower-case: `ctet`, `hptgt`, `htet`, `mahatet`, `ugcnet`, `uptet`, …).
- `GET /api/v1/bigquery/refreshTopicTrends/status` — result of the last real run (`status`, counts, `per_exam`, `trigger`, `finished_at`).
Counts: `computed, created, updated, unchanged, stale_kept, skipped_topic, skipped_stage, ignored_untagged_questions, per_exam, seconds`.

Examples (browser works too): `https://<backend>/api/v1/bigquery/refreshTopicTrends?dry_run=true`, then `https://<backend>/api/v1/bigquery/refreshTopicTrends`, then `.../refreshTopicTrends/status`.
⚠️ The endpoint has no authentication (decision of 2026-11-14, same as the other `bigquery/*` sync routes). It is safe to repeat (idempotent, deletes nothing, ~1 s of work, one run at a time by lock), but anyone who knows the URL can start a refresh.

## 5. Operations
- Deploy: run the migration (`php artisan migrate`) — it **refuses** (changes nothing) if duplicate `(topic_id, exam_id, stage_id)` rows exist; fix them first. A queue worker must be running (same as for the question sync).
- First run after deploy: call `dry_run`, read the counts, then run it for real once (all exams). Afterwards it is automatic after each successful question sync.
- Logs to grep: `topic_trends.refreshed`, `topic_trends.stale_rows_kept`, `topic_trends.skipped_unmapped_topics`, `topic_trends.failed`, `topic_trends.dispatch_failed`.
- Rollback: the migration is reversible (`down()` drops the unique key and `last_computed_at`); data written by a run can be restored from a table dump taken before the first run.

## 6. Known limits (not changed in this phase)
- **Paper preference never matches.** `getSectionChapters` prefers the trend row whose `stage_id` equals the enrollment's `stage_id`, but enrollments store an `e_navigations.id` (e.g. 53 = "English and Hindi") and trends store `e_stages.id` (6/7 = CTET Paper 1/2). Different id spaces → for a topic that has a trend in several papers of one exam (759 topic/exam pairs locally) the student gets the first row, not necessarily their paper's. Needs a navigation → paper mapping (separate change, see phase 114 §6).
- "Questions Asked" is the min–max question count; real marks would need the section's per-question marks.
- `pct_of_exam` uses only tagged questions as denominator (as the SQL does).

# AUDIT — current system (2026-11-11)

This audit is **read-only**. Sources:
- Code reading of BE (`C:\laragon\www\clearcutoff-main-backend`, branch `main`, clean) and CM `apps/dashboard`.
- Read-only `SELECT` queries on the **local dev DB `clearcut`**.
- **Not checked:** production, BigQuery, the n8n workflows and Coolify.

Labels: see [README §5](README.md#5-labels-used-in-these-docs). Line numbers are as of this date.

> ⚠️ The local DB `clearcut` already has the phase-64 enrollment migrations applied (`u_enrollments`, the `v_exam_enrollments` view and others). It is **not** identical to production. Every number below is **[V-local]** until PT-1 repeats it on a production copy.

---

## 1. Systems and data flow

```
BigQuery  clear-cutoff-435016.staging.*   (content team, upstream pipeline [U])
     │  GET /api/v1/bigquery/syncXxx  (unauthenticated, triggered by hand [U: who/when])
     ▼
MySQL (app DB) ── BigQuery-owned tables: exams, e_*, s_subjects, s_chapters, s_topics, mapping_*, s_contents,
     │                                    topic_contents, t_video_contents, t_note_contents, question_new/_trans
     │── App/student tables: u_exam_enrollments / u_enrollments, user_learning_progress, user_learning_interactions,
     │                       user_course_resume_states, exam_attempts*, daily_test_*, practice_test_*, user_syllabus_trackers …
     ▼
Laravel API (V1 legacy + V2)  ──►  dashboard (Next 16), RN WebView app, blog/landing/tools
                               ──►  Amplitude (client + server events), Sentry
n8n  ──► /api/v2/automation/* (daily tests, payments) [V: config/services.php:92-93, routes/Apis/V2/automation.php]
POST /api/v2/admin/db-sync/start (automation.key) copies app tables to a SEPARATE DB with insertOrIgnore [V: SyncDatabaseTableJob.php:64]
```

- **[V]** No admin panel writes syllabus structure. There is no Filament or Nova, and `routes/Apis/V2/admin.php` contains no content writes. Syllabus rows are created **only** by the BigQuery sync endpoints, or by direct DB access **[U]**.

## 2. Content hierarchy and how it is stored

```
exams ─< e_navigations (levels/papers; parent_id tree; `entity` = BigQuery numeric id)
          ─< mapping_navigation_sections >─ e_sections            (each section belongs to exactly 1 exam)  [V-local]
                  ─< mapping_section_chapters (entity_type=SChapter) >─ s_chapters  ── s_subjects
                                                     s_chapters ─< s_topics (parent_id = sub-topics)
s_topics ─< topic_contents (video|note) ─< t_video_contents / t_note_contents ;  s_topics ─< s_contents (morph)
question_new.topic_id (string column holding s_topics.id) + exam_instance_id_b → mini-test pool per exam
```

| Fact | Evidence |
|---|---|
| 14 exams, 133 navigations, 123 sections, 34 subjects, 569 chapters, 6,263 topics (3,534 of them sub-topics) | [V-local] |
| **Chapters are shared across exams.** 299 of 515 mapped chapters appear in 2–8 exams (2: 162, 5: 23, 6: 59, 7: 36, 8: 9) | [V-local] |
| **Top-level topics are shared.** 1,105 of 2,246 mapped root topics appear in more than one exam | [V-local] |
| **Sections are exam-specific.** 112 of 112 mapped sections belong to one exam | [V-local] |
| Likely duplicate subjects: MATH (S_005 / S_0019), SCI (S_006 / S_0015), SST (S_007 / S_0020). Probably split by level, so **not proven equivalent** | [V-local] |
| 11 groups of same-name root topics in different chapters of the same subject | [V-local] |
| No business-key duplicates locally (`s_topics.topic_id`, `s_chapters.chapter_id`, `e_navigations.entity`, `e_sections.section_id`, `topic_contents(b_content_id,type)`, mapping pairs) | [V-local]. Production is [U] (PT-1) |
| No unique index on any of those business keys | [V] migrations |
| No syllabus model uses `SoftDeletes`, although every table has a `deleted_at` column. Any `->delete()` would be a hard delete with cascades. | [V] |
| `ENavigation` calls `Cache::flush()` on saved, updated and deleted | [V] `app/Models/ENavigation.php:44-57` |
| `STopic` eager-loads `children`, `children.content` and `trends` on every query | [V] `app/Models/STopic.php:10` |

## 3. Learning progress today

### 3.1 Tables

| Table | Shape | Problems |
|---|---|---|
| `user_learning_progress` (19,027 rows, 6,924 users) | `user_id, course_id varchar, section_id int, chapter_id int, topic_id FK→s_topics CASCADE, video_watched, notes_taken, mini_quizzes_taken, status, progress_percent, watch_time, timestamps, deleted_at` | Only index is (user_id, course_id). **No unique key** on (user, course, topic) [V]. The model has no SoftDeletes. In some environments, legacy `entity_id/entity_type` columns may still exist (migration edited in place) [U: prod schema] |
| `user_learning_interactions` (4,482) | append-only `user_id, topic_id, interaction_type, meta, notes, interaction_at` | No course column and no dedupe. The enum has both `note_taken` and `notes_taken`. Written by the client in a second call |
| `user_course_resume_states` | unique (user_id, course_id, mode); ids stored as strings | Test-series mode stores an enrollment uuid **or** a group_code. `last_accessed_at` is cast to `date` |
| `user_syllabus_trackers` | Tools self-reported checklist, per chapter, keyed ESection.id → SChapter.id | Separate feature (Tools). Not linked to learning progress |
| `tele_course_progress` | Telegram channel cursor. No user_id | Not student progress |

### 3.2 Writers

| Writer | Code | Behaviour |
|---|---|---|
| **W1 (live)** `POST /v2/interactions/learning-progress` | `UserLearningInteractionController.php:152-226` | `firstOrNew([user, course, topic])` + `save()`. Only the flags that were sent get written. `% = flags/3`; completed when all 3 are set. `section_id` / `chapter_id` come from the client and are never checked. Race: parallel pings can create duplicate rows or leave a stale status (all flags true, status `in_progress`). |
| W2 `POST /v1/progress/create/{courseId}` | `ProgressTrackController.php:46-105` | Writes `entity_type`, a column that no longer exists, so it probably returns 500 [U]. Rewrites `uuid` on every call |
| W3 `POST /v1/progress/mini-test-attempt` | `ProgressTrackController.php:108-151` | Upsert key has **no course_id**. Sets all flags. Rewrites `uuid` |
| Interactions `POST /v2/interactions` | `UserLearningInteractionController.php:80-112` | Plain `create` |
| Resume `POST /v2/interactions/resume-state`, plus a write inside `create-exam` | `:386-425`, `V2/ExamController.php:175-186` | `updateOrCreate`. A concurrent first write can raise a 23000 unique-key error and return 500 |

### 3.3 What each flag means in practice (dashboard)

| Flag | Set when | Evidence |
|---|---|---|
| `video_watched` | When the **"Start Video"** overlay is clicked. `watch_time` is never sent. | [V] `MainVideo/VideoWrapper.tsx:65-128`, `VideoCard.tsx:166-199` |
| `notes_taken` | Notes are opened with **View** (once per mount), or **Download** is tapped (every tap). Viewing and downloading look the same. Notes opened from the content area are not tracked at all. | [V] `RelatedContent/Content.tsx:200-291`, `downloadable-content/components/section-notes.tsx` |
| `mini_quizzes_taken` | **When the mini-test modal opens**, before any answer, even if loading fails. No answers or score are ever stored. | [V] `components/modal/MiniTest.tsx:114-123` |

### 3.4 Readers and aggregates

| Reader | Code | Behaviour |
|---|---|---|
| Sidebar topic ticks and chapter/section/course % | `GET /v2/interactions/learning-progress/by-topic` (`:232-253`) plus **client** `features/preparation/util/progressTracker.ts` | `groupBy('topic_id')->first()` picks an arbitrary duplicate. The client marks a topic complete only when video, notes and mini-test are all done. Chapter totals count only **root** topics, while progress is often recorded on sub-topic ids, so chapters with sub-topics never reach 100%. Topics with no video or mini-test can never complete. |
| Course cards "chapters X/Y, tests X/Y" | `GET /v2/interactions/progress-summary` (`:309-381`) → `MyCoursesWrapTwo.tsx:220-243` | About 6 queries per course, up to 20 courses, no cache. The first query is **not scoped to the user** (`:341-343`). `chapters_completed` counts a chapter as done when any one topic is complete. "Tests" means mini-test flags, and ignores `exam_attempts`. |
| Today Goals | `GET /v2/interactions` (`:25-77`) | Reads interactions only. Not scoped to a course |
| Persisted aggregates | — | **None** [V] |

React Query: `courses-progress-summary`, `learning-progress-by-topic`, `resume-state` and `learning-streak` are **never invalidated** after a report. Only `today-goals` is [V].

### 3.5 Data quality

All numbers below are [V-local].

| Check | Count |
|---|---|
| Duplicate (user, course, topic) groups | 6 groups / 7 extra rows |
| `course_id` = enrollment `group_code` | 14,237 |
| `course_id` = enrollment `uuid` | 2,727 |
| `course_id` matches neither | ~2,063 |
| `chapter_id` ≠ the topic's `s_chapters.id`, of which 2,657 hold a **`mapping_section_chapters.id`** | 4,064 (writer path [U]) |
| Rows on sub-topics | 3,521 |
| `completed` | 599 (3%) |
| Same (user, topic) under two or more courses, already duplicated across exams | 441 pairs |
| Flag totals | video 12,384 · notes 11,654 · mini-test 3,567 (the last means **"opened"**, see §3.3) |

## 4. Test series today

| Kind | Storage | Behaviour and problems |
|---|---|---|
| Chapter / sectional / full-length (V2) | `exam_attempts` (10.8k rows) + `exam_attempt_sections` (canonical `section_id` / `chapter_id` FKs) + `exam_attempt_questions` | `type` ∈ sectional, full-length, chapter. `test_id` → `mapping_sectional_tests` (canonical (type, entity_id)) **or** `mapping_tests` (exam-specific), depending on type. Results are **only** in the `result` JSON. **Every start inserts a new row**: there are 452 duplicate in-progress groups [V-local]. List endpoints pick `MAX(id)` without a status filter, so an unfinished retry hides the earlier score (`SectionalTestService.php:312-334`, `FullLengthExam.php:83-124`). Only index is (user, course, paper). `endExam` locks properly (`ExamController.php:344-435`). `heartbeat` has **no owner check** (`:464`). `ExamAttempt::paper()` points at `EStage` although `paper_id` is an ENavigation id. |
| Legacy V1 | `exam_test_attempts` (34 rows) | No submit endpoint. Effectively dead, but the routes are still mounted |
| Daily test | `daily_test_attempts` | Locked, unique `(user, test, attempt_number)`, idempotent submit. **This is the model to copy.** |
| Practice test | `practice_test_attempts` | Public endpoints. `user_id` is probably always null [U]. The result can be fetched by sequential id (IDOR) |
| Mini / topic test | — | Nothing is stored (§3.3). Questions come from `GET /v2/mini-test/get` (topic plus exam instances) |

## 5. BigQuery synchronization (summary; full rules in [BIGQUERY-SYNC.md](BIGQUERY-SYNC.md))

| Fact | Evidence |
|---|---|
| 24 sync endpoints, all `GET /api/v1/bigquery/*`, **unauthenticated**. Middleware is only `flush.cache.after.sync`. | [V] `routes/Apis/V1/dataapi.php:152-181` |
| No sync is scheduled, and there is no artisan command for any of them. Git history suggests they are run by hand. | [V] `routes/console.php`; who runs them is [U] |
| Writes are additive only (`updateOrCreate`, `firstOrNew()->save()`, `EntityStorageService::storeOrUpdate`). **No sync deletes, truncates or soft-deletes anything.** Numeric PKs stay stable, and rows deleted upstream are never removed locally. | [V] |
| Several syncs **rotate `uuid` on every run**: topics, chapters, subjects, s_contents, both mapping tables, topic trends, sectional/full-length mappings. So `s_topics.uuid` is **not a stable identifier**, and `updated` events fire for every row on every run. | [V] `SyncTopicsChunkJob.php:59`, `ExamRepository.php:725,757,1081,1260` |
| If its chapter is not synced yet, a topic's `chapter_id` is **overwritten to NULL**. It silently drops out of the tree but keeps its PK. | [V] `SyncTopicsChunkJob.php:53,61` |
| `BackfillTopicParentsJob` sets `parent_id` through a query builder, so no model events fire. | [V] `BackfillTopicParentsJob.php:49` |
| Topics, content and questions run as queued jobs on the `database` queue, `--tries=3`. `retry_after` is 90s but job timeouts are 1200–1800s, so a running job can be picked up a second time. No job uses `ShouldBeUnique` or a lock. | [V] `config/queue.php:42`, `Dockerfile.queue-worker` |
| `FlushCacheAfterSync` runs `Cache::flush()` when the request ends, which is **before** the queued jobs have written anything. It also wipes OTPs and rate limits. | [V] `app/Http/Middleware/FlushCacheAfterSync.php:27-30` |
| `?date=` is interpolated into the BigQuery SQL unescaped. | [V] `ExamRepository.php` passim |
| `SyncError` logging is used by topics, topic-content and legacy questions, but not by the inline syncs, `SyncContentChunkJob` or `SyncQuestionsJobNew`. | [V] |
| Note storage: Detailed and Revision notes share one key (`topic_content_id`, `language`), so at most one note row is kept per language. | [V] `SyncTopicContentService.php:76-100` |
| Upstream production of `staging.*` (scheduled queries, sheets) and whether every table has `updated_at`. | [U] `PayloadController.php:103-116` suggests several tables have none |

## 6. Scheduler and queue inventory

- **[V] Scheduled tasks in `routes/console.php`:**
  - `expire-trials` daily 03:00
  - `payments:close-stale-attempts` every 5 min
  - `subscriptions:alert-stuck-authenticated` 09:30
  - `CheckExpiredSubscriptionsJob` 02:00
  - `SendUpcomingRenewalNotificationJob` 09:00
  - `app:send-daily-test-notifications` 08:00
  - `app:check-push-receipts` every 30 min
  - `app:dispatch-due-notifications` every 5 min
  - `cache:prune-expired` 04:00
- **[U]** Whether `schedule:work` or cron actually runs in production, and how many queue workers run. Only `Dockerfile.queue-worker` is in the repo.
- **[V]** Deploy: BE, dashboard and ASTRO auto-deploy when `main` is pushed (memory `project_deploy_pipeline`). **A push to main is a production release.**

## 7. Reusable components

| Component | Reuse for |
|---|---|
| `s_chapters` / `s_topics` + mapping chain | Canonical learning keys (identity covers most shared content) |
| `exam_attempts` engine (per-question rows, locked idempotent `endExam`) | Test series; possibly mini-tests (DECISIONS D6) |
| `daily_test_attempts` pattern (lock, unique attempt number, `retake`) | Mini-test attempts, if they get their own table |
| `user_learning_interactions` | Append-only activity log (extended, not replaced) |
| `SyllabusTreeService` | Reference for building the tree; `exam_syllabus_topics` replaces the duplicated "totals" logic |
| `SyncError` model | Logging rebuild and backfill failures |
| Phase-64 `ENROLLMENT_SOURCE=legacy|dual|new` pattern and its tests (`EnrollmentMirrorTest`, `WritePathTest`) | Progress flags and parity tests |
| Queue worker plus `ShouldBeUnique`; scheduler with `withoutOverlapping` | Rollup fan-out, reconcile |
| `ApiResponse`, FormRequests, ownership chain returning 404 (DEVELOPMENT_RULES §6–7) | New endpoints |
| Dashboard `fetchWithRetry`, React Query keys, `useStreakTracker` re-queue logic | Reporting client |

## 8. Risk register

Columns: severity, where it was found, then the phase that handles it.

| # | Risk | Sev | Where | Handled in |
|---|---|---|---|---|
| R1 | SQL injection: `lang` goes into `orderByRaw` | **Critical** | `V2/Tests/MiniTestController.php:76,121` [V] | PT-0 |
| R2 | BigQuery sync endpoints are public GETs: anyone can trigger full scans and whole-cache flushes. Their `?date=` is injectable. | **Critical** | `dataapi.php:152-181` [V] | PT-0 (needs the caller identified first, see D10) |
| R3 | Sectional-test generation is unauthenticated | High | `routes/Apis/V2/sectional-test.php:13-17` [V] | PT-0 |
| R4 | `heartbeat` has no owner check | High | `V2/ExamController.php:464` [V] | PT-0 |
| R5 | Practice-test result IDOR; any logged-in user can create or delete tests | High | `routes/Apis/V2/practice-test.php` [V] | PT-0 |
| R6 | V1 analytics counts every user's rows; progress-summary enrollment lookup is not user-scoped | Medium | `AnalyticsController.php:154-196`, `UserLearningInteractionController.php:341` [V] | PT-0 |
| R7 | Hardcoded secret fallbacks in `config/services.php` and `config/database.php`, and a hardcoded BigQuery key path | Medium | [V] (values not copied) | PT-0 (rotation is the user's call) |
| R8 | Duplicate or racy progress rows; no unique key | High | §3.2 | PT-3 / PT-6 |
| R9 | Mixed `course_id` formats; `chapter_id` holds two different kinds of id | High | §3.5 | PT-3 / PT-6 |
| R10 | Mini-test marked done when opened; video marked watched on click | High (data meaning) | §3.3 | PT-7 |
| R11 | Duplicate open `exam_attempts`; "attempted" counts unfinished attempts | Medium | §4 | PT-3 / PT-8 |
| R12 | A sync job retried while still running can create a duplicate topic with a **new PK** (no unique key), orphaning new progress | Medium | §5 [I] | PT-1 check, PT-2 hardening |
| R13 | Topic `chapter_id` set to NULL during a partial sync, so it disappears from exam totals | Medium | §5 | PT-4 sanity guard |
| R14 | `s_topics.uuid` rotates, so it can't be used as a stable public id for progress | Medium | §5 | ARCHITECTURE §2 (use the numeric id internally, validated) |
| R15 | `Cache::flush()` from ENavigation and the sync middleware wipes everything, including any cache we add | Medium | §2, §5 | ARCHITECTURE §7 (versioned keys, no reliance on cache) |
| R16 | Production schema drift (`user_learning_progress` legacy columns), duplicates in production, scheduler or worker not running | Unknown | [U] | PT-1 |
| R17 | Hard-delete cascades: deleting an `s_topics` row would delete student progress (`ON DELETE CASCADE`) | High if it ever happens | migrations [V] | New tables use `RESTRICT` (ARCHITECTURE §3) |
| R18 | Phase-64 enrollment migration is half-done in production (u_exam_enrollments vs u_enrollments) | Medium | memory `project_enrollment_table_migration` | New tables keep **no foreign key** to either enrollment table |
| R19 | Streak bugs (timezone mismatch; Carbon 3 `diffInDays` sign probably breaks longest streak). Separate from this project. | Low | `StreakController.php` [V/I] | Out of scope (listed only) |

## 9. Unverified items, to be resolved in PT-1

1. Production `SHOW CREATE TABLE` for `user_learning_progress`, `user_learning_interactions`, `exam_attempts` and the syllabus tables.
2. Production counts for every [V-local] number above, including business-key duplicates.
3. Who calls `/api/v1/bigquery/*`, how often, and in what order (n8n on `n8n.clearcutoff.in`, Postman or browser by the content team). Check the access logs.
4. Whether the scheduler and queue workers run in production, and how many workers there are.
5. Whether a staging environment exists. If not, which production-like DB copy is approved for rehearsal. `clearcut_live_0411` and `clearcut_prod_src` exist locally and were **not opened** here.
6. Which client writes the 2,657 rows where `chapter_id` is a mapping id (RN app or an older dashboard build).
7. Whether the V1 progress endpoints still get traffic (from production logs).

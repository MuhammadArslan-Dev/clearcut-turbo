# ARCHITECTURE — target design

Status: **approved in principle by the user (2026-11-11)**. Details marked 🛑 still need a decision ([DECISIONS.md](DECISIONS.md)).
Everything in this document is **[R] proposed**; nothing exists yet. The current state is described in [AUDIT.md](AUDIT.md).

---

## 1. Table ownership (the core rule)

| Class | Tables | Who writes | Who must never write |
|---|---|---|---|
| **BigQuery-owned** (source of truth for content) | exams, e_instances, e_stages, e_labels, e_navigations, e_sections, mapping_navigation_sections, mapping_section_chapters, mapping_instance_stages, s_subjects, s_chapters, s_topics, s_contents, topic_contents, t_video_contents, t_note_contents, question_new, question_trans, mapping_sectional_tests, mapping_tests, mapping_topic_trends | The BigQuery sync only (`/api/v1/bigquery/*`, its jobs) | Progress code. **No schema change** to these tables in this project, except optional unique indexes in PT-2, with separate approval |
| **Derived from content** (rebuildable, disposable) | `exam_syllabus_topics` (new) | `SyllabusIndexService` only | The sync and student flows. **No student table has a foreign key to it**, so it can be truncated and rebuilt at any time |
| **App-curated content metadata** | `topic_equivalences` (new) | Curation command / admin endpoint (🛑 D7) | The sync. It lives outside BigQuery tables on purpose, so a sync can never overwrite it |
| **Student-generated** (never derived, never overwritten by sync) | `user_topic_progress`, `user_topic_study_contexts`, `user_learning_interactions` (extended), `exam_attempts*` (extended), mini-test attempts, `user_test_progress` | `ProgressService`, test controllers | The sync, `SyllabusIndexService` and rebuild jobs |
| **Derived from student data** (rebuildable) | `user_progress_rollups` (new) | `ProgressRollupService` (recount only) | Anything else |
| **Legacy, kept read-compatible** | `user_learning_progress`, `exam_test_attempts` | Dual-written during rollout; frozen afterwards (PT-13) | — |

Foreign keys from student tables to content tables use **`ON DELETE RESTRICT`**, not CASCADE. A hard delete of a topic then fails loudly instead of silently erasing progress (AUDIT R17). Today no code hard-deletes content [V], so RESTRICT changes no current behaviour.

## 2. Identifiers

| Concept | Internal key | Public / API | Notes |
|---|---|---|---|
| Topic | `s_topics.id` (numeric PK, stable: sync never deletes or recreates) [V] | numeric id, as today. Every request is **validated** against the student's enrolled syllabus (`exam_syllabus_topics`) | `s_topics.uuid` **rotates on every sync** [V], so it cannot be used. Mapping a stable public id is 🛑 D11 |
| Learning key | `COALESCE(topic_equivalences.canonical_topic_id, s_topics.id)` | — | Same row in several exams means same key (identity, the majority case) |
| Exam | `exams.id` | `exam_id` code / enrollment uuid | |
| Course (enrollment) | resolved server-side to `exams.id` + `navigation_id` (level) | enrollment `uuid` **or** `group_code` (both accepted, as today) | New tables store `exam_id`, `navigation_id` and the normalised `enrollment_group_code` string, **with no foreign key** to either enrollment table (phase 64 is unresolved) |
| Section / chapter | `e_sections.id`, `s_chapters.id` | — | **Derived by the server** from `exam_syllabus_topics`; never trusted from the client |

## 3. Schema

All tables are new, InnoDB, utf8mb4 and +05:30 timestamps; migrations are reversible. Column types follow existing conventions (`bigint unsigned` FKs).

### 3.1 `exam_syllabus_topics` (derived; one row per topic placement)

```
id, exam_id, navigation_id (level), section_id, chapter_id, subject_id,
topic_id, parent_topic_id NULL, learning_key,
is_countable (bool: counts toward totals — 🛑 D4 sub-topic rule),
has_video, has_notes, has_mini_test (per exam: question_new.topic_id + exam instances),
chapter_order, topic_order, build_id, created_at, updated_at
UNIQUE (exam_id, navigation_id, section_id, chapter_id, topic_id)
INDEX (exam_id, navigation_id, section_id, chapter_id), INDEX (learning_key, exam_id), INDEX (topic_id)
```
- Plus a small `syllabus_index_builds` log table: `id, scope (exam_id|all), trigger, source_fingerprint, rows_added, rows_removed, rows_changed, status, error, started_at, finished_at`. This powers monitoring and the "abort on suspicious shrink" guard.
- How it is built and kept in sync: [BIGQUERY-SYNC.md](BIGQUERY-SYNC.md).

### 3.2 `topic_equivalences` (curated)

```
topic_id (PK, FK s_topics RESTRICT), canonical_topic_id (FK s_topics RESTRICT),
status enum(proposed, approved, rejected), evidence json (signals), approved_by, approved_at, timestamps
CHECK canonical_topic_id <> topic_id; one level only (service enforces: a canonical topic is never itself mapped)
```
- Only `approved` rows affect `learning_key`.
- Candidates come from a read-only report that matches on several signals: same subject code, normalised name, overlapping `question_new` sets, same content links. **A name match alone is never enough** (user requirement).
- Chapter-level equivalence is derived: a chapter maps to another when all of its countable topics map. Nothing extra is stored.

### 3.3 `user_topic_progress` (global, per user per learning key)

```
id, user_id FK users CASCADE, learning_key FK s_topics RESTRICT,
status enum(not_started,in_progress,completed),
video_started_at, video_completed_at, video_watch_seconds, video_max_position_seconds,
notes_viewed_at, notes_downloaded_at, notes_download_count,
mini_test_attempts, mini_test_best_correct, mini_test_best_total, mini_test_last_attempt_at, mini_test_passed_at,
legacy_mini_test_opened (bool, from backfill only — 🛑 D3),
first_studied_at, last_studied_at, completed_at,
first_exam_id, first_navigation_id, completed_exam_id,
source enum(live, backfill), timestamps
UNIQUE (user_id, learning_key), INDEX (user_id, status), INDEX (user_id, last_studied_at)
```

### 3.4 `user_topic_study_contexts` (exam-wise history; requirement 5)

```
id, user_id, learning_key, topic_id (as studied), exam_id, navigation_id NULL, section_id NULL, chapter_id NULL,
enrollment_group_code NULL, video_done_at, notes_done_at, mini_test_done_at,
first_studied_at, last_studied_at, completed_at, timestamps
UNIQUE (user_id, learning_key, exam_id, navigation_id_key)   -- navigation_id_key = VIRTUAL IFNULL(navigation_id,0) (DEVELOPMENT_RULES §6 pattern)
INDEX (user_id, exam_id)
```
- "Where was this first studied?" is `ORDER BY first_studied_at LIMIT 1`.
- The actual `topic_id` is kept, so a wrong equivalence can be undone.

### 3.5 `user_learning_interactions` (existing; extended additively)

New nullable columns:

```
exam_id NULL, navigation_id NULL, client_event_id NULL varchar(64), source NULL varchar(16), meta (existing)
UNIQUE (user_id, client_event_id)   -- NULLs allowed, so old rows/clients unaffected
```

The new endpoint writes this table server-side, inside the same transaction. The old `POST /v2/interactions` keeps working unchanged.

### 3.6 Mini-test attempts (🛑 D6)

- **Option A (preferred if compatible):** `exam_attempts.type` gains the value `topic`, which reuses the questions table and the locked `endExam`.
  - **Blocker to check:** `exam_attempt_questions.question_id` FKs `question_new`. Confirm the mini-test pool is `question_new` (V2 `MiniTestController.php:18-41` scopes on `question_new.exam_instance_id_b`), not the legacy `questions` table (`getTopicQuestion`).
  - Changing an enum column on a live table is an `ALTER`. Rehearse it on the copy and measure the lock time.
- **Option B:** a new `topic_test_attempts` table cloned from `daily_test_attempts`:

  ```
  user_id, topic_id, learning_key, exam_id, uuid, attempt_number, question_ids, answers, correct, total, status, started_at, completed_at
  UNIQUE (user_id, topic_id, exam_id, attempt_number)
  ```

### 3.7 `exam_attempts` (existing; extended additively)

New nullable columns, filled at submit and by backfill:

```
exam_id NULL, enrollment_group_code NULL, attempt_number NULL,
correct_count NULL, wrong_count NULL, unanswered_count NULL, total_questions NULL, percentage DECIMAL(5,2) NULL,
active_key VARCHAR VIRTUAL = IF(status IN ('started','in_progress'), CONCAT(user_id,':',type,':',test_id), NULL)
UNIQUE (active_key)            -- one open attempt per user/test (PT-3, after closing existing duplicates)
INDEX (user_id, type, test_id), INDEX (user_id, exam_id, type, status)
```

`result` JSON stays the source that existing readers use. The new columns are a copy of it.

### 3.8 `user_test_progress` (per user per test)

```
user_id, exam_id, type enum(chapter,sectional,full_length), test_id, section_id NULL, chapter_id NULL,
attempts_started, attempts_submitted, first_attempt_id, best_attempt_id, latest_submitted_attempt_id,
best_percentage, latest_percentage, first_submitted_at, last_submitted_at, timestamps
UNIQUE (user_id, exam_id, type, test_id)
```

"Attempted" means **submitted**. Cross-exam credit for chapter tests is 🛑 D5.

### 3.9 `user_progress_rollups` (precomputed counts)

```
user_id, exam_id, navigation_id_key, scope_type enum(exam,level,section,chapter), scope_id,
topics_completed, topics_in_progress, video_done, notes_done, mini_test_done, chapters_completed,
chapter_tests_submitted, sectional_tests_submitted, full_tests_submitted,
computed_at, syllabus_build_id
UNIQUE (user_id, exam_id, navigation_id_key, scope_type, scope_id)
```

- Totals are **not** stored per user. They come from `exam_syllabus_topics` grouped per scope (cached per exam and level, keyed by `build_id`).
- Percent = completed ÷ total, computed when read and clamped to 0–100.

## 4. Relationships

```
users ─< user_topic_progress >─ s_topics (learning_key)
users ─< user_topic_study_contexts >─ exams ; >─ s_topics
users ─< user_learning_interactions (event log)
users ─< exam_attempts ─< exam_attempt_sections/questions ;  users ─< user_test_progress
users ─< user_progress_rollups
exam_syllabus_topics : (exam, navigation, section, chapter, topic) placements — joined by learning_key to progress
topic_equivalences : topic_id → canonical_topic_id
```

## 5. Progress calculation

| Rule | Proposal | 🛑 |
|---|---|---|
| Topic completed | All **available** activities for that topic in that exam are done (`has_video` → video completed, `has_notes` → notes viewed or downloaded, `has_mini_test` → a mini-test submitted). If a topic has none of these, it is never countable. | D1 |
| Video "completed" | ≥ 80% of duration watched (`video_max_position`), or the player's ended event | D2 |
| Mini-test "done" | At least one **submitted**, server-scored attempt. Whether a minimum score is needed is a choice. | D1 |
| Sub-topics | Either the parent completes when all its children are complete (children not counted separately), or only leaves count | D4 |
| Chapter completed | Every countable topic in the chapter (for this exam) is completed | — |
| Section / level / exam % | completed countable topics ÷ total countable topics in scope | — |
| Cross-exam | A topic completed under exam A counts as completed under exam B when B contains the same learning key. Availability in B decides completion: if B has a mini-test for the topic but A had none, it shows as "in progress" in B. 🛑 confirm. | D1 |

Status is always **recomputed from the timestamps**, never set by the client.

## 6. Write and update lifecycle

1. The **client** calls `POST /v2/progress/topic-activity`, or the old endpoint while dual-writing.
2. **`ProgressService::record()`** runs in a single DB transaction:
   1. Resolve the enrollment through the ownership chain (404 on any mismatch).
   2. Look up the placement in `exam_syllabus_topics`, which validates the topic and derives section and chapter.
   3. `INSERT … ON DUPLICATE KEY UPDATE user_topic_progress` using only monotonic expressions: `COALESCE(old, new)` for the first timestamp of each kind, `GREATEST` for positions and counts.
   4. `SELECT … FOR UPDATE` that row and recompute its status from the completion rule.
   5. Upsert the context row.
   6. Insert the interaction. A duplicate `client_event_id` makes this a no-op.
   7. If dual-write is on, also upsert the legacy `user_learning_progress` row, keeping today's semantics.
3. **After commit, and only if the status or a first-time activity changed:**
   - Recount the rollups for the current exam synchronously. These are small `GROUP BY`s over at most a few hundred rows.
   - Queue `RecomputeUserRollupsJob(user, exam)` for the user's **other** active enrollments that contain the learning key. The job is `ShouldBeUnique` per (user, exam) and has a short delay to absorb bursts.
4. **On enrollment created or level changed:** queue a rollup recount for that exam. Hook it into the existing `UExamEnrollment::created/updated` hooks, using the same try/catch pattern as the daily-test hook so it can never break enrollment.
5. **On test submit** (`endExam`, after the existing commit): copy the scores into the new columns, upsert `user_test_progress` and recount the rollups. Wrapped in try/catch, so a progress failure never breaks a submit.
6. **On syllabus change:** see [BIGQUERY-SYNC.md](BIGQUERY-SYNC.md). Changed placements trigger a queued rollup recount for users enrolled in the affected exams, chunked.
7. **Nightly reconcile:** recount rollups from scratch for users active in the last 24 hours plus a random sample, compare them with the stored values, fix any difference and report the drift count.

Concurrency guarantees:
- Unique keys on every new table.
- Monotonic upserts, so retries and parallel pings converge.
- Row lock while computing status.
- `ShouldBeUnique` on fan-out jobs.
- `client_event_id` for idempotent retries.

## 7. Performance and caching

| Read | Cost |
|---|---|
| Course cards (≤ 20 courses) | 1 query on `user_progress_rollups` (exam scope) plus cached totals |
| Sidebar ticks | 1 query on `user_topic_progress` joined to the cached chapter tree |
| Section / chapter % | 1 query on rollups by (user, exam, scope) |
| Test lists | 1 query on `user_test_progress` per list |

- Totals are cached under `syllabus_totals:{exam}:{nav}:{build_id}`, a **versioned** key. A `Cache::flush()` (AUDIT R15) only costs one rebuild query and never gives wrong data.
- Nothing depends on the cache for correctness.
- Production-sized EXPLAINs are part of PT-10.

## 8. API

| Endpoint | Status | Notes |
|---|---|---|
| `POST /v2/interactions/learning-progress` | **Kept, same contract** | Becomes a thin adapter onto `ProgressService` once dual-write is on |
| `POST /v2/progress/topic-activity` | New | `{course_id, topic_id, activity: video_started / video_progress{position,duration} / video_completed / notes_viewed / notes_downloaded, client_event_id}` |
| `POST /v2/mini-test/start`, `POST /v2/mini-test/{uuid}/submit` | New | Server-scored. Answer key never sent before submit |
| `GET /v2/interactions/progress-summary` | **Kept, same response shape** | Served from rollups when `PROGRESS_READ_SOURCE=new` (or the user is on the allow-list). Card UI unchanged |
| `GET /v2/interactions/learning-progress/by-topic` | **Kept, same shape** plus optional fields | Adds `completedIn {examShortName, completedAt}` and `progressPercent`. Old clients ignore extra fields |
| `GET /v2/progress/topic/{topic}/history?course_id=` | New (data only) | Exam-wise history for future UI |
| `GET /v2/test/sectional/{course}`, `/v2/test/list/{course}` | **Kept, same shape** | Counts come from `user_test_progress` when the flag is on; fixes "attempted = submitted" |

Every endpoint uses `auth:sanctum`, the `ApiResponse` envelope, the ownership chain (404 on mismatch) and FormRequest validation.

## 9. Feature flags (backend `config/progress.php`, env-driven)

| Flag | Values | Default |
|---|---|---|
| `PROGRESS_WRITE_MODE` | `legacy` · `dual` · `new` | `legacy` |
| `PROGRESS_READ_SOURCE` | `legacy` · `new` | `legacy` |
| `PROGRESS_READ_ALLOWLIST` | comma-separated user ids (internal testers first) | empty |
| `PROGRESS_ROLLUPS_ENABLED` | bool | false |
| `SYLLABUS_INDEX_AUTO_REBUILD` | bool | false |
| `MINI_TEST_SERVER_SCORING` | bool (the dashboard reads it from the API capability field) | false |

The dashboard keeps working in every combination: response shapes never change.

## 10. Components added (complete list)

**Backend:**
- `App\Services\Progress\ProgressService`
- `ProgressRollupService`
- `SyllabusIndexService`
- `TopicEquivalenceService` (report and apply)
- Jobs: `RebuildSyllabusIndexJob`, `RecomputeUserRollupsJob`
- Commands: `syllabus:rebuild`, `progress:backfill`, `progress:parity`, `progress:reconcile`, `topic-equivalence:report`
- One controller: `V2/ProgressController`
- Mini-test start/submit added to the existing V2 `MiniTestController`
- `config/progress.php`

**Dashboard:**
- One shared `reportTopicActivity()` that replaces the three copy-pasted report blocks.
- Query invalidation.
- Mini-test start/submit wiring.

That is everything. There is no event bus, no CQRS framework and no extra repositories beyond the existing pattern.

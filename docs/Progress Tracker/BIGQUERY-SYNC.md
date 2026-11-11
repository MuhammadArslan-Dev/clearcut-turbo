# BIGQUERY-SYNC — integration rules

Facts below come from code reading (2026-11-11). See [AUDIT.md §5](AUDIT.md#5-bigquery-synchronization-summary-full-rules-in-bigquery-syncmd) for the evidence. **The Progress Tracker does not change the BigQuery upstream, the `staging.*` tables, or the existing sync code.** PT-2 is the exception: it is separate, optional hardening that needs its own approval.

---

## 1. Source-of-truth definitions

| Data | Source of truth | Local copy | May the Progress Tracker write it? |
|---|---|---|---|
| Exams, levels/papers, sections, subjects, chapters, topics, mappings, contents, video/notes, questions, test mappings | **BigQuery** `clear-cutoff-435016.staging.*` | BigQuery-owned MySQL tables (ARCHITECTURE §1) | **Never** |
| Placement index (`exam_syllabus_topics`), per-exam totals | **Derived** from the local BigQuery-owned tables | Rebuildable | Yes: `SyllabusIndexService` only |
| Topic equivalence | **App-curated** (`topic_equivalences`) | — | Yes, curation flow only (🛑 D7: or should it move upstream into BigQuery later?) |
| Student activity, attempts, progress, history, rollups | **Application** | — | Yes. The BigQuery sync must **never** touch them, and it doesn't today [V] |

Rules:
1. **One-way flow:** BigQuery → content tables → derived index → (joined at read time) student progress. Nothing flows back.
2. Student rows reference content only by local numeric PK (`s_topics.id`, `e_sections.id`, …). The sync keeps these stable: it never deletes or recreates rows [V].
3. No student table has a foreign key to `exam_syllabus_topics`, so rebuilding the index can never cascade into student data.
4. Student foreign keys to content use `RESTRICT`. A future accidental hard delete fails instead of erasing progress.

## 2. Current sync behaviour that this design depends on

| Behaviour | Status | Consequence for the Progress Tracker |
|---|---|---|
| Upsert-only, no deletes | [V] | PKs are stable, so progress keys survive. Content deleted upstream **stays locally**, so the index will keep showing it. This matches today's app behaviour; changing it is out of scope (🛑 D12). |
| `uuid` rotated on every run for topics, chapters, subjects, mappings, … | [V] | Never use those `uuid`s as identifiers. Model `updated` events fire for every row on every run, so **don't use per-row observers** as change triggers. |
| Topic `chapter_id` overwritten to NULL when the chapter isn't synced yet | [V] | A topic can vanish from the index after a bad sync order, so the rebuild has a shrink guard (§4.4). |
| Parent topics set by query builder (no events) | [V] | Observers would miss it anyway. Rebuild from table state instead. |
| `retry_after` 90s vs job timeouts of 1200–1800s; no unique keys or locks | [V] | A duplicate topic with a new PK is possible [I]. Detected by reconciliation (§6); PT-2 can prevent it. |
| Cache flushed at request end, before queued jobs finish | [V] | Our caches are versioned by `build_id`, so they're correct whether a flush comes early or late. |
| Sync triggers are manual GETs, nothing scheduled | [V] / caller [U] | We can't hook "sync finished" without touching the sync code, so §3 detects changes from table state instead. |
| `has_mini_test` depends on `question_new.topic_id` plus the exam's `exam_instance_id_b` | [V] | Computed per exam during the rebuild. |
| One note row per language (Detailed/Revision share a key) | [V] | `has_notes` is just "a note row exists in any language". The UI doesn't change. |

## 3. How `exam_syllabus_topics` follows content changes

**[R] Recommended: change detection by fingerprint, with zero changes to the sync code.**

1. Scheduled command `syllabus:check` runs every 10 minutes (`withoutOverlapping`, `onOneServer`). It computes a cheap **source fingerprint**:
   - For each source table in §3.1: `COUNT(*)`, `MAX(updated_at)` and `MAX(id)`.
   - Every sync writes `updated_at` through Eloquent, and uuid rotation guarantees it changes on each run [V].
2. If the fingerprint differs from the last successful build in `syllabus_index_builds`, the command checks whether a sync is still running. It treats the sources as "quiet" when `MAX(updated_at)` across them is older than **5 minutes** and the `jobs` table has no pending `Sync*` jobs. If they are quiet it dispatches `RebuildSyllabusIndexJob(all)`, otherwise it waits for the next tick. This avoids building from a half-finished sync.
3. **Manual paths:**
   - `php artisan syllabus:rebuild {--exam=} {--dry-run}`, run by the user on the server.
   - An authenticated `POST /v2/automation/syllabus-index/rebuild` behind the existing `automation.key` middleware. It can be called from n8n after a sync, if the content team wants instant updates.
4. **Optional, later, approved separately (PT-2):** append `RebuildSyllabusIndexJob` to the end of the topic `Bus::chain`, the topic-content jobs and the questions batch `then()`. Fingerprinting stays in place as the safety net.

> **Precondition [U]:** the Laravel scheduler must run in production (PT-1 verifies this). If it doesn't, the existing schedules (trial expiry, payment cleanup) aren't running either, which is a bigger finding that goes to the user first.

### 3.1 Source tables read by the rebuild

`exams`, `e_navigations`, `mapping_navigation_sections`, `e_sections`, `mapping_section_chapters` (only rows with `entity_type = SChapter`), `s_chapters`, `s_subjects`, `s_topics`, `topic_contents` (only `is_published`), `t_video_contents`, `t_note_contents`, `question_new` (`topic_id`, `exam_instance_id_b`), `e_instances`, and `topic_equivalences` (approved rows only).

Rows with `deleted_at IS NOT NULL` are excluded, even though nothing sets that column today.

## 4. Rebuild algorithm (`SyllabusIndexService::rebuild($examId|null)`)

### 4.1 Build
- For each exam:
  1. Build the **desired set** with set-based SQL: navigation → section → chapter → topic, including sub-topics with `parent_topic_id`.
  2. Compute `has_video`, `has_notes` and `has_mini_test` (per exam), plus `learning_key` and `is_countable`.
- Everything is read-only against the BigQuery-owned tables.

### 4.2 Diff and apply (idempotent)
- Compare the desired set with the current rows for that exam, using the unique key `(exam, navigation, section, chapter, topic)`:
  - insert rows that are missing
  - update rows whose flags or order changed
  - delete rows that are no longer placed
- Run this in **one transaction per exam**, so readers see either the old placement set or the new one, never a mix.
- Write `build_id`, plus the add/change/remove counts, to `syllabus_index_builds`.
- Running it twice in a row on unchanged sources is a no-op: 0/0/0.

### 4.3 What a rebuild never does
- It never touches student tables.
- It never deletes progress. If a topic is removed from an exam, only its placement row goes away. `user_topic_progress` stays, and so does the history in `user_topic_study_contexts`. If the topic comes back, the progress shows again automatically.

### 4.4 Safety guard
- **Abort** the exam's transaction, keep the old rows, log a `SyncError` (`job_name = RebuildSyllabusIndex`) and alert if any of these happen:
  - the exam ends with 0 rows
  - more than **5%** of its rows would be removed (threshold configurable)
  - more than 20% of its chapters would lose all topics
- An override flag `--force` is for the user only, after they review the dry-run diff.

### 4.5 After a successful build
- For each exam with changes, queue `RecomputeUserRollupsJob` for its enrolled users, chunked at 500 users per job.
- Recounts are idempotent (ARCHITECTURE §6).
- Bump the cache version (`build_id`).

## 5. Conflict handling

| Conflict | Handling |
|---|---|
| Sync running during a rebuild | The quiet-period check (§3 step 2) delays the rebuild. A rebuild that does run on half-synced data is caught by the shrink guard, or fixed by the next tick, because it is idempotent. |
| Two rebuilds at once | `RebuildSyllabusIndexJob` is `ShouldBeUnique` and also takes `Cache::lock('syllabus-index-rebuild', 900)`. On a lock clash it re-releases with a delay. |
| Topic re-parented or moved to another chapter | The placement row changes. Progress stays on the learning key, so the student keeps credit in the new location. |
| Same topic code arriving with a new PK (duplicate race) | Reconciliation (§6) flags `s_topics.topic_id` codes that have more than one PK. A manual merge runbook re-points progress rows ([MIGRATION.md §7](MIGRATION.md)). Rollups are never trusted until it is resolved. |
| Equivalence approved or revoked | Rebuild the index (the `learning_key` changes). Recount the rollups of affected users. Re-key `user_topic_progress` rows with `progress:rekey` (it merges using the monotonic rules and is rebuildable from contexts plus interactions). Contexts are never rewritten. |
| Topic removed upstream (stays locally today) | Index keeps it as long as the local mappings keep it (current behaviour). 🛑 D12 decides whether to support an explicit "retired" flag later. |

## 6. Reconciliation and validation

`progress:reconcile` runs nightly at 04:30 (`withoutOverlapping`) and on demand. It is read-mostly and auto-fixes only derived tables.

1. **Index vs. source:** recompute the desired set and diff it against the stored rows. Expect 0 differences outside a running sync. Any difference triggers a rebuild and is recorded.
2. **Business-key duplicates:** count duplicate `s_topics.topic_id`, `s_chapters.chapter_id`, `e_navigations.entity`, `e_sections.section_id` and mapping pairs. Expect 0. If any are found: alert, no auto-fix.
3. **Orphans:** student rows whose `learning_key` no longer exists in `s_topics`. This should be impossible with RESTRICT; alert if any appear.
4. **Rollups:** recount from scratch for users active in the last 24 hours plus 1% random, compare and fix. Report the drift count; it should be 0.
5. **Coverage:** topics with progress but no placement in any exam the user is enrolled in. This is informational: the content was removed from the exam.

## 7. Failure recovery and retries

| Failure | Recovery |
|---|---|
| Rebuild exception or deadlock | Per-exam transaction rolls back and the old rows stay. Job `tries=3`, `backoff=[30,120,600]`, `timeout=600`. It runs on a dedicated `syllabus` queue with `retry_after` 900 (> timeout), avoiding the 90s re-pick problem (AUDIT §5). The next scheduled check retries anyway. |
| Shrink guard triggered | No change applied; `SyncError` plus alert. A human reviews the dry-run output. A partial sync is usually fixed by re-running the sync, after which the next tick rebuilds. |
| Rollup recount fails | Retried by the queue. The nightly reconcile repairs anything left. |
| Queue worker down | Writes still succeed: topic progress is updated synchronously and only rollups lag. Card numbers then lag until the reconcile or the worker returns. Monitoring alert on the age of the oldest job. |
| Scheduler down | No automatic rebuilds. Manual `syllabus:rebuild` still works. Alert if the newest `syllabus_index_builds` row is older than 24 hours. |

## 8. Monitoring

| Signal | Where | Alert threshold |
|---|---|---|
| Rebuild result (added/changed/removed, duration, status) | `syllabus_index_builds` + log channel `progress` | Status failed or guard triggered; duration > 120s |
| Time since last successful build vs. source fingerprint change | `syllabus:check` | Fingerprint changed more than 1 hour ago with no successful build |
| Reconcile drift (index diff, rollup drift, business-key duplicates, orphans) | `progress:reconcile` output → Sentry message (warning) | Any non-zero (except coverage) |
| Queue lag on `progress` and `syllabus` queues | `jobs` table oldest `available_at` | > 15 min |
| Progress write errors / 5xx on new endpoints | Sentry (existing integration), `ApiResponse` errors | Error rate > 1% over 15 min |
| `SyncError` rows from the existing sync | `sync_errors` | Shown alongside; not owned by this project |

## 9. What the content team or user must verify (from AUDIT §9)

- [ ] Who triggers `/api/v1/bigquery/*`, in what order, and how often.
- [ ] Whether the scheduler and queue worker(s) run in production, and how many workers there are.
- [ ] Whether every `staging.*` table has a reliable `updated_at` (it affects only `?date=` incremental syncs; our fingerprint uses the local `updated_at`, which Eloquent always sets).
- [ ] Whether there are business-key duplicates in production (PT-1 SQL).

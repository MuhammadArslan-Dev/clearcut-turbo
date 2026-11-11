# MIGRATION — cleanup, backfill, dual-write, rollout, rollback

**Golden rules:**
1. Every step runs first on a **production-like copy**, never on `clearcut` (the shared dev DB), and never on a remote or shared DB (🛑 D9 picks the copy).
2. Never mutate legacy data in place without a recorded **before-snapshot table** of the affected rows.
3. Production commands are **run by the user** (memory `feedback_no_self_run_prod_commands`). These docs provide the exact commands.
4. A push to `main` is a production deploy. Push only after an explicit go-ahead.

---

## 1. Environments

| Env | Use | Status |
|---|---|---|
| Local copy (🛑 D9: `clearcut_live_0411`, `clearcut_prod_src`, or a fresh dump the user provides) | Rehearse every migration, backfill and parity check. Measure timings and lock durations. | Exists locally; **not opened** in this audit |
| Throwaway test DB (e.g. `clearcut_pt_test`) | `php artisan test` for this project only, with `--list-tests` checked first | To be created in PT-1 (with approval) |
| Staging | Full end-to-end with the dashboard | [U] Does one exist? (🛑 D9) |
| Production | Final rollout | Changed by the user only, step by step |

## 2. Backups (before every production schema or data step)

1. Take a full logical dump of the app DB, run by the user on the server. Example, adjusted to the real container or host:

   ```
   mysqldump --single-transaction --routines --triggers <db> | gzip > pt-<phase>-<date>.sql.gz
   ```

2. Check the dump is usable: `gunzip -t`, then restore it into a local scratch DB and compare row counts on `users`, `user_learning_progress` and `exam_attempts`.
3. For data-changing steps, keep an in-DB snapshot of the affected rows as well, e.g. `pt_backup_ulp_dedupe_20261120`. The snapshot is **kept for 30 days**, and dropped only with approval.
4. Record the dump name and the snapshot table names in the phase file's §4.

## 3. Existing-data cleanup (PT-3), each step reversible

| Step | What | Reversible by |
|---|---|---|
| C1 | **Normalise `user_learning_progress.course_id`.** For rows where `course_id` equals an enrollment `uuid`, set it to that enrollment's `group_code` (2,727 locally). Rows that match neither (~2,063) are **left untouched** and listed in a report (orphan or deleted enrollments) | Snapshot table (id, old course_id) |
| C2 | **Repair `chapter_id`.** Root topics: use `s_topics.chapter_id`. Sub-topics: use the parent's chapter. The 2,657 mapping-id rows are covered by this. The table has no metadata column, so the old values are kept only in the snapshot | Snapshot (id, old chapter_id) |
| C3 | **Deduplicate (user, course, topic).** Merge into the oldest row: OR the flags, MIN `first_accessed_at`, MAX `last_accessed_at`, recompute status. Soft-delete the extra rows (set `deleted_at`). Readers that ignore `deleted_at` are fixed in the same phase (`by-topic` adds `whereNull('deleted_at')`), or the rows are moved to the snapshot and hard-deleted. 🛑 D13 | Snapshot of the full duplicate rows |
| C4 | **Add `UNIQUE(user_id, course_id, topic_id)`** to `user_learning_progress` after C1–C3. Change W1's `firstOrNew` to an atomic upsert that catches duplicate-key errors (23000), so behaviour stays the same | Migration `down()` drops the index |
| C5 | **Close duplicate open `exam_attempts`.** For each (user, course, test, type) with more than one `in_progress`/`started` row, keep the newest and mark the older ones `expired`. Never touch `submitted` rows | Snapshot (id, old status) |
| C6 | **Make `createExam` idempotent** (return the open attempt), then add the `active_key` unique index | Revert code; drop the index |

Each step comes with a **dry-run** mode that prints counts only, which are compared on the copy against SQL run by hand.

## 4. Backfill (PT-6 / PT-8)

`php artisan progress:backfill {--users=} {--chunk=500} {--dry-run}` is idempotent: it is upsert-only, using the same monotonic rules as live writes, and resumes from a cursor (last `user_id`). It runs on a low-priority queue or in a terminal, with no lock held for longer than one chunk.

| Target | From | Rules |
|---|---|---|
| `user_topic_progress` | `user_learning_progress` (after C1–C4) grouped by (user, learning_key) | `video_started_at` ← first row with `video_watched` (use `updated_at` when there is no better timestamp; marked `source=backfill`). `notes_viewed_at` ← same from `notes_taken`. `legacy_mini_test_opened` ← `mini_quizzes_taken` (**not** counted as a mini-test attempt, 🛑 D3). `first_studied_at` = MIN(`first_accessed_at`). `first_exam_id` = exam of the earliest row. Status is recomputed with the new rule (D1), so legacy `completed` (all 3 flags) maps to completed only if the new rule agrees. Disagreements are reported. |
| `user_topic_study_contexts` | each legacy row → course → enrollment → exam/navigation | Rows whose course can't be resolved get `exam_id` NULL. They stay in the global progress only. |
| `user_learning_interactions` new columns | — | Left NULL for history; not needed |
| `exam_attempts` new columns | the `result` JSON | `correct/wrong/unanswered/percentage`, `exam_id` from `course_id` (group_code or uuid), `attempt_number` by `ROW_NUMBER()` per (user, type, test) ordered by `id` |
| `user_test_progress` | submitted `exam_attempts` | first, best and latest per (user, exam, type, test) |
| `user_progress_rollups` | recount from the above | Run after the index exists (PT-4) |

**Historical meaning caveat:** before PT-7, "video" meant "Start clicked" and "mini-test" meant "opened". The backfill keeps those as `*_started_at` / `legacy_mini_test_opened`, so they are never upgraded to "completed" by accident (🛑 D3 decides how they count).

## 5. Dual-write and parity

1. `PROGRESS_WRITE_MODE=dual`: every write updates **both** the legacy row (same semantics as today) and the new tables, in one transaction.
   - A failure in the new-table write is caught, logged to Sentry and **does not fail the request**. In dual mode the legacy write is authoritative.
   - Compared with phase 64's strict mirror, this is a deliberately softer choice, because progress pings are fire-and-forget.
2. Run the backfill **after** dual-write is on, so rows written live in between are not missed. Monotonic upserts make the overlap harmless.
3. `php artisan progress:parity {--users=} {--sample=}` reports differences per user:
   - legacy topic flags vs new activity timestamps
   - legacy `progress-summary` numbers vs rollups (expected to differ where the old rules were wrong: they get categorised, not just counted)
   - test counts from the old list endpoints vs `user_test_progress`
4. **Acceptance:** zero **unexplained** differences on the full copy, and on production for 7 consecutive days. Every explained category (old bug fixed) is listed in the phase file and signed off by the user.

## 6. Production rollout sequence

Each step is a separate deploy and a separate approval. Do not combine them.

1. **PT-0 security fixes** (independent).
2. **Additive migrations** (new tables and columns), with flags at their defaults. Nothing reads or writes them yet. Verify: app unchanged, error rate flat.
3. **PT-3 cleanup** (C1–C6), using backups and snapshots.
4. **Syllabus index:** run `syllabus:rebuild --dry-run`, review, run it for real, then turn on `SYLLABUS_INDEX_AUTO_REBUILD`.
5. `PROGRESS_WRITE_MODE=dual`, then the backfill, then the parity checks (7 days).
6. `PROGRESS_ROLLUPS_ENABLED=true`, then the reconcile reports drift = 0 for 3 nights.
7. `PROGRESS_READ_ALLOWLIST=<internal users>` and verify the cards and sidebars against the DB, then widen to 10% of users → 50% → `PROGRESS_READ_SOURCE=new`.
8. PT-7 dashboard reporting changes plus `MINI_TEST_SERVER_SCORING`: deploy BE first, then the dashboard (the app WebView picks it up automatically).
9. After at least 30 days stable: `PROGRESS_WRITE_MODE=new` (legacy table frozen). Retiring legacy (PT-13) needs a separate approval.

## 7. Rollback and recovery

| Situation | Action | Data impact |
|---|---|---|
| New read path shows wrong numbers | `PROGRESS_READ_SOURCE=legacy` (env change and config reload, run by the user) | None: the legacy table is still written in dual mode |
| New write path errors | `PROGRESS_WRITE_MODE=legacy` | New tables stop updating. Re-run the backfill later to catch up (idempotent) |
| Rollup drift | `PROGRESS_ROLLUPS_ENABLED=false`, then fix, then `progress:reconcile --full` | Derived only; rebuild from source |
| Bad syllabus index | `SYLLABUS_INDEX_AUTO_REBUILD=false`, then `syllabus:rebuild --exam=X` after fixing the data | Derived only. Can be truncated and rebuilt |
| Cleanup step went wrong (C1–C5) | Restore the affected columns from the snapshot table with the prepared `UPDATE … JOIN pt_backup_…` (written and rehearsed **before** the step runs) | Exact restore of the changed columns |
| Migration problem | `php artisan migrate:rollback --step=1` (every migration has a tested `down()` that drops only what it added) | New tables or columns only |
| Catastrophic | Restore the full dump from §2 into a new DB and switch over (user-run). Rehearse once on the copy in PT-10 and record how long it takes | Last-resort |
| Duplicate topic PK found (BIGQUERY-SYNC §5) | Runbook: identify the canonical PK (oldest, referenced by mappings), re-point `user_topic_progress`, contexts and interactions in one transaction with a snapshot, then fix the duplicate in BigQuery or locally with the content team | Student rows preserved |

## 8. Backward compatibility guarantees

- Response shapes of `progress-summary`, `by-topic` and the test lists **don't change**; only additive optional fields are added.
- The old write endpoints keep accepting the old payloads until PT-13.
- `MyCourseCard` / `MyCoursesWrapTwo` are untouched (client-approved).
- The RN app (WebView) needs no release; it renders the dashboard.
- V1 endpoints keep their current (broken or legacy) behaviour until PT-13. They are not removed silently.

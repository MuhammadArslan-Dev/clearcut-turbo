# Progress Tracker — project plan

**Status:** Planning only. Nothing has been implemented. No code, migrations, data, BigQuery tables, sync jobs or deploy settings have been changed.
**Created:** 2026-11-11
**Branch for these docs:** `docs/progress-tracker-plan` (clearcut-master). Not committed or pushed.
**Repos involved:**
- **BE**: `C:\laragon\www\clearcutoff-main-backend` (Laravel 12, most of the work)
- **CM**: this repo, `apps/dashboard` (reporting calls and invalidation)

**Approval gate:** Stop at every 🛑 in [DECISIONS.md](DECISIONS.md). No phase starts until the user approves it explicitly. Approval of one phase does not carry over to the next.

---

## 1. What we are building

A student progress system for the live LMS that is accurate, works across exams, and is precomputed:

1. **Hierarchical learning progress:** exam → level (paper) → section (subject) → chapter → topic.
2. **Cross-exam recognition:** a topic completed in HTET shows as completed in UPTET when it is the same learning content.
3. **Learning activities per topic:** video, notes (viewed / downloaded) and mini-test, each with timestamps and, for the mini-test, attempts and score.
4. **Test-series tracking:** chapter, sectional and full-length tests, each with attempts, scores, completion and counts.
5. **Exam-wise learning history:** every exam a topic was studied in, and where it was first studied and completed. Stored now, even though no UI shows it yet.
6. **Precomputed progress:** course cards and sidebars read stored numbers instead of recomputing them on every page load.

## 2. Non-negotiable principles

| # | Principle | What it means in practice |
|---|---|---|
| P1 | **Nothing live breaks** | Changes are additive only (new tables and nullable columns). Existing endpoints keep the same response shapes. Old tables and endpoints are retired only after the new path is proven in production, with separate approval. |
| P2 | **BigQuery content and student data never mix** | The BigQuery sync owns syllabus and content tables. The app owns student tables. The sync never writes a student table. Progress code never writes a BigQuery-owned table. Derived tables are rebuilt from BigQuery-owned tables, and no student row has a foreign key into them. |
| P3 | **Feature flags and dual paths** | Writes go to legacy only, then both (dual), then the new tables. Reads come from legacy, then from new for an allow-list of users, then for everyone. Each switch is reversible by changing an env var. |
| P4 | **Recount, don't increment** | Every aggregate is recomputed from source rows, so it is idempotent and repairable. |
| P5 | **Store ids, derive names** | DEVELOPMENT_RULES §6. Names and translations always come from the current syllabus. |
| P6 | **Reuse before adding** | Reuse `exam_attempts` (the test engine), `user_learning_interactions` (the event log), the queue worker, the scheduler, `SyncError`, the `ApiResponse` envelope and the phase-64 rollout pattern. No event bus, no new services beyond one `ProgressService` and one `SyllabusIndexService`. |
| P7 | **Rehearse every risky step on a copy first** | Every migration, backfill and parity check runs on a production-like copy before production. Never on the shared or remote DBs, and never as broad `php artisan test` runs against a real DB (see `feedback_backend_tests_wipe_db`). |

## 3. Scope

**In:**
- Backend schema and services for progress.
- The derived syllabus index (`exam_syllabus_topics`) and how it stays in sync.
- Cross-exam topic equivalence.
- Server-scored mini-tests.
- Test-series summaries.
- Rollups.
- Backfill and migration of existing data.
- Dashboard reporting fixes (what gets reported, and when).
- Security fixes found during the audit.
- Monitoring.

**Out, for now:**
- New UI. Course cards are client-approved and are not restyled.
- The cross-exam "completed in HTET" badge. It is designed (PT-12) but needs separate design approval.
- Changing the BigQuery upstream (`staging.*` tables).
- The phase-64 enrollment-table migration (it stays paused; this plan does not depend on its outcome).
- The streak bugs found during the audit. They are listed in AUDIT.md §8 and handled separately if wanted.

## 4. Documentation index

| File | What it holds |
|---|---|
| [AUDIT.md](AUDIT.md) | The current system as verified: data flow, schemas, writers and readers, BigQuery sync, risks and data-quality numbers |
| [ARCHITECTURE.md](ARCHITECTURE.md) | Target design: tables, relationships, ownership, progress calculation, sync lifecycle, API |
| [BIGQUERY-SYNC.md](BIGQUERY-SYNC.md) | Source-of-truth rules, how `exam_syllabus_topics` follows syncs, idempotency, failure recovery, reconciliation, monitoring |
| [MIGRATION.md](MIGRATION.md) | Cleanup, deduplication, normalisation, backfill, dual-write, parity, rollout, rollback, recovery |
| [ROADMAP.md](ROADMAP.md) | Phases PT-0 … PT-13: files allowed to change, what must not change, steps, tests, rollback, done criteria, effort |
| [TESTING.md](TESTING.md) | Unit, integration, regression, concurrency, migration, sync, performance and production-safety tests |
| [DECISIONS.md](DECISIONS.md) | Decisions taken, assumptions, open questions and approval gates |

## 5. Labels used in these docs

| Label | Meaning |
|---|---|
| **[V]** | Verified in code (file:line) or by a read-only SQL query on the local dev DB `clearcut` |
| **[V-local]** | Verified on the local DB only. Production may differ, and checking it is a PT-1 task. |
| **[A]** | An assumption we are working with until it is verified |
| **[R]** | A recommendation |
| **[U]** | Unverified. It could not be checked from the repos and needs the user or production access. |

## 6. How a future session resumes

1. Read root `CLAUDE.md`, `docs/DEVELOPMENT_RULES.md`, then this folder in index order.
2. Open [ROADMAP.md](ROADMAP.md), find the first phase not marked Done, and check its prerequisites and 🛑 items in [DECISIONS.md](DECISIONS.md).
3. Create the phase file `docs/phases/NN-progress-tracker-ptX-….md` from `_TEMPLATE.md` (rule: phase doc first). Work on a dedicated branch in the canonical repo. Never use worktrees or copies of the repo.
4. Update the status table in ROADMAP.md §0 when a phase changes state.

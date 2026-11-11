# DECISIONS — technical decisions, assumptions, open questions

Legend:
- ✅ decided
- 🛑 needs the user's decision before the phase named in the "Blocks" column
- ⚠️ system impact (prod env, deploy config, other apps, analytics or payments): explicit approval needed

## 1. Decisions taken

| # | Decision | Why | Date |
|---|---|---|---|
| T1 | ✅ Progress is stored **per user per learning key**, not per course. Exam context is kept as history | Topics are already shared rows across exams (AUDIT §2); per-course keys duplicate them | 2026-11-11 (architecture approved by user) |
| T2 | ✅ Canonical identity = `s_topics.id`. Curated equivalences live in an **app-owned** `topic_equivalences` table, **not** in a column on `s_topics` | `s_topics` is BigQuery-owned; keeping the curated data separate means a sync can never overwrite it | 2026-11-11 (changed from the first proposal, which put a column on `s_topics`) |
| T3 | ✅ `exam_syllabus_topics` is a derived, disposable table. No student foreign key points at it | It can be rebuilt or truncated with zero risk to student data | 2026-11-11 |
| T4 | ✅ Index sync uses **fingerprint polling plus a scheduled rebuild**, not model observers or sync-code hooks | uuid rotation and query-builder updates make observers unreliable; this needs zero changes to sync code (BIGQUERY-SYNC §3) | 2026-11-11 |
| T5 | ✅ Reuse `exam_attempts` for test series (additive columns); reuse `user_learning_interactions` as the event log | Avoids duplicate tracking systems | 2026-11-11 |
| T6 | ✅ Rollups are recounted, never incremented. Totals come from the index, so a syllabus change needs no rewrite of user data | Repairable and idempotent | 2026-11-11 |
| T7 | ✅ Student foreign keys to content use `RESTRICT` | Accidental hard deletes fail loudly instead of erasing progress | 2026-11-11 |
| T8 | ✅ No foreign key from new tables to either enrollment table. Store `exam_id`, `navigation_id` and the normalised `group_code` | Phase 64 (enrollment tables) is paused and half-migrated in prod | 2026-11-11 |
| T9 | ✅ Same response shapes on existing endpoints; flags for writes and reads; `MyCourseCard` untouched | Live LMS, client-approved UI | 2026-11-11 |
| T10 | ✅ The docs live in `docs/Progress Tracker/`; each implementation phase still gets its own `docs/phases/NN-…` file | User request plus the repo's phase-doc-first rule | 2026-11-11 |
| D1 | ✅ **Completion = all activities that exist for the topic.** Video = ≥ 80% watched or the ended event (this also settles **D2**). Mini-test = one submitted attempt, with no minimum score | User | 2026-11-11 |
| D3 | ✅ **Old flags are not counted as completed.** They are stored as `legacy_mini_test_opened` / `video_started_at` | User | 2026-11-11 |
| D4 | ✅ **A parent topic completes when all its sub-topics complete.** Only parent (root) topics count in totals | User | 2026-11-11 |
| D9 | ✅ **New local copy `clearcut_pt`** (dump of the local `clearcut`, created 2026-11-11) for every migration, backfill and E2E run. No prod or remote DB is touched | User | 2026-11-11 |
| D8 | ✅ Started on the user's "start the work" go-ahead: PT-0 branch `fix/pt0-security-hotfixes` (R1, R4, R6). R2, R3 and R5 stay open until their callers are known (D10) | User go-ahead | 2026-11-11 |
| D6 | ✅ (technical) Mini-test attempts go in a **new `topic_test_attempts` table** cloned from `daily_test_attempts`. This avoids an `ALTER` of the enum on the live `exam_attempts` table | Developer, lowest-risk option | 2026-11-11 |

## 2. Open decisions (🛑)

| # | Question | Options (recommended first) | Blocks |
|---|---|---|---|
| D1 | When is a topic **completed**? | (a) **All activities that exist for the topic** are done; mini-test = one submitted attempt; (a+) same, plus a minimum mini-test score of __%; (b) mini-test submitted only; (c) keep "all three flags" (topics with no video or mini-test never complete) | PT-6 |
| D2 | When does a video count as **watched**? | (a) **≥ 80% watched or the ended event**; (b) any playback start (today's behaviour) | PT-7 |
| D3 | Historical **mini-test flags** (3,567 rows locally, meaning "opened") and video flags (meaning "Start clicked") | (a) **Keep as `legacy_*_opened/started`, not counted as completed**, so some students' completed counts may **drop**; (b) count them as done (keeps today's numbers but they are inflated); (c) count them only for rows created before date X | PT-6 |
| D4 | **Sub-topics** | (a) **The parent completes when all its children complete; only parents count in totals**; (b) only the leaves count | PT-6 |
| D5 | **Chapter and sectional tests across exams** | (a) **Shown as history only; counts stay per exam**; (b) count toward the other exam when the chapter is shared | PT-8 |
| D6 | **Mini-test attempt storage** | (a) **`exam_attempts` type `topic`** if the questions are in `question_new` (check in PT-1); (b) a new `topic_test_attempts` table cloned from daily tests | PT-7 |
| D7 | **Who curates topic equivalences?** | (a) **Content team reviews the generated CSV and the developer applies it**; (b) the developer proposes and the user approves each batch; (c) move equivalence upstream into BigQuery later | PT-5 |
| D8 | Should **PT-0 security fixes** ship now as separate tickets? | (a) **Yes, immediately, one branch each**; (b) bundle with PT-3 | PT-0 |
| D9 | **Rehearsal environment** | (a) **A fresh prod dump restored locally into a new DB** (the user provides the dump); (b) the existing local `clearcut_live_0411` / `clearcut_prod_src` (age and contents unchecked); (c) a staging server, if one exists. Also: read-only BigQuery credentials for sync replay, yes or no | PT-1, PT-10 |
| D10 | **Caller of `/api/v1/bigquery/*`** (needed before adding auth) | The user or content team confirms who calls it (manual, n8n, other). Then add an `automation.key` header to that caller first | PT-0 (R2) |
| D11 | **Public topic id** | (a) **Keep the numeric `s_topics.id` in requests, validated against the enrolled syllabus** (needs an exception note against DEVELOPMENT_RULES §2.2, because `uuid` rotates on sync); (b) fix uuid rotation in PT-2, then switch to uuids | PT-6 |
| D12 | **Content deleted upstream** never disappears locally today | (a) **Keep today's behaviour** (out of scope); (b) a later "retired" flag process with the content team | — |
| D13 | Duplicate legacy progress rows | (a) **Merge, keep the snapshot, then hard-delete the extras**; (b) soft-delete and make every reader filter `deleted_at` | PT-3 |
| D14 | ⚠️ **PT-2 sync hardening** (touches sync code) | (a) **Do it after PT-4, with the content team present for the first run**; (b) skip it and rely on reconciliation | PT-2 |
| D15 | ⚠️ **Hardcoded secret fallbacks** in config | Remove the fallbacks in PT-0; rotate the keys (the user's call; affects n8n, blog revalidate, sync DB) | PT-0 |
| D16 | ⚠️ **Queue worker change**: add the `syllabus` and `progress` queues to the worker command, or reuse `default` | (a) **Dedicated queues with their own `retry_after`**; (b) reuse default (simpler, but has the 90 s re-pick risk for long jobs) | PT-4 |
| D17 | **Visible behaviour changes** the user must accept: test lists show the latest *submitted* result; some completed counts may drop (D3); chapters with sub-topics start completing (D4) | Approve the list before PT-3 / PT-9 | PT-3, PT-9 |

## 3. Assumptions (valid until PT-1 verifies them)

| # | Assumption |
|---|---|
| A1 | The production schema matches the migrations (no leftover `entity_*` columns on `user_learning_progress`). If not, PT-3 adds a cleanup migration first |
| A2 | The Laravel scheduler and at least one queue worker run in production |
| A3 | Production has no business-key duplicates in the syllabus tables (true locally) |
| A4 | The sync is run by hand, now and then, by the content team; no hidden caller depends on these endpoints being unauthenticated |
| A5 | The mini-test pool is `question_new` (V2 `MiniTestController.php:18-41`), and the legacy `questions` path is unused |
| A6 | The dashboard is the only client writing progress. The RN app is a WebView of it, so no separate native writer exists |
| A7 | Data volumes in production are within about 10× of local, so set-based rebuilds and recounts stay in the seconds range |

## 4. Approval gates (summary)

1. **Approve this plan** (README to TESTING) as the working blueprint.
2. D8 → PT-0 starts (independent).
3. D9 and D10 → PT-1 starts (read-only, the user runs production SQL).
4. D1, D3, D4, D11, D13 and D17 → PT-3 and PT-6.
5. D2 and D6 → PT-7. D5 → PT-8. D7 → PT-5. D14 → PT-2. D16 → PT-4.
6. Each production step in PT-11 gets its own go-ahead. Push to `main` only when told to.

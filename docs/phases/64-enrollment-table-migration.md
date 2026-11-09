# Phase 64 — Move enrollments from `u_exam_enrollments` to `u_enrollments` + `enrollment_levels`

**Repos:** BE (`C:\laragon\www\clearcutoff-main-backend`) + CM-dashboard · **Risk:** ⚠️ SYSTEM IMPACT (payments, access, backend contract, prod data)
**Status:** 📝 Plan written 2026-10-28 — **waiting for approval (decisions D1–D7 below). No application code, branch or database has been touched.**
**Branch:** not created yet (proposal in D1). Working tree currently holds uncommitted work for phases 57/58/59 on `feature/first-enrollment-practice-test` in both repos.

## 1. Objective
Make `u_enrollments` (one master row per user + exam + `group_code`) and `enrollment_levels` (one row per paper/stage inside it) the **only source of truth** for enrollment, access, progress-linked state, renewals and purchase history. `u_exam_enrollments` is frozen to read-only, kept as an audit/rollback source, and **not dropped in this phase**.

Success means: no read or write path touches the legacy table, every legacy row is accounted for in the new tables, every payment still resolves to the right enrollment, and nothing a student can see or do changes.

## 2. What the investigation found (evidence, read-only)
Source: local DB `clearcut` (Laragon dump `mysql-8-2026-10-28_143309`), backend `main`, branch `enrolment_logic`. **Local data is not production** — see D6.

### 2.1 Code state
- Backend `main` still uses `UExamEnrollment` in **~50 files** (payments V1/V2, subscriptions, refunds, referral, daily tests, preparation, dashboard, Telegram bot, cron `ExpireTrials`/`BackfillPaidValidTill`, QR admin payment …).
- Branch `enrolment_logic` (17 commits, 45 files, +1011/−1169) already moves most of those to `UEnrollment`/`EnrollmentLevel`, adds `enrollment:migrate`, and an admin `EnrollmentMigrationController` (`status|run|verify`). It is **51 commits behind `main`** and has never been through the checks in §7. It must be treated as a head start, not as done.
- New in-flight code on the current branch still reads the legacy table: `FirstPracticeTestService`, `UserStateService`, `UserStateRegistry`, `UserStateTest` (phases 57/58). They have to be ported too.
- Dead copies (`* copy.php`) still mention the legacy model; they must stay untouched (rule: never edit stale copies) and must not be routed.
- Frontend: the dashboard talks only to the API. Contract fields it depends on: enrollment `uuid`, `group_code`, `enrollment_type`, `status`, `valid_till`, `stage/level` info (`types/Exam.ts`, `lib/dashboard/learning.ts`, `useMyActiveCourses`, `useGetCurrentCourse`, `usePreparationDataStore`, paywall + edit-course + change-exam modals). URLs use the **enrollment uuid** (daily tests) or **`group_code`** (preparation, practice test, user-state).

### 2.2 Data state (local snapshot)
| Check | Result | Why it matters |
|---|---|---|
| Legacy rows / distinct groups | 14,228 / 13,263 | |
| New masters / levels | 7,525 / 8,384 | **Half-migrated.** 5,740 groups and 5,965 legacy rows have no counterpart. |
| Legacy `active` | 327 vs 97 `active` in new | 233 legacy-active enrollments are missing or not active in the new table = **paying users would lose access on cutover**. |
| Level status ≠ legacy status | 197 | The existing command skips groups it already copied, so it never fixes drift. |
| Master `valid_till` ≠ legacy | 48 | Same cause. Access expiry would differ. |
| Legacy rows with `group_code IS NULL` | **27** (2 are `active`) | `enrollment:migrate` silently skips them → data loss. |
| Groups with >1 `active_level=1` | **160** | New model assumes one active level. |
| Duplicate (user, exam, group, stage) | 2 groups | Would break a unique key on levels. |
| Groups mixing users/exams, differing status/valid_till/subscription | 0 | Grouping by `group_code` is safe locally. |
| New-table integrity | 0 orphans, 0 duplicate groups, all rows carry `source_enrollment_id` | Good base. |
| Master uuid reused from a legacy uuid | **0 of 7,525** | `enrollment:migrate` mints new uuids, so any saved/bookmarked URL, app deep link or daily-test link holding the old enrollment uuid would 404. |

### 2.3 Payments — the hidden link
- **No foreign key links `transactions` to enrollments.** The link is polymorphic: `transactions.transactionable_type = App\Models\UExamEnrollment` with `transactionable_id` = the **legacy row id** (1,074 rows; one value is corrupt: `App\Models\UExamEnrollment\r\n`), plus `group_code` (1,742 rows) and `subscription_id`. No morph map is configured.
- Types in use: `UExamEnrollment` 1,074 · `Subscription` 684 · `Exam` 11 (no group). 798 `success`, 161 `failed`, 808 `initiated`, 2 `refunded`. 0 duplicate `gateway_payment_id`.
- 547 **successful** transactions carry a `group_code` that does not exist in `u_enrollments` yet. Dropping or re-keying the legacy table without a remap would orphan paid history.
- `subscriptions.enrollment_id` is the only real FK to the legacy table (`ON DELETE SET NULL`); it is empty in all 1,256 rows, linking is by `group_code`/`subscription_id` (legacy 1,057 and new 67 enrollments carry a `subscription_id`). `u_referrals` and `point_redemptions` already point at `u_enrollments`.

## 3. Scope
**In:** schema additions (expand only), id map, backfill + reconcile tooling, every backend read/write path, payment/subscription/refund/webhook paths, cron jobs, the two in-flight features, API contract guard, frontend adjustments needed to keep the contract, tests.
**Out (needs its own approval):** dropping/renaming `u_exam_enrollments`, rewriting `transactions` history beyond the morph re-point in §5.4, any production run, deploy, merge, push.

## 4. Principles
1. **Expand → backfill → reconcile → switch reads → switch writes → freeze legacy → (later phase) contract.** Never a big bang.
2. **Money rows are append-only for this phase.** `amount`, `status`, `gateway_*`, `paid_at`, `currency`, `payment_method` of `transactions`/`subscriptions` are never modified; verified by a before/after checksum (§7.2).
3. **Nothing is assumed, everything is verified.** Each rule below has a count query that must return 0 unexplained rows before the next stage.
4. **Idempotent and re-runnable**, keyed by legacy ids. Re-running changes nothing; running it twice concurrently is safe (lock + unique keys).
5. **One owner for enrollment writes** (a single `EnrollmentService`/repository), transaction-wrapped, so payment confirmation, enrollment update and transaction record commit or fail together.
6. Existing rules: DEVELOPMENT_RULES §6 (migrations new + reversible, UUID public ids, 404 not 403), no full test suite on the dev DB (§10), no self-run production commands, no `Co-Authored-By` trailer, commit only when asked.

## 5. Migration rules (legacy → new)
### 5.1 Id map (new, makes everything traceable and reversible)
`enrollment_legacy_map(legacy_id PK, legacy_uuid UNIQUE, u_enrollment_id FK, enrollment_level_id FK, mapped_at)` — one row per legacy row, including those collapsed by a rule. It replaces trusting `source_enrollment_id` alone, powers uuid resolution (§5.5), the transaction re-point (§5.4) and rollback (§8).

### 5.2 Grouping and master fields
- Group by `group_code`; one `u_enrollments` row per group, one `enrollment_levels` row per legacy row.
- **NULL `group_code` (27 rows):** do not skip. Each becomes its own group with a deterministic code (`legacy-<id>`), flagged in `metadata.migration`. The 2 `active` ones are listed for manual sign-off first (D5).
- **Master status:** highest priority in the existing order (`active` > `completed` > `cleared` > `trial_end` > `expired` > `dropped` > `trial`); `valid_till` = the latest in the group; `price/enrollment_type/subscription_id/purchase_id/attempt_year` from the row that carries the master status (tie → highest id). All group-level conflicts are written to a reconcile report, not resolved silently.
- **Exactly one `active_level` per master:** keep the most recently `updated_at`; others set false; each change logged.
- **Duplicate (user, exam, group, stage):** collapse to one level (higher status, then latest); both legacy ids stay in the map.
- Soft-deleted legacy rows (0 locally) keep `deleted_at` on both tables.

### 5.3 Constraints added (after data passes checks)
`UNIQUE(group_code)` on `u_enrollments` (0 duplicates today); `UNIQUE(u_enrollment_id, stage_id)` on live levels (generated-column pattern from the rules, because `stage_id` and `deleted_at` can be NULL); `subscriptions.enrollment_id` FK re-pointed from `u_exam_enrollments` to `u_enrollments`; confirm/ensure a unique key on `transactions.gateway_payment_id` + `gateway_order_id` (to be verified — idempotency for duplicate callbacks).

### 5.4 Transactions
- Add `legacy_transactionable_type/id` columns, copy the originals, then re-point `transactionable_*` to `App\Models\UEnrollment` + the mapped master id. Clean the `\r\n` value first.
- Register a **morph map** so both old and new class names resolve during the compatibility window.
- Rows with `transactionable_type = Exam` (11, no group) and `Subscription` (684) are left unchanged. The 16 `UExamEnrollment` rows without `group_code` are resolved through the id map, any unresolvable one goes to the report (never guessed).

### 5.5 Public ids
The master keeps the **uuid of its master row**; every other legacy uuid stays resolvable through `enrollment_legacy_map` (lookup falls back to it and returns the same enrollment). So old daily-test/app links keep working. `group_code` is unchanged.

### 5.6 Live drift
Because students keep paying and enrolling while this is built, the final cutover uses (a) a reconcile pass that upserts by legacy id and reports every field difference, and (b) either a short write freeze or a dual-write window behind `ENROLLMENT_SOURCE=legacy|dual|new` (D3). Local drift (233 active, 197 status, 48 `valid_till`) is the proof that a one-time copy is not enough.

## 6. Implementation sequence (each step ends in a green check from §7 before the next)
| # | Step | Repo | Output |
|---|---|---|---|
| 0 | Approval + branch + restored scratch DB `clearcut_enrollmig` (never the dev `clearcut`) | BE, CM | |
| 1 | Merge `main` into the chosen base; list every remaining legacy reference (`git grep`) as a checklist in this file | BE | checklist |
| 2 | Expand migrations: map table, transaction legacy columns, nullable additions; all reversible | BE | |
| 3 | Rewrite backfill as `enrollment:migrate` v2: idempotent, per-group transaction, `--dry-run` with full report, `--verify`; retire the "skip migrated groups" shortcut | BE | report JSON |
| 4 | Single enrollment write service; port every write path (create/enroll, edit levels, renew, expire, trial convert, payment success, refund, QR/manual admin, referral, Telegram, crons) | BE | |
| 5 | Port reads (preparation, dashboard, active courses, daily tests, exam attempts, access checks, `EnrollmentAccessService`) and phase 57/58 code | BE | |
| 6 | Payments atomicity: `lockForUpdate` on the master, `DB::transaction` around verify→enrollment→transaction, duplicate-callback guard | BE | |
| 7 | Contract guard: snapshot the JSON of every enrollment-bearing endpoint before and after (per fixture user) and diff | BE | diff = 0 |
| 8 | Frontend: only what the guard shows changed; otherwise none. Types/fixtures, uuid-alias handling, modals | CM-dashboard | |
| 9 | Constraints (§5.3) and the morph re-point (§5.4) on the scratch DB | BE | |
| 10 | Full verification (§7) incl. Playwright (one agent at a time, existing dev server) | both | evidence in this file |
| 11 | Hand-over pack: prod pre-checks, exact commands for the user to run, rollback steps | docs | |

## 7. Verification
### 7.1 Data checks (all must be 0 / explained, on the scratch DB, after backfill)
legacy rows without map row · legacy groups without master · master without level · level without map row · status/`valid_till`/subscription differences vs legacy · masters with ≠1 `active_level` · duplicate groups/levels · transactions whose `transactionable` does not resolve · successful transactions whose `group_code` has no master · orphaned `subscriptions`/referrals/redemptions.

### 7.2 Money invariants
Before/after checksum over `transactions`(id, amount, currency, status, gateway_order_id, gateway_payment_id, paid_at, user_id, subscription_id, group_code) and `subscriptions`(…); row counts and `SUM(amount)` per status identical; every `success` transaction maps to a master of the same user.

### 7.3 Automated tests (Pest, `DatabaseTransactions`, MySQL scratch DB only, always `--filter`)
Migration idempotency (run twice, diff 0) · each §5.2 rule with a fixture (NULL group, multi-active-level, duplicate stage, mixed statuses) · rollback restores the exact pre-state · uuid alias resolves · morph map both names · enrollment create / level edit / renew / expire / convert / refund · payment success twice (duplicate callback) → one transaction, one extension · failed payment → no enrollment change · already-recorded transaction → no-op · course change · access matrix (trial / active / expired / completed / other user → 404) · progress & completion tracking unchanged · crons.
### 7.4 Concurrency / failure
Parallel processes (real, not simulated): 10 simultaneous verify callbacks for one order; verify + webhook race; two enroll requests for one exam; edit-levels while the migration runs; kill the process mid-group → no partial group. Failure injection after payment-recorded/before-enrollment-update → rolled back together.
### 7.5 End-to-end (Playwright, Sonnet sub-agent, one at a time, existing dev server, hi/mr + mobile)
New signup → trial → buy; existing active user; expired user renews; autopay subscription charge; failed payment; payment page reload after success; add/change paper; daily test link with an **old** enrollment uuid; preparation progress; profile Payments/Subscriptions totals vs DB (rule §8 "compare screen numbers against the database").
### 7.6 Always
`tsc`, `eslint`, `check:colors`, Pint, `pnpm turbo run build --filter=dashboard` if routes/i18n change.

## 8. Rollback
- Everything before step 9 is additive: rollback = run the `down()` migrations / drop the scratch DB; legacy table untouched.
- Reads/writes: flip `ENROLLMENT_SOURCE` back (kept until legacy is retired in a later phase). Legacy stays complete during `dual`.
- Transactions: restore `transactionable_*` from `legacy_transactionable_*` (one UPDATE, tested).
- New rows created after cutover are traced via the map and replayed to legacy by a reverse script (tested on scratch).
- Prod: only after a verified backup; the exact commands are given to the user, never run by me.

## 9. Acceptance criteria
- [ ] Zero references to `UExamEnrollment`/`u_exam_enrollments` in live code paths (`git grep` outside `* copy.php`, tests that assert legacy behaviour, and the migration/compat files).
- [ ] §7.1 data checks all 0 on a fresh restore, and on a second run (idempotent).
- [ ] §7.2 money checksum identical; all 798 successful transactions resolve to an enrollment of the same user.
- [ ] Every legacy-`active` enrollment is `active` with the same `valid_till` in the new tables (the 233 gap closed).
- [ ] Contract guard diff = 0 on all enrollment endpoints, or each difference approved.
- [ ] Old enrollment uuids still resolve; `group_code` URLs unchanged.
- [ ] Duplicate callbacks, racing callbacks and mid-migration kills leave consistent data (§7.4).
- [ ] Full regression list in §7.3 and §7.5 passes, with output attached under "Results".
- [ ] Migrations reversible; rollback rehearsed on scratch.
- [ ] Phase 57/58 features pass their existing tests on the new tables.
- [ ] Nothing committed, pushed, merged or deployed without explicit approval.

## 10. Decisions needed (🛑 — please answer before step 0)
| # | Question | Recommendation |
|---|---|---|
| **D1** | Base branch. `enrolment_logic` is 51 commits behind `main`, and my current tree has uncommitted phase 57–59 work. | New branch `feature/enrollment-table-migration` **from `main`** in both repos, bring in `enrolment_logic` by merge/cherry-pick, and do not touch the uncommitted phase 57–59 files until you commit or stash them. |
| **D2** | OK to treat `enrolment_logic` code as a starting point rather than finished work? | Yes, with the §6 checklist. |
| **D3** | Cutover style: short write freeze (minutes, off-peak) or dual-write window behind `ENROLLMENT_SOURCE`. | Dual-write flag: no downtime, instant rollback, a bit more code. |
| **D4** | uuid policy (§5.5): keep the master row's uuid and alias the rest. | Yes. |
| **D5** | The 27 NULL-`group_code` rows (2 are `active`): migrate each as its own group, with the 2 active ones reviewed by you first. | Yes. |
| **D6** | Production reality. The local DB is half-migrated and may not match prod (prod may have run the admin `enrollment-migration/run`). I need the production numbers from read-only SQL **you** run (I will write the exact queries). | Required before any prod hand-over; not needed for local work. |
| **D7** | Constraints/morph re-point (§5.3–5.4) are in this phase and applied locally only; prod run is a separate approval. | Yes. |

## 11. Risks not yet resolved
- Production data may differ from local (D6); the plan's counts are local facts only.
- Unknown prod unique keys on `transactions` (checked after scratch restore).
- The 60/min API limiter can affect long Playwright runs.
- `* copy.php` files in the backend are still autoloaded classes with the same names in places — to confirm they cannot shadow routes.
- Rate of live writes during cutover (peak hours, autopay charges, Razorpay retries) decides D3.

## 12. Decision log
- 2026-10-28 — User: go with recommendations D1–D7, prioritise data safety + backward compatibility; `enrolment_logic` is reference only; feature-flagged transition; keep legacy uuids working; review the 2 active NULL-group rows before migrating; never touch dev DB or prod without explicit approval.
- 2026-10-28 — Phase 57–59 work preserved: `D:\clearcutoff-projects\_backups\phase57-59-20261028-211748\` (patch + untracked tar) and git ref `refs/backup/phase57-59` in both repos. New branch `feature/enrollment-table-migration` lives in worktrees `clearcut-master-enrollmig` and `clearcutoff-main-backend-enrollmig` (from `main`). Original trees untouched.
- 2026-10-28 — Prod dump (maindb, taken 2026-10-27 02:00 UTC) restored read-only into scratch DB `clearcut_prod_src` (95 tables, no errors). Dev DB `clearcut` untouched.

## 14. Production findings (dump of 2026-10-27, read-only)
| Item | Prod | Note |
|---|---|---|
| Legacy rows / groups | 16,732 / 15,735 | |
| Migrated masters / levels | 7,525 / 8,384 | identical to local: prod ran the old command once; **8,212 groups (8,483 rows) never migrated** |
| Legacy `active` not `active` in new | **282** (259 with a successful payment) | cutover blocker; fixed by backfill |
| Status / `valid_till` drift | 196 / 49 | already-copied groups went stale |
| NULL `group_code` | 27 (2 active, 25 trial_end) | |
| Groups with >1 `active_level` | 189 | |
| Duplicate (user, exam, group, stage) | 6 groups (one is two **active** rows, group 6aaaa90e44878) | |
| Transactions | 1,987 (994 success) | |
| Payment link | polymorphic `UExamEnrollment`: 1,120 rows; **284 point at legacy rows that no longer exist** (64 success ₹24,346; 52 of them still resolvable by `group_code`) | rows are deleted/recreated on paper edit |
| Success tx whose group is in no enrollment table | 11 (+1 Subscription-type) | users 393 and 13593 have **no enrollment at all** (₹298) |
| Success tx without `paid_at` | 138 (all enrollment-type) | untouched |
| Unique index on `gateway_payment_id`/`gateway_order_id` | **none** (0 duplicates today) | duplicate-callback protection is code-only |
| Active legacy past `valid_till` | 72 | still `active` |
| Active legacy with no payment/subscription | 21 (19 added Apr–Oct 2026, `valid_till` NULL) | looks like admin/QR/referral grants |
| Soft-deleted users with active enrolment | 6 | |
| Master uuid equal to a legacy uuid | 0 | uuid alias map required |

The 2 active NULL-group rows: legacy **#52** (user 12, exam 3, full_exam, no expiry, no price; user has one old ₹199 success tx pointing at deleted row #31) and **#82** (user 105, exam 1, full_exam, no expiry, no successful payment — only ₹0/₹199 `initiated` tx).

## 15. Paid-user decisions (answered 2026-10-28)
- **P1** the 2 NULL-group active rows (#52, #82): migrate each as its own group, stay `active`, `valid_till` NULL kept, `metadata.migration.needs_review = true`.
- **P2** drift (196 status, 49 `valid_till`): **legacy wins**; every overwrite is written to the reconcile report.
- **P3** paid users with no enrollment (users 393, 13593) and 11 success tx pointing at deleted rows with no surviving group: **leave unlinked**, never create enrollments for money rows; hand the exact list to support.
- **P4** 72 `active` rows past `valid_till`: **copy exactly, do not flip**; the migration stays purely structural.
- Scratch DBs: `clearcut_prod_src` (pristine, never written) and `clearcut_enrollmig` (working copy). **Superseded 2026-10-28: user asked to work only on the local dev DB `clearcut`; the scratch DBs are no longer used.**
- **P6 (answered 2026-10-28: fix both)** duplicate `subscription.charged` race in `handleRenewalSuccess`. Applied on the dev DB: subscription row `lockForUpdate` + refresh + re-check inside the transaction, a duplicate hitting the DB guard is treated as a duplicate (logged, no error), and migration `2026_10_28_230000_add_unique_gateway_payment_id_to_transactions` (`UNIQUE(gateway_payment_id)`, NULLs allowed; refuses to run if duplicates or empty strings exist). Measured with 8 simultaneous deliveries in `legacy`/`dual`/`new`: before 2 transactions + `paid_count` 2 + 6 deadlocks; after **1 transaction, `paid_count` 1, expiry +30 days, 0 errors**. Tests: 2 added to `EnrollmentPaymentFlowTest` (27 tests, 251 assertions in total). **Prod hand-over pre-check (run read-only before the migration):** `SELECT COUNT(*) FROM (SELECT gateway_payment_id FROM transactions WHERE gateway_payment_id IS NOT NULL GROUP BY 1 HAVING COUNT(*)>1) x;` and `SELECT COUNT(*) FROM transactions WHERE gateway_payment_id='';` must both be 0 (the 2026-10-27 dump had 0 duplicates; empty strings were not checked there).

- **P5** (2026-10-28) group `6aaaa90e44878` (user 18357): two active rows disagree on `valid_till` → master follows the row with the **widest access** (NULL = no expiry beats a date). Rule is generic; in prod it changes only this group.

## 13. Results
### Step 3 (data backfill) — done on scratch, 2026-10-28
Branch `feature/enrollment-table-migration` (BE worktree `C:\laragon\www\clearcutoff-main-backend-enrollmig`, **uncommitted**): migrations `2026_10_28_200000_create_enrollment_legacy_map_tables`, `2026_10_28_200100_add_legacy_columns_to_transactions_table` (both additive, up/down/up tested) and `app/Console/Commands/ReconcileEnrollments.php` (`enrollment:reconcile`, dry-run by default, `--apply`, `--group`, `--report`).
Run on scratch `clearcut_enrollmig` (copy of the prod dump; `clearcut_prod_src` stays pristine): 15,762 groups, masters +8,239 / ~7,523 updated, levels +8,478, 133 stale levels retired, 6 duplicate stages collapsed, 27 NULL-group rows → `legacy-<id>`, 2 flagged `needs_review`, 0 errors, ~5 min.
Checks after apply: legacy rows mapped 16,732/16,732 · duplicate groups 0 · orphan levels 0 · masters without live level 0 · masters with >1 active level 0 · legacy-active-not-active-in-new **282 → 0** · level status diffs 0 · every legacy uuid resolves · legacy table identical to pristine · `transactions` count 1,987 and success sum ₹143,286 identical · **second run = 0 changes (idempotent)**. The only master≠source diff is the deliberate P5 group.
Kept untouched, listed in the report: 2 masters whose legacy group no longer exists (ids 2207, 3905, both `trial_end`).
### Step 4 (flag + live mirror) — done on scratch, 2026-10-28
`config/enrollment.php` → `ENROLLMENT_SOURCE=legacy|dual|new` (default `legacy` = production behaviour unchanged). `App\Services\Enrollment\EnrollmentSyncService` holds all sync rules (the command is now a thin wrapper, plus `--since=<min>`). In `dual`/`new` every legacy write is mirrored **after commit** (`DB::afterCommit`), failures are logged and can never fail or roll back the original request: `UExamEnrollment` `saved`/`deleted` observers, plus explicit mirror calls at the three sites that bypass model events (V1 `enrollExam` bulk delete, `EnrollmentAccessService` bulk expiry, `ExpireTrials` raw update). A legacy group that disappears retires its master + levels (`deleted_at`, nothing hard-deleted). Scheduler safety net: `enrollment:reconcile --apply --since=30` every 5 min, only when the flag is `dual`/`new`.
Concurrency: per-group MySQL named lock. Before the lock, 8 barrier-synchronised processes on one new group → 1 master but **6/8 failed with duplicate-key**; with the lock 8/8 ok, 1 master / 2 levels / 2 map rows / 1 alias, 3 rounds. DB-level guard: `UNIQUE(group_code)` on `u_enrollments` (migration refuses to run if duplicates exist).
Tests: `tests/Feature/EnrollmentMirrorTest.php` 10/10 (create, update, multi-level + uuid alias, group removal, bulk delete helper, legacy mode = no mirror, NULL-group, idempotent, failing mirror never breaks legacy write, rolled-back transaction mirrors nothing). Scratch only (guarded by DB name).
Known pre-existing bug, not touched: `CourseRepository.php:225` updates `'last_accessed_at '` (trailing space) so `last_accessed_at` is never written.
Legacy model hooks to port when writes move to the new tables: `START_TRIAL` event (`EventTrackingService`) and the daily-test hook (the reference branch already moved the latter to `EnrollmentLevel`).

### Step 5, batch 1 (reads) — done, 2026-10-28
**Target DB changed by the user to the local dev DB `clearcut`** ("sirf meri local db par kaam karo, baaki DB na dekho"). Backup first: `D:\clearcutoff-projects\_backups\clearcut-dev-before-enrollmig-20261028-221639.sql` (700 MB). Only the six phase-64 migrations were run, with `--path` (the dev DB has ~10 unrelated pending migrations that must not be run by this work). Scratch DBs `clearcut_prod_src` / `clearcut_enrollmig` are no longer used.
Design: **read model view** `v_exam_enrollments` (legacy-shaped rows from `u_enrollments` + `enrollment_levels`, ordered by id). With `ENROLLMENT_SOURCE=new`, `UExamEnrollment::getTable()` returns the view, so all existing read code runs unchanged (this avoids the behaviour drift found in the reference branch: dropped `active_level` filter, lost section ordering, dropped eager loads). While reading the view the model **throws on any write** (unported write sites fail loudly). New: `enrollment_levels.uuid` (a level keeps its legacy row uuid), migrations `…210000`, `…210100`, `…220000`.
Rule changes found by testing: duplicate-stage legacy rows are **no longer merged** (each keeps its own level/uuid/id; reported in `duplicate_stage_groups`, 2 in dev, 6 in prod) · `active_level` = lowest-id flagged row, exactly what legacy `firstOrFail()` returned · orphan masters are retired by full runs.
Dev results: reconcile 13,290 groups, 0 errors; coverage 14,228/14,228 rows; view rows 14,228 = legacy 14,228, **0 diffs in user/exam/stage/group/status/valid_till/subscription/uuid/price/type/metadata/selections**; known benign diffs: `active_level` 177 (extra flags dropped), `enrolled_at` 10, `last_accessed_at` 7 (master-level fields). **Contract guard `EnrollmentReadParityTest`: 529 responses (44 users × get-my-active-courses, get-mycourses, payment/history, subscription, daily-tests, resume-state, progress-summary, preparation get-course/sections/instances/pyqs) identical in `dual` vs `new`: 0 differ.** `EnrollmentMirrorTest` 10/10 on `clearcut`.
Caveat: the dev DB lacks the daily-test migrations, so those endpoints return the same 500 in both modes; they still need a run on a fully migrated DB.

### Step 5, batch 2 (writes) — done, 2026-10-28
Design decision (changed from the original plan, on evidence): the enrollment write sites build legacy-shaped rows (`firstOrNew` + attribute assignment + `save()`, `stage_id` auto-fill, `edit_count`, hooks). Re-implementing them against master/level is exactly where the reference branch drifted, so with `ENROLLMENT_SOURCE=new`:
- **reads** → view `v_exam_enrollments` (batch 1);
- **instance writes** (`create/save/update/delete`) → still go to the legacy table, now called the **ledger**, with all existing hooks (START_TRIAL event, daily-test generation) untouched; `save()`/`delete()` run in their own transaction and the new tables are derived **synchronously, in that transaction, strictly** (a failed derive rolls the ledger write back). The mirror is registered first so later hooks already see the new row;
- **bulk writes** go through `UExamEnrollment::bulkUpdate(fn ($q) => …, [...])` / `legacyQuery()` (ledger + mirror). Converted: V1 `enrollExam` delete, `EnrollmentAccessService`, `ExpireTrials`, `BackfillPaidValidTill`, `UserActionsController` (guide seen), `CourseRepository::changeCourse`, `RefundService`, `SubscriptionService` ×4 (incl. `handleAuthenticated`, charge, expiry). A statement-level scan finds no remaining builder write on the model.
Consequences: view ids always equal ledger ids, so **`transactions.transactionable_id` keeps resolving with no re-point** while the ledger exists; rollback is flipping the flag (ledger is always complete). The ledger is retired in a later step, by pointing the model's persistence at the new tables with the same sync code (no change to the ~20 call sites); that step is NOT done here and needs its own approval.
Bug found by the tests and fixed: Eloquent's `newQueryWithoutScopes()` calls `newModelQuery()`, so overriding that redirected reads too; the table is now switched per instance only during save/delete.
Tests (dev DB, DatabaseTransactions): `EnrollmentWritePathTest` 7/7 — ledger+master+level in one call and hooks see the row, atomicity with no outer transaction, bulk helpers, ExpireTrials, **V1 `enrollExam` (create + add-a-paper edit) answers identically in `dual` and `new` and keeps ledger/view/master/levels consistent**, V2 `enrolledToCourse` + my-active-courses, `bulkUpdate` in legacy/dual/new. With `EnrollmentMirrorTest` 10/10 and `EnrollmentReadParityTest` (529 responses, 0 differ): 18 passed, 101 assertions.

### Step 5, batch 3 (payments, concurrency, rollback) — done, 2026-10-28, dev DB `clearcut`
- **Payment flows through the real signed `POST /api/webhooks/razorpay`**, run in `legacy`, `dual` and `new` (`EnrollmentPaymentFlowTest`, 6 tests): one-time payment activates the enrollment · duplicate `payment.captured` (3 deliveries) changes nothing and does not extend again · renewal before expiry adds to the paid period (>35 days) · failed payment leaves the enrollment untouched · forged signature rejected · subscription lifecycle (authenticated → charged → duplicate charged → renewal → halted). Outcome identical in all three modes; in `dual`/`new` master/levels/view agree with the ledger.
- **Real parallel concurrency** (8 processes released at the same instant, committed fixtures, cleaned up afterwards): duplicate delivery of one payment through `activateEnrollment` in `new` mode → **1 success transaction, expiry extended once (+31 days), no deadlock, master/levels/view consistent**.
- **Rollback rehearsal** (`EnrollmentRollbackRehearsalTest`): one student goes `legacy → dual → new → dual → legacy → new` with an enroll, a payment and a paper edit in different modes; after every switch the enrollments read identically and nothing written in `new` is missing after rolling back. Physical rehearsal on the dev DB: all six phase-64 migrations rolled back in reverse order, then re-applied + reconcile: `u_exam_enrollments`, `subscriptions`, `users` checksums identical before/after, `transactions` content hash identical before and after re-up, masters 13,290 unchanged, 0 errors. (A data rollback of `u_enrollments`/`enrollment_levels` to their pre-phase state = restore those two tables from the pre-run backup; they are derived tables and the ledger is never touched.)
- Totals: `EnrollmentMirrorTest` 10 · `ReadParity` 1 (529 responses) · `WritePath` 7 · `PaymentFlow` 6 · `RollbackRehearsal` 1 = **25 passed, 240 assertions**.
- **FOUND, pre-existing, NOT caused by this phase (identical in `legacy`, `dual`, `new`):** `SubscriptionService::handleRenewalSuccess()` checks `Transactions::exists(gateway_payment_id)` and only then inserts, with no lock and no unique key. 8 simultaneous deliveries of one `subscription.charged` produced **2 transactions for one payment id, `paid_count` 2 instead of 1, and 6 deadlock errors**. `transactions` has no unique index on `gateway_payment_id` (prod dump: 0 duplicates today). Fix needs a decision (paid users) — see §15, P6.
- Phase 57/58 code (uncommitted, original working tree): its 3 reads work unchanged through the view; **merge-time TODO:** `UserStateRegistry.php:99` `UExamEnrollment::where(...)->update(['study_guide_seen' => true])` must become `UExamEnrollment::bulkUpdate(fn ($q) => $q->where(...), [...])`, and `QrPaymentController`'s `exists:u_exam_enrollments,id` rule is fine while the ledger exists.
- Not done here: ledger retirement, frontend contract run in a browser, a fully migrated DB for the daily-test endpoints (dev DB lacks those migrations), production hand-over pack.

### Final review (#4) — 2026-10-28: four defects found by reading the diff and racing it, all fixed
1. **Named `GET_LOCK` in the sync could stall a request for its full timeout** (invisible to InnoDB's deadlock detector when one request syncs several times) and released before the caller committed (stale-overwrite window). Replaced by a transaction + `FOR UPDATE` on the group's legacy rows (lock order: legacy rows, then new tables; `UNIQUE(group_code)` as backstop). 8 simultaneous syncs of a new group: 8/8 ok, 1 master, 2 levels, 0 errors.
2. **P6 fix used `$subscription->refresh()`**, which reloads the already-loaded `user` relation without its `withTrashed()`. Now `setRawAttributes()` only.
3. **Two simultaneous writers on one NEW group can deadlock in `new` mode** (not in `legacy`/`dual`); data stayed consistent, one request failed. Added a retry in the model's `save()`/`delete()` wrapper (3 attempts, only when it is the outermost transaction). **The first version of the retry silently lost rows** (the failed attempt had already set `exists = true`, so the retry ran a no-op UPDATE and reported success) — caught by the race test (ok-count ≠ ledger rows), fixed by restoring the model state before retrying, then the exception type was wrong too (Laravel 12 throws `DeadlockException`, not `QueryException`). Final: 12 rounds of two simultaneous writers → 12/12 both succeed, 2 ledger rows, 2 levels, 1 master, master `active`, 0 failed requests.
4. Re-ran after all changes: 27 tests / 251 assertions pass; 8-process duplicate one-time payment + duplicate subscription charge in `new` and `dual`: 1 transaction each, `paid_count` 1, view = ledger.
Residual risk (documented in the runbook): with a caller-owned outer transaction a deadlock cannot be retried (MySQL already rolled the whole transaction back) and surfaces as an error; consistent data, the client retries.
Browser check (#2): not done yet — needs a backend running this branch, see the runbook note; the API contract itself is covered by `EnrollmentReadParityTest`.

**Still to do:** repoint transactions (cutover only, together with the code switch), `ENROLLMENT_SOURCE` flag + port of ~50 files, payments atomicity, constraints, contract guard, tests §7.3–7.5, rollback rehearsal, prod hand-over pack.

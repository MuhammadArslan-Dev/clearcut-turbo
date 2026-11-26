# Phase 64 — Enrollments: `u_exam_enrollments` → `u_enrollments` + `enrollment_levels`

**Tickets:** (new, from user)
**Repos:** BE (`C:\laragon\www\clearcutoff-main-backend`) · CM (apps/dashboard — verification only, no code change expected)
**Branch:** BE `enrolment_logic` (main merged in, then the phase-64 layer on top; 5 local commits, **not pushed, not merged**) · CM `phase-64-enrollment-migration` (this doc only)
**Created / start date:** 2026-10-28 (paused 2026-10-29, resumed 2026-11-26)
**Status:** In Progress — backend built and verified on the local DB (31 tests green); browser/frontend verification running; **nothing deployed, production untouched**

---

## 1. Problem / objective
Production is half-migrated: 282 legacy-active enrollments were not active in the new tables, and payments link to the legacy row (`transactionable_type = UExamEnrollment` + legacy id), so a naive switch orphans paid history. Goal: make the new tables (`u_enrollments` master per `group_code` + `enrollment_levels` one row per paper) a working, verified read model **without breaking anything live**, keeping the legacy table as the instant fallback.

## 2. Scope
- **In:** schema + view, one idempotent migration command, mirror of every write path (model events + bulk writes), free test credits (phase 132) on the new tables, tests, runbook.
- **Out:** dropping/modifying legacy data (needs separate approval after a soak), repointing `transactions` to the new ids, the old `php artisan enrollment:migrate` (do **not** use it, see §6).

## 3. Design (decided)
- **Ledger + mirror.** `u_exam_enrollments` stays the written ledger. Every change (model events, `UExamEnrollment::bulkUpdate()/updateAndMirror()/legacyQuery()`, free-credit charge/refund) is mirrored by `EnrollmentSyncService` into `u_enrollments` + `enrollment_levels`, keyed by `group_code` (rows without one become `legacy-<id>` groups). Legacy wins on drift.
- **Reads.** Flag `ENROLLMENT_SOURCE` = `legacy` (default, inert) | `dual` (mirror on, reads legacy) | `new` (mirror on, reads the view `v_exam_enrollments`, which reproduces the legacy row shape/ids/uuids). Switch = env change + `php artisan config:clear`; going back loses nothing because the ledger is always written.
- **Active course is never changed.** `active_level` is copied exactly as the ledger has it (several rows of one group may be flagged; readers take the lowest id and so does the view's `ORDER BY`).
- **Statuses/valid_till** copied exactly; master status = highest-priority status of its levels, master `valid_till` = widest.
- **Free credits (phase 132).** Counter is still charged on the ledger row (race-safe `UPDATE … WHERE used < limit`), then mirrored to `u_enrollments.free_test_credits_used` (MAX of the group); the view exposes it. Limit stays 5 (`FREE_CREDITS_LIMIT`); the "3 credits" in the original brief was not applied — confirm if 3 is wanted (env only).
- **Safety net.** `enrollment:reconcile --apply --since=30` is scheduled every 5 min while the flag is `dual`/`new`.

## 4. Progress / completed changes
- [x] 2026-11-26 `enrolment_logic` (old hard-cutover branch, June) ← `main` merged taking **main's tree** (all post-June work kept); old controller rewrites stay in history only. Phase-64 WIP snapshot (`wip/enrollment-migration-dirty-2026-11-09`) re-applied on top; 6 conflicts resolved to main's access/payment logic.
- [x] Main's new bulk writes now mirror: `EnrollmentAccessService` (3), `SubscriptionService` (2), `UserStateRegistry`, `ExamController::enrollExam` (row lock reads the ledger).
- [x] Local DB `clearcut` repaired and migrated (backup `D:\clearcutoff-projects\_backups\clearcut-enrollment-tables-before-enrolment_logic-20261126-212845.sql`).
- [x] `enrollment:reconcile --apply` on local: 16502 groups, 0 errors, idempotent on re-run.
- [x] Credits: migration `2026_11_30_100000_add_free_test_credits_to_u_enrollments_and_view`, sync copy, `FreeTestCreditService::mirrorCanonical()` after charge/refund.
- [x] Tests: `EnrollmentMirrorTest`, `EnrollmentReadParityTest`, `EnrollmentWritePathTest`, `EnrollmentPaymentFlowTest`, `EnrollmentRollbackRehearsalTest`, `EnrollmentFreeCreditsTest` (new) — 31 passed, 275 assertions.
- [~] Browser/API verification of the dashboard on `ENROLLMENT_SOURCE=new` (background tester).
- [ ] Production hand-over (§9) — by the owner.

## 5. Decision log
| Date | Question | Answer (who) |
|---|---|---|
| 2026-10-28 | Work only on local dev DB `clearcut`; no other DB | user |
| 2026-11-26 | Which branch? | `enrolment_logic`, with main merged in so main's work keeps running (user) |
| 2026-11-26 | Must production be able to fall back instantly? | yes — keep writing `u_exam_enrollments`; flag back to `legacy` (user) |
| 2026-11-26 | Credits = the phase-132 free credits, to be moved onto the new structure | user (limit left at 5) |
| 2026-11-26 | active_level: copy exactly, never normalise | decided after parity test showed 228 rows differed |

## 6. Blockers / risks
- **Two commands exist.** `enrollment:reconcile` (this phase: idempotent, dry-run by default, legacy wins) vs `enrollment:migrate` (old, on main since June: `--fresh` truncates). Production must only use `reconcile`.
- Migration `…200200_add_unique_group_code_to_u_enrollments` refuses to run if production already has duplicate `group_code` in `u_enrollments` (prod is half-migrated). Check first (§9 step 3) and resolve with `reconcile` before the unique key.
- `AccessRestoreExpired` writes legacy rows with raw SQL: run `php artisan enrollment:reconcile --apply` after using it.
- `ENROLLMENT_SOURCE` cut-over changes which table every read uses (≈70 files read `UExamEnrollment`); do `dual` first, soak, then `new`.
- Local dev `.env` is currently `ENROLLMENT_SOURCE=new` (for browser testing). Set `legacy` + `config:clear` to go back.
- Payment history still points at legacy ids (`transactionable_id`); the view keeps legacy ids so nothing orphans. Re-pointing is a separate, later step.
- Flaky-by-design fixtures fixed: halt test (main now keeps paid rows active until `valid_till + grace`) and payment-flow `valid_till` (rows of one group differ by a second; master keeps the widest).

## 7. Dependencies / packages added
Migrations (in order): `2026_10_28_200000 … 220000`, `230000` (unique `transactions.gateway_payment_id`), `2026_11_30_100000`. Env: `ENROLLMENT_SOURCE`, existing `FREE_CREDITS_*`. No packages.

## 8. Tests and verification
Local DB only, transaction-wrapped (`DB_CONNECTION=mysql DB_DATABASE=clearcut php artisan test <the six files>` — always pass explicit files, never a broad `--filter`, see memory "backend tests wipe DB").
- [x] Counts: legacy 16475 groups + 27 NULL-group rows → 16502 masters; 17490 levels = 17490 legacy rows = 17490 view rows.
- [x] `active_level`: legacy 14512 = new 14512, 0 mismatched rows.
- [x] Credits: ledger / master / view / model read agree after each charge, stop at the limit, paid enrolments never charged.
- [x] Backend tests 31/31 (6 files).
- [ ] Browser (390px, en/hi/mr), request counts, double-tap, retry — background tester report pending.
- [ ] Break-it pass §8.1 complete.

## 9. Production hand-over (owner runs; nothing here was run on production)
1. Merge BE branch to `main` only after the browser report is green and you approve. `ENROLLMENT_SOURCE` unset = `legacy` = inert.
2. Backup: `mysqldump … u_exam_enrollments u_enrollments enrollment_levels transactions subscriptions`.
3. Duplicate check: `SELECT group_code, COUNT(*) FROM u_enrollments GROUP BY group_code HAVING COUNT(*)>1;` — must be empty before migration `200200`.
4. `php artisan migrate --force` (the 8 migrations above; verify with `--pretend` first).
5. `php artisan enrollment:reconcile --report=storage/app/reconcile-prod.json` (dry run) → read the report (needs_review, disagreements) → `php artisan enrollment:reconcile --apply`.
6. Compare counts like §8 (legacy groups vs masters, rows vs levels, `active_level`, statuses).
7. Set `ENROLLMENT_SOURCE=dual` + `php artisan config:clear`; watch Sentry/logs; the scheduler keeps reconciling.
8. After a soak (days) set `new`. Rollback at any time: set `legacy`/`dual` + `config:clear`.
9. Legacy table is **not** touched or dropped in this phase.


---

## 10. Part 2 — new tables PRIMARY, `u_exam_enrollments` = shadow copy (built 2026-11-27, local only, backend branch `phase-64-write-source`, not merged, not deployed)

**Flag:** `ENROLLMENT_WRITE_SOURCE=legacy` (default, today's behaviour, byte-identical) | `new`. It is independent of `ENROLLMENT_SOURCE` (reads). `new` implies: reads from the new tables (view), the strict in-transaction mirror, the free-credit counter on the master, and the scheduler heals the SHADOW (`enrollment:reconcile --apply --direction=new --since=30`, every 5 min) instead of the new tables. Going back = set `legacy` + `php artisan config:clear` + restart the queue worker; nothing is lost because the shadow is written in the same DB transaction as every change.

**What "primary" means in this part (and what it does NOT mean yet)**
- Every write still goes through the same model/service call sites (about 41 write sites, none removed). Inside ONE atomic transaction the legacy row is written and the new tables are derived, so the end state is identical to a native write on the new tables. What changes with the flag is who is AUTHORITATIVE: (1) the free-credit counter is charged on `u_enrollments.free_test_credits_used` (atomic `UPDATE ... WHERE used < limit`) and the canonical shadow row is set equal in the same transaction; a drifted shadow counter is overwritten, not trusted; (2) `enrollment:reconcile --direction=new` rewrites the shadow from the new tables (`LegacyShadowService`), never the other way; (3) the scheduler safety net runs that direction; (4) read-modify-write sites lock the right rows (see below); (5) the referral extension, which writes `u_enrollments` directly, now also updates the shadow.
- NOT done (needs its own approval, later): rewriting the call sites to mutate `u_enrollments` / `enrollment_levels` first and removing every reference to `u_exam_enrollments`; re-pointing `transactions.transactionable_id` (still legacy ids, which stay valid because every level has a shadow row: `enrollment_levels.source_enrollment_id`); dropping or renaming the legacy table. Reason for not converting call sites now: they carry model events (START_TRIAL, daily-test generation, analytics, widget cache) and legacy integer ids that payments and attempts depend on; a native-first rewrite of 41 sites in one go is the part most likely to break a live platform and gives the same end state.
- Locks: write paths keep locking the LEDGER rows they are about to write (V1 `enrollExam`, `extendRows`, V2 test-start guard), now also `PaymentService::activateEnrollment` (new mode) and a per-user lock before the first read of V2 `enrolledToCourse*` (stops two first calls creating two groups). Locking the master instead would invert the lock order against the sync (ledger rows first, then master) and add deadlocks for no extra safety. The old locks on the READ VIEW (in `extendRows` and the V2 test-start guard) did nothing: fixed (commit a5f1236).

**New pieces:** `app/Services/Enrollment/LegacyShadowService.php`, `enrollment:reconcile --direction=legacy|new` (dry run by default, `--apply`, `--group`, `--since`, `--limit`, `--report`), `config/enrollment.php` `write_source`, `.env.example`, `phpunit.xml` (pins `legacy`), `tests/Feature/EnrollmentWriteSourceTest.php` (9 tests).

**Shadow rules:** group-level fields (price, valid_till, subscription_id, purchase_id, attempt_year, study_mode, enrolled_at, trial_converted_at, edit_count, last_accessed_at, study_guide_seen) come from the master and are copied onto every shadow row; per-paper fields (stage, status, active_level, language, selections, metadata) come from the level; `active_level` is copied exactly; a level without a shadow row gets one (a legacy id exists, written back to the level); a shadow row whose level was RETIRED is removed (the old code hard-deletes removed papers too); a shadow row no level ever pointed at is kept and reported (never deletes what the primary store does not know, e.g. before the forward reconcile ran). On the local DB the dry run would update 36 shadow rows: per-row differences inside a group (enrolled_at 30, last_accessed_at 10, edit_count 4, 1 each of enrollment_type / valid_till / trial_converted_at / study_guide_seen) that the master flattens.

**Bugs found and fixed while building (also on `main`, urgent)**
- `UExamEnrollment::updateAndMirror()` had a broken type hint (`IlluminateDatabaseEloquentBuilder`): TypeError on EVERY call. It is called from `EnrollmentAccessService::expireForSubscription` (halted / cancelled subscription webhooks), so since the main merge (cb43544) a halt did not expire anything. An earlier test expectation ("halt keeps the row active") only passed because of that error. Fixed in `0b84af3`; the test is back to `expired` (ACCESS_GUARD_MODE=log).
- Same escaping accident (lost backslashes) in `AccessRestoreExpired` (fixed `25a865a`).

**Pre-existing issues found, NOT changed**
- V1 `ExamController::startLearning` (`updateOrCreate`, about line 286) matches on `exam_id` + `stage_id` only (no `user_id`; exam_id is read from `$request['exam_id']['transactionable_id']`): it can update another user's row. Legacy PayU-style route; leave until the owner decides.
- `CourseRepository.php:254` writes the column `'last_accessed_at '` (trailing space): silently ignored by mass assignment. Fixing it would start bumping `last_accessed_at` whenever that endpoint runs, which changes which course is "active", so it is left as is on purpose.
- `AccessRestoreExpired` rollback is raw SQL (now bumps `updated_at` and mirrors); `ReferralService` `new_course` creates a master without levels (invisible to the view); `PaymentService` and the credit counters do not bump `updated_at` (ExpireTrials now does when mirroring).

**Tests (local MySQL `clearcut`, transaction-wrapped):** the six existing files plus `EnrollmentWriteSourceTest` = 41 green with the flag off. The same six pass with `ENROLLMENT_WRITE_SOURCE=new` forced, except 3 tests that assert legacy/dual-only semantics ("mirrors nothing in legacy mode", "a failing mirror never breaks the legacy write" = the after-commit dual behaviour, bulk-delete capture in dual). sqlite suite: 71 failed / 280 passed = identical to main.

### 9b. Production steps for Part 2 (the owner runs these; nothing was run on production)
Pre-conditions: section 9 done (migrations, `reconcile --apply`, `ENROLLMENT_SOURCE=dual` soak, then `new` soak) and this branch reviewed and merged by the owner.
1. Deploy with `ENROLLMENT_WRITE_SOURCE` unset (= legacy): nothing changes. Watch Sentry for 24 h.
2. Dry run the other direction; expect only small, explainable numbers: `php artisan enrollment:reconcile --direction=new --report=storage/app/shadow-prod-dry.json`. Look at `changes_by_field`, `orphan_shadow_rows`, `errors` (must be 0).
3. Env on BOTH Coolify apps (`clearcut-main-backend` and `clearcut-backend-queue-worker`): `ENROLLMENT_SOURCE=new` and `ENROLLMENT_WRITE_SOURCE=new`, then redeploy/restart (config cache). Run `php artisan enrollment:reconcile --apply --direction=new --limit=50` first, then without `--limit`.
4. Watch: Sentry, enroll / payment / renewal / free-credit flows, and counts: masters, levels, ledger rows (levels = ledger rows), credits (`SUM(free_test_credits_used)` on both tables).
5. Roll back at any time: `ENROLLMENT_WRITE_SOURCE=legacy` (and `ENROLLMENT_SOURCE=dual` or `legacy`), `config:clear`/restart both apps. Then `php artisan enrollment:reconcile --apply` (forward) to bring the new tables level with the legacy table.
6. Never drop or rename `u_exam_enrollments` in this part.

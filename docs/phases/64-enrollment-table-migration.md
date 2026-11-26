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

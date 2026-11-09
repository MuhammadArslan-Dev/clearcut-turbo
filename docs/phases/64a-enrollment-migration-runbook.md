# Phase 64a — Production runbook: `u_exam_enrollments` → `u_enrollments` + levels

**For the person running it on production. Nothing here has been run on production** — every number below comes from the 2026-10-27 dump and the local dev DB. Companion to `64-enrollment-table-migration.md` (design, evidence, decisions).
**Rule:** one stage at a time, wait for the check at the end of each stage, never skip a backup. Any stage can be undone with the rollback line at its end.

## 0. What ships and what it changes
- Backend branch `feature/enrollment-table-migration` (not merged, not committed yet). Frontend: **no change needed** (the API contract is identical, see 64 §13).
- New env var `ENROLLMENT_SOURCE` = `legacy` (default, today's behaviour) → `dual` → `new`. Only `legacy` is safe to leave unset.
- 7 additive migrations (order matters):
  `2026_10_28_200000_create_enrollment_legacy_map_tables` · `…200100_add_legacy_columns_to_transactions_table` · `…200200_add_unique_group_code_to_u_enrollments` · `…210000_add_uuid_to_enrollment_levels_table` · `…210100_create_v_exam_enrollments_view` · `…220000_order_v_exam_enrollments_view` · `…230000_add_unique_gateway_payment_id_to_transactions`.
- One payment-code change (P6): `SubscriptionService::handleRenewalSuccess` now locks the subscription row and re-checks, so a duplicate `subscription.charged` can no longer create a second transaction / double `paid_count`.

## 1. Stage A — backup (no change)
1. Full database backup, then a copy of these tables so the data can be put back exactly: `u_enrollments`, `enrollment_levels`, `transactions`, `subscriptions`.
2. Note the row counts: `u_exam_enrollments` (2026-10-27: 16,732), `u_enrollments` (7,525), `enrollment_levels` (8,384), `transactions` (1,987, success sum ₹143,286).
**Check:** you can open the backup and count the rows. **Rollback:** n/a.

## 2. Stage B — read-only pre-checks (must all be 0 / as stated before going on)
```sql
-- B1 duplicates / empty strings that would block the payment-id unique index (must be 0 and 0)
SELECT COUNT(*) FROM (SELECT gateway_payment_id FROM transactions WHERE gateway_payment_id IS NOT NULL GROUP BY 1 HAVING COUNT(*)>1) x;
SELECT COUNT(*) FROM transactions WHERE gateway_payment_id = '';
-- B2 duplicate group codes among already-migrated masters (must be 0)
SELECT COUNT(*) FROM (SELECT group_code FROM u_enrollments GROUP BY 1 HAVING COUNT(*)>1) x;
-- B3 baseline money numbers (write them down)
SELECT status, COUNT(*), SUM(amount) FROM transactions GROUP BY status;
-- B4 what the backfill is about to do (informational; 2026-10-27: 282 legacy-active not active in the new tables)
SELECT COUNT(*) FROM u_exam_enrollments l WHERE l.status='active' AND NOT EXISTS (SELECT 1 FROM u_enrollments e WHERE e.group_code=l.group_code AND e.status='active');
```
Also run `php artisan migrate:status` and confirm the ONLY pending migrations are the 7 above (if others are pending, stop and ask — the 7 must be run with `--path`, see Stage C).
**Rollback:** n/a (read-only).

## 3. Stage C — deploy code with `ENROLLMENT_SOURCE` unset/`legacy`, run the migrations
```sh
php artisan migrate --force      # only if migrate:status showed exactly the 7 above; otherwise run each with --path=database/migrations/<file>.php in the order in §0
```
**Check:** the app behaves exactly as before (flag is `legacy`: nothing is mirrored, the model reads/writes the legacy table). `SELECT COUNT(*) FROM v_exam_enrollments;` returns the number of live levels.
**Rollback:** `php artisan migrate:rollback --force --path=database/migrations/<file>.php` for each of the 7, newest first (tested: legacy table, subscriptions, users unchanged; transactions content hash unchanged).

## 4. Stage D — backfill the new tables (still `legacy`)
```sh
php artisan enrollment:reconcile --report=storage/app/reconcile-dry.json      # DRY RUN (default). Read the table it prints and the report.
php artisan enrollment:reconcile --apply --report=storage/app/reconcile-apply.json   # ~5 min per 14k groups; safe to re-run
php artisan enrollment:reconcile --report=storage/app/reconcile-again.json    # must now report 0 created / 0 updated
```
Expected from the dump: ~15,7xx groups, 0 errors, 27 NULL-group rows become `legacy-<id>` groups, **2 flagged `needs_review`** (legacy rows #52 user 12 and #82 user 105: active, no expiry — kept exactly as they are), 6 groups with the same stage twice (kept as separate levels, listed in the report), group `6aaaa90e44878` (user 18357) resolved to the widest access.
**Checks (all must hold):**
```sql
SELECT COUNT(*) FROM u_exam_enrollments l WHERE NOT EXISTS (SELECT 1 FROM enrollment_legacy_map m WHERE m.legacy_id=l.id);                       -- 0
SELECT COUNT(*) FROM u_exam_enrollments l WHERE l.status='active' AND NOT EXISTS (SELECT 1 FROM u_enrollments e WHERE e.group_code=COALESCE(l.group_code,CONCAT('legacy-',l.id)) AND e.status='active');   -- 0 (was 282)
SELECT COUNT(*) FROM (SELECT u_enrollment_id FROM enrollment_levels WHERE active_level=1 AND deleted_at IS NULL GROUP BY 1 HAVING COUNT(*)>1) x;  -- 0
SELECT status, COUNT(*), SUM(amount) FROM transactions GROUP BY status;                                                                           -- identical to B3
```
**Rollback:** the legacy table and transactions are never written by this stage. To return `u_enrollments`/`enrollment_levels` to their pre-run state restore those two tables from the Stage A copy (they are derived data).

## 5. Stage E — `ENROLLMENT_SOURCE=dual` (legacy stays the truth, every write is mirrored after commit)
Set the env var in Coolify, then `php artisan config:clear` and restart workers. **The scheduler must be running**: `enrollment:reconcile --apply --since=30` runs every 5 minutes as the safety net.
Watch for a few days: log lines `enrollment.mirror_failed` (should be none; each is repaired by the next reconcile), and re-run the Stage D checks daily (all still 0).
**Rollback:** set `ENROLLMENT_SOURCE=legacy`, `config:clear`. No data to undo.

## 6. Stage F — `ENROLLMENT_SOURCE=new` (reads from the new tables; writes still land in the legacy table, the "ledger", and are derived into the new tables inside the same transaction)
Go only after Stage E has been clean for the agreed soak period and you have done the browser check (64 §13). Off-peak, one app instance first if possible.
**Checks right after:** a test signup/enrol, a test payment, `GET /api/v2/get-my-active-courses` for 3 real accounts (compare with what the student sees), and Stage D checks again.
**Watch after the flip:** the log for `Deadlock found` (SQLSTATE 40001) on enrollment writes. Two simultaneous writers on one brand-new group can deadlock in `new` mode; the model retries up to 3 times when it owns the transaction (tested 12/12), but a caller-owned transaction cannot be retried and the request fails (data stays consistent, the client retries). A handful is expected only on double-submits; a steady stream means go back to `dual`.
**Rollback (instant, no data loss — the ledger is always complete):** `ENROLLMENT_SOURCE=dual` (or `legacy`), `config:clear`.

## 7. Facts for support / ops (from the 2026-10-27 dump — re-run on the day)
- **Paid but no enrollment of any kind:** user 393 (₹199) and user 13593 (₹99). Not touched; follow up manually.
- **11 successful payments** point at enrollment rows that were deleted and whose group no longer exists anywhere. Not touched.
- **72** legacy rows are `active` but already past `valid_till`; copied exactly, not expired by this work.
- **21** active rows have no payment/subscription (look like admin/QR/referral grants); copied exactly.
- **138** successful transactions have no `paid_at`; untouched.
- Known, unchanged: `CourseRepository.php` writes `'last_accessed_at '` (trailing space) so that column is never updated there.

## 8. Not part of this rollout
- Retiring the legacy table / making the model write straight to the new tables (separate approval, separate phase).
- Phase 57/58 code (practice test, user states) when it merges: change `UserStateRegistry.php:99` `UExamEnrollment::where(...)->update(...)` to `UExamEnrollment::bulkUpdate(fn ($q) => ..., [...])`.
- Daily-test endpoints were not compared on a fully migrated DB (the dev DB lacked their migrations): check them on staging/prod right after Stage F.

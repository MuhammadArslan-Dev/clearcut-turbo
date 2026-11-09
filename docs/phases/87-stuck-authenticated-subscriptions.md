# Phase 87 — Paid subscriptions stuck in `authenticated`

**Tickets:** CC-117 (Highest, queue 01 — "24 students won't renew before 19 Nov")
**Repos:** BE (`C:\laragon\www\clearcutoff-main-backend`)
**Branch:** backend `fix/cc-117-stuck-authenticated-subscriptions` — commit `5dac488`, tested, NOT pushed/merged
**Created / start date:** 2026-11-09
**Status:** In Progress — code + tests done on the backend branch (not pushed); the repair run (`--apply`) is `Blocked – Decision`; enforcement flag is a 🛑 too

> Razorpay is strictly READ-ONLY for us. Nothing here changes Razorpay. Backend deploys before any frontend.

---

## 1. Problem / objective
38 students paid the first autopay month but their row in `subscriptions` is `authenticated`, not `active`; none was "ever charged again" (24 are still inside their paid period, ending 13 Oct–19 Nov). Goal: every paid subscription ends `active`, the 24 live ones renew, and a daily alert catches this in future.

## 2. Scope
- **In:** webhook/status logic in `SubscriptionService` + `SubscriptionWebhookService`; a dry-run-first repair command; a daily alert; PHPUnit tests.
- **Out:** changing anything in Razorpay; the 10 Halted subscriptions (failed renewals — separate, report only); access rules; frontend.

## 3. Evidence gathered (read-only, 2026-11-09)
**Razorpay dashboard (live mode):** Subscriptions → **Active 137, Pending 1, Halted 10** ("auto charge failed"); there is no "authenticated" bucket at Razorpay. So the 38 DB rows are almost certainly `active` there (our DB status is wrong) — to be confirmed per subscription (see §6).
**Code:**
- `app/Services/SubscriptionService.php` `handleAuthenticated()` (~l.515–570) writes `status='authenticated'` unconditionally except for closed states (`cancelled/completed/expired`, guarded by `EnrollmentAccessService::guardEnforced()` → log `access_guard.would_block_status_regress` or return false).
- `app/Services/SubscriptionWebhookService.php` `onActivated()` (l.110) only logs. `status='active'` is set only by `subscription.charged` (`handleRenewalSuccess`, l.140–230) or `subscription.resumed`.
- So `paid_count >= 1 AND status = 'authenticated'` means `charged` ran first and a later `authenticated` (out-of-order delivery or Razorpay retry of an earlier failed webhook) overwrote it. The Sentry GX crash (null user for a deleted account) is already fixed (`8220529`) but makes Razorpay replay events.
- Students are **not locked out**: access uses enrollment `status` + `valid_till` + 3 days grace (`EnrollmentAccessService::hasPaidAccess`), not `subscriptions.status`. Damage = wrong reporting/renewal logic.
- Creation sends no `start_at`/upfront amount (`createSubscription` l.85–130): `plan_id`, `total_count`, `customer_notify`, notes.

## 4. Implementation plan
- [x] 1. Guard in `handleAuthenticated`: ignore (return false, existing "ignored" contract) when `paid_count > 0` or status ∈ {active, paused}. **Follow the pattern directly above it:** when `guardEnforced()` is false only `Log::warning('access_guard.would_block_status_regress', …)`; when true return false. Ship log-only first; enable enforcement after the logs show only legitimate hits.
- [x] 2. `onActivated`: set `status='active'` when `paid_count >= 1` and not terminal (self-healing).
- [x] 3. New artisan command (dry-run default; same pattern as `payments:reconcile` / `analytics:backfill-razorpay`) listing rows with `status='authenticated' AND paid_count>=1`; each row confirmed against Razorpay via existing `SubscriptionService::fetchFromRazorpay()` (read-only API call); never marks halted/cancelled as active. **The repair (`--apply`) is only run after the user approves the dry-run list.**
- [x] 4. Daily alert command `subscriptions:alert-stuck-authenticated` (`paid_count>=1 AND status='authenticated'` for > 24 h), registered in `routes/console.php` with `Schedule::command(...)->dailyAt('09:30')->withoutOverlapping()`; output `Log::error` (reaches Sentry via `bootstrap/app.php`).
- [x] 5. PHPUnit (default `phpunit.xml` = sqlite `:memory:`; any MySQL-only test on a throwaway DB — some backend tests wipe their DB): `charged → authenticated` stays `active`; `authenticated`-only stays `authenticated`; `activated` heals; closed states unchanged.

## 4a. Built (2026-11-09, backend commit `5dac488`)
- `SubscriptionService::handleAuthenticated` — new guard after the closed-state one: when `paid_count >= 1` or status is `active`/`paused`, log `subscription.would_block_authenticated_regress` (log mode, behaviour unchanged) or, when `payment.access_guard.mode=enforce`, log `subscription.authenticated_regress_blocked` and return `false` (webhook then skips notification/analytics).
- `SubscriptionWebhookService::onActivated` — heals `authenticated` + `paid_count>=1` to `active` (status only, no access change, no analytics).
- `subscriptions:repair-stuck-authenticated` (dry run; `--apply` writes only when Razorpay says `active`/`paused`; halted/cancelled/unreachable are left, listed as "needs a human"/"skipped"). Status column only: no access change, no events, nothing written to Razorpay.
- `subscriptions:alert-stuck-authenticated` (daily 09:30, `withoutOverlapping`, `Log::error` only when something is stuck > 1 day).
- No migration, no new dependency.

## 4b. Findings from the local DB copy (read-only)
37 rows `authenticated` with `paid_count>=1` (the prod count was 38). Webhook order for them: in **24 of 33** that have logs, `subscription.authenticated` arrived AFTER `charged`/`activated` (the regress this fixes); 4 only ever got `paused`; 4 have no log at all. Access does not depend on `subscriptions.status`, so students were not locked out.

## 5. Decision log
| Date | Question | Answer (who) |
|---|---|---|
| 2026-11-09 | 🛑 Approve the dry-run list before any status is changed (`--apply`)? Also: turn guard enforcement on after the log-only period? | open |
| 2026-11-09 | 🛑 Merge/push backend `main` (auto-deploys)? Ships in log-only mode, so behaviour on live does not change except the `onActivated` self-heal and the daily alert. | open |

## 6. Blockers / risks — what only the user can do
- Risk: medium (subscription state machine; no money moves). A wrongly "active" row for a halted/cancelled mandate would mislead renewals → the repair re-checks Razorpay per row.
- **User, on the production DB** (no phone numbers needed): list the 38 —
  `SELECT id, razorpay_subscription_id, status, paid_count, current_end, created_at FROM subscriptions WHERE status='authenticated' AND paid_count>=1 AND deleted_at IS NULL ORDER BY current_end;`
  then compare 3–5 of them in the Razorpay dashboard (status + next charge date) and, in `webhook_logs`, the order of `subscription.authenticated` vs `subscription.charged` for the same subscription id (column names to confirm).
- **User, Razorpay dashboard (read-only look):** confirm `subscription.activated` is among the subscribed webhook events; look at the 10 Halted (failed renewals).
- "None ever charged again": a Razorpay-side fact (failed/pending renewal debits or mandate) — code alone cannot tell which.

## 7. Dependencies / packages added
None. No migration. New artisan commands + scheduler entry.

## 8. Tests and verification
- [x] PHPUnit `StuckAuthenticatedSubscriptionTest` (13 tests, MySQL scratch DB `clearcut_p26b_test`, never the dev data): 6 of them FAIL on the old code and pass on the new (proof they catch the bug); `AccessAuthorityTest`, `EventTrackingServiceTest`, `RazorpayWebhookBackfillTest` still green (67 passed together); pint clean.
- Pre-existing, not mine: `PaymentRecoveryTest` fails 21/21 on the scratch DB on clean `main` code too (`Attempt to read property "id" on null`, missing seed data).
- Not verified: the repair command against real Razorpay (the dry run calls Razorpay's read API — run it on prod with the live keys; I did not call Razorpay), the production list of 38, enforcement mode on live traffic, real webhook replay from Razorpay.
- [ ] dry-run command output reviewed by the user; [ ] after deploy: alert query returns 0 for 48 h

## 9. Next steps
Get the user's go to push/merge backend; then on prod run `php artisan subscriptions:repair-stuck-authenticated` (dry run), share the table, wait for the 🛑 before `--apply`; later set `ACCESS_GUARD_MODE=enforce` if the logs look right.

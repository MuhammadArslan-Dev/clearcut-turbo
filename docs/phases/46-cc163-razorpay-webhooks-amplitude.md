# Phase 46 — Razorpay subscription webhooks -> Amplitude

**Tickets:** CC-163 (High)
**Repos:** BE
**Status:** Built + verified locally (not committed). Waiting on: deploy BE, then the user runs the backfill
**Created:** 2026-10-27 (wave 2, Arslan's list)

## Goal
Renewals, cancels, pauses, halts and failed payments appear in Amplitude as server-side events on the same user as browser/app events, without slowing the webhook.

## Already in place before this phase (Phase 29, CC-69/CC-98 — on main since 2026-10-23, live)
- `PaymentAnalytics` sends from the Razorpay webhooks, on EXISTING event names:
  - `Payment Completed`: first charge `is_renewal=false`; renewals `is_renewal=true` with `renewal_count` and `days_since_first_payment`.
  - `Subscription Status Updated`: pending, halted, cancelled, paused, active, completed, with `source=razorpay`.
- Delivery: queued `SendAmplitudeEvent` (backoff 10/60/300/900 s). `user_id` = user uuid (same as the dashboard). Switch: `AMPLITUDE_ENABLED`.
- Amplitude, last 30 days (checked 2026-10-27): renewals 14, first charges 4, pending 9, cancelled 3 — events flow since the week of 19 Oct.

## Gaps found and built (2026-10-27)
1. **Failed renewal charge was invisible.**
   - Razorpay sends `payment.failed` (with `subscription_id`), not `subscription.payment.failed`, and the controller only logged it as `skipped`.
   - Now: `PaymentAnalytics::renewalFailedIfRenewal()` sends **Payment Outcome** with `outcome=payment_failed`, `billing_type=auto_renew`, `is_renewal=true`, `failure_reason`, `error_code`, `error_reason`, `final_price`, `payment_method` and `source=razorpay`.
   - It fires only when the subscription has paid before (a failed first checkout is the browser's Payment Outcome).
   - Insert_id: `razorpay:payment.failed:<payment id>`, so a retried webhook is de-duplicated.
   - The lookup is wrapped in its own try/catch, so it can never change the webhook response.
2. **Mandate approved:** `subscription.authenticated` sends Subscription Status Updated `new_status=authenticated`. Insert_id: `razorpay:subscription.authenticated:<sub id>`.
3. `AmplitudeService::track()` takes optional `$insertId` and `$timeMs` (additive; the old callers are unchanged).
4. **Backfill:** `php artisan analytics:backfill-razorpay --until="<live start>" [--send]`.
   - Dry run by default.
   - Replays `webhook_logs` (status success/skipped) in id order through `App\Services\Analytics\RazorpayWebhookBackfill::map()`.
   - The mapper is pure: renewal counts and days-since-first-payment are the values true at that time, not today's.
   - Insert_id: `razorpay-backfill:<webhook_logs.id>`. Time: when the webhook arrived. Property `backfilled: true`.
   - `--until` is required. Use the earliest live server event; the commit landed 2026-10-23 14:58 +05:00, so check Amplitude for the first `source=razorpay` event.

## Checks
- Pest unit tests: `TracesSamplerTest` + `RazorpayWebhookBackfillTest` (26 tests pass). Pint clean on the touched files.
- `php -l` passes on every touched file.
- Local dry run on the local DB (a copy with real rows), up to 2026-10-23 14:58:
  - Payment Completed 441
  - Status: authenticated 172, cancelled 186, pending 104, paused 61, halted 21, active 4
  - Skipped (no mapping) 1029; 0 missing subscription/user
- Live path with `Queue::fake()` in tinker (nothing sent):
  - A paid subscription → one Payment Outcome job with insert_id `razorpay:payment.failed:pay_TEST123` and the props above.
  - An unpaid subscription → no job.
  - authenticated → a Status Updated job.

## Steps
1. [x] Read AmplitudeService, AmplitudeEvent, the webhook controller, and user_id (uuid everywhere).
2. [x] Queue/retry/flag — already there.
3. [x] Failed renewal + authenticated + deterministic insert_ids.
4. [x] Unit tests + local queue check. (A full HTTP feature test with a signed webhook was not written.)
5. [x] Backfill command — **user runs it on the server** after the deploy: dry run first, then `--send`.
6. [ ] Amplitude taxonomy descriptions for the new properties (failure_reason, error_code, source, backfilled, new_status=authenticated). This writes to Amplitude, so it needs approval.
7. [ ] After 7 days: `Payment Completed` (server) vs `subscription.charged` rows in webhook_logs within 1%.

## Decision log
| Date | Decision | By |
|---|---|---|
| 2026-10-27 | Failed renewal → existing **Payment Outcome** (outcome payment_failed), not a new event | User |
| 2026-10-27 | Backfill: build the command; user runs it on production | User |
| 2026-10-27 | Mandate authenticated → Subscription Status Updated (authenticated) | User |

## Verification
After deploy: trigger or wait for a failed renewal → Payment Outcome (source razorpay) in Amplitude. Backfill dry run on prod, compare the counts with webhook_logs, then `--send`.

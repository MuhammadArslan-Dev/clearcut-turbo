# Phase 29 — CC-69 + CC-98: checkout events and renewal events

**Status:** Built + verified locally (2026-10-23). BE `phase-29-payment-events` (d39e2eb), CM `phase-29-payment-events`. Additive only: every existing event keeps firing unchanged.
**Jira:** [CC-69](https://clear-cutoff.atlassian.net/browse/CC-69), [CC-98](https://clear-cutoff.atlassian.net/browse/CC-98)
**Repos:** CM `apps/dashboard` (browser events), BE (webhook → Amplitude HTTP API, failure reasons)
**Size:** medium

## What the tickets say
**CC-69 (blocks the CC-62 price test and the CC-65 WhatsApp reminder):**
- **Events in Amplitude and Clarity, same names:** `pay_page_view`, `plan_selected`, `pay_tap`, `rzp_opened`, `rzp_dismissed`, `rzp_failed` (error.code/reason), `paid` (**from the backend webhook**), `continue_free_tap`.
- **Properties:** exam, plan (e.g. `99_autopay`), price, source, language, in_app_browser (fb/ig/none), `price_anchor` (A/B, also a user property).
- **Clarity:** `clarity("event"…)` and `clarity("set"…)`.
- **For CC-65:** Amplitude user_id = our user id; phone as a user property (check with RD how). A signed 48-hour `app.clearcutoff.in/pay?t=…` link plus an API to get it.
- **Failure reasons:** store every Razorpay `error.code`/`error.reason` on the transaction.

**CC-98 — backend events from Razorpay webhooks to Amplitude:**

| Webhook | Event |
|---|---|
| `subscription.charged` | `subscription_renewed` {renewal_number, days_since_first_payment} |
| `payment.failed` (sub) | `renewal_failed` |
| `subscription.halted` | `subscription_halted` |
| `subscription.cancelled` | `subscription_cancelled` {cancelled_by, reason} |
| `subscription.paused` / `resumed` | `subscription_paused` / `subscription_resumed` |
| `subscription.completed` | `subscription_completed` |

- **User properties:** subscription_status, plan, renewal_count, next_charge_date.
- **Then:** build an Amplitude chart "paid month 1 → renewed month 2".

## What the code shows (2026-10-23, first pass)
- **Dashboard already fires:** `Payment Paywall Rendered`, `Plan Switched`, `Purchase Intent Initiated`, `Payment Initiated`, `Payment Outcome` (+ failure reason via `getPaymentFailureReason`), `Support Contacted` (CC-64), and the cancel-flow events (CC-97: `subscription_cancelled`/`paused` from the **browser**, with the reason).
- **Name clash:** CC-98's server `subscription_cancelled` has the same name. Decide whether to keep the browser one (has the reason) or rename (`cancel_confirmed`).
- **BE:** has `AmplitudeService` (used for `Signed Up`, needs `AMPLITUDE_ENABLED` + key).
- **BE webhook entry:** `SubscriptionWebhookService` (CC-120 touches the same file — do Phase 26 first).

## What was found (2026-10-23)
- **Phone is already an Amplitude user property** (`AnalyticsProvider`: `setAnalyticsUser(uuid, { phone })`), and Clarity gets `set phone`. Nothing new needed for D1.
- **The browser already has `subscription_cancelled` and `subscription_paused` (CC-97).** Both server names differ.
- **Razorpay sends `subscription.pending`** for a failed renewal that it retries (104 in the local copy). `subscription.payment.failed` never arrives, so `onPaymentFailed` is dead code.
- **`subscription.paused` (61) and `subscription.resumed` (4) were unhandled**, so the local status didn't follow.
- **Old webhook failures in the local copy are already fixed:**
  - `markFailed(null)` ×2138, last 24 Aug.
  - `notifyCancellation(null)` ×25, last 1 Jul.

## What was built
**BE (`PaymentAnalytics`, `AmplitudeEvent`):**

| Event | From | Properties |
|---|---|---|
| `paid` | one-time activation; first autopay charge | exam, course_id, plan (`149_autopay` / `229_onetime` / `799_annual`), price, billing_type, payment_method |
| `subscription_renewed` | `subscription.charged` (not first) | + renewal_count, days_since_first_payment |
| `renewal_failed` | `subscription.pending` | reason, error_code, error_reason, auth_attempts |
| `subscription_halted` | `subscription.halted` | |
| `subscription_cancel_confirmed` | `subscription.cancelled` | cancelled_by (student / account_deleted / razorpay) |
| `subscription_pause_confirmed` | `subscription.paused` | |
| `subscription_resumed` | `subscription.resumed` | |
| `subscription_completed` | `subscription.completed` | |

- **User properties:** subscription_status, subscription_plan, renewal_count, next_charge_date.
- `user_id` = uuid, the same as the browser.
- A duplicate webhook doesn't count twice; analytics never fails a webhook.
- `subscription.paused` / `resumed` now set the local status to `paused` / `active`.

**Dashboard (`lib/analytics/paymentFunnel.ts`):**
- `trackPayFunnel()` sends the same name to Amplitude (typed catalog) and Clarity (`event` + `set pay_plan / pay_exam / in_app_browser`).
- Events:
  - `pay_page_view`, `plan_selected`, `pay_tap`, `continue_free_tap` (bottom button) on the payment page.
  - `rzp_opened`, `rzp_dismissed`, `rzp_failed` (error_code, error_reason) in both the one-time hook (all paywalls) and the autopay checkout.
- Properties: exam, plan, price, source, language, in_app_browser (fb / ig / none).
- **Not built:**
  - `price_anchor`: no price A/B exists yet (CC-62); add it with that test.
  - The signed `/pay` link (user: later).

## Verification (local)
- [x] **BE dry run** (rolled-back DB, faked Amplitude HTTP, sync queue) on a real active subscription:
  - charged → `subscription_renewed` (renewal_count 5, 159 days); the same payment again → nothing.
  - pending → `renewal_failed`.
  - paused / resumed / cancelled → events with status user properties (`cancelled_by: razorpay`).
  - New subscription's first charge → `paid`.
  - One-time activation → `paid` {799_annual, card, HTET}.
  - Every `user_id` is a uuid.
- [x] **Browser (hi, Razorpay stubbed, Clarity recorded):** in order `pay_page_view` (149_autopay) → `plan_selected` (799_annual) → `pay_tap` → `rzp_opened` → `rzp_dismissed` → `pay_tap` → `rzp_opened` → `rzp_failed`. Then autopay `pay_page_view` → `pay_tap` → `rzp_opened` → `rzp_dismissed` → `continue_free_tap`. Failure still lands on `/payment/failed` as before.
- [x] tsc: no new errors; eslint equal to main (13 = 13); check:colors passes.
- [ ] Amplitude ingestion not observable locally (`NEXT_PUBLIC_AMPLITUDE_ENABLED` empty in `.env`). Check the events in Amplitude after deploy.
- [ ] After a month: chart "paid month 1 → `subscription_renewed`".

## Event names corrected (2026-10-23, user's rule: reuse existing events)
The first version created new snake_case events next to existing ones. Now:

| Moment | Event (existing unless marked new) | Properties added |
|---|---|---|
| Payment page opened | Purchase Intent Initiated | exam, plan, price, source, language, in_app_browser |
| Plan changed | Plan Switched | exam, plan, price, source, language, in_app_browser |
| Pay tapped / autopay checkout created | Payment Initiated | plan, price, source, language, in_app_browser (+ `resumed_session` allowed in payment_flow) |
| Razorpay checkout opened | **Checkout Opened** (new) | billing_type + the same context |
| Paid / failed / cancelled in checkout | Payment Outcome | error_code, error_reason (failed) + the context |
| "Continue free" sheet resolved | **Continue Free Clicked** (new) | reason: expensive / exploring / later / payment_issue / skipped / closed + the context |
| Test saved after end-exam | Test Submitted (catalog, never sent before) | exam, course_id, section_name, total_questions, language |
| Test left (page closed / 30 min idle) | **Test Abandoned** (new) | test_id, test_type, course_id, reason, answered |
| Report opened / tab | Performance Report Viewed / Performance Report Tab Viewed (catalog, never sent before) | — |
| Cancel flow steps | **Cancel Started / Cancel Reason Selected / Save Offer Shown / Save Offer Accepted** (new, renamed from snake_case) | unchanged |
| Cancel/pause/resume done in the app | Subscription Status Updated | subscription_id, source: app, reason, note |
| Server: paid / renewal | Payment Completed (name already in Amplitude) | plan, price, billing_type, payment_method, is_renewal, renewal_count, days_since_first_payment, exam, course_id |
| Server: pending / halted / completed, or cancel/pause/resume by Razorpay | Subscription Status Updated | new_status, plan_name, exam_id, exam_name, subscription_id, source: razorpay, cancelled_by |
| Resizer (tools) | **Resizer Image Uploaded / Processed / Downloaded, Resizer Process Another Clicked** (renamed to Title Case) | unchanged |

- Clarity gets the same names through `trackPaymentEvent` (lib/analytics/paymentFunnel.ts).
- Removed names: pay_page_view, plan_selected, pay_tap, rzp_opened, rzp_dismissed, rzp_failed, continue_free_tap, continue_free_reason, test_submitted, test_abandoned, report_viewed, cancel_started, cancel_reason_selected, save_offer_shown, save_offer_accepted, subscription_cancelled, subscription_paused, resizer_*, and server paid, subscription_renewed, renewal_failed, subscription_halted/cancel_confirmed/pause_confirmed/resumed/completed.

## Plan
- [x] **Browser events (CC-69):** map onto the existing typed catalog (don't duplicate `Payment Initiated`/`Payment Outcome`; add the missing names or alias them). Add Clarity `event`/`set` through one helper. Add `in_app_browser` + `price_anchor`.
- [x] **BE `paid` + all CC-98 events** via `AmplitudeService`, from the webhook handlers. Same `user_id` as the app (uuid).
- [x] **BE `transactions.payment_method` / `failure_reason`** (Phase 27) filled (shared with CC-119 step 4 / CC-71).
- [ ] **Signed `/pay?t=` link + API (CC-65): later (user, 2026-10-23)** short-lived signed token → login + payment page for exam/plan; 48 h expiry.
- [!] 🛑 **D1:** phone number as an Amplitude user property — confirm with RD (privacy).
- [!] 🛑 **D2:** `subscription_cancelled` name clash (browser vs server).
- [ ] **Verify:**
  - Blocked-request capture (as in Phase 20) shows each browser event with properties.
  - BE tinker sends a fake webhook → Amplitude HTTP payload logged (dry run).
  - The `/pay` link logs in and opens the right plan, and expires.

## Decision log
| Date | Item | Decision | By |
|---|---|---|---|
| 2026-10-23 | D1 phone in Amplitude | Yes (already sent as a user property) | User |
| 2026-10-23 | D2 name clash | Server: `subscription_cancel_confirmed` (+ `subscription_pause_confirmed`) | User |
| 2026-10-23 | `/pay` signed link | Later | User |

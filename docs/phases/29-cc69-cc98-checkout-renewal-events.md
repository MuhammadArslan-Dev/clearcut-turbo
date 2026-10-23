# Phase 29 — CC-69 + CC-98: checkout events and renewal events

**Status:** Not Started
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

## Plan
- [ ] **Browser events (CC-69):** map onto the existing typed catalog (don't duplicate `Payment Initiated`/`Payment Outcome`; add the missing names or alias them). Add Clarity `event`/`set` through one helper. Add `in_app_browser` + `price_anchor`.
- [ ] **BE `paid` + all CC-98 events** via `AmplitudeService`, from the webhook handlers. Same `user_id` as the app (uuid).
- [ ] **BE `transactions.payment_method` / `failure_reason`** filled (shared with CC-119 step 4 / CC-71).
- [ ] **Signed `/pay?t=` link + API (CC-65):** short-lived signed token → login + payment page for exam/plan; 48 h expiry.
- [!] 🛑 **D1:** phone number as an Amplitude user property — confirm with RD (privacy).
- [!] 🛑 **D2:** `subscription_cancelled` name clash (browser vs server).
- [ ] **Verify:**
  - Blocked-request capture (as in Phase 20) shows each browser event with properties.
  - BE tinker sends a fake webhook → Amplitude HTTP payload logged (dry run).
  - The `/pay` link logs in and opens the right plan, and expires.

## Decision log
| Date | Item | Decision | By |
|---|---|---|---|
| | | | |

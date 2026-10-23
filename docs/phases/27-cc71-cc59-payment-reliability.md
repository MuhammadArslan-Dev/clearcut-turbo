# Phase 27 — CC-71 + CC-59: one order per attempt, and payments that survive the Facebook/Instagram app browser

**Status:** Not Started — **very important** (money)
**Jira:** [CC-71](https://clear-cutoff.atlassian.net/browse/CC-71), [CC-59](https://clear-cutoff.atlassian.net/browse/CC-59) (context: [CC-49](https://clear-cutoff.atlassian.net/browse/CC-49) "Authorize" status)
**Repos:** BE (orders, webhooks, status endpoint), CM `apps/dashboard` (payment page)
**Size:** large; payment flow. Test only with stubs / Razorpay test mode; never a live charge from this machine.

## What the tickets say
**CC-71:**
- Students tap pay many times (one HTET student opened the payment page about 8 times and tapped pay 5 times in an hour), and each tap creates a new Razorpay order/subscription.
- Before creating one, check our DB and Razorpay for this student + exam:
  - Already paid/captured/active → don't charge again; grant access and go to success.
  - An attempt for the same plan open or pending and under 30 minutes old → reuse it.
  - Otherwise create a new one.
- Save every attempt in our DB (student, exam, plan, Razorpay id, status, time).
- A plan switch closes the old attempt.
- Granting access is idempotent (webhook + callback).

**CC-59 — paid per 100 pay taps:**

| Browser | Paid per 100 taps |
|---|---|
| Chrome | 27 |
| Facebook app | 16 |
| Instagram app | 14 |

- **Why:** the app browser kills our page while the student is in PhonePe/GPay, so the in-page success callback never runs. Logs show "Error invoking postMessage: Java object is gone".
- **Fix:**
  - Use Razorpay `callback_url`/redirect mode.
  - Confirm on the server from webhooks (`payment.captured`, `subscription.activated`).
  - When the student returns to the payment page, ask the backend for the order status first.
  - Test on a real low-end Android phone inside FB and IG.
  - If autopay still breaks there, show an "Open in Chrome to pay" step.

**CC-49 (P0 comment):**
- Some payments stay "authorized", and Razorpay auto-refunds them if they're never captured.
- Set automatic capture in the dashboard.
- Capture stuck ones now.
- Handle `payment.authorized`.
- Count the refunded damage.

## What the code shows (2026-10-23, first pass; verify before building)
- **Order creation:** dashboard calls `POST /v2/payment/create` (one-time) or `/v2/subscription/create` (autopay) on every pay tap (`useRazorpayPayment`, `payment/initiated/page.tsx`). `/subscription/create` already returns 409 for an existing subscription (handled in CC-60).
- **Since CC-60:**
  - A late webhook means "pending", not "failed".
  - `pollVerifyPaymentResult` polls `transaction_id` after the callback, but **only if the page is still alive**. Nothing runs when the page comes back after the app browser killed it.
- **Known security gap (separate, but the same code):** `PaymentController::createPayment` trusts the client `amount`/`type`. Fix it in this phase or right before it: the server computes the price from plan + exam.

## Plan
- [ ] **BE `createPayment`/`createSubscription` reuse rule:**
  - paid → `{already_paid: true}`
  - same plan pending < 30 min → return the same order/subscription
  - plan switch → mark the old one `abandoned`.
- [ ] **BE attempts:** one row per attempt (reuse `transactions` if it already holds this; add missing columns `payment_method`, `failure_reason`, `rzp_order_id`/`rzp_subscription_id`, `plan`).
- [ ] **BE grant access** in a single idempotent function used by the callback/verify and by webhooks (`payment.captured`, `subscription.activated`/`charged`). Lock on the payment id.
- [ ] **BE `payment.authorized` webhook:** capture via API if not captured within N minutes, or alert. List currently stuck authorized payments (read-only) for ops.
- [ ] **BE status endpoint** for "do I have a recent attempt for this exam?" (`paid | pending | none`).
- [ ] **FE return-to-page check:** on load / `visibilitychange` / `pageshow`, if there is a recent attempt, ask the status endpoint → paid → success page; pending → the "waiting" note (CC-70 overlap).
- [ ] **FE redirect mode:** Razorpay `callback_url` (+ `redirect: true` in FB/IG in-app browsers) to a dashboard route that verifies and routes to success/failed. Keep the modal flow in normal browsers.
- [ ] **FE fallback:** if autopay still fails inside FB/IG after this, an "Open in Chrome to pay" step (UA FBAN/FBAV/Instagram), with the CC-122 idea in mind.
- [!] 🛑 **D1:** fix the client-trusted `amount` here (recommended) or as its own phase first.
- [!] 🛑 **D2:** redirect mode for everyone, or only in-app browsers?
- [ ] 📞 **Ops (CC-49):** turn on automatic capture in the Razorpay dashboard (RD/Ganesh). Capture stuck authorized payments. Count refunds for 6 months.
- [ ] **Verify:**
  - Stubbed Razorpay: double tap → one order; reload within 30 min → same order; paid → straight to success; page killed mid-payment → status endpoint routes to success.
  - Webhook + callback grant access once.
  - Real FB/IG phone test in test mode (user/Ganesh).

## Decision log
| Date | Item | Decision | By |
|---|---|---|---|
| | | | |

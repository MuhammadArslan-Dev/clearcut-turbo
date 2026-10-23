# Phase 27 — CC-71 + CC-59: one order per attempt, and payments that survive the Facebook/Instagram app browser

**Status:** Built + verified locally (2026-10-23) — BE `phase-27-payment-reliability` (a522311), CM `phase-27-payment-reliability`. Not merged. Real FB/IG phone test still needed.
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

## What was found (2026-10-23)
- **Plan switch charged one plan and gave another.**
  - `createPayment` reused the course's open `initiated` transaction as-is.
  - Tap 1 month (₹229) and then 1 year (₹799): the Razorpay order was ₹799, but the transaction kept ₹229 / `1month-onetime`, so activation gave 1 month.
- **A paid order could activate nothing.**
  - `payment.failed` marked every open attempt of the course `failed` and replaced its metadata.
  - `activateEnrollment` only looked for `initiated` rows of the course.
  - So a failed UPI try followed by a successful second try in the same checkout found nothing to activate.
  - Also, when several `initiated` rows existed (31 courses in the local copy), it could pick a different attempt (wrong plan).
- **Each tap made a new Razorpay order;** nothing stopped paying again right after a payment.
- **`transactions` already has** `gateway_order_id`, `gateway_payment_id`, `payment_method`, `failure_reason`, `paid_at`, all empty until now (CC-119 step 4).
- **Orders were created without `payment_capture`,** so capture depended on the account setting (CC-49).
- **Local copy:** one ₹139 one-time payment (user 7689, 2026-08-07) was captured with no transaction or activation. Worth checking in production (SQL below).

## What was built
**BE (`a522311`)**
- **`createPayment`:**
  - Same plan + amount within 30 min → the same order (`reused: true`).
  - A plan switch or an older open attempt → `cancelled` (`failure_reason = replaced_by_new_attempt`), and a new order.
  - Paid in the last hour → 409 `already_paid`.
  - **The amount still comes from the client (user's decision, below).**
- **`activateEnrollment`:**
  - Finds the attempt by Razorpay order id (`gateway_order_id`, or the id inside old metadata) in any status. Falls back to the old lookup.
  - Idempotent on the payment id.
  - A renewal adds to the remaining paid days.
  - Fills `gateway_*`, `payment_method`, `paid_at`.
- **`markFailed`:** only the failed order's attempt; keeps metadata; sets `failure_reason` + `payment_method`.
- **CC-49:**
  - Orders are created with `payment_capture=1`.
  - The `payment.authorized` webhook captures anything still uncaptured.
- **`GET /v2/payment/attempt-status`:** paid / pending / failed / none for the student's own attempt, + `meta_purchase`.
- **`/v2/payment/checkout-return`** (Razorpay redirect mode):
  - Verifies the signature and activates (idempotent; the webhook stays the source of truth).
  - 303 to the dashboard success/failed page.
  - Passes only whitelisted params and always targets `services.dashboard.app_url`.
  - A bad signature → "success, activating" (never "failed").
- **`subscription/create`:** a pending mandate is reused only for the same plan.

**CM dashboard**
- `useRazorpayPayment`:
  - 409 `already_paid` → success page, no checkout.
  - Saves the open attempt (`cc-payment-attempt-v1`, 30 min).
  - On load / `pageshow` / back to visible, asks attempt-status: paid → Purchase (event id) + success page; failed → forget it.
- **FB/IG app browser (UA `FBAN|FBAV|FB_IAB|Instagram`):** the payment page opens Razorpay with `callback_url` + `redirect: true`, for both one-time and autopay. Other browsers are unchanged.
- **Success page:** with `tx` (redirect return), sends Meta Purchase from the backend's `meta_purchase` (same event id).
- `Payment Outcome` gets `confirmed_via: return_check`.

## Verification (local; Razorpay stubbed; DB restored)
- [x] **BE (rolled-back transaction, stubbed orders):**
  - 1 year tap → order A; tap again → A reused; switch to 1 month → A cancelled, order B.
  - B failed try → only B failed (`UPI PIN wrong`, upi).
  - B second try captured → active, +1 month, payment columns filled; duplicate webhook → no change.
  - Old checkout A paid as well → A success, valid_till +1 year on top.
  - Tap again → 409 `already_paid`. attempt-status → paid.
- [x] Old-style transaction (order id only in metadata, status `failed`) activates the right attempt, not the other open one.
- [x] **checkout-return:**
  - No payment → `/hi/payment/failed?…&redirect=1`.
  - Bad signature → success + pending.
  - Valid signature → transaction success, course active, `tx` in the URL.
  - A `next=` param is ignored.
- [x] **Browser (390 px, stubbed checkout.js + create):**
  - Pay → the attempt is saved and the normal browser gets no redirect.
  - Reload while pending → stays.
  - Payment activated meanwhile → back to visible → success page, attempt cleared.
  - Tap after paid → real 409 → success page, checkout not opened.
  - FB UA (hi) → one-time and autopay both open with `callback_url` (`lang=hi`) + `redirect: true`.
  - Success page with `tx` calls attempt-status and clears the attempt.
- [x] tsc: no new errors (2 pre-existing on the touched lines). eslint equal to main (13 = 13, 8 = 8). check:colors passes.
- [ ] **Real phone test in FB and IG** (Razorpay test mode / ₹1 test phone) — user/Ganesh.

## Rollout
1. Merge + push (backend first or together; the dashboard copes with an older backend: no 409, no attempt-status → the old flow).
2. Razorpay dashboard: make sure **auto-capture** is on (Settings → Payment capture). Orders now ask for it anyway.
3. Production check (read-only), captured one-time payments with no success transaction:

```sql
SELECT w.created_at, JSON_UNQUOTE(JSON_EXTRACT(w.payload,'$.payment.entity.notes.userId')) AS user_id,
       JSON_UNQUOTE(JSON_EXTRACT(w.payload,'$.payment.entity.notes.group_code')) AS group_code,
       JSON_EXTRACT(w.payload,'$.payment.entity.amount')/100 AS rupees
FROM webhook_logs w
WHERE w.event_type = 'payment.captured'
  AND JSON_EXTRACT(w.payload,'$.payment.entity.subscription_id') IS NULL
  AND NOT EXISTS (SELECT 1 FROM transactions t
                  WHERE t.group_code = JSON_UNQUOTE(JSON_EXTRACT(w.payload,'$.payment.entity.notes.group_code'))
                    AND t.status = 'success');
```

4. Authorized-but-not-captured payments (CC-49): Razorpay dashboard → Payments → filter "Authorized" → capture.

## Plan
- [x] **BE `createPayment`/`createSubscription` reuse rule:**
  - paid → `{already_paid: true}`
  - same plan pending < 30 min → return the same order/subscription
  - plan switch → mark the old one `abandoned`.
- [x] **BE attempts (existing columns now filled; no migration):** one row per attempt (reuse `transactions` if it already holds this; add missing columns `payment_method`, `failure_reason`, `rzp_order_id`/`rzp_subscription_id`, `plan`).
- [x] **BE grant access** in a single idempotent function used by the callback/verify and by webhooks (`payment.captured`, `subscription.activated`/`charged`). Lock on the payment id.
- [x] **BE `payment.authorized` webhook:** capture via API if not captured within N minutes, or alert. List currently stuck authorized payments (read-only) for ops.
- [x] **BE status endpoint** for "do I have a recent attempt for this exam?" (`paid | pending | none`).
- [x] **FE return-to-page check:** on load / `visibilitychange` / `pageshow`, if there is a recent attempt, ask the status endpoint → paid → success page; pending → the "waiting" note (CC-70 overlap).
- [x] **FE redirect mode:** Razorpay `callback_url` (+ `redirect: true` in FB/IG in-app browsers) to a dashboard route that verifies and routes to success/failed. Keep the modal flow in normal browsers.
- [ ] **FE fallback (after the real-phone data):** if autopay still fails inside FB/IG after this, an "Open in Chrome to pay" step (UA FBAN/FBAV/Instagram), with the CC-122 idea in mind.
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
| 2026-10-23 | D1 amount | Keep the amount the frontend sends (no server price) | User |
| 2026-10-23 | D2 redirect | Only in the Facebook/Instagram app browsers; other browsers keep the in-page checkout | Claude (recommended, conservative) |

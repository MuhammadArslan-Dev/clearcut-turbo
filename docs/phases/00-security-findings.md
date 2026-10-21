# Phase 00 — Security findings found during investigation (not in the ticket list)

**Status:** Blocked – Decision
**Repos:** BE
**Why it's here:** found while investigating CC-58/CC-60. Not part of Arslan's list, but more serious than most of it. The user decides whether and when to act.

## Findings (verified in code, 2026-10-21)

1. **Live Razorpay secrets are committed to git.**
   - `BE/config/payment.php:19-28` hardcodes the live key (`rzp_live_…`), the live secret, the webhook secret, plus the test key and secret.
   - `env()` is not used for them, so `.env` values have no effect.
   - PayU and PhonePe secrets are there too, as `env()` defaults.
2. **The client sets the price.**
   - `BE/app/Http/Controllers/API/V2/PaymentController.php:61`: `$amount = (float) $request->amount`. There is no server-side price lookup, so anyone can create a ₹1 order for any course.
   - Not yet verified: whether the webhook/activation compares the paid amount.
3. **Public debug/test routes.**
   - `BE/routes/api.php:47-57`: `/payments/order` and `/payments/verify` run `TestPaymentController` with no auth. `createOrder` is broken anyway (wrong argument count).
   - `/razorpay-ping` is public and returns the latest live order, including the user's phone and email in the notes. **This is a PII leak.**
   - `BE/routes/Apis/V2/payment.php:13-18`: `payment/check-payment-by-user` is public. It looks up any user's enrollment by phone and can trigger a reminder.

## Steps

- [!] 🛑 **D1:** rotate the Razorpay live key, secret and webhook secret now, and move them to env? Rotating changes webhook signature verification.
  - ⚠️ Coordinate the rotation with the prod `.env` update and the Razorpay dashboard webhook secret at the same moment, or webhooks fail and paid users don't get activated.
- [!] 🛑 **D2:** remove `TestPaymentController` routes and `/razorpay-ping`, and add auth to `check-payment-by-user`?
- [!] 🛑 **D3:** add a server-side price lookup in `createPayment`, so the client sends a plan/variant id, not an amount?
  - ⚠️ This is a frontend + backend contract change across every `useRazorpayPayment` caller and the RN WebView.
- [ ] 📞 **C1:** tell RD/owner about the key exposure, and ask whether git history must be scrubbed.
- [ ] For any prod/server command: give the user the exact command to run themselves. Don't run it yourself.

## Decision log

| Date | Item | Decision | By |
|---|---|---|---|
| | | | |

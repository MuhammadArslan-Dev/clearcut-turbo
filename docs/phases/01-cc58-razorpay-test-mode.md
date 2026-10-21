# Phase 01 — CC-58: some live checkouts open Razorpay in "Test Mode"

**Status:** Not Started
**Jira:** https://clear-cutoff.atlassian.net/browse/CC-58
**Repos:** BE, CM `apps/dashboard`

## Problem
Between Sep 28 and Oct 6, students on app.clearcutoff.in saw Razorpay's "Test Mode" banner and ended up on `/payment/failed`. Affected checkouts: CTET ₹99, HTET ₹99 and HPTET ₹149.

## What the code shows (2026-10-21)

**One-time order path (₹139/229 monthly, ₹599/799 yearly, all paywall modals)**
- FE `hooks/payment/useRazorpayPayment.ts:75-96` calls `POST /v2/payment/create`.
- BE `PaymentController.php:134-139` uses the test account only when `payment_type === 'test'`. The FE sets that only for phone `+919988776655` (`useRazorpayPayment.ts:78`).
- The backend returns the matching `key`. ✅ Looks fine.

**Monthly autopay subscription path (the default "1month" plan)** — likely culprit
- FE `payment/initiated/page.tsx:351-354` calls `POST /v2/subscription/create`.
- The backend response contains **no `key`** (`SubscriptionController.php:94-101`, `:117-122`).
- The FE does `key: res.key`, so `checkout.js` opens with `key: undefined` (`page.tsx:442`).
- The ticket amounts (99/99/149) match the monthly autopay prices exactly. They match none of the one-time prices.
- Still a guess: exactly how checkout.js behaves with `subscription_id` but no key. Reproduce on non-prod.
- Smaller risk: a `subscription_plans.razorpay_plan_id` row created from the test account.

## Plan
- [ ] Reproduce on local/non-prod: start an autopay checkout and confirm whether the popup shows "Test Mode" without a key.
- [ ] **BE:** return `'key' => config('payment.razorpay.key')` in both subscription-create responses.
- [ ] **BE:** add `RazorpayKeyGuard`. In production, if a key doesn't start with `rzp_live_`, return 503, `Log::critical`, and report to Sentry. Call it from `createPayment`, `SubscriptionController::create` and the `SubscriptionService` constructor.
- [ ] **FE:** refuse to open checkout if `key` is missing, or if it is `rzp_test_` in a production build. Show the error in-page and report to Sentry.
- [!] 🛑 **D1:** keep the test-mode bypass for one phone number in prod (make it a server-side allowlist from config), or remove it?
- [!] 🛑 **D2:** should the guard **hard-block** checkout, or only alert?
- [!] 🛑 **D3:** combine with Phase 00 (move keys to env and rotate) now, or later?
- [!] ⚠️ **System impact:** backend deploy plus prod env change. The RN app WebView uses the same checkout. Deploy BE before FE, or FE must tolerate both response shapes.
- [ ] 📞 **C1:** RD: Razorpay payment/subscription IDs of the Sep 28–Oct 6 failures. Are they in the **test** or **live** dashboard?
- [ ] 📞 **C2:** RD: count of test-mode orders/subscriptions from Sep 28–Oct 6, and the list of affected students for ops outreach.
- [ ] 📞 **C3:** RD/owner: prod values of `subscription_plans` ids 1, 2, 3 and their `razorpay_plan_id`. Are they live plans? Give the user a tinker/SQL command to run; don't run it on prod yourself.
- [ ] Verify: on a production build, the autopay and one-time popups show no Test Mode. Run tsc, eslint and Pint.

## Decision log
| Date | Item | Decision | By |
|---|---|---|---|
| | | | |

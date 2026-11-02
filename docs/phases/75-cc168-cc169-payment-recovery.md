# Phase 75 — One-time attempts that stay "initiated" + one-time fallback when autopay fails

**Tickets:** [CC-169](https://clear-cutoff.atlassian.net/browse/CC-169), [CC-168](https://clear-cutoff.atlassian.net/browse/CC-168)
**Repos:** BE, CM (apps/dashboard)
**Branch:** `feature/phase-75-payment-recovery` in worktrees `D:\clearcutoff-projects\clearcut-master-p75` and `C:\laragon\www\clearcutoff-backend-p75`, both from `origin/main`. Not committed, not pushed.
**Created / start date:** 2026-11-02
**Status:** In Review — built and tested locally, not committed. Flag off. Waiting on commit approval, D4 (client) and the real phone test.

---

## 1. Problem / objective
- **CC-169:** since 27 Oct many one-time attempts stay `initiated`, which the ticket reads as "the Razorpay step may never have opened".
- **CC-168:** most students who pick autopay never approve the mandate and get no other way to pay at that moment.

## 2. Findings (read-only, 2026-11-02)

### CC-169
Sources: prod `transactions` + `webhook_logs` (Grafana, maindb), Amplitude project 673721, code.

- **Why attempts rose:** `8819bdf` (27 Oct 18:29) made one-time 1-month the first and default plan.
- **27 Oct – 1 Nov `purchase` rows not paid:** 23 `initiated`, 9 `failed`, 1 `cancelled`.
- **All 23 `initiated` rows have a Razorpay order id and no `payment.failed` / `authorized` / `captured` webhook.** Order creation works, and no payment attempt is recorded for these orders in `webhook_logs`.
- **None of the 23 has a later successful `transactions` row.** Paying through autopay afterwards is not excluded by this check.
- **Amplitude, last 7 days, one-time:** 37 `Payment Initiated`, 37 `Checkout Opened` (33 normal browser, 3 FB, 1 IG), 12 `Payment Outcome` cancelled, 5 successful, about 20 with no outcome.
- **`Checkout Opened` fires right after `razorpay.open()`.** It shows the call did not throw, not that the sheet was visible on the phone.
- **No code closes an abandoned attempt:** `modal.ondismiss` only sends analytics, nothing expires old rows, and they are only closed if the student taps pay again. So `initiated` also means "closed the sheet" or "left".
- **8 of the 9 `failed` rows** say "could not complete it in time" (UPI timeout).
- **Prices:** ₹139 / ₹699 are the phase 67 list. ₹229 / ₹799 are the old HTET-group prices, and all such rows are from before `ec8d3f5` (29 Oct). Not a bug.
- **Sentry:** two searches for payment issues in the last 7–14 days returned nothing. That is not proof: CC-158 also found this project silent after 24 Oct, so its ingestion needs checking. APP-7K was not opened.

**Conclusion:** no hard break found. The evidence points to students closing or leaving the checkout, plus a status that is never closed. A real problem with the sheet in some browsers is **not ruled out**; only a phone test and the Razorpay dashboard can settle that.

### CC-168
- **`subscriptions` created in the last 30 days:** 245 `created`, 22 `active`, 19 `authenticated`, 17 `cancelled`, 2 `paused`.
- **Autopay, week of 26 Oct (Amplitude):** 75 checkouts opened, 22 cancelled, 11 successful, 3 insufficient funds, about 39 with no outcome.
- **Trigger 1 "failed / cancelled":** dismissal (`ondismiss`) is the biggest visible case. Real declines are only about 19 in 30 days.
- **Trigger 2 "pending check from CC-70" does not exist in the dashboard code** (no CC-70 reference, no subscription status check). The "attempt" return check in `useRazorpayPayment` is one-time only. It has to be built.
- **Trigger 3:** `/payment/failed` already has "Pay once instead" (CC-64), but it goes back to the plan page, so it costs an extra tap.
- **Double-charge risk:** a mandate approved late plus a one-time payment means two payments. Must be handled.
- **Sample size:** at about 75 autopay checkouts a week, a 10% holdout gets about 8 a week, so 300 per arm takes about 40 weeks. The ticket's "whichever is later" would not end in a useful time.
- **Baseline has moved:** one-time became the default on 27 Oct, after most of the ticket's 60-day window.

## 3. Implementation plan

### Part A — CC-169 (do first)
- [ ] A1. **Check first (user/Ganesh):** real one-time checkout on Android Chrome, FB app and IG app; Razorpay dashboard for 5–10 stuck order ids; Sentry ingestion.
- [x] A2. **BE:** `POST /v2/payment/attempt/{id}/close`, own attempts only, `initiated` only → `cancelled` + `failure_reason=checkout_dismissed`.
- [x] A3. **BE:** scheduled command: `initiated` older than 30 min → `cancelled` + `failure_reason=not_completed`. 30 min matches the CC-71 reuse window. A late payment still activates, because `activateEnrollment` finds the attempt by order id in any status (phase 27). Re-test this.
- [x] A4. **CM:** `useRazorpayPayment` `ondismiss` calls A2 (fire and forget) and clears the saved attempt.
- [x] A5. **Check readers of `initiated`** before shipping: `PaymentController` 116/809, `PaymentService` 87/221, Grafana panels.

### Part B — CC-168
- [x] B1. **BE:** `createPayment` accepts a whitelisted `source`, saved as `metadata.source` (no migration).
- [x] B2. **BE:** double-charge guard (D1).
- [x] B3. **CM:** Amplitude flag `autopay_fallback`, same plain-fetch approach as `lib/experiments/practiceTestFlag.ts` (extract the shared part rather than copy it). Any failure = current flow.
- [x] B4. **CM:** `AutopayFallbackSheet`, reusing the sheet used by `ContinueFreeSheet`, plus `useRazorpayPayment` with `1month-onetime` for the same exam. en/hi/mr. No new colours.
- [x] B5. **CM triggers on `/payment/initiated`:** `payment.failed` and `ondismiss` on an autopay attempt.
- [x] B6. **CM trigger for return from the UPI app:** save the autopay attempt, on return poll `GET /v2/subscription/{id}`; still `created` after the timeout (D2) → sheet.
- [x] B7. **CM `/payment/failed`:** autopay failure shows the sheet in the treatment arm; holdout keeps today's page.
- [x] B8. **Success page:** no autopay push after a fallback payment.
- [x] B9. **Tracking:** per D3, `source=autopay_fallback` on existing payment events and on the transaction.
- [ ] B10. **Grafana:** recovered-payers panel. Create the Amplitude flag, off at first.

## 4. Progress / completed changes
- 2026-11-02: investigation and this plan.
- 2026-11-02 BE: `PaymentController` (`closeAttempt`, `source`, fallback guard, a just-dismissed attempt is reused), `SubscriptionService::closePendingMandate`, `SubscriptionWebhookService::onCancelled` (no "subscription cancelled" message for a mandate we closed), `Console/Commands/CloseStalePaymentAttempts` every 5 min (only rows from 2026-11-02 on, not admin QR), `tests/Feature/PaymentRecoveryTest.php`.
- 2026-11-02 CM: `lib/experiments/experimentFlag.ts` (extracted; `practiceTestFlag.ts` now uses it), `lib/payment/autopayFallback.ts`, `hooks/payment/useAutopayFallback.tsx`, `components/features/payment/AutopayFallbackSheet.tsx`, `useRazorpayPayment` (`orderSource`, `onAutopayActive`, `returnCheck`, close on dismiss), initiated + failed pages, `monetization.ts` events, en/hi/mr `payment.json`.
- Changed from the plan: A4 keeps the saved attempt on dismiss (a UPI payment started before closing can still complete). Flag has a `holdout` variant so that arm is counted: `Autopay Fallback Shown` with `displayed: false`. The success page has no autopay push, so B8 needed no code. A `failed` trigger on the payment page was not added: that path already goes to `/payment/failed` (`failed_page`).
- 2026-11-02 Code review fixes: `Cache` import in `SubscriptionWebhookService` (would have crashed every `subscription.cancelled` webhook); the fallback order now goes ahead only when the mandate is known closed, otherwise 409 or 503, with the close before the DB transaction; failed-page sheet no longer freezes; return check sees a checkout open in either hook instance and reports the attempt's own price + source; closed mandate unlinked from the enrollment (keeps the grace period); reuse locks the rows; late `payment.failed` recorded on a closed attempt; full 60 s on page load; correct price on `autopay_active`; flag reads `key` first; `closeAttempt` only for attempts with an order.
- Known, not changed: Subscriptions tab shows a closed unapproved mandate with access Active (existing display logic, becomes routine once the flag is on: fix before the flag). "Pay once instead" and picking one-time on the plan page don't run the mandate guard (existing gap). A create failure shows the generic error, not `errorUnavailable`.
- 2026-11-02 **Incident:** running a wider test filter with `DB_DATABASE=clearcut` ran `EventTrackingServiceTest` (`RefreshDatabase`) and emptied the local dev DB `clearcut`. Local only, prod untouched. See §6.

## 5. Decision log
| Date | Question | Answer (who) |
|---|---|---|
| 2026-11-02 | D1 Double charge | Cancel the pending `created` subscription when a fallback order is created. Razorpay says approved → no order (user) |
| 2026-11-02 | D2 Return-from-UPI timeout | 60 s (user) |
| 2026-11-02 | D3 Tracking | Ticket's new `Autopay Fallback Shown/Tapped/Dismissed` events (user) |
| | D4 Experiment: 90/10 read after 3 weeks (directional only), or 50/50 for a real result | **pending, client.** Built for either: only the flag weights differ |
| 2026-11-02 | D5 Old `initiated` rows | Leave them (user) |
| 2026-11-02 | D6 Order | Part A then Part B, one phase (user) |

## 6. Blockers / risks
- ⚠️ Payments: changes to live payment status and checkout. Never a live charge from this machine.
- ⚠️ Razorpay's docs don't clearly say `created` can be cancelled, and this has not run against Razorpay. If refused, the fallback answers 503 and sells nothing, so the feature would not work. Confirm in Razorpay test mode before turning the flag on.
- ⚠️ `payments:close-stale-attempts` needs the scheduler running on the server (not checked).
- The flag response shape is read from existing code, not checked on a live flag. Check with a tester before the rollout.
- Local dev DB `clearcut` was emptied by a test run and **restored the same day** from `C:\laragon\backup\mysql\mysql-8-2026-11-02_090300.sql` (lines 1070-5450; the `v_exam_enrollments` view from the 2026-11-01 20:02 dump, because the 09:03 file is cut off). Binlog after 09:03 shows only 3 writes to `jobs` that were not brought back.
- ⚠️ Grafana numbers change: `initiated` falls and `cancelled` rises, while revenue does not. Tell the client, since this meets the ticket's "stuck rows go back to 1 a week" without selling more.
- Part A alone is not expected to increase payments, unless A1 finds a real sheet problem.
- A fallback could cannibalise students who would have approved autopay (the ticket's guardrail).

## 7. Dependencies / packages added
No packages or migrations planned. New: one BE route, one scheduled command, one Amplitude flag.

## 8. Tests and verification
- [x] BE `PaymentRecoveryTest`: 15 passed on their own (close ownership, expiry, late payment after close/expiry activates, `source` whitelist, double-charge guard), Razorpay mocked. Other Payment/Subscription/Razorpay tests: 24 passed. After the review fixes, that file only: 21 passed. Never run a wide filter on a real DB name: `EventTrackingServiceTest` resets it.
- [x] Vitest: `practiceTestFlag` 9 + `autopayFallback` 4 passed. Trigger logic is covered by the browser run.
- [x] check:colors passes. tsc: no errors in new files; remaining ones are on lines not written here. eslint: new files clean; 2 `any` errors in `useRazorpayPayment.ts` are on existing lines.
- [x] Playwright via a Sonnet subagent, all external calls stubbed: after the review fixes 16 scenarios, 144 checks, 0 failed (390 px + desktop; hi/mr mobile only). Not exercised: FB/IG redirect mode, real Razorpay, a real UPI return.
- [ ] Real phone test on Chrome, FB, IG (user/Ganesh).

## 9. Next steps
1. Commit approval. 2. Razorpay test mode: cancel a `created` subscription. 3. Real phone test on Chrome, FB, IG. 4. Client answers D4, then create the Amplitude flag `autopay_fallback` (variants `on`, `holdout`), deploy BE before dashboard, and turn it on. 5. Grafana recovered-payers panel (B10, not built).

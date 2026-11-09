# Phase 88 — "Waiting for UPI approval" screen + automatic status check

**Tickets:** CC-70 (High, queue 04)
**Repos:** CM (`apps/dashboard`); BE read-only (existing status endpoints are enough)
**Branch:** `feature/upi-waiting-screen` — committed locally, not pushed
**Created / start date:** 2026-11-09
**Status:** In Progress — detection part built behind a flag (default OFF); the waiting/options screen is `Blocked – Decision`

> Payment path = money-critical. Behind an Amplitude flag so it can be switched off without a deploy. Razorpay stays read-only.

---

## 1. Problem / objective
After tapping Pay, many students sit 7–22 minutes on the payment page while approving in their UPI app; the page shows nothing and most give up (Clarity: https://clarity.microsoft.com/player/o8pe7lwvxo/1pkczm3/kpdei2). Razorpay dashboard (read-only, 2026-11-09) shows many recent `Customer – Payment Timed Out` and `Created` UPI payments, which matches. Goal: always show what is happening, detect a finished payment within ~5 s, and always give a way forward after 2 minutes.

## 2. Scope
- **In:** a waiting state + polling + 2-min/15-min options on the dashboard payment pages; strings en/hi/mr.
- **Out:** the Razorpay modal itself (Razorpay owns it), backend status logic, `payments:close-stale-attempts`, price/plan changes.

## 3. Implementation plan (current code verified read-only)
Today: one-time `src/hooks/payment/useRazorpayPayment.ts` (return check via `pageshow` + `visibilitychange`, `VERIFY_RETRIES=10`, `ACTIVATING_RETRIES=30` × 2 s; skipped while `checkoutsInFlight.size > 0`); autopay `payment/initiated/page.tsx` (handler ~l.700, `ondismiss` ~794) + `src/lib/payment/waitForMandate.ts` (20 s, 2 s interval, runs only after Razorpay's handler fires); `src/lib/payment/autopayFallback.ts` (`PENDING_TIMEOUT_MS = 60_000`) + `src/hooks/payment/useAutopayFallback.tsx`; `src/lib/payment/paymentAttempt.ts` (attempt kept 30 min, `getAttemptStatus` → `/v2/payment/attempt-status`; backend `PaymentController::attemptStatus` returns paid/pending/failed/none; autopay uses `SubscriptionController::show`).
- [ ] 1. New reusable hook `usePendingPaymentWatch(kind, id)`: poll every 3–5 s; immediate re-check on `visibilitychange` (not suppressed by the in-flight guard for this watch); options after 120 s; stop after 15 min.
- [ ] 2. Reuse `getAttemptStatus`, `getSubscriptionStatus`, `AutopayFallbackSheet` and the existing `Autopay Fallback Shown/Tapped/Dismissed` events for "pay once instead". No new analytics event names (add properties if needed).
- [ ] 3. Waiting UI: "approve the payment/autopay in your UPI app", spinner + running timer, "don't close this page"; after 2 min: try again · other UPI app/QR · pay once without autopay (only if the attempt is autopay). Existing tokens/components only; strings en/hi/mr.
- [ ] 4. Wire to the saved attempt, not inside the Razorpay modal. Amplitude flag (pattern `lib/experiments/experimentFlag.ts`) default OFF → fail-open to today's behaviour.
- Must not break: keep the in-flight guard so a second tap cannot create a second order; do not change the `attemptStatus` "pending" mapping (a cancelled attempt reads "pending" after `payments:close-stale-attempts`); the phase 27 one-order-per-attempt behaviour; phase 75/77 fallback + renewal flows.

## 4. Progress / completed changes
- 2026-11-09 — phase file written; code read only.
- 2026-11-09 — **built (detection part, flag `upi_waiting_watch`, default OFF → today's behaviour):**
  - `lib/payment/pendingWatch.ts` — framework-free watch: polls every 4 s while the page is visible, re-checks at once when it becomes visible, never overlaps two checks, survives a failing check, "slow" after 2 min, gives up after 15 min. 6 Vitest tests (fake clock) pass.
  - `lib/experiments/upiWaitingFlag.ts` — Amplitude flag `upi_waiting_watch`, ON only for variant `on`, never throws.
  - `hooks/payment/useRazorpayPayment.ts` — after `razorpay.open()`, with the flag on, polls `getAttemptStatus(order.transaction_id)`; when paid it closes the Razorpay popup, runs the SAME success steps as the CC-59 return check (extracted unchanged into `reportPaidFromAttempt`, `confirmed_via` is now `return_check` or `upi_wait_watch`) and calls `onSuccess`. Stops on handler / dismiss / payment.failed; if the watch already confirmed, a late Razorpay `handler` returns early (no double success, no double Purchase). The in-flight guard is untouched.
  - `lib/analytics/events/monetization.ts` — `confirmed_via` also accepts `upi_wait_watch` (existing event, new property value; no new event name).
  - Autopay (`waitForMandate`, `payment/initiated`) NOT touched in this step.

## 5. Decision log
| Date | Question | Answer (who) |
|---|---|---|
| 2026-11-09 | 🛑 **Where can the "waiting" screen + 2-minute options show?** Razorpay's popup is an iframe at the top of the page, so while it is open our page cannot show anything above it (we cannot beat its z-index). Our screen is only visible after the popup is closed or in the in-app-browser redirect mode (page reloads, attempt still pending). Options: (a) show the waiting sheet only in those two situations (safe, but not while the popup is open); (b) at 2 min, close the popup on purpose and show our sheet — but `ondismiss` would then call `closeAttempt`, so a late UPI payment must still be found by the watch (needs care, more risk); (c) leave the popup alone and rely on detection only (what is built now). Recommendation: (c) now, (a) next. | open |
| 2026-11-09 | 🛑 Autopay path (`waitForMandate`, 20 s) — extend with the same watch in a later step? | open |

## 6. Blockers / risks
- Risk: medium (UI beside the payment flow). Real UPI timing (7–22 min), FB/IG in-app browsers (phase 27's open real-phone test) and whether Razorpay keeps its modal alive in the background **cannot be verified from code** — needs the user's real-phone UPI test.

## 7. Dependencies / packages added
None. New i18n keys; one Amplitude flag key.

## 8. Tests and verification
- [x] tsc 93 errors = clean `main` 93 (no new); eslint `useRazorpayPayment.ts` 2/0 before and after, new files 0/0; `check:colors` passes; `pendingWatch.test.ts` 6 passed (poll, no overlap, hidden/visible re-check, failing check, 2 min slow / 15 min stop, stop())
- [ ] **Not verified yet:** the wiring in a real browser (stub `window.Razorpay`, mock `attempt-status` pending → paid, check one `Payment Outcome`, one `onSuccess`, popup closed, flag OFF = zero extra requests, flag ON request count ≈ 1 per 4 s, double tap still creates one order); Playwright MCP is not connected in this session.
- [ ] User: real-phone UPI test inside FB/IG browser and Chrome

## 9. Next steps
After phase 87 is in review: branch from `main`, implement behind the flag, test, report. No merge/deploy without approval.

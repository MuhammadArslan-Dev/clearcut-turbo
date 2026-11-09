# Phase 88 — "Waiting for UPI approval" screen + automatic status check

**Tickets:** CC-70 (High, queue 04)
**Repos:** CM (`apps/dashboard`); BE read-only (existing status endpoints are enough)
**Branch:** `feature/upi-waiting-screen` — not created yet, not committed, not pushed
**Created / start date:** 2026-11-09
**Status:** Not Started — plan approved 2026-11-09

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

## 5. Decision log
| Date | Question | Answer (who) |
|---|---|---|
| — | none open now. A 🛑 will be added if a UX/business choice appears (e.g. wording of the 2-minute options, whether "pay once" is offered for one-time attempts). | — |

## 6. Blockers / risks
- Risk: medium (UI beside the payment flow). Real UPI timing (7–22 min), FB/IG in-app browsers (phase 27's open real-phone test) and whether Razorpay keeps its modal alive in the background **cannot be verified from code** — needs the user's real-phone UPI test.

## 7. Dependencies / packages added
None. New i18n keys; one Amplitude flag key.

## 8. Tests and verification
- [ ] tsc / eslint / `check:colors`; unit test of the hook timing (fake timers: 3 s polls, 120 s options, 15 min stop)
- [ ] Playwright (Sonnet) with mocked `attempt-status`: pending → paid → success page; 2-min options; tab hidden/visible re-check; en/hi/mr; mobile 390
- [ ] User: real-phone UPI test inside FB/IG browser and Chrome

## 9. Next steps
After phase 87 is in review: branch from `main`, implement behind the flag, test, report. No merge/deploy without approval.

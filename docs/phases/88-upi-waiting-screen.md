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

## 4b. Waiting screen + options (2026-11-12, user: "70 kar do, kam break na ho, new branch, live nahi") — branch `feature/cc-70-upi-waiting-screen`, NOT merged
Still behind the same flag **`upi_waiting_watch`** (default OFF → nothing below ever shows; the only extra work with it OFF is the flag lookup the checkout already did).
- **`components/features/payment/UpiWaitingSheet.tsx`** (BottomSheet on phones / Modal on desktop, like AutopayFallbackSheet; DotsLoader, ShimmerButton, tokens only): "Approve the payment/autopay in your UPI app", running mm:ss timer (per-second leaf), "Don't close this page"; after **2 min** the options **Try again · Pay with another UPI app or QR** (both open a fresh checkout, where Razorpay lists every UPI app and the QR) **· Pay once without autopay** (autopay only); after **15 min** "We couldn't confirm your payment yet — if money was deducted the course activates on its own, check before paying again" + the same options. A Close link is always there. i18n `payment.upiWaiting` en/hi/mr (Hindi = the ticket's lines).
- **`hooks/payment/useUpiWaiting.ts`**: sheet state + `startPendingWatch` (4 s, re-check on return to the tab, slow 2 min, stop 15 min). Asks once immediately; only the first verdict counts (an immediate check and a poll both finding "paid" can never report twice). `pendingWatch` gained optional `startedAt` (a wait resumed after a reload counts from the real start; +1 test).
- **One-time (`useRazorpayPayment`)**: popup closed with the flag on → after the unchanged cancel event + `closeAttempt` (a closed attempt still activates if the UPI payment arrives, CC-169; attempt-status maps `cancelled` → pending) the sheet opens and polls the attempt; paid → the same `reportPaidFromAttempt` (`confirmed_via: upi_wait_watch`). While waiting, a token sits in `checkoutsInFlight` so the CC-59 return check cannot report the same payment again. Page back with a pending attempt (FB/IG redirect mode, reload) → the wait resumes from the attempt's start, unless the student closed it (`waitClosed` on the saved attempt) or 15 min passed. Try again → `Payment Initiated` with `retry_from: upi_waiting`. `handlePayment()` signature unchanged (callers pass it as onClick).
- **Autopay (`payment/initiated`)**: popup closed with the flag on → "approve the autopay" sheet polling `/v2/subscription/{id}`; authenticated/active → Payment Outcome success (`confirmed_via`), server-decided Meta Subscribe/Purchase with its event_id (no client-side fallback values — no event_id → risk of double counting), cache refresh, success page. Any status other than created → the one-time fallback offer as before. The CC-168 `autopay_fallback` experiment keeps its counts: `offer("dismissed")` now runs when the wait ends without a mandate (Close, failed, Pay once) instead of at once; `useAutopayFallback` got `paused` so its own 60 s return check doesn't open a second sheet on top. Pay once: treatment arm → the fallback sheet; holdout / no experiment → counted and the one-time plan is selected. Reload with a pending autopay attempt → wait resumes (same rules).
- Sheet also rendered by every other caller of the hook (MainPaywall, PreparationPaywall, full-course-payment-modal, payment-failed-modal, useAutopayFallback) — closed unless the flag is on.
- Analytics: no new event names; `retry_from` on Payment Initiated, `confirmed_via` on Payment Outcome (types updated). **Not measured:** how often the sheet is shown / closed (no event; ask if wanted).
- **Verified 2026-11-12:** tsc — only the 3 errors clean main already has in these files; eslint per-file counts identical to main; new files 0/0; `check:colors` ✓; Vitest `src/lib/payment` 14 passed (+1 `startedAt`). **Playwright (sonnet agent, local dashboard, fixture user 19392 + token `pw-phase88-cc70`, every payment/subscription call and Razorpay's checkout.js stubbed, analytics hosts blocked):** A one-time ON — 1 order, dismiss → 1 close + sheet with timer, status 1 at once then ~every 4 s, paid → exactly 1 navigation to success, polling stopped, verify 0 · B Close → polling stopped, `waitClosed` saved, reload does not reopen · C at ~128 s hint + Try again / other app (no Pay once on one-time), Try again → +1 order, +1 popup · D flag OFF → no sheet, 0 status calls, fast double tap = +1 order · E autopay ON — 1 subscription, dismiss → autopay sheet, polled, authenticated → exactly 1 navigation to success, no fallback sheet · F 390px /hi — Hindi strings, scrollWidth 390. 0 app console errors. Screenshots in the session scratchpad.
- **Not verified:** real Razorpay / UPI / webhook on a phone (FB/IG in-app browser + Chrome); the 15-minute state in a browser (unit test only); autopay "Pay once" with the `autopay_fallback` treatment arm; the sheet inside MainPaywall / PreparationPaywall / full-course / payment-failed modals (rendered closed; not opened in a browser); a 500 from attempt-status in the browser (unit-tested); Meta Subscribe/Purchase payload on the autopay watch path.

## 5. Decision log
| Date | Question | Answer (who) |
|---|---|---|
| 2026-11-12 | Where the waiting screen shows | user: "Popup band hone pe" = option (a) |
| 2026-11-12 | Autopay too? | user: "Haan, autopay bhi" |
| 2026-11-09 | 🛑 **Where can the "waiting" screen + 2-minute options show?** Razorpay's popup is an iframe at the top of the page, so while it is open our page cannot show anything above it (we cannot beat its z-index). Our screen is only visible after the popup is closed or in the in-app-browser redirect mode (page reloads, attempt still pending). Options: (a) show the waiting sheet only in those two situations (safe, but not while the popup is open); (b) at 2 min, close the popup on purpose and show our sheet — but `ondismiss` would then call `closeAttempt`, so a late UPI payment must still be found by the watch (needs care, more risk); (c) leave the popup alone and rely on detection only (what is built now). Recommendation: (c) now, (a) next. | open |
| 2026-11-09 | 🛑 Autopay path (`waitForMandate`, 20 s) — extend with the same watch in a later step? | open |

## 6. Blockers / risks
- Risk: medium (UI beside the payment flow). Real UPI timing (7–22 min), FB/IG in-app browsers (phase 27's open real-phone test) and whether Razorpay keeps its modal alive in the background **cannot be verified from code** — needs the user's real-phone UPI test.

## 7. Dependencies / packages added
None. New i18n keys; one Amplitude flag key.

## 8. Tests and verification
- [x] tsc 93 errors = clean `main` 93 (no new); eslint `useRazorpayPayment.ts` 2/0 before and after, new files 0/0; `check:colors` passes; `pendingWatch.test.ts` 6 passed (poll, no overlap, hidden/visible re-check, failing check, 2 min slow / 15 min stop, stop())
- [x] **Browser test (Chrome, local dashboard `payment/initiated?plan=1year`, 2026-11-09).** `window.Razorpay`, `/v2/payment/create`, `attempt-status` and the Amplitude flag were stubbed inside the page, so nothing reached Razorpay or the backend:
  - flag ON, pending: 1 order, 1 flag fetch, 5 status polls in ~20 s (one per ~4 s);
  - then paid: found by the very next poll (+1), popup closed once, ONE navigation to `/payment/success`, saved attempt cleared, polling stopped (8 → 8 over the next 9 s);
  - a late Razorpay `handler` after that did nothing (push 1→1, status 8→8, create 1→1): no double success;
  - flag OFF, triple tap: 1 order, 1 popup, 0 status polls (today's behaviour unchanged);
  - flag ON, popup dismissed: polling stopped (2→2 over 10 s), `closeAttempt` called once, 1 order.
  - Note (not mine): the success URL carries `source=null` when the page has no `source` param — existing code at `payment/initiated/page.tsx` l.406.
  - Lesson: the flag cache lives in `sessionStorage` under `cc-flag:<flag>:<user>` (10 min), clear it between flag scenarios.
- [ ] **Not verified:** a failing/500 `attempt-status` in the browser (covered only by the unit test), tab hidden then visible in the browser, hi/mr and 390px (no new UI was added), `payment.failed` event, redirect mode in an FB/IG browser, Meta Purchase / `Payment Outcome` payload (analytics disabled locally), real UPI on a phone, and the other callers of the hook (`MainPaywall`, `PreparationPaywall`, `full-course-payment-modal`, `useAutopayFallback`: same hook, flag decides, but not opened one by one).
- [ ] User: real-phone UPI test inside FB/IG browser and Chrome

## 9. Next steps
After phase 87 is in review: branch from `main`, implement behind the flag, test, report. No merge/deploy without approval.

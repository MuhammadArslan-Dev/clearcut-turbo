# Phase 09 — CC-60: pay button ("Unlock Full Access") does nothing

**Status:** In Review (branch cc-60-pay-button; not merged)
**Jira:** https://clear-cutoff.atlassian.net/browse/CC-60
**Repos:** CM `apps/dashboard`, optionally BE

## What the code shows (2026-10-21)
- `checkout.js` loads **on click** (`lib/loadRazorpay.ts`, called at `useRazorpayPayment.ts:65` and `page.tsx:340`). After it loads, the order or subscription is created. That is two round trips with only a spinner.
- There is no ref-based double-tap guard (`page.tsx:619-626`), so two quick taps create two orders. `AddPaymentInfo` fires on every tap.
- "UPI / Card / Net banking" is static text that looks selectable.
- **Main bug (one-time path, verified):**
  1. After a successful payment, `pollVerifyPayment` (`lib/payment/payment.ts:223-238`) calls `/v2/payment/verify`.
  2. While the webhook hasn't arrived yet, the BE returns **400** for status "initiated" (`PaymentController.php:340-345`).
  3. `apiFetch` throws on non-OK, so the 6 retries never run. The handler rejects silently: no redirect, no Purchase event.
  4. The user **paid but sees nothing**; the webhook activates the enrollment later.
- The subscription path's missing `key` (Phase 01) ends in `alert("Something went wrong")` or a broken popup. `alert()` may be suppressed in in-app WebViews.

## Plan
- [x] Preload `checkout.js` on page mount (/payment/initiated only).
- [x] `useRef` in-flight guards: the hook (one-time) and the page's pay click (both paths; AddPaymentInfo fires once). "Opening payment…" under the button while it spins (en/hi/mr, `payment.checkout.*`).
- [x] Verify polling (BE half done in CC-53): `pollVerifyPaymentResult` now returns success / `failed` (BE 400 "Payment not successful", stops at once) / `pending` (window ended). Network errors keep polling.
- [x] After a successful checkout: full-screen "Confirming your payment…" (20 s), then "Payment received. Activating your course…" (60 s more). Still pending → success page with `&pending=1` and a "course will be active in a few minutes — no need to pay again" note. **Never the failed page** for a paid order (that made people pay twice). Other hook callers (paywalls/modals) fall back to their `onSuccess`.
- [x] alert() → in-page error under the button on /payment/initiated (SDK didn't load, order/subscription not created, test key, unexpected). Other hook callers keep alert() (no `onError`). The informational alerts before a redirect (already subscribed / paused) are unchanged. The "checkout not open after ~5 s" error was not added: the button spinner + "Opening payment…" cover that wait.
- [x] "UPI / Card / Net banking" row is a button that opens the same checkout (C1).
- [!] 🛑 **D1:** fix verify on the **BE** (return 200 `{status:"initiated"}` while pending; semantically right, needs a BE deploy) or the **FE** (catch 4xx and keep polling; no BE deploy)?
- [!] 🛑 **D2:** create the Razorpay order in the background on page load (ticket step 2)? It creates many unused orders; preloading the script alone may be enough.
- [!] ⚠️ **System impact:**
  - The verify change affects every `useRazorpayPayment` caller (MainPaywall, PreparationPaywall, 3 modals, the failed page) and the RN WebView.
  - **Purchase pixel volume will jump** once success is actually reached. Warn the client/ads team (links to Phase 05).
- [ ] 📞 **C1:** RD: should "UPI / Card / Net banking" be a real method picker, or plain text?
- [ ] 📞 **C2:** RD: copy for the "opening payment" and "activating" states (en/hi/mr).
- [ ] Verify with Razorpay test mode locally: slow-3G throttle, double tap, webhook delayed (verify returns pending), checkout closed. Run tsc and eslint, and take screenshots.

## Decision log
| Date | Item | Decision | By |
|---|---|---|---|
| 2026-10-22 | D1 | Done in CC-53 (BE 200 + pending, FE keeps polling) | User (CC-53) |
| 2026-10-22 | Pending | Check 60 s more behind an "activating" screen, then success page with a note; never "failed" | User |
| 2026-10-22 | D2 | Preload checkout.js only; no order before the tap | User |
| 2026-10-22 | C1 | UPI/Card/Net banking row opens the checkout | User |
| 2026-10-22 | Tests | Polling outcomes: 6/6 (throwaway vitest with a stubbed apiFetch). tsc/eslint: no new problems (same 2 TS / 22 lint as main in these files). Browser + Razorpay test mode not run yet (needs click-through; ask the user) | Claude |
| 2026-10-22 | Browser test (Playwright, 390px) | Real Razorpay unreachable from this machine (406, non-Indian IP), so a fake checkout.js + stubbed create/verify drove the page. Found: (1) paywalls/modals re-enabled the button during the 20-80 s verify -> second order/payment; (2) a tap before the popup appeared -> 2 orders; (3) verify 404 -> stuck on "Confirming" for ever; (4) pending success page said "Access Unlocked"; (5) a hanging checkout.js spun for ever and a tap during preload added a second script | Claude |
| 2026-10-22 | Follow-up fixes (branch cc-60-fixes) | Guard + loading held for the whole checkout (until dismiss / failure / verify done) in the hook and the subscription path; page tap ignored while busy; unexpected verify error -> pending path; pending success page titled "Payment received" and Resume refetches courses; loadRazorpay: one shared load, 15 s timeout; copy "tap Pay" -> "try again". Re-test 9/9: F 404 -> success + note, G 1 order, H dismiss then retry works, J error after 14 s, A/B/C/D unchanged | User asked; Claude |

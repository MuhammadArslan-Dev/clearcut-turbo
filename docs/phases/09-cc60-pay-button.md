# Phase 09 — CC-60: pay button ("Unlock Full Access") does nothing

**Status:** Not Started
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
- [ ] Preload `checkout.js` on page mount.
- [ ] Add a `useRef` in-flight guard on both paths. On tap, disable the button immediately and show "भुगतान खुल रहा है…" / "Opening payment…" (i18n en/hi/mr).
- [ ] Fix verify polling so pending isn't treated as failure (see D1).
- [ ] After a polling timeout, show a "Payment received, activating…" state instead of nothing.
- [ ] Replace `alert()` with in-page error UI and a "Try again" button. Show an error if checkout hasn't opened within ~5 seconds.
- [ ] "UPI / Card / Net banking" row: make it tappable (opens the same checkout) or restyle it as plain text (see C1).
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
| | | | |

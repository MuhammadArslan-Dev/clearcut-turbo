# Phase 05 — CC-53: send the correct Purchase value to Meta

**Status:** In Review (branches cc-53-meta-purchase in BE + CM; not merged)
**Jira:** https://clear-cutoff.atlassian.net/browse/CC-53
**Repos:** CM `apps/dashboard`, optionally BE

## Already done — commit `04f110f` (2026-10-20, on main)
- `lib/payment/metaPurchaseConfig.ts` holds the multipliers (subscription ×1.85, one-time ×1.0), rounds the value, and maps `plan` → `monthly_autopay` / `monthly_onetime` / `annual`.
- One-time Purchase (`useRazorpayPayment.ts:150-157`) sends `value`, `currency INR`, `amount_paid`, `plan`.
- Subscription (`payment/initiated/page.tsx:464-481`) sends Subscribe with `value` + `predicted_ltv`, plus a Purchase with `plan: monthly_autopay`.
- Note: `f79b739` ("payment event set changes") actually only touched OTP/auth files.

## Remaining gaps (verified)
1. **One-time Purchase rarely fires**, because verify-polling dies on the first 400 (the CC-60 bug). **Depends on Phase 09.**
2. `amount_paid` is the client's display `price`, not what was charged. The BE applies a referral discount (`PaymentController.php:62-69`). Use `order.order.amount / 100`. No coupon system exists.
3. The subscription's `amount_paid` is the FE display price, not the DB plan amount.
4. "First payment only": OK for autopay renewals (webhook-only), but **not** for one-time. Repeat purchases and retries from the failed page fire Purchase again.
5. `predicted_ltv == value`: confirm this is intended.

## Plan
- [ ] Use the server-charged amount for `amount_paid` and for the value base (one-time and subscription).
- [!] 🛑 **D1:** how to enforce "first payment only" for one-time? Option: verify returns `is_first_purchase` from `EventTrackingService::record()`. That is a BE change.
- [!] 🛑 **D2:** browser Pixel only (as the ticket says), or also add server CAPI from the webhook with `event_id` dedup? CAPI is more reliable but needs a BE token, a queue and PII hashing.
- [!] 🛑 **D3:** keep the multipliers in the FE config (current), or move them to BE config so RD can change them without a frontend deploy?
- [!] ⚠️ **System impact:** fixing Phase 09 plus this will change Purchase count and value in Ads Manager, which shifts ad optimisation. **Tell the client before release.** Also route the pixel calls through the Phase 02 allowlist.
- [ ] 📞 **C1:** RD: confirm 1.85, and that `predicted_ltv` = value.
- [ ] 📞 **C2:** RD: is "first purchase" per user or per user+exam?
- [ ] 📞 **C3:** RD: should annual send the plain total (no multiplier)?
- [ ] 📞 **C4:** RD: do referral-discounted payments send the discounted value? Ticket says "after discount", so yes; confirm.
- [ ] Verify with Meta Pixel Helper / Events Manager Test Events on a prod-like host, for each plan: value, amount_paid, plan, currency.

## Decision log
| Date | Item | Decision | By |
|---|---|---|---|
| 2026-10-22 | First payment | Per user + course (group_code): the first successful payment of each course sends Purchase (+ Subscribe for autopay); autopay renewals and re-buying the same course's one-time plan are renewals (nothing sent). | User |
| 2026-10-22 | D1 | (a) backend decides (MetaPurchaseService): verify returns meta_purchase; GET /v2/subscription/{id}/meta-purchase for autopay | User |
| 2026-10-22 | D2 | (b) multipliers in BE config payment.meta_purchase (env META_PURCHASE_SUBSCRIPTION/ONE_TIME/ANNUAL_MULTIPLIER, then config:clear) | User |
| 2026-10-22 | D3 | (a) verify polling fixed now: BE pending -> 200 + pending; FE keeps polling on old 400s, 10 x 2 s | User |
| 2026-10-22 | Done | value = charged amount (webhook paise or transaction rupees, after discount) x multiplier, rounded; eventID per payment + once-per-browser guard. Local check (rolled back): first course send=true, same course again send=false, other course send=true; autopay ₹99 -> 183. Live Pixel not tested (needs a real payment). | Claude |

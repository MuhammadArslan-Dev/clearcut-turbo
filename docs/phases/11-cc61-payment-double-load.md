# Phase 11 — CC-61: payment page loads twice and reloads on plan change

**Status:** In Review (branch cc-61-payment-double-load; not merged)
**Jira:** https://clear-cutoff.atlassian.net/browse/CC-61
**Repos:** CM `apps/dashboard`

## Cause (verified, 2026-10-21)
- `payment/initiated/page.tsx:303-312`: an effect calls `set({ price: selectedPrice })`, which runs `router.replace` (`hooks/useQueryParams/useQueryParam.ts:85-89`). That is an App Router navigation with a server round trip through `proxy.ts`.
- On load, `selectedPrice` is computed before the course data arrives (99), then again after (e.g. 149 for HPTET). That makes 2 replaces on load, plus 1 per plan switch (`handleSelectVariant`, `:145-201`).
- The `price` param is **never read** on this page. The success page gets its price via its own URL (`:325`, `:484`).

## Plan
- [x] Deleted the effect; the plan lives in React state only (`set` from useQueryParams no longer used here).
- [x] Skeleton uses the loaded page's frame (`h-screen` on phones, `justify-between`, full-width blocks), so content replaces it in place. The loaded page itself is unchanged.
- [!] 🛑 **D1:** keep the plan in the URL? If yes, use `window.history.replaceState` with `?plan=` and seed `selectVariant` from it (no navigation). If no, drop it entirely.
- [ ] Optional: the success page reads the price from the order/verify response instead of the URL. Check this together with Phase 05.
- [ ] ⚠️ Low system impact (one page). Check that no analytics or marketing link depends on `&price=`.
- [ ] 📞 **C1:** RD: do any ads or links deep-link a preselected plan (`&price=` / `&plan=`)?
- [ ] Verify: open `/payment/initiated?exam_id=…`. The Network tab shows a single document/RSC load, switching plans shows no RSC request, and there is no layout shift (mobile screenshot).

## Decision log
| Date | Item | Decision | By |
|---|---|---|---|
| 2026-10-22 | D1 | Drop the plan from the URL (nothing reads it; no link deep-links a plan) | User |
| 2026-10-22 | Tests | Playwright, 390px, local dev + backend, MAHATET (₹149 ≠ default ₹99): main = 3 App Router (RSC) navigations on load + 3 on 3 plan switches, URL `&price=149→229→799→149`; fix = 0 and 0, URL unchanged. CLS 0.187 → 0.063 (the only shift was the centred skeleton → full-height page). tsc: only the old line-460 error; ESLint 12 → 11; check:colors OK | Claude |

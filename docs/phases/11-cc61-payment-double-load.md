# Phase 11 — CC-61: payment page loads twice and reloads on plan change

**Status:** Not Started
**Jira:** https://clear-cutoff.atlassian.net/browse/CC-61
**Repos:** CM `apps/dashboard`

## Cause (verified, 2026-10-21)
- `payment/initiated/page.tsx:303-312`: an effect calls `set({ price: selectedPrice })`, which runs `router.replace` (`hooks/useQueryParams/useQueryParam.ts:85-89`). That is an App Router navigation with a server round trip through `proxy.ts`.
- On load, `selectedPrice` is computed before the course data arrives (99), then again after (e.g. 149 for HPTET). That makes 2 replaces on load, plus 1 per plan switch (`handleSelectVariant`, `:145-201`).
- The `price` param is **never read** on this page. The success page gets its price via its own URL (`:325`, `:484`).

## Plan
- [ ] Delete the effect. Keep the selected plan in React state only. Switching plans only changes the highlight and the button text.
- [ ] Reserve space (skeletons with final dimensions) for the plan cards, button and badges, so nothing jumps when data arrives.
- [!] 🛑 **D1:** keep the plan in the URL? If yes, use `window.history.replaceState` with `?plan=` and seed `selectVariant` from it (no navigation). If no, drop it entirely.
- [ ] Optional: the success page reads the price from the order/verify response instead of the URL. Check this together with Phase 05.
- [ ] ⚠️ Low system impact (one page). Check that no analytics or marketing link depends on `&price=`.
- [ ] 📞 **C1:** RD: do any ads or links deep-link a preselected plan (`&price=` / `&plan=`)?
- [ ] Verify: open `/payment/initiated?exam_id=…`. The Network tab shows a single document/RSC load, switching plans shows no RSC request, and there is no layout shift (mobile screenshot).

## Decision log
| Date | Item | Decision | By |
|---|---|---|---|
| | | | |

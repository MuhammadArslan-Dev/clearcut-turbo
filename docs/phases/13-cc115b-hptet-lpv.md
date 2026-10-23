# Phase 13 — CC-115 Part B: HPTET ad clicks not credited as landing page views (PARKED)

**Status:** Covered by Phase 28 (2026-10-23): /go pixel on page load + shared `_fbc`; HPTET ad URLs still needed from Ganesh (Phase 30).
**Jira:** https://clear-cutoff.atlassian.net/browse/CC-115
**Repos:** ASTRO (`FacebookPixel.astro`, Worker, `src/pages/index.astro`)

## What the code shows (2026-10-21)
- HPTET, HTET and CTET use the same template (`exam/[slug].astro`). There is no HPTET-specific code difference that would explain this, other than price, social proof, and no `/mr` variant.
- **The Meta Pixel loads only after the first click, scroll or keydown, on every go page** (`packages/auth/src/FacebookPixel.astro`). Visitors who don't interact are never counted as a landing page view. That depresses LPV everywhere, and more on pages where people bounce faster.
- **URL variants lose attribution:**
  - A trailing slash or `.html` gets a 308 that drops `/go` (→ the Next.js landing page).
  - Unknown or uppercase slugs fall back to `index.html`, which meta-refreshes to `/teaching` and **drops every query param, including fbclid**.
- `htet.astro` had no Pixel until an uncommitted change.

## Plan (only if confirmed)
- [!] 🛑 **D0:** do this phase now, or leave it parked?
- [!] 🛑 **D1:** load the Pixel base code + PageView early in `<head>`, not gated on interaction? This is a speed vs attribution trade-off.
- [!] 🛑 **D2:** make the Worker normalise trailing slash and case, and make the fallback keep the query string?
- [!] ⚠️ **System impact:** the pixel change applies to all go pages. Worker changes affect all `/go` routes and need a separate `wrangler deploy` (the user runs it).
- [ ] 📞 **C1:** RD: the exact HPTET ad destination URLs and params from Ads Manager. Same pixel/dataset as HTET/CTET? What is the placement mix?
- [ ] 📞 **C2:** RD/Ganesh: open the ad on a phone in the FB/IG app and record every redirect hop, plus Pixel Helper results.
- [ ] Done when: HPTET LPV ÷ link clicks is above 45% within 3 days.

## Decision log
| Date | Item | Decision | By |
|---|---|---|---|
| | | | |

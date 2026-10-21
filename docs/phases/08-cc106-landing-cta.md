# Phase 08 — CC-106: landing main button "3-दिन का फ्री ट्रायल शुरू" doesn't respond on first tap

**Status:** Not Started
**Jira:** https://clear-cutoff.atlassian.net/browse/CC-106
**Repos:** ASTRO (`packages/ui/Button.astro`, `apps/go-marketing/.../exam/[slug].astro`, maybe the Worker), CM `packages/auth/src/redirect.ts` (for mr)

## What the code shows (2026-10-21)
- **Verified:** every CTA is already a real `<a href>`, e.g. `https://clearcutoff.in/hi/start?course=ctet&element_location=sticky_bar&element_type=button`. They work without JS.
- **Verified bugs:**
  1. **Marathi sticky CTA goes to English `/start`.** `Button.astro:~112` only knows hi/en.
  2. **UTMs and `fbclid` are not passed to /start.** The hrefs are fixed at build time.
  3. The main CTA is `md:hidden`, so there is none on desktop.
  4. The price card (₹1299/₹99) and the guarantee block are not links.
  5. `/mr` users land on English onboarding after verify (`packages/auth/src/redirect.ts` `buildPostVerifyRedirectUrl` / `getCurrentLocale` know only hi).
  6. The go pages' logged-in check calls **`https://apptest.clearcutoff.in/api/v1/me`** (`ASTRO packages/auth/src/lib/auth.ts:7`). That looks wrong for production.
- **Why a tap "does nothing" or "reloads" (guesses, supported by code):**
  - The Truecaller probe (`truecallersdk://` hidden iframe) runs on the first scroll on Android Chrome. A tap can trigger it and switch to the Truecaller app.
  - GTM, Pixel, badge and social-proof scripts all start on the first click.
  - Logged-in users get bounced from `/hi/start` to the dashboard (AuthProvider).
  - Cloudflare Speed Brain or a Bot challenge on `/hi/start` would look like a reload. Check Cloudflare Security Events.

## Plan
- [ ] Fix `Button.astro` locale handling for `mr`.
- [ ] Pass the incoming query string (`utm_*`, `fbclid`) to every /start link.
- [ ] Make the price card and guarantee block link to the same /start URL (coordinate with Phase 03).
- [ ] Add an immediate pressed state, and prefetch /start when the CTA enters the viewport.
- [ ] Fix the `mr` locale in `buildPostVerifyRedirectUrl` / `getCurrentLocale`.
- [!] 🛑 **D1:** pass the query string with a small inline script, or with the Worker (HTMLRewriter)?
- [!] 🛑 **D2:** keep the Truecaller probe on go pages? Remove it, or delay it until after the CTA tap?
- [!] 🛑 **D3:** go pages' backend: switch `apptest.clearcutoff.in` to the production API?
- [!] 🛑 **D4:** prefetch via Speculation Rules or `<link rel=prefetch>`?
- [!] ⚠️ **System impact:**
  - `Button.astro` is also used by `landing.astro`.
  - `packages/auth/redirect.ts` is used by blog and landing.
  - Cloudflare zone settings affect the whole domain.
  - ASTRO and the Worker deploy separately (`wrangler deploy`); the user runs it.
- [ ] 📞 **C1:** RD: exact device, browser and app (FB or IG) where the tap fails, and whether the user was logged in.
- [ ] 📞 **C2:** RD: should desktop also get the main CTA?
- [ ] 📞 **C3:** RD/owner: check Cloudflare Security Events for challenges on `/hi/start`.
- [ ] Verify: open `/hi/go/exam/ctet-preparation?utm_source=x&fbclid=y`, tap the CTA, and confirm /start keeps both params. Repeat for `/mr`, and in the FB in-app browser.

## Decision log
| Date | Item | Decision | By |
|---|---|---|---|
| | | | |

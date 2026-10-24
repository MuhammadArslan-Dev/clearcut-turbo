# Phase 40 — CC-122: from a Facebook/Instagram in-app browser, the /go CTA opens /start in Chrome

**Status:** Planned (2026-10-24)
**Jira:** [CC-122](https://clear-cutoff.atlassian.net/browse/CC-122)
**Repos:** ASTRO `apps/go-marketing` (the user's WIP on main must be stashed around this work and restored), CM `apps/landing` (`/start` side)
**Size:** medium

## What the user asked (2026-10-24)
When a student is in the FB/IG in-app browser and taps the CTA on a `/go` page, `/start` should open in Chrome instead of staying in FB/IG.

The ticket itself asks for more: a separate `-v2` landing variant with an A/B test, new events, and CAPI. The user's scope is the `/go` CTA itself, so this phase does that. The A/B variant part is listed at the end, not built.

## What the code shows
- Every `/go` CTA is a plain `<a href="https://clearcutoff.in/start…">`.
- ASTRO `apps/go-marketing/src/components/StartLinkEnhancer.astro` already:
  - appends `utm_*`, `fbclid`, `gclid`;
  - dims the pressed link;
  - prefetches `/start`.
  That is the place to add the escape.
- IAB detection already exists for Truecaller (`packages/auth/src/lib/truecaller.ts`: `FBAN|FBAV|FB_IAB|FBIOS|FB4A|Instagram`) and in dashboard `inAppBrowserKind()`.

## Plan (Meta policy guardrails from the ticket hold)
- [ ] Only on **Android** + FB/IG IAB, only **on the tap**. No automatic redirect; same page content for everyone.
- [ ] On tap:
  1. Build `intent://clearcutoff.in/start?<same params>#Intent;scheme=https;package=com.android.chrome;S.browser_fallback_url=<encoded https URL>;end`.
  2. Navigate to it.
  3. If the page is still visible after ~1.5 s, Chrome didn't open: continue to the normal `/start` link inside the IAB. The student is never trapped.
- [ ] Carry into Chrome:
  - utm/fbclid/gclid (already done);
  - `fbp`/`fbc` from the `_fbp`/`_fbc` cookies;
  - Amplitude device id;
  - `src=iab_escape`.
- [ ] `/start` (landing):
  - If `fbp`/`fbc` params are present, write them as `_fbp`/`_fbc` cookies before the Pixel starts. Keep the originals; never regenerate.
  - Start Amplitude with the passed device id, so the IAB and Chrome sessions are one user.
- [ ] iOS, Chrome and other browsers: unchanged.
- [ ] Kill switch: `PUBLIC_IAB_ESCAPE=off` env in go-marketing. This needs a rebuild; a no-deploy switch would need a remote flag, so say so.
- [ ] Analytics (reuse rule): one new event **`Chrome Escape`** with `result: attempted | opened | failed` and `browser_context: instagram_iab | facebook_iab`, instead of three snake_case events. `opened` fires on `/start` when `src=iab_escape`.

## Verification
- Can only be proven on a real Android phone. Open the `/go` link from an Instagram DM and from the Facebook app, then tap the CTA:
  - Chrome opens `/start` with every param.
  - Login works.
  - `_fbc` in Chrome equals the IAB value.
- Android without Chrome / Chrome disabled: the fallback URL works.
- iOS IG/FB: the same as today.
- Desktop/Chrome: the same as today.
- Locally: Playwright with an Android IG user agent checks the built intent URL and the 1.5 s fallback (the intent itself can't open in a desktop browser).

## Not built here (rest of the ticket)
- Separate `-v2` variant page + A/B split (CC-123 monitors it).
- Meta CAPI Lead/Purchase (there is no CAPI yet).
- Logged-in skip to the dashboard.

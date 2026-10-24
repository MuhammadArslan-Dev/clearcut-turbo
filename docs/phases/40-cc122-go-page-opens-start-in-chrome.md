# Phase 40 — CC-122: from a Facebook/Instagram in-app browser, the /go CTA opens /start in Chrome

**Status:** Built + verified locally (2026-10-24). ASTRO branch `phase-40-cc122-iab-to-chrome` (4f7b3e9, on top of Phase 36), CM branch `phase-40-cc122-iab-to-chrome` (on top of Phase 39). Not pushed. Real Android phone test still needed.
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

## What was built
- **ASTRO**
  - `StartLinkEnhancer.astro`: on Android + FB/IG in-app browser (same UA markers as Truecaller's IAB check), a tap on a `/start` CTA:
    1. sends `Chrome Escape` `{result: attempted, browser_context}`;
    2. flushes it (≤300 ms);
    3. opens `intent://clearcutoff.in/start?…#Intent;scheme=https;package=com.android.chrome;S.browser_fallback_url=<plain link>;end`.
  - Carried into Chrome: the link's params + utm/fbclid, `fbp`/`fbc` (from the `_fbp`/`_fbc` cookies), `ampDeviceId`, `src=iab_escape`, `iab=instagram_iab|facebook_iab`.
  - If the page is still in front 1.5 s later: `Chrome Escape failed` (flushed), then the plain link opens in the app.
  - A `visibilitychange` guard stops this from firing when the student comes back to the app after Chrome opened.
  - `PUBLIC_IAB_ESCAPE=off` (build env) turns it off.
  - `@repo/analytics/amplitude`: `flushAmplitude()`, `getAmplitudeDeviceId()`.
- **CM**
  - `packages/utils/meta-fbc.ts` `persistFbcFromUrl()`: an `fbc` param in Meta's format is written as `_fbc` exactly (original timestamp kept; a fresh one would break the click window). An `fbp` param is written as `_fbp` only when the browser has none. Otherwise the old fbclid logic applies. 4 new tests with a real cookie-jar fake.
  - Landing `services/analytics.ts`: after init, `src=iab_escape` → `Chrome Escape {result: opened, browser_context}`.
  - The Amplitude SDK itself adopts `ampDeviceId` from the URL (checked in the SDK source), so no extra code was needed for that.
- **Not built** (rest of the ticket):
  - A separate `-v2` variant + A/B split.
  - Pixel `CTA_Click`.
  - Server CAPI.
  - Logged-in skip to the dashboard.

## Verification (2026-10-24, local)
- **ASTRO production build on `localhost:4330`, Playwright with real UA strings.** Requests to `clearcutoff.in/start` and `amplitude.com` were stubbed.
  - Android Instagram and Android Facebook:
    - the intent URL carries every param above with the right `iab` value;
    - Chrome can't open from a desktop browser, so the fallback ran: the plain `/start` link opened ~1.5 s later;
    - events: `attempted` then `failed`. Before the flush fix, `failed` was lost on navigation.
  - iOS Instagram and Android Chrome: no intent, normal link, no events.
- **Landing `/start` (dev)** with `fbc`/`fbp`/`ampDeviceId=iab-device-0001`/`src=iab_escape`:
  - `_fbc` and `_fbp` equal the passed values;
  - every Amplitude event (incl. Authentication Initiated etc.) has device id `iab-device-0001`, i.e. the same user as the IAB session;
  - `Chrome Escape opened/instagram_iab` was sent.
- utils tests 92/92. Landing typecheck clean, lint unchanged.

## Still needed
- A real Android phone:
  - open a `/go` link from an Instagram DM and from the Facebook app, then tap the CTA → Chrome opens `/start`, login works;
  - test without Chrome / with Chrome disabled → the fallback works.
- iOS: confirm nothing changed.

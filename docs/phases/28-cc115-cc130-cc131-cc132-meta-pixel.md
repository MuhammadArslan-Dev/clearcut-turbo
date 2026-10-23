# Phase 28 — CC-115 + CC-130 + CC-131 + CC-132: clean, correct Meta Pixel data

**Status:** Not Started
**Jira:** [CC-115](https://clear-cutoff.atlassian.net/browse/CC-115), [CC-130](https://clear-cutoff.atlassian.net/browse/CC-130), [CC-131](https://clear-cutoff.atlassian.net/browse/CC-131), [CC-132](https://clear-cutoff.atlassian.net/browse/CC-132)
**Repos:** CM (`apps/landing`, `apps/dashboard`, `packages/auth`, `apps/blog`/`tools` if they load the pixel), ASTRO (`/go` pixel), BE only for CC-132's real fee
**Size:** medium; many small edits across apps

## What the tickets say
**CC-115:**
- Localhost PageViews reach the live pixel: ~310 on 20 Oct.
- HPTET ads get ~27% landing-page views vs 54% for HTET/CTET. The fbclid is lost in a redirect, or the pixel fires late.
- **User's instruction (22 Oct):** block test traffic **only from Meta**. Amplitude and the others keep receiving it (don't change them here).
- Ask: allowlist production hostnames for the pixel (clearcutoff.in, app.clearcutoff.in, academy.clearcutoff.in), and use `test_event_code` for local tests. Check for localhost Lead/Purchase events.

**CC-130:**
- Purchase is the only event with 0% fbc; the other events send 60–100%.
- Ask: capture fbc (`_fbc` cookie, else build `fb.1.<ms>.<fbclid>`), store it, and send it with Purchase. Keep the same `event_id` for dedup. Renewals still never send Purchase.
- **User's instruction:** **browser only**, not the server/CAPI.

**CC-131:**
- Purchase value excludes GST: `value = amount / 1.18`, 2 decimals (₹149 → 126.27, ₹99 → 83.90).
- One GST constant. Pixel and CAPI must send the same value for dedup.
- Amplitude and internal revenue stay unchanged.

**CC-132 (after CC-131):**
- Also subtract Razorpay's fee: the actual `fee − tax` from the payment entity, else a configurable 2% of the ex-GST amount (logged).
- Pixel and CAPI must match; the value may have to come from the server.

## What the code shows (2026-10-23, first pass)
- **Dashboard Purchase:** `trackFacebookEventWithUserData()` (`apps/dashboard/src/lib/analytics/facebook-pixel.ts`), fired from `useRazorpayPayment`, the paywall modals and `payment/initiated`.
- **Landing:** pixel bootstrap + PageView (DEVELOPMENT_RULES: PageView fires only after `getMetaGeoData()`).
- **Server:** BE CAPI exists (CC-53 decides `send` per first payment).
- **ASTRO:** `/go` has its own FacebookPixel component (the user's WIP touches `htet.astro`; stage only this phase's hunks).
- **HPTET landing:** `/hi/go/exam/hptet-preparation`. Check the redirect chain from the ad URLs (needs the Ads Manager URLs).

## Plan
- [ ] **One shared hostname allowlist** (`isMetaAllowedHost()`), used by every pixel loader (landing, dashboard, blog?, ASTRO, tools if any). The pixel doesn't load off-allowlist; Amplitude/Clarity untouched.
- [ ] **Query the Meta dataset / Amplitude** for localhost Lead/CompleteRegistration/StartTrial/Purchase in the last 14 days (via Meta Ads MCP if available) and report counts.
- [ ] **HPTET:**
  - List each active HPTET ad URL (Meta Ads MCP / ask Ganesh), follow redirects, and check fbclid/UTM survive and PageView fires in `<head>` early.
  - Compare with the HTET page and fix the redirect or the pixel timing.
- [ ] **CC-130:** read/build fbc on landing (same logic as Lead), store it (localStorage + user if available), pass it as `fbc` in the dashboard's browser Purchase `user_data`. Server unchanged.
- [ ] **CC-131:** `META_GST_RATE` constant; Purchase value ex-GST in the browser **and** in the BE CAPI (same value).
- [ ] **CC-132:** the BE computes the final value (actual fee or 2% fallback, logged), returns it with the payment verify response, and the browser sends that same value.
- [!] 🛑 **D1:** CC-131 changes CAPI (server) too, because dedup needs equal values. Confirm that's fine given "CC-130 browser only".
- [ ] **Verify:**
  - Pixel requests blocked on localhost (Playwright network log) and present on prod hosts.
  - Meta Test Events with `test_event_code`: Purchase carries fbc, value 126.27 for ₹149, deduped.
  - HPTET PageView fires with fbclid.

## Decision log
| Date | Item | Decision | By |
|---|---|---|---|
| 2026-10-22 | CC-115 scope | Block test traffic only from Meta; others keep receiving it | User |
| 2026-10-22 | CC-130 scope | Browser Purchase only, not server | User |

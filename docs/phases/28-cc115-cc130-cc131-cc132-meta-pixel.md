# Phase 28 — CC-115 + CC-130 + CC-131 + CC-132: clean, correct Meta Pixel data

**Status:** Built + verified locally (2026-10-23) — CM/BE/ASTRO branches below. Not merged.
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

## What was found (2026-10-23)
- **CC-115 Part A was already live:** local hosts were off.
  - But it was a deny-list: `maintest.clearcutoff.in` (the test server), preview deployments and `*.pages.dev` still loaded the live pixel.
- **ASTRO `/go` (every ad landing: `/go/exam/*`, `/go/landing`, academy) loaded the pixel only after the first click/scroll/keydown.**
  - A visitor who left without one never sent PageView, which Meta counts as the landing-page view.
  - A CTA tap navigated away before fbevents.js could store the click id (`_fbc`).
- **HPTET (Meta, active ads, last 14 days):**

  | Ad | LPV / link clicks |
  |---|---|
  | HPTET New Leads Ad SET-A | 54 / 202 = 27% |
  | HTET_SET_A | 674 / 1273 = 53% |
  | CTET Sales | 676 / 1229 = 55% |

  - The Meta API doesn't return the creatives' destination URLs.
  - Live `/hi/go/exam/hptet-preparation?fbclid=…`: 200, no redirect, fbclid kept, ~0.3–0.5 s.
  - `/hi/go/htet` (live) has no pixel at all; `/hi/htet` is 404.
  - So redirects aren't the cause. The deferred pixel is the clear defect on these pages. Whether HPTET's destination differs from HTET's needs the ad URLs (Ganesh).
- **Purchase fbc 0%:** the pixel sends fbc only from the `_fbc` cookie.
  - The cookie was written only by fbevents.js on a page still carrying `fbclid`.
  - With the deferred `/go` pixel that rarely happened before the student moved on.
  - Purchase is on app.clearcutoff.in, later.
- **There is no server-side (CAPI) Purchase in BE.** The browser sends the backend's `meta_purchase` (CC-53).
  - So D1 is moot: changing `MetaPurchaseService` changes the one value used.

## What was built
- **CC-115 allowlist:**
  - `isMetaPixelHost()` loads the live pixel only on `clearcutoff.in`, `www.`, `app.`, `academy.` (`packages/utils/src/meta-pixel-env.ts`; ASTRO `packages/auth/src/lib/facebook-pixel.ts` has the same list).
  - Any other host: off unless the browser opted in (`cc-meta-pixel-local`).
  - Amplitude/Clarity/GTM untouched.
- **CC-115 `/go`:** the pixel loads on page load (`FacebookPixel.astro`), as the client rule already says for the other apps. fbevents.js stays async.
- **CC-130 (browser only):** `persistFbcFromUrl()` (`packages/utils/src/meta-fbc.ts`; ASTRO copy).
  - On any page with `fbclid` it writes `_fbc = fb.1.<ms>.<fbclid>` on `.clearcutoff.in` for 90 days (same click kept, a new click replaces it).
  - Called by the landing, dashboard and `/go` pixels on load.
  - Every later event, Purchase on app.clearcutoff.in included, carries fbc. No server change.
- **CC-131 + CC-132 (BE `MetaPurchaseService`):**
  - value = (amount / 1.18 − Razorpay fee ex-GST) × plan multiplier, 2 decimals.
  - The fee is the payment's `fee − tax`, stored from `payment.captured`; otherwise `razorpay_fee_fallback_pct` (2%) of the ex-GST amount.
  - Config: `META_PURCHASE_GST_RATE`, `META_PURCHASE_RAZORPAY_FEE_PCT`.
  - `amount_paid`, Amplitude and internal revenue are unchanged.
  - The CC-53 multipliers (autopay 1.85) still apply on top.

## Verification (local)
- [x] **Unit tests** (`@clearcut/utils`, 56 pass):
  - Allowlist hosts in/out (maintest, pages.dev, vercel.app, `clearcutoff.in.evil.com`).
  - Opt-in on a test subdomain.
  - fbc format, shared domain, same-click kept, no fbclid → nothing.
- [x] **Browser:**
  - `/go/exam/hptet-preparation?fbclid=…` on localhost → `_fbc` written at once with no interaction, and no Facebook request.
  - Opted in → fbevents.js requested on load, without a click.
  - Dashboard → `_fbc` written, no Facebook request.
- [x] **Values:**

  | Price | Fee used | Value |
  |---|---|---|
  | ₹149 | ex-GST only | 126.27 |
  | ₹149 | 2% fallback | 123.74 |
  | ₹99 | 2% fallback | 82.22 |
  | ₹229 | real fee ₹5.41 − tax ₹0.83 | 189.49 |
  | autopay ₹99 | fallback, × 1.85 | 152.11 |

- [x] tsc clean for touched files; eslint equal to main (2 = 2 each); check:colors passes; ASTRO go-marketing build passes.
- [ ] **After deploy:**
  - Meta Events Manager: Purchase fbc coverage rises from 0%; no events from maintest/localhost.
  - HPTET LPV rate over a week.
  - Ganesh to share the HPTET/HTET ad destination URLs.

## Plan
- [x] **One shared hostname allowlist** (`isMetaAllowedHost()`), used by every pixel loader (landing, dashboard, blog?, ASTRO, tools if any). The pixel doesn't load off-allowlist; Amplitude/Clarity untouched.
- [ ] **Query the Meta dataset / Amplitude** for localhost Lead/CompleteRegistration/StartTrial/Purchase in the last 14 days (via Meta Ads MCP if available) and report counts.
- [ ] **HPTET:**
  - List each active HPTET ad URL (Meta Ads MCP / ask Ganesh), follow redirects, and check fbclid/UTM survive and PageView fires in `<head>` early.
  - Compare with the HTET page and fix the redirect or the pixel timing.
- [x] **CC-130:** read/build fbc on landing (same logic as Lead), store it (localStorage + user if available), pass it as `fbc` in the dashboard's browser Purchase `user_data`. Server unchanged.
- [x] **CC-131:** `META_GST_RATE` constant; Purchase value ex-GST in the browser **and** in the BE CAPI (same value).
- [x] **CC-132:** the BE computes the final value (actual fee or 2% fallback, logged), returns it with the payment verify response, and the browser sends that same value.
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
| 2026-10-23 | D1 | Moot: BE has no server Purchase; the browser sends the BE-computed value | Found in code |
| 2026-10-23 | `/go` pixel timing | Load on page load (client rule for all apps) instead of first interaction | Claude, per existing client rule |

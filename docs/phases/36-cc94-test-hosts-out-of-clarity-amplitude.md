# Phase 36 — CC-94: test and local sites stop recording into live Clarity and Amplitude

**Status:** Planned (2026-10-24)
**Jira:** [CC-94](https://clear-cutoff.atlassian.net/browse/CC-94) (Highest)
**Repos:** CM (`packages/analytics`, `packages/utils`, dashboard, landing, blog, tools), ASTRO, BE
**Size:** small–medium

## What the ticket says
- Live Clarity project `o8pe7lwvxo` records `localhost:3000/3020` and `maintest.clearcutoff.in` sessions.
- **Ask:**
  - Load Clarity only on `clearcutoff.in`, `www.`, `app.`, `academy.`.
  - Do the same for Amplitude.
  - **Done when:** no localhost or maintest sessions appear in the live project after release.

## What the code shows
- **Phase 02 audit:** it already maps every tracker. Phase 28 (CC-115) added the host allowlist for Meta Pixel only (`packages/utils/src/meta-pixel-env.ts` → `META_PIXEL_HOSTS`, `isMetaPixelHost`, `isLocalDevHost`). Amplitude and Clarity were left out at the time.
- **Clarity:**
  - Dashboard `components/thirdparties/LazyClarity.tsx` is gated only on `NODE_ENV` + id, so maintest passes.
  - The id `o8pe7lwvxo` is not in any repo, so Clarity is most likely also a tag inside GTM `GTM-WC2GWW9Z`.
  - Gating Clarity in code is therefore not enough: GTM must load only on production hosts as well.
- **Amplitude:**
  - Dashboard `lib/analytics/browser.ts`: `NEXT_PUBLIC_AMPLITUDE_ENABLED`.
  - Landing `services/analytics.ts`: on whenever a key exists.
  - Blog `services/analytics.js`: on unless `"false"`.
  - Tools `lib/toolsAnalytics.ts`.
  - ASTRO `amplitude.ts`: no gate.
  - BE `AmplitudeService` ("Signed Up"): `AMPLITUDE_ENABLED` defaults to true.

## Plan
- [ ] Rename/extend the Pixel allowlist into one shared check `isProductionAnalyticsHost(hostname)` (same 4 hosts) in `packages/utils`. Keep `isMetaPixelHost` working as an alias.
- [ ] Gate on it, in the browser:
  - Dashboard `LazyClarity`, `LazyGTM` and Amplitude `browser.ts`.
  - `packages/analytics` (GTM + Clarity for blog/landing/tools).
  - Landing, blog and tools Amplitude.
- [ ] ASTRO: the same check for GTM and Amplitude (`packages/analytics`, `amplitude.ts`).
- [ ] BE: send server Amplitude only when `APP_ENV=production`.
- [ ] Keep a local opt-in, like the Pixel's `cc-meta-pixel-local`: `localStorage.setItem("cc-analytics-local","1")`. Then a developer can still test events on purpose.
- [!] **D1:** GTM also carries GA4/Ads tags. Blocking GTM off production hosts stops test hits there too. **Recommended:** yes. It is the only way to stop the GTM-loaded Clarity.

## Verification
- Local dev (`localhost:3020`, `3010`, `next start`): no requests to `clarity.ms`, `api2.amplitude.com` or `googletagmanager.com` in the network panel.
- With the opt-in key set, the requests come back.
- A production build served under a fake `clearcutoff.in` host (hosts-file or Playwright route) still loads all three.
- After deploy: Clarity filter on URL contains `localhost` / `maintest` shows no new sessions for 48 h.

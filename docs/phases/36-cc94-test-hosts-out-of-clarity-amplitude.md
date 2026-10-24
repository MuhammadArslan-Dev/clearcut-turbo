# Phase 36 — CC-94: test and local sites stop recording into live Clarity and Amplitude

**Status:** Built + verified locally (2026-10-24). CM branch `phase-36-cc94-analytics-hosts`, ASTRO branch `phase-36-cc94-analytics-hosts` (8e3d072). Not pushed.
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
- [x] **D1 (user: yes, 2026-10-24):** GTM is blocked off production hosts too. It is the only way to stop the GTM-loaded Clarity. Confirmed: with the opt-in on localhost, `gtm.js` loads and then loads `clarity.ms/tag/o8pe7lwvxo`.

## Verification
- Local dev (`localhost:3020`, `3010`, `next start`): no requests to `clarity.ms`, `api2.amplitude.com` or `googletagmanager.com` in the network panel.
- With the opt-in key set, the requests come back.
- A production build served under a fake `clearcutoff.in` host (hosts-file or Playwright route) still loads all three.
- After deploy: Clarity filter on URL contains `localhost` / `maintest` shows no new sessions for 48 h.

## What was built
- `packages/utils/src/analytics-hosts.ts`:
  - `PRODUCTION_ANALYTICS_HOSTS`, `isProductionAnalyticsHost`, `analyticsAllowedHere()` (production host, or opt-in `localStorage cc-analytics-local=1`).
  - The Meta Pixel list (`meta-pixel-env.ts`) now points at the same list.
  - Tests in `analytics-hosts.test.ts`.
- Gated:
  - `packages/analytics` `lazy-gtm` / `lazy-clarity` (blog, landing, tools);
  - dashboard `LazyGTM`, `LazyClarity`, Amplitude `internalInit`;
  - landing, blog and tools Amplitude init.
  - The check runs in effects / init, never in render, because the server has no hostname.
- `packages/analytics` and `apps/tools` got the `@clearcut/utils` workspace dependency (lockfile +6 lines).
- ASTRO `packages/analytics/src/lib/env.ts` (same list + opt-in) gates `initGtm` and `initAmplitude`.
- BE: **code not changed.** Tying `AMPLITUDE_ENABLED` to `APP_ENV` could silently stop the live "Signed Up" event if production's `APP_ENV` isn't `production`. Instead, `AMPLITUDE_ENABLED=false` was set in this machine's local `.env`. For a maintest backend, set the same on that server.

## Verification (2026-10-24)
- utils tests: 71/71 pass (incl. the new host tests). Typecheck clean for utils, analytics, tools, landing and dashboard. Lint: no new problems.
- Dashboard dev (`localhost:3020`), dashboard + preparation pages, after click/scroll/keydown:
  - no `googletagmanager`, `clarity.ms`, `amplitude.com` or `google-analytics` requests;
  - with the opt-in, GTM loads, then Clarity.
- ASTRO production build served on `localhost:4330/go/exam/htet-preparation`:
  - nothing loads;
  - with the opt-in, Amplitude + GTM + Clarity load.
- The two opt-in test visits did reach the live Amplitude/Clarity projects once each.

## After deploy
- In Clarity, filter URL contains `localhost` / `maintest` for 48 h: there should be no new sessions.
- Maintest backend (if it exists): `AMPLITUDE_ENABLED=false` in its env.

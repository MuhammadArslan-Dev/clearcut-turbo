# Phase 02 — CC-115 Part A + CC-94: stop localhost/test traffic reaching Meta Pixel, Amplitude, Clarity

**Status:** Not Started
**Jira:** [CC-115](https://clear-cutoff.atlassian.net/browse/CC-115) (Part A only), [CC-94](https://clear-cutoff.atlassian.net/browse/CC-94)
**Repos:** CM (`packages/analytics` + all 4 apps), ASTRO, BE, GTM container (outside the repos)

## Problem
Events from localhost, maintest.clearcutoff.in, previews and `gtm-msr.appspot.com` reach the production Pixel (`1126041265682766`), the production Amplitude project and Clarity `o8pe7lwvxo`.

Wanted: a **hostname allowlist** — `clearcutoff.in`, `www.clearcutoff.in`, `app.clearcutoff.in`, `academy.clearcutoff.in`.

## Where each tracker loads today and why it leaks

| Where | Tracker | Gate today | Leak |
|---|---|---|---|
| `packages/analytics` (`lazy-gtm.tsx:30`, `lazy-clarity.tsx:21`, `env.ts:29,37`) | GTM, Clarity (blog/landing/tools) | `NODE_ENV==="production"` + id | No hostname check: maintest, previews and local `next start` pass |
| landing `components/thirdparties/FacebookPixel.tsx` | Pixel | **none**, prod id fallback | Every environment |
| landing `services/analytics.ts:6,36-51` | Amplitude | key exists (prod fallback) | Every environment (the reported localhost pages are landing routes) |
| blog `services/analytics.js:24-29` | Amplitude | on unless `"false"` | Every environment |
| dashboard `components/thirdparties/FacebookPixel.tsx` + `lib/analytics/facebook-pixel.ts` | Pixel + events | **none**, hardcoded id | The localhost:3020 `/payment/initiated` hits |
| dashboard `LazyGTM.tsx:26` | GTM | **none**, hardcoded id | Even in `next dev` |
| dashboard `LazyClarity.tsx:17` | Clarity | `NODE_ENV` + env id | maintest |
| dashboard `lib/analytics/browser.ts` | Amplitude | `NEXT_PUBLIC_AMPLITUDE_ENABLED==="true"` | Local `.env` has `true` plus the prod key |
| tools `app/layout.tsx`, `lib/toolsAnalytics.ts` | GTM, Amplitude | GTM via shared gate; Amplitude on unless `"false"` | `*.pages.dev` previews |
| ASTRO `packages/analytics` GTM / `packages/auth/FacebookPixel.astro` / `amplitude.ts` | GTM, Pixel, Amplitude | GTM `PROD` only; Pixel and Amplitude **none** | Previews and `astro dev` |
| BE `config/services.php:64-67`, `AmplitudeService.php` | Server "Signed Up" | `AMPLITUDE_ENABLED` defaults to true, prod key fallback | Local and staging backends |

- Clarity id `o8pe7lwvxo` is **not in any repo**. It is most likely a tag inside GTM `GTM-WC2GWW9Z`. Code can't gate tags inside GTM; only gating the GTM load, or adding hostname triggers in GTM, can.
- There is no Meta CAPI in the backend, so "send CAPI only on prod" has nothing to change today.
- `gtm-msr.appspot.com` is a Google renderer (Tag Assistant / ad quality). The allowlist filters it automatically.

## Plan
- [ ] CM: add `isAllowedAnalyticsHost()` in `packages/analytics/src/env.ts` and make `isAnalyticsEnabled` require it. This keeps the CLAUDE.md rule: trackers self-gate, no app-level `isProduction` wrapper.
- [ ] CM: route every tracker through it: landing and dashboard Pixel plus the `fbq` helpers, all 4 Amplitude wrappers, and dashboard's own GTM and Clarity.
- [ ] ASTRO: the same helper in `packages/analytics/src/lib/env.ts`, used by GTM, Pixel and Amplitude.
- [ ] BE: Amplitude only when `APP_ENV=production` (or `AMPLITUDE_ENABLED` defaults to false outside prod).
- [ ] Set `AMPLITUDE_ENABLED=false` / `NEXT_PUBLIC_AMPLITUDE_ENABLED=false` in local `.env` files and update `.env.example`.
- [!] 🛑 **D1:** blocked traffic: drop it entirely, or send it to separate dev projects (Amplitude, Pixel, Clarity)?
- [!] 🛑 **D2:** maintest: send to a staging project, or nothing?
- [!] 🛑 **D3:** remove the hardcoded prod-id fallbacks, or keep them? Removing is safer, but a missing prod env var then silently turns analytics off. The allowlist alone avoids that risk.
- [!] 🛑 **D4:** dashboard: add a `@clearcut/analytics` dependency (pure helper), or keep a local copy of the helper? It is a partial consumer by design.
- [!] 🛑 **D5:** gate GTM-loaded tags in code (the GTM load) and/or with hostname triggers inside GTM?
- [!] ⚠️ **System impact:**
  - The shared `isAnalyticsEnabled` change affects blog, landing and tools at once.
  - The RN WebView uses app.clearcutoff.in, so it stays tracked; any dev WebView build goes silent.
  - Tools `*.pages.dev` previews go silent (desired).
  - Prod env vars in Coolify/Pages need review. Give the user the exact steps; don't change them yourself.
- [ ] 📞 **C1:** RD: what tags does GTM-WC2GWW9Z contain (Clarity? Pixel? GA4?)? Who can edit the container?
- [ ] 📞 **C2:** RD: CompleteRegistration / Lead / StartTrial / Purchase counts from localhost in the last 14 days (Events Manager). Clean the dataset, or exclude?
- [ ] 📞 **C3:** RD: create separate dev/staging Amplitude and Clarity projects?
- [ ] 📞 **C4:** RD: is server-side CAPI wanted? It doesn't exist yet.
- [ ] 📞 **C5:** RD: any staging hostnames besides maintest?
- [ ] Verify: on localhost (dev and `next start`), no requests to facebook.net, amplitude or clarity in the Network tab. On prod, all fire. After 3 days, no localhost hostnames in Meta or Amplitude.

## Decision log
| Date | Item | Decision | By |
|---|---|---|---|
| | | | |

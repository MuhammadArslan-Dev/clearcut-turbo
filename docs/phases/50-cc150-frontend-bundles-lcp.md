# Phase 50 - Front-end weight: bundles, LCP element, fonts, long tasks

**Tickets:** CC-150 (Medium)
**Repos:** CM dashboard (+ blog, same bug)
**Status:** First pass done (safe fixes built + measured, not committed); 4 decisions open
**Created:** 2026-10-27 (wave 2, Arslan's list)

## Goal
Initial JS for dashboard + onboarding -25%; Lighthouse mobile LCP < 2.5s on both.

## How it was measured
`ANALYZE=true next build --webpack` (the production build), `next start`, then Playwright on the
production bundle: **Slow 4G (1.6 Mbps, 150 ms RTT) + 4x CPU, cold cache**, Chrome 412x823, local
backend. PerformanceObserver for LCP / layout-shift / longtask / long-animation-frame, plus
Resource Timing for compressed JS bytes. `@next/bundle-analyzer` added to the dashboard
(same `ANALYZE=true` switch as landing). Build takes ~2-3.5 min, peak RAM use ~2 GB.
Timings are indicative (fast local API); **byte counts are exact**.

## Baseline (before any change)
| Page | LCP | LCP element | JS (gzip) | Long tasks | CLS |
|---|---|---|---|---|---|
| /dashboard | 5.0 s | `<h6>` "Today's Daily Test" (text) | 756 KB, 52 files | 6, 764 ms, worst 310 | 0.056 |
| /onboarding | 1.0 s | `<img>` logo 239x48 (in the HTML) | 579 KB, 28 files | 4, 615 ms, worst 207 | 0 |
| /preparation/[id] | 7.8 s | `<p>` chapter-list topic text | 687 KB, 46 files | 10, 1,711 ms, worst 499 | 0.144 |
| /test-series/[id] | 4.1 s | `<span>` "Based on latest pattern..." | 699 KB, 44 files | 6, **3,641 ms, worst 3,047** | 0.001 |
| /payment/initiated | 0.9 s | `<p>` "CLEAR CUTOFF" (skeleton label) | 613 KB, 36 files | 5, 926 ms, worst 309 | **0.457** |

Production "chunk 1075" (146 KB) = this build's `8991` (145 KB gzip): Next runtime 295 KB parsed +
Sentry 168 KB parsed. `main-app` is tiny (3.8 KB); the weight is in the shared chunks.

## Fixes made (no visual or functional change)
1. **`agentation` (dev-only toolbar) was in the production bundle** - 414 KB parsed / **89.8 KB gzip**,
   on every page of the dashboard AND the blog. The layout imported it statically behind a JSX
   `NODE_ENV` check, which stops it rendering but not shipping. Replaced with the module-level
   `DevAgentation` wrapper landing and tools already use (phase 1.1). Dashboard:
   `components/thirdparties/DevAgentation.tsx`; blog: `components/DevAgentation.tsx`.
   Blog not build-verified (same file, same pattern; tsc 33 = baseline).
2. **Icons barrel**: `components/ui/icons/index.ts` re-exports 44 modules (incl. a 55 KB
   illustration) and the app declared no `sideEffects`, so one shared chunk (`8091`, 41.5 KB gzip)
   went to every page. A nested `icons/package.json` with `"sideEffects": false` (the folder only
   imports React - checked) lets the bundler drop unused icons: chunk 127 -> 95 KB parsed, and
   onboarding no longer loads it at all. Icon rendering compared prod vs dev on all 5 pages:
   identical apart from the dev toolbar's own SVGs.
3. **Payment skeleton** rebuilt to the redesigned page's real geometry (header 74 / exam 195 /
   plan 404 / footer 154 at 412 px, plus the lg grid). It was still the old single-column frame, so
   swapping it for the page shifted everything: CLS 0.456, one shift at the swap. This was a
   regression from phase 55. **Not yet re-measured** (the re-measure run was cut short).

## Result (same harness, after fixes 1+2)
| Page | JS before | JS after | Change | Before-LCP JS |
|---|---|---|---|---|
| /dashboard | 755.7 KB | **686.8 KB** | **-9.1%** | 683 -> 599 KB |
| /onboarding | 579.2 KB | **451.2 KB** | **-22.1%** | 16.5 -> 16.6 KB |

LCP 5.0 -> 4.4 s on /dashboard (noisy, single runs). **The -25% target is not met yet** (dashboard
-9%, onboarding -22%). What is left on /dashboard (687 KB): Next+React 164, our code 162 (includes
~43 KB of *prefetched* other-route chunks: profile page 31, my-courses 11), Sentry 90 (Replay 37.5
lazy after idle + core 52), Amplitude 58, framer-motion+motion-dom 52, swiper 28 (Learn course
slider), radix/floating select 28 (prefetched profile page).

## Findings that need your decision (nothing below was touched)
- **D1 Amplitude browser SDK (58 KB gzip, 9-13% of the page) loads eagerly** via `AnalyticsProvider`.
  Deferring it to idle would take onboarding past -25% (451 -> ~393 KB) and dashboard to ~-17%, but
  events fired before it loads must be queued, and a visitor who leaves in the first seconds (45% are
  Facebook in-app browser) could be lost. Analytics behaviour change -> your call.
- **D2 (DONE 2026-10-27, user: "Replay sampled sessions mein")** - see "D2 result" below. Original finding: **Sentry Replay costs real main-thread time**, not just bytes. Blocking only its 37 KB chunk on
  /test-series cut the worst long task **3,047 -> 1,229 ms** and total long-task time **3,641 ->
  1,662 ms** (4x CPU). Phase 3.3 kept Replay for its size (D6); this is new runtime evidence.
  Options: keep / sample sessions only (no on-error buffering) / lower mutation limits.
- **D3 Route prefetch** pulls other pages' JS during the Learn page load (~43 KB on /dashboard).
  Extending the `useAllowPrefetch` idea from CC-146 to the nav links would trim it but makes the first
  click on a nav item slower.
- **D4 framer-motion -> LazyMotion** would save ~25-30 KB gzip with no visible change, but touches
  every animated component; needs a full animation pass.
- **#1 from speedaudit.md still stands and is the biggest LCP lever**: the server HTML is a spinner
  until the client auth effect runs, so LCP waits for JS + token + APIs on every protected page
  (dashboard 4.4 s, preparation 7.8 s). It changes the auth flow; plan separately.

## D2 result - Replay only in sampled sessions
Replay now records only a **5% session slice**, decided by us once per browser session
(`lib/sentry/replay-sampling.ts`, sticky in sessionStorage so a reload does not re-roll). Everyone
else never downloads the Replay chunk. On-error buffering is off (`replaysOnErrorSampleRate: 0`; the
init's session rate is 1.0 because only already-sampled sessions get the integration).
Measured on /test-series, prod build, Slow 4G + 4x CPU:

| | Replay chunk | JS | Long tasks | Worst long task |
|---|---|---|---|---|
| Before (everyone buffered) | loaded | 699 KB | 6 / 3,641 ms | 3,047 ms |
| **Not sampled (95% of sessions)** | **not loaded** | **561 KB** | 3 / 1,583 ms | **1,317 ms** |
| Sampled (5%) | loaded | 600 KB | 4 / 3,394 ms | 2,900 ms (cost kept only here) |

Trade-off accepted: an error outside the sampled 5% has no replay; its stack trace, breadcrumbs and
tags are unchanged. To record more/less, change `REPLAY_SESSION_SAMPLE_RATE`.

## Other measurements (recorded, not fixed - per the ticket)
- **Fonts:** already self-hosted `next/font`, `display: swap`, Devanagari `preload: false`; 35 KB on
  English pages, ~132 KB when Hindi text is present. Nothing to fix without dropping weights.
- **Long tasks:** /test-series 3.0 s = one React render callback; ~60% of it is Replay (D2), the
  rest (1.2 s) is the page's own render. /preparation worst 499 ms.
- **CLS / INP baseline** is in the table above; CLS fixes belong to CC-116 (not redone here). The
  `/preparation` 0.144 is the one to look at there.

## Verification
tsc dashboard 94 (baseline 95; generated `.next/types` removed first), blog 33; eslint clean on the
touched files; `check:colors` dashboard 427 / blog 216; prod vs dev icon counts identical.

## Decision log
| Date | Decision | By |
|---|---|---|
| 2026-10-27 | Fixes 1-3 applied (zero visual/functional change); D1-D4 and the auth-spinner LCP left for the user | - |

# Phase 17 — Sentry: load it lazily in every app, keep page-speed data

**Status:** In Review (branch sentry-lazy-loading; not merged)
**Jira:** — (asked by the user 2026-10-22)
**Repos:** CM `apps/dashboard`, `apps/blog`, `apps/landing`, `apps/tools`

## Goal
Load Sentry lazily on every web app so it doesn't slow down the first page load. Sentry must still capture page speed (Web Vitals: LCP, FCP, CLS, TTFB, INP) and errors.

## What was measured (2026-10-22)
Measured from the current builds (dashboard 20 Oct, blog/landing/tools 21 Oct). Sentry was also bundled on its own with esbuild, minified, Next/React external.

| App | How Sentry loads today | Sentry size (min / gzip) | When |
|---|---|---|---|
| Dashboard | `@sentry/nextjs` 10.67, static import, Replay + breadcrumbs + tracing (10%) | ~275 KB / **~91 KB** (without Replay ~150 / 52) | Every page, at start |
| Blog | `instrumentation-client.ts` (project root): `import("@sentry/nextjs")` right at start, only if `NEXT_PUBLIC_SENTRY_DSN` is set | 0 in the current build (no DSN) | At start, once a DSN is set |
| Landing | Same as blog, plus `lib/page-errors.ts` loads the SDK on a 404 or crash | ~452 KB / ~144 KB lazy chunk (full SDK: `import()` can't tree-shake) | Error only (DSN not set) |
| Tools | `lib/page-errors.ts`: `import("@sentry/browser")` on error only, tracing 0 | ~428 KB / ~140 KB lazy chunk | Error only, so no page-speed data |

## Why lazy loading still gets page-speed data
- Sentry reads Web Vitals through `PerformanceObserver` with `buffered: true`. Checked in the installed SDK: `@sentry/browser-utils` 10.67, `metrics/web-vitals/lib/observe.js`.
- So an SDK that loads **after** the page has loaded still receives the LCP, FCP, CLS and navigation-timing entries the browser already recorded.
- INP only counts interactions that happen after the SDK loads.
- If the SDK is loaded **only when an error happens**, no page-speed data is ever sent. That is the case for tools today, and landing until a DSN is set.

## Plan
**Dashboard (Replay lazy):**
- [x] Core Sentry stays eager, because ~40 files import `logger` / `captureException` from `@sentry/nextjs` statically.
- [x] Session Replay (~40 KB gzip) leaves the first load. It is added with `Sentry.addIntegration` once the page has loaded and the browser is idle, from its own split chunk.
- [x] Session sample (5%) and on-error sample (100%) stay the same.

**Blog and landing (SDK after load):**
- [x] With a DSN set, load and init the SDK after `load` + idle, instead of immediately. Tracing stays at `NEXT_PUBLIC_SENTRY_TRACES_SAMPLE_RATE` (default 0.1).
- [x] The 404/crash reporter (`page-errors.ts`) uses the same loader, so the SDK is initialised once, and errors before idle still load it.
- [x] Without a DSN, nothing changes: 0 bytes.

**Tools (SDK after load, with page speed):**
- [x] With a DSN set (at build time), load `@sentry/browser` after `load` + idle, with `browserTracingIntegration` (0.1). The error-only loader shares it.

**All apps:**
- [x] Shared helper `whenIdleAfterLoad(cb)` in `@clearcut/error-reporting/when-idle` (blog/landing/tools all use that package; tools has no `@clearcut/utils`). Dashboard keeps its own copy in `lib/sentry/when-idle.ts` (partial consumer).

## Decisions
| Date | Item | Decision | By |
|---|---|---|---|
| 2026-10-22 | Scope | Lazy-load on all apps, keep page-speed capture | User |
| 2026-10-22 | Dashboard | Only Replay lazy (core is statically imported across the app; making it lazy would be a large refactor) | Claude |
| 2026-10-22 | Public apps | SDK after load + idle (keeps buffered Web Vitals), not "on error only" | Claude, per the user's page-speed requirement |
| 2026-10-22 | One init | blog/landing had two inits (instrumentation-client with tracing, page-errors with tracing 0; whichever ran first won). Now `loadSentry()` in page-errors.ts is the only one | Claude |

## Risks / trade-offs
- **Dashboard:** Replay is not recording for the first ~1–3 s of a page, so an error in that window has no replay. The error itself is still captured.
- **Blog/landing/tools:** errors before the SDK loads are caught only through the 404/crash reporter (`error.tsx` / `global-error.tsx`). An unhandled `window.onerror` in the first seconds is missed. INP covers interactions after load only.
- **Tracing cost:** tracing on tools (0.1) creates new transactions in the Sentry quota once a DSN is set.

## Test plan
- [x] Builds: dashboard, blog, landing, tools. tsc on the changed files, eslint, check:colors.
- [x] Bundle check: dashboard's first-load chunks no longer contain Replay (rrweb); public apps with a fake DSN have no Sentry in first-load chunks.
- [x] Browser (local production build with a test DSN pointing at a local catcher):
  - SDK and Replay requests happen only after `load`.
  - A pageload transaction with web-vital measurements (lcp, fcp, cls, ttfb) is sent.
  - A thrown error is captured; a 404 before idle is still reported once.
- [x] Results written below, then the user checks on their side.

## Results (2026-10-22, local production builds, test DSN → local catcher, nothing sent to real Sentry)
| App | Page | `load` | Sentry SDK fetched | Page-speed data received | Test error |
|---|---|---|---|---|---|
| Landing | /hi/start | 670 ms | 789 ms (145 KB gz) | pageload: LCP 484, FCP 484, TTFB 50, CLS 0 | ✅ captured, tag app=landing |
| Blog | /hi | 470 ms | 593 ms | pageload: LCP 352, FCP 352, TTFB 75 | ✅ captured, tag app=blog |
| Tools | /tools/age-eligibility-calculator/afcat | 458 ms | 483 ms | pageload: LCP 256, FCP 256, TTFB 21 | ✅ captured, tag app=tools |
| Dashboard | /sign-in | 391 ms | core at start (unchanged); Replay chunk 454 ms (39 KB gz) | tracing unchanged (10% sample) | ✅ captured + replay_event/replay_recording (buffer mode) |

- Dashboard first-load JS on /sign-in (gzip, before `load`): **504 KB → 469 KB** (old vs new build, same machine); the 39 KB Replay chunk now comes after `load`.
- Landing/tools/blog: no Sentry SDK in any page's first-load scripts (checked in the built HTML and in the browser).
- Typecheck (all 4 apps, changed files): clean. ESLint (dashboard/landing/blog changed files): clean; tools has no ESLint config (as before). check:colors: OK. `@clearcut/error-reporting` tests: 13/13.
- Not covered: real phone / slow network; dashboard Web Vitals (its tracing sample is 10%, code path unchanged).
- Note: the local `.next` / `out` builds made for this test have the test DSN baked in — rebuild normally before using them.

# Phase 10 — CC-112: crashes on older phones and after deploys

**Status:** In Review (branch cc-112-older-phones; not merged)
**Jira:** https://clear-cutoff.atlassian.net/browse/CC-112
**Repos:** CM (landing, blog, tools, dashboard, `packages/error-reporting`), ASTRO

## Error by error (2026-10-21)

| # | Error | Finding | Proposed fix |
|---|---|---|---|
| 1 | "Failed to load chunk …" (homepage, `/hi/exam/ctet-preparation`, both **landing**) | Only dashboard has `ChunkErrorReload.tsx`. Its regex doesn't match Turbopack's "Failed to load chunk" wording. Landing's `error.tsx` only reports. | Move it to a shared package, widen the regex, call reload-once (sessionStorage guard) from window events **and** `error.tsx`/`global-error.tsx`, mount it in all apps |
| 2 | "Unexpected end of input" (ASTRO ctet page) | Not reproducible. The inline scripts are valid. | Needs a stack trace first (Phase 03 D1: turn on Sentry for go pages) |
| 3 | "t.entries.at is not a function" | Comes from `web-vitals@5` inside Amplitude's web-vitals plugin. It runs only when `autocapture.webVitals` is on. Blog and dashboard don't set `fetchRemoteConfig:false`, so remote config may enable it. ASTRO gets no Next polyfills. Browserslist alone **won't** fix it. | Set `autocapture:{webVitals:false}` + `fetchRemoteConfig:false` in every Amplitude init, and/or add a tiny `Array.prototype.at` polyfill early (root layout + Astro head) |
| 4 | "speechSynthesis is not defined" | **No** first-party usage anywhere. Probably an extension or WebView injection. | Add to the Sentry ignore list |
| 5 | "e.getBoundingClientRect is not a function" (/dashboard) | All first-party callers null-check, but none type-check. Candidates: driver.js tour (`GlobalTour.tsx:26`), swiper, framer-motion. | Guard with `instanceof Element`; needs the Sentry stack to pick the place |
| 6 | "window.webkit.messageHandlers…" | **No** first-party usage (RN uses `ReactNativeWebView.postMessage`). FB iOS in-app browser or a third-party script. | Ignore list; no code change |
| 7 | FB in-app noise | Dashboard ignore list partly covers it. `packages/error-reporting` has **no** ignore list, and landing/blog/tools `Sentry.init` set none. | Add `packages/error-reporting/src/noise.ts` (`IGNORE_ERRORS`, `DENY_URLS`) and use it in every init. Add the missing strings to dashboard `sentry-shared.ts` |

**Side finding:** landing and blog keep `instrumentation-client.ts` at the **app root** while `instrumentation.ts` is in `src/`. Per CLAUDE.md, Next may ignore root-level files with `src/app`, so their client Sentry may never run. Verify this.

## Plan
- [x] Chunk reload (#1): `@clearcut/error-reporting/chunk-reload` (`isChunkLoadError`, `reloadOnceForChunkError`, `installChunkErrorReload`). Pattern now includes Turbopack's "Failed to load chunk" and native dynamic-import wordings. Anti-loop: at most one reload per tab per 60 s (sessionStorage; no storage → no reload). Wired: blog/landing/tools `instrumentation-client.ts` (window error + unhandledrejection, no DSN needed) and the shared `reportBoundaryError` (error.tsx / global-error.tsx reload instead of reporting). Dashboard: its own `ChunkErrorReload.tsx` updated the same way (pattern + 60 s window, exported helpers) and called from its 3 error boundaries.
- [x] `.at` (#3): `fetchRemoteConfig: false` in blog and dashboard Amplitude init (landing, tools and ASTRO already had it — remote config could switch the web-vitals plugin on). Plus `applyLegacyPolyfills()` (Array/String `.at`) first thing in every app's instrumentation-client (dashboard: own copy `src/lib/legacy-polyfills.ts`). ASTRO not changed: its Amplitude already has remote config off.
- [x] Noise (#4, #6, #7): `@clearcut/error-reporting/noise` (`IGNORE_ERRORS`, `DENY_URLS`: speechSynthesis, webkit.messageHandlers, FB IAB bridge strings, Java object is gone, extensions, GTM/FB/Clarity scripts) used in blog/landing/tools `loadSentry()`; same strings added to dashboard `sentry-shared.ts`.
- [ ] `instanceof Element` guards (#5): **not done** — no stack trace (not in Sentry; public apps have no DSN, source is Clarity). Same for #2.
- [x] `instrumentation-client.ts` location: verified in Phase 17 — Next's webpack alias resolves `src/` then the app root, and the client SDK ran in the landing/blog tests.
- [!] 🛑 **D1:** after a chunk error, reload once automatically (may lose form state), or show a "new version, tap to reload" prompt?
- [!] 🛑 **D2:** the `.at` crash: turn off Amplitude web vitals, add a polyfill, or both?
- [!] 🛑 **D3:** change the browserslist target? It increases bundle size and still adds no polyfills. Recommendation: no.
- [!] ⚠️ **System impact:**
  - The shared chunk handler and noise list touch every app plus new package exports. Dashboard must be wired deliberately (partial consumer).
  - Reload-once also runs inside the RN WebView.
  - Moving `instrumentation-client.ts` turns on full browser Sentry for landing/blog (bundle trade-off).
- [ ] 📞 **C1:** RD: does anyone use Amplitude Web Vitals or remote-config autocapture?
- [ ] 📞 **C2:** RD: minimum Android/iOS versions to support.
- [ ] 📞 **C3:** RD: any GTM Custom HTML tags installed? They could be the source of `.at` and `webkit` calls.
- [ ] 📞 **C4:** RD/owner: Sentry or Clarity stack traces for #2 and #5.
- [ ] Verify: simulate a missing chunk (delete one chunk from a local build → one reload, no loop). Run an old Chrome via BrowserStack if available. Run tsc and eslint.

## Decision log
| Date | Item | Decision | By |
|---|---|---|---|
| 2026-10-22 | D1 | Reload once automatically (anti-loop: one per 60 s per tab) | User |
| 2026-10-22 | D2 | Both: Amplitude remote config off (blog, dashboard) + `.at` polyfill | User |
| 2026-10-22 | D3 | No browserslist change (it adds no polyfills) | Claude (doc recommendation) |
| 2026-10-22 | Noise | Shared ignore list in every app | User |
| 2026-10-22 | Tests | `@clearcut/error-reporting` 18/18 (5 new: chunk patterns, reload anti-loop, no-storage, polyfill). Playwright on a local landing production build: with `Array/String.prototype.at` deleted before load, the polyfill restored them and the page had 0 errors; with every new chunk 404 after load (stale deploy), a client navigation reloaded once and landed on the page, no loop over 16 s. Typecheck clean in all 4 apps; ESLint: no new problems (dashboard's 3 are old `any`s). Sentry search found none of the ticket's errors (they come from Clarity on public pages) | Claude |

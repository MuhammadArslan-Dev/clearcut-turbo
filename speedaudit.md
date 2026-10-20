# Dashboard speed audit (app.clearcutoff.in)

**Status:** ON HOLD (audit done 2026-10-20, nothing fixed yet). Read-only audit — no code was changed.
**Scope:** `apps/dashboard` routes `/preparation/[id]`, `/test-series/[id]`, `/exam/[...]`, `/[id]/content/notes`.
**Yardstick:** Vercel React best-practices skill (`vercel-react-best-practices`, rule ids below).

---

## 1. Field data (Microsoft Clarity, last 3 days, captured 2026-10-19)

Filter: `app.clearcutoff.in/(hi/)?(preparation|test-series)/*` — 235 sessions.

| Metric | Value | Google "good" |
|---|---|---|
| Performance score | 45/100 (62% of pageviews "poor") | — |
| LCP | 4.9 s | < 2.5 s |
| INP | 380 ms | < 200 ms |
| CLS | 1.1 | < 0.1 |

Worst individual URLs:

| URL | LCP | INP | CLS |
|---|---|---|---|
| `/test-series/<id>`, `/preparation/<id>` | 9–12 s | 1.3–6 s | 0.7–2 |
| `/exam/EXAM-…` | 5.2 s | 5 s | 1.5 |
| `/<id>/content/notes` | 9.3 s | 1.4 s | 0.65 |

Audience: 45% Facebook in-app browser, 38% Chrome Mobile, 13% Instagram in-app browser (mostly low/mid Android phones).

---

## 2. Findings (ranked by likely impact)

Paths are relative to `apps/dashboard/src/components/` unless they start with `providers/`, `hooks/`, `app/` or `instrumentation-client.ts` (those are under `apps/dashboard/src/`).
✅ = re-checked in code by hand; others are from the audit report with file:line evidence.

| # | Metric | Cause | Code | Minimal fix | Rule |
|---|---|---|---|---|---|
| 1 ✅ | LCP | Server HTML is only a spinner: `ProtectedPage` returns `FullScreenLoader` until a client effect sets `tokenReady`. Content waits for JS → hydration → token effect → shell → chained API calls. | `features/auth/ProtectedPage.tsx:50`, `providers/AuthProvider.tsx:55,114` | Read the `auth_token` cookie on the server (layout) and pass `initialTokenReady`, so shell + skeletons are in the HTML. Later: prefetch syllabus/test list on the server + `HydrationBoundary`. | async-suspense-boundaries, rendering-hydration-no-flicker |
| 2 ✅ | CLS, INP | Mobile "hide header on scroll" animates real layout (`height`, `width`) every animation frame via React state. Scroll is not user input, so every frame counts toward CLS. Present on preparation, test-series and notes (the 3 high-CLS routes). | `layout/preparation/Topbar.tsx:69-72` (same in testSeries Topbar), `hooks/useScrollHideOffset.ts:52-54`, `PayWalls/PaywallFloatingWidget.tsx:86-87`, `BottomPageSwitchReveal.tsx:41` | Animate only `transform`/`opacity` (overlay header, or CSS scroll-driven animation); keep the offset in a ref / CSS variable, not React state. | rerender-use-ref-transient-values, js-batch-dom-css |
| 3 | INP | The same scroll offset is state on the 871-line preparation Sidebar and the shells, so they re-render every scroll frame. | `layout/preparation/Sidebar.tsx:144-151`, `TestSeriesShell.tsx:77`, `ContentShell.tsx:85` | Same as #2 — move the offset out of these components. | rerender-use-ref-transient-values |
| 4 ✅ | INP (exam) | Exam timer updates state every second and re-renders the whole question; `ReactMarkdown` (rehype-raw + sanitize) re-parses question + 4 options; `React.memo(QOption)` is defeated by inline object props. | `features/exam/pages/mainContent.tsx:132`, `useExamTimer.ts:67-68`, QOption props `mainContent.tsx:440-457` | Put the timer in a small child component (or ref + expire callback); memo `TextMarkDown` on its string; pass stable props to QOption. | rerender-memo, rerender-split-combined-hooks |
| 5 | LCP | Default `testType` is set in an effect (list renders nothing until then); `router.replace` on a dynamic route triggers a server request. | `TestSeriesShell.tsx:64-68`, `testListPage.tsx:120-130`, `ChapterTest.tsx:142-146`, `exam/ExamShell.tsx:30-32`, `providers/AuthProvider.tsx:103` | Derive the default (`get("testType") ?? "chapter-tests"`); use `window.history.replaceState` for URL-only changes (as `preparationPage.tsx:136` already does). | async-dependencies |
| 6 | LCP | Test list `useQuery` lives inside a `dynamic(..., { ssr:false })` chunk with no `loading`, so the fetch waits for the chunk download. | `testListPage.tsx:30-32`, `ChapterTest.tsx:78` | Hoist the `useQuery`/`prefetchQuery` into TestListPage, or import the default tab statically. | async-dependencies, bundle-preload |
| 7 | LCP | Syllabus result is copied into the store in an effect → sets `selectedSectionId` → only then the chapters query starts (2 serial requests + extra renders). | `usePreparationData.ts:240-244`, `usePreparationDataStore.ts:291-315` (`hydrateFromApi`), `useChapterData.ts:20` | Start the chapters request from the syllabus `queryFn` (or `?section=`), or have the API return the first section's chapters. | async-dependencies, rerender-derived-state-no-effect |
| 8 | LCP, INP | YouTube iframe API + player created on mount; on mobile the content panel is mounted off-screen, so the player loads even when only the chapter list is visible. | `MainVideo/VideoCard.tsx:78-93`, `PreparationShell.tsx:165-175` | Thumbnail (with width/height) first, create the player on tap. | bundle-defer-third-party |
| 9 ✅ | INP, LCP | Sentry `replayIntegration` bundled eagerly; `replaysOnErrorSampleRate: 1.0` buffers DOM mutations in every session. | `instrumentation-client.ts:30,52` | `Sentry.lazyLoadIntegration` for Replay, or lower the on-error rate. | bundle-defer-third-party |
| 10 | CLS | Components render nothing until data arrives, then appear above content: paper switch, area tab, sections tab. | testSeries `PaperSwitch.tsx:37`, `AreaTab.tsx:22` → `Sidebar.tsx:413-417`, `SectionsTab.tsx:88-94` | Reserve a fixed-height slot / same-height skeleton while loading. | rendering-conditional-render |
| 11 | CLS | `hydrateFromApi` sets `loading:false` before chapters/topic exist: aspect-video skeleton → `null` (collapse) → video. | `VideoWrapper.tsx:133-157`, `RelatedContentWrapper.tsx:332-361` | Keep the skeleton while `!selectedTopic`. | rendering-conditional-render |
| 12 | LCP | Notes: children held back until syllabus loads, so section-notes and `useGetCurrentCourse` start a round trip later; `staleTime` commented out. | `ContentShell.tsx:49,128-134`, `notes-page.tsx:10`, `section-notes.tsx:43` | Render children with skeletons, reserve the tab-bar height. | async-dependencies |
| 13 | CLS (exam) | Question/option markdown `<img>` has no width/height (DB stores bare `<img src=…>`), options jump when images load. | `ui/widgets/TextMarkDown.tsx:~70` | `components={{ img }}` override with a fixed box / `aspect-ratio`. | — (images need dimensions) |
| 14 | CLS (exam) — hypothesis | Timer-strip slot switches `<Tip/>` → `SectionsTab` after load; `LanguageToggle` returns `null` then appears. | `layout/exam/TimerStrip.tsx:85-99`, `exam/Topbar.tsx:49,133` | Confirm with web-vitals attribution (`largestShiftTarget`), then fix the slot height. | rendering-conditional-render |

### Other observations
- `page.tsx` files are server components, but each renders a fully client tree (`preparationPage`, `testListPage`, `mainContent`, `notes-page` are `"use client"`). Combined with #1, the LCP element exists only after JS + APIs.
- Statically imported: framer-motion (`PreparationShell` — only for the mobile slide —, `RelatedContentWrapper`, `mainContent`), katex + react-markdown + rehype-raw on `/exam`, Amplitude (`lib/analytics/browser.ts`). Modals are already lazy.
- GTM and Clarity load on first click, so that click's work also counts toward INP. Their `scroll` trigger never fires because the window itself doesn't scroll in these layouts.
- The auth gate no longer waits for `/v1/auth-user` (2.6–4.2 s), only for the client token effect; the gate is `position: fixed`, so swapping it out doesn't itself cause CLS.

### Not verified
- Each item's share of CLS — record a DevTools Performance trace (Layout Shifts track) while scrolling on a mobile viewport to confirm #2.
- Real API latencies, and whether the backend serializes requests per session.
- JS bundle sizes (no `ANALYZE=true` / `next build --profile` run).
- `ExamSkeleton` height vs. real exam content.
- Assumes the field data reflects the build that already includes the 2026-09 `useIsMobile` / katex CLS fixes.

---

## 3. Suggested order when resuming

1. **#2 + #3** — scroll-hide header: `transform`/`opacity` only, offset in ref/CSS variable (biggest CLS + INP win, small isolated change).
2. **#4** — exam timer isolation + markdown memo.
3. **#9, #8** — lazy Sentry Replay; YouTube thumbnail-then-player.
4. **#5, #6, #7, #12** — remove fetch waterfalls (derive defaults, hoist queries, start chapters with syllabus).
5. **#10, #11, #13, #14** — reserve space / skeletons / image dimensions.
6. **#1** — server-side token check + server prefetch. Largest LCP win but touches the dashboard auth flow (token handoff from another host, cookie + localStorage — see root `CLAUDE.md` "Dashboard is a partial consumer"); plan and test separately.

**Verify after each step:** Lighthouse mobile + DevTools Performance (Layout Shifts, Interactions) locally; after deploy, compare the Clarity URL performance for the same routes (LCP / INP / CLS) over 3–7 days.

---

## 4. Related Clarity findings (same session, for context)

- **Dead clicks (53% of sessions):** concentrated on the Tools resizer (`/tools/resizer/tnpsc`, `/tools/resizer/canara-bank`). Fixed locally, not deployed: "Image Requirements" tiles made plain text; tapping the optimized result image downloads it (`apps/tools/src/components/ResizeImageTool.tsx`). Upload-box dead taps are Clarity not seeing the native file picker (not a bug). Other pages are minor: `/hi/go/exam/ctet-preparation` 45 dead taps / 524 views, `/payment/initiated` 14 / 203, `/hi/start` 0.
- **JavaScript errors (75):** 81% "error invoking postmessage: java object is gone" (53 sessions) and "script error." (6 sessions) occur only in the Facebook/Instagram in-app browsers, mostly on `/hi/go/exam/*` (Astro go-marketing repo). Likely the in-app browser's own bridge, not our code — unverified (Clarity shows no stack trace). Remaining 3 errors not inspected.

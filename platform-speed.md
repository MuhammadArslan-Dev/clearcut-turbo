# Platform speed — tracker

Speed work across all four apps: **dashboard** (app.clearcutoff.in), **blog**
(academy.clearcutoff.in), **landing** (clearcutoff.in), **tools**
(clearcutoff.in/tools). Yardstick: Vercel React best-practices skill
(`vercel-react-best-practices`, rule ids in brackets). Dashboard evidence and
field data: `speedaudit.md`. Blog/landing/tools: read-only audits 2026-10-20.

## Rules for this work

1. **Design and existing functionality must not change.** Every fix keeps the
   same look and behaviour.
2. **Stop and discuss** whenever a fix might affect design or functionality.
   No action on it until the user decides. Those items live under
   "Needs decision" below.
3. A phase is marked **done** only after its test passes (see "How each phase
   is tested"). Each item gets ✅ when done and tested, ⏸ when parked for a
   decision, ❌ when dropped.
4. Work happens on the `blog_seo` branch (user's decision). Nothing is
   committed or pushed without the user's approval.

## How each phase is tested

- `pnpm test`, typecheck (no new errors vs. the baseline counts below) and
  lint on the changed files.
- Local production build of each touched app (`next build` + `next start`),
  then in Chrome: LCP, CLS and long tasks recorded with PerformanceObserver,
  and JS/HTML bytes, **before vs. after**.
- Screenshots before vs. after (desktop and 390px mobile) to confirm the
  design is unchanged; the affected flows are clicked through.
- Baselines (2026-10-20): typecheck errors — blog 33, dashboard 113,
  landing 0 (excl. generated `.next/dev`), tools 0.

Landing's production build reads Payload CMS at build time (`CMS_URL`); a
reachable CMS is needed for its before/after measurements.

---

## Phase 0 — Dashboard scroll re-renders (done before this tracker)

- ✅ **0.1 Dashboard** — scroll-hide offset moved out of React state; shells,
  Topbars and their tabs no longer re-render per scroll frame
  (`hooks/useTopbarScrollHide.ts`). [rerender-use-ref-transient-values]
  Tested in Chrome (390px + desktop, preparation / test-series / notes):
  behaviour identical, no console errors. Speedaudit #3 + INP part of #2.

**Status: ✅ done (2026-10-20)**

## Phase 1 — Biggest, zero-visual wins

- ✅ **1.1 Landing + tools** — `agentation` (dev-only toolbar) shipped to
  production on every page. Now `components/(global/)DevAgentation.tsx` with a
  module-level `NODE_ENV` check, so prod builds drop the `import()`.
  [bundle-conditional, bundle-dynamic-imports]
  Result: agentation in prod JS 102 KB → 0 (landing), 95.6 KB → 0 (tools).
- ✅ **1.2 Landing** — removed `experimental.inlineCss` (kept `optimizeCss`).
  [server-serialization] Result (home): HTML 698 → 196 KB, RSC 459 → 80 KB;
  `/start` HTML 501 → 40 KB; local FCP/LCP 616 → 252 ms, CLS 0. Screenshots
  (home top + 2 scroll positions, `/exam/ctet-preparation`, `/start`):
  identical design, below-the-fold styles load fine.
- ✅ **1.3 Landing** — footer now receives only `{id, slug, competitorName,
  hero.title}` per alternative (prop kept for the planned footer links).
  `FooterWrap.tsx` [server-serialization]
- ✅ **1.4 Landing** — removed the unused `ReactQueryProvider` (nothing on
  landing uses React Query). `layout.tsx` [bundle-conditional]
- ✅ **1.5 Blog** — pre-paint inline script (`COUNTDOWN_ENDED_SCRIPT`) marks
  `<html data-offer-ended>`; `globals.css` hides `[data-countdown-banner]`.
  [rendering-hydration-no-flicker] Tested: ended offer → banner never painted,
  CLS 0 (live old code: 1 shift, 0.019 on desktop); active offer → banner
  shows and counts (07:55); first visit → banner shows 09:55.

Total JS per page (gzip), before → after: landing `/` 479 → 381 KB,
`/start` 447 → 349 KB; tools resizer 405 → 315 KB, age calculator 323 → 232 KB.
Tests: blog 205/205, landing 31/31, tools 13/13. Typecheck: blog 33 / landing
0 / tools 0 (= baseline). Lint: no new findings (3 pre-existing).

**Status: ✅ done (2026-10-20)**

## Phase 2 — LCP

- ✅ **2.1 Tools** — `FadeIn` is now the CSS keyframe `.cc-fade-in` (same
  0.5s / ease-out / 14px, `delay` → `animation-delay`, `backwards` fill,
  reduced-motion off). `components/motion.tsx`, `app/globals.css`
  [rendering-hydration-no-flicker] Result (`/tools/resizer`, local desktop):
  server HTML had 3 hero blocks at `opacity:0` → 0; LCP 376 → 136 ms (hero
  H1 had waited for hydration). Screenshots identical.
- ✅ **2.2 Tools** — `<AnimatePresence mode="wait" initial={false}>` around
  "Image Requirements". Tested: first render opacity 1; Photo → Signature
  still fades out/in (~150 ms) and shows 140×60.
- ✅ **2.3 Blog** — post hero `<img fetchPriority="high">`; featured cover no
  longer `loading="lazy"` + `fetchPriority="high"`. [rendering-resource-hints]
  Code-only check: local CMS posts have no cover images, so not seen in a
  browser.
- ✅ **2.4 Landing** — `/start`: `sizes="(max-width: 767px) 1px, 60vw"` (the
  preload now carries it; desktop unchanged).
- ✅ **2.5 Landing** — `/exam/*`: testimonial avatars no longer `priority`
  (2 image preloads → 0); avatars still load on scroll.
- ✅ **2.6 Landing** — `/exam/*`: SocialProofStack renders its 36px row from
  the server (empty until the first name). Tested at 390px: hero list top
  166px with JS off (server HTML) and after hydration — no jump (old: row
  missing in server HTML, list moved 34px). CTET has no social-proof data →
  no row, as before.
- ✅ **2.7 Landing** — `/teaching/[slug]`: `generateStaticParams` (course
  slugs) + `dynamicParams = true`. Build: ● pre-rendered; response
  `x-nextjs-cache: HIT` (was `no-store`, rendered per request). Unknown slug
  → 404 as before (`CoursePage` calls `notFound()`); `/hi/teaching/ctet` 200.
  No `revalidate`: the data is code (`lib/data`), it changes only on deploy.
- ❌ **2.8 Landing** — dropped. `next/font` decides preload per layout file,
  not per locale, and all three locales share one root layout; a manual
  `<link rel=preload>` would need the hashed font file names that change
  every build.

Tests: blog 205/205, landing 31/31, tools 13/13. Typecheck = baseline
(33 / 0 / 0). Lint: no new findings on changed lines. Colours: no new
(landing 109 → 108).

**Status: ✅ done (2026-10-20)**

## Phase 3 — Third-party scripts and bundle

- ✅ **3.1 Blog** — `services/analytics.js` loads the SDK with a dynamic
  import; every call chains on one promise (order kept). Init NOT moved to
  idle: it still runs in InitAmplitude's effect right after hydration, so no
  page views are lost from quick bounces. [bundle-defer-third-party]
  Result: JS per page (gzip) 501 → 441 KB (`/`, `/ctet`, `/ctet/paper-1`,
  `/ctet/blog`). Chrome: SDK chunk loads, `api2.amplitude.com/2/httpapi`
  POST 200, no console errors.
- ❌ **3.2 Tools** — dropped. The SDK is already its own chunk, imported in
  an effect after hydration (`toolsAnalytics.ts`). Only "wait for idle" was
  left, which would drop "Page Viewed" for visitors who leave in the first
  seconds — a data change for a small gain.
- ❌ **3.3 Dashboard** — Sentry Replay is **~39 KB gzip on every page**
  (root main JS 253.5 → 214.6 KB without it; measured by building once with
  the integration removed, then restored). User decided (D6, 2026-10-20):
  keep it as is, so errors in the first seconds still get a replay.
- ◐ **3.4 Landing** — done the two zero-risk parts:
  - `useScrollShadow` (`packages/hooks`, used by blog + landing headers) is a
    passive scroll listener instead of framer's `useScroll`. Tested: no
    shadow at top, `shadow-md` after scrolling, gone again at top.
  - `ButtonShimmerOverlay` is a CSS keyframe (`.button-shimmer`, same
    -150% → 150%, 3s linear, infinite). Tested: ~80px per 400ms on a 200px
    button = same speed.
  D7 results (user decisions 2026-10-21):
  - ✅ `LogoCarousel` → CSS keyframe `.logo-marquee`, kept. It now loops after
    exactly one logo set (D9: "smooth karo") — `--marquee-shift` = measured
    start of 2nd set − start of 1st (server estimate: logos × 144px).
    Tested: 60.5 px/s; animation paused at its last ms and at 0 shows the
    identical frame (every logo on the same pixel) → no jump. Pause on
    hover/touch, reduced-motion off. No JS per frame any more.
  - ❌ CTA hover → CSS: built, then reverted to framer (user: no KB gain, so
    no risk). `ContinueFreeButton.tsx` is back to HEAD.
  **Finding:** framer does NOT leave any landing page with these changes —
  `@clearcut/auth`'s `create-auth-feature.tsx` statically imports
  `screens/inline-auth-flow.tsx` (framer), and every page imports
  `lib/auth`. See D8.
- ✅ **3.5 Landing** — removed 3 unused imports from `CoursePage.tsx`.

Tests: blog 205/205, landing 31/31. Typecheck: blog 33 / landing 0 / hooks 0.
Lint: no new findings. Colours: no new.

**Status: ✅ done (2026-10-21)** — 3.2 dropped, 3.3 kept as is (D6), CTA
hover reverted (D7). Follow-up D8 (plan below) is open.

### D8 plan — take framer off landing pages that don't need it

What pulls framer onto every landing page: `packages/auth/src/create-auth-feature.tsx`
line 8 imports `createInlineAuthFlow` statically. The login modal's screens
are already `next/dynamic` (`auth-modal.tsx`); only `InlineAuthFlow` is not.
On landing it is rendered in exactly one place: the onboarding result step
(`components/features/onboarding/components/result-step.tsx:46`), a client
step shown after the quiz.

Change: in `create-auth-feature.tsx`, build `InlineAuthFlow` with
`next/dynamic(() => import("./screens/inline-auth-flow").then(m =>
m.createInlineAuthFlow({...})), { ssr: false })`. Also used by blog (its
header keeps framer anyway) — tools uses its own lazy feature.

Expected effect: framer (45.6 KB gzip) leaves pages whose other components
don't use it (`/start`, `/teaching/*`, `/contact-us`, policy pages, …);
`/`, `/exam/*`, `/faq` keep it (FAQs, reviews, marketing page). Not measured
yet — two measurement builds ran out of machine memory (see log).

Risk: on the onboarding result step the form would appear after a small
chunk loads (blank for that moment). Mitigation: start the import when
onboarding opens (preload), so it is ready by the last step.

Test: build + per-page framer bytes; onboarding run-through to the result
step (form shows, OTP send/verify on localhost test account); blog build.

## Phase 4 — Server waterfalls (TTFB)

- ✅ **4.1 Blog post** — exam id resolved once; post + related list fetched
  together (`Promise.all`), metadata's post + Hindi-slugs too; related list
  `limit: 100 → 4` (3 newest other than this one need at most 4). Unused
  prev/next computation removed (its ArticlePager is commented out — note in
  code). [async-parallel] Tested: related = the same 3 posts the CMS returns
  for "3 newest except this one"; `/hi` post 200; unknown slug 404;
  canonical + hreflang unchanged.
- ✅ **4.2 Blog listing** — `toCardPost()` (`lib/blog/card-post.ts`) passes only
  the fields the cards read. [server-serialization] Result `/ctet/blog`: HTML
  237 KB → 71 KB, no `content_html` in the payload; all 8 posts still in the
  payload (1 featured + 6 shown + 1 behind "Load more"); search uses
  title + excerpt, both kept.
- ✅ **4.3 Blog** — level, subject and chapter pages start their data fetches
  alongside the exam-index check instead of after it. [async-defer-await]
  Tested: level page 6 subject + 5 year links; bad level 404; subject page
  200 (bad level 404); chapter 200 with 200 cards; chapter under the wrong
  paper → 308 to the right one; unknown chapter 404; `/hi` chapter 200.
  Trade-off: a 404/redirect chapter URL now also asks the backend for that
  chapter (cached, 3600s). Also removed a dead `baseUrl` constant/check in
  the level page. Note: the subject listing page's server HTML has subject
  names but no links — same on production, pre-existing.
- ◐ **4.4 Dashboard**
  - ✅ #5 (render part) — `testListPage` renders `testType ?? "chapter-tests"`
    right away instead of nothing until the shell's `router.replace` lands.
    The shell's URL effect and the report-modal effect are untouched (the
    `history.replaceState` half of #5 was NOT done: that is the code path of
    the documented report-modal race).
  - ✅ #6 — chapter-test list query prefetched by `testListPage` (same key/fn
    via new `components/tests/chapterTestQuery.ts`, also used by
    `ChapterTest`) so it no longer waits for the ChapterTest chunk.
    Tested (local dev, test account): bare `/test-series` → chapter tests
    render, URL gets `testType`, one list request, starting together with
    `get-course` (the page's first data request); Chapter → Sectional →
    Full-length → Chapter all work, no console errors.
    **Unexplained, not reproduced:** in one run the page moved by itself to
    `/preparation/...?section&chapter&topic`; three later runs (1× HEAD
    code, 2× new code, 20s each) stayed put. Later the same Chrome tab was
    seen on another preparation topic with no action of mine, so the tab
    was most likely in use by someone at that time. Ask the user to check.
  - ❌ #7 — not done (D10: user, 2026-10-21: leave it; real fix is backend).
  - ✅ #12 (alternative, D11) — the spinner gate in `ContentShell` stays
    exactly as is (it exists to stop the tab row pushing content down; a
    skeleton couldn't know the tab row's final 0/1/2-row height). Instead the
    shell prefetches the page's current-course query (shared
    `currentCourseQueryOptions` in `hooks/course/useGetCurrentCourse.tsx`)
    alongside the syllabus. The notes list itself needs the section id from
    the syllabus, so it can't start earlier either way. Tested (dev, test
    account): notes + papers pages — `get-course` now starts with
    `get-sections` (2613 vs 2612 ms; before: only after the syllabus
    resolved and the page mounted), one request, pages render the same, no
    console errors.

Typecheck: blog 33 (baseline), dashboard 94 (< 113 baseline, none in changed
files). Tests: blog 205/205. Lint: no new findings on changed lines.

**Status: ✅ done (2026-10-21)** — #7 left for a backend fix (D10).

## Phase 5 — INP (responsiveness)

- ✅ **5.1 Dashboard** — `useExamTimer` (1s countdown + 60s heartbeat +
  auto-submit) moved into a null `<ExamTimerWatcher>` rendered first in both
  of `MainContent`'s returns (fragment, so the same instance survives
  skeleton ↔ content); its unused `remaining` re-rendered the whole question
  every second. `TextMarkDown` is `React.memo` (pure on its string).
  [rerender-memo] Tested (dev, local in-progress full-length attempt):
  `MainContent` renders in 10s idle — HEAD 20 (10 ticks × StrictMode) →
  0; heartbeat still sent; no `end-exam` call. Limits: the local backend's
  `get-exam` returns 500 (`ExamResourceNew.php:39`, local data), so the
  question body itself couldn't be shown locally; local `create-exam` for
  chapter tests 404s ("Chapter not found", same on HEAD code). QOption
  stable props not done (the costly part, markdown, is now memoized).
- ✅ **5.2 Tools resizer** — the upload is decoded once and reused
  (`decodeFile`, one-entry cache, same `<img>` decode path so EXIF handling
  is unchanged; the old object URL is revoked when a new file comes in).
  [js-cache-function-results] Tested in Chrome: Apply decodes once; two
  slider changes re-render the output (16 → 23.3 KB) with no new decode;
  a second file decodes fresh and the result shows the new image; no
  console errors. Signature pad / crop drag NOT changed: the pad does no
  layout write between moves (no forced layout), and caching the crop
  container's rect would break dragging if the page scrolls mid-drag.
- ✅ **5.3 Shared `useIsMobile`** — `useSyncExternalStore` + one shared
  `matchMedia('(max-width: 767px)')` listener (same test as
  `innerWidth < 768`; `change` fires only on crossing 768px; Safari < 14
  `addListener` fallback). Server/hydration value still `false`.
  [client-event-listeners] Tested on a blog chapter page: desktop footer
  shows the number, 390px shows "Phone"; live 390 → 900 → 390 switches both
  ways; no hydration/console errors.
- ✅ **5.4 Landing** — `useActiveStep`: effect keyed on the joined ids (was
  re-subscribing on every step change), passive listener, at most one update
  per frame (rAF); same distance rule. [client-passive-event-listeners]
  Tested: scrolling to step 1 → 2 → 3 → 1 highlights each in turn.
- ✅ **5.5 Tools** — age calculator clamps month/day in the year/month
  change handlers (new `lib/dobSelection.ts` `clampDob`, date helpers moved
  there), not in two effects. [rerender-move-effect-to-event] Unit-tested
  (`dobSelection.test.ts`, 5 tests: month length, leap year, empty parts,
  18-years ceiling). Not clicked through in Chrome — the browser renderer
  froze under low machine memory (~1 GB free).

Tests: blog 205/205, landing 31/31, tools 18/18. Typecheck: blog 33 /
dashboard 94 / landing 0 / tools 0 / hooks 0. Lint: no new findings.

**Status: ✅ done (2026-10-21)**

## Phase 6 — CLS (reserve space)

- ◐ **6.1 Dashboard — results after D12–D14 (user: build, then show)**
  - ❌ D12 paper-tab skeleton (preparation `PaperSwitch`): built, measured,
    reverted. At 390px load CLS went 0.33 → 0.84 — on phones the reserved
    row appears and then goes away again. Test series has no reliable
    "loading" flag (`papers` stays `null` on an empty/failed response), so
    it was not touched; `AreaTab` skipped (most sections have no areas, so
    reserving would add a shift).
  - ✅ D13 video skeleton (`VideoWrapper`): `loading || !selectedTopic` →
    skeleton. Desktop load CLS HEAD 0.0166 / 0.0197 → 0.0132 / 0.0167
    (the 0.007 video-area shift is gone); 390px unchanged (0.333 both — the
    topic is picked from the URL at once here). Small, kept as the user chose.
  - ❌ D14 exam image box: built, then reverted (CSS + class removed). Inline
    images exist in only 72 of 60,289 question rows (~0.12%) and 4 option
    sets, and they are screenshots 541×369 … 1198×564: a 160px-high box
    would show them ~216×160 instead of ~700×518 (desktop) / ~360×267
    (390px) — hard to read. Not worth it.
  - #14 not attempted (needs field attribution data).
- Earlier analysis, kept for reference — every item changes what shows while loading:
  #10 paper/area tabs (`PaperSwitch`, `AreaTab`) render only when there are
  2+ — the final height (0 or 1 row) isn't known before data, so a reserved
  slot can itself be wrong; #11 `VideoWrapper` returns `null` between
  "loading done" and "topic selected" (skeleton → nothing → video) — keeping
  the skeleton would also show it forever for a course with no topics; #13
  exam markdown `<img>` has no width/height in the DB — reserving space needs
  a fixed box/aspect-ratio, which changes how images look; #14 is still a
  hypothesis (needs `largestShiftTarget` field data). See D12–D14.
- ✅ **6.2 Tools (D15)** — `TrackerLoadingSkeleton` while `step ===
  "loading"` (server HTML included), sized from the real first screen
  measured at 390px and desktop (account bar 36, stepper 74/78, heading
  178/90, search 91/42, then the picker's own 6-card loading grid).
  Measured (footer position, server HTML → after hydration): desktop
  1047 → 1339 (292px) became 1071 → 1339 (268px); 390px 1155 → 2411
  (1256px) became 1856 → 2411 (555px). The rest is the exam list growing
  past the picker's own 6-card skeleton (unchanged). The footer is below
  the first screen either way, so the CLS-score gain is small; the page is
  no longer blank while loading. Returning visitors (tracked list) get the
  same skeleton, then the list.
- ✅ **6.3 Landing (D16: "render always")** — `LazySection` renders its
  section right away (same wrapper div, no `content-visibility`, so nothing
  is clipped). Prod build, home page: CLS while scrolling the whole page
  **0.917 → 0** (page height 2823 → 4231 while scrolling before; constant
  5163 after); HTML 201 → 270 KB (FAQ/pricing content now in it; 5 empty
  400px boxes → 0); `/#pricing-section` now lands on pricing (heading 48px
  under the header) — before, the id wasn't in the page at load and it
  stayed at the top; blocking time on load 8 → 20 ms; no console errors;
  FAQ (desktop) and pricing (390px, shadow intact) screenshots unchanged.
  (`content-visibility:auto` was tried first and dropped: at 390px it clips
  the pricing card's shadow ~8px and the step circles' shadows 3–12px.)
- ✅ **6.4 Landing `/start`** — the Truecaller block renders only after
  hydration (`useHydrated()` = `useSyncExternalStore`, false on the server
  and during hydration). It read UA/URL/localStorage during render, so on
  Android Chrome the first client render didn't match the server HTML and
  React re-rendered the whole form on the client. The button already
  appeared only after hydration, so nothing visible changes.
  Tested: `/start` renders, no console errors (desktop — the mismatch itself
  only happens on Android Chrome, so it couldn't be reproduced here).
  Landing tests 31/31, typecheck 0.

Tests: tools 18/18, landing 31/31. Typecheck: tools 0, landing 0,
dashboard 94 (baseline). Lint: no new findings. Colours: no new.

**Status: ✅ done (2026-10-21)** — D12 and D14 measured worse / harmful and
reverted; #14 left (needs field data).

---

## Needs decision (no action until the user decides)

| # | Item | Why it needs a decision |
|---|---|---|
| D1 | Dashboard scroll-hide header overlay (speedaudit #2 CLS, "step 1B") | Scrolling up mid-list, the header covers the list instead of pushing it down. Parked by the user 2026-10-20. |
| D2 | Dashboard server-side token check (speedaudit #1, largest LCP win) | Touches the dashboard login / token-handoff flow. Needs its own plan and testing. |
| D3 | Dashboard YouTube player created on tap (speedaudit #8) | Shows a thumbnail first; the player appears on tap. |
| D4 | Blog: remove the unused Emotion provider | Deliberately deferred to a separate milestone in the code. |
| D5 | Facebook pixel on every page | Business requirement; left alone. |
| D6 | Dashboard: load Sentry Replay after page load (Sentry CDN `lazyLoadIntegration`) — saves ~39 KB gzip per page | **Decided 2026-10-20: keep as is.** |
| D7 | CTA hover / logo carousel → CSS | **Decided 2026-10-21:** carousel CSS (kept), hover back on framer. |
| D8 | Landing: lazy-load `InlineAuthFlow` in `@clearcut/auth` (plan under Phase 3) | Shared login package; onboarding result-step form loads a chunk first. User asked for the plan before deciding. |
| D10 | Dashboard preparation (#7): the chapters request waits for the syllabus → store effect → section id. Fix: prefetch the first section's chapters inside the syllabus `queryFn` | Still 2 serial requests (the real fix needs the API to return the first section's chapters); saves only the effect/render gap. Touches the preparation store flow. **Decided 2026-10-21: leave it.** |
| D11 | Dashboard notes (#12): render the notes children with skeletons while the syllabus loads (reserve the tab-bar height) | **Decided 2026-10-21:** no skeleton (only one request would gain, with a layout-shift risk); prefetch the current-course query instead, spinner unchanged. |
| D12 | Dashboard #10: reserve one tab-row height for paper/area tabs while loading | **Decided: try → measured worse (390px CLS 0.33 → 0.84), reverted.** |
| D13 | Dashboard #11: keep the video skeleton while no topic is selected | **Decided: done** (small desktop gain; a course with no topics keeps the skeleton). |
| D14 | Dashboard #13: give exam question/option images a fixed box or aspect ratio | **Decided: try → reverted** (images ~3× smaller, hard to read; only ~0.12% of questions). |
| D15 | Tools syllabus tracker: show a skeleton instead of nothing while it decides which screen to show | **Decided: done.** |
| D16 | Landing `LazySection`: real HTML for below-the-fold sections | **Decided 2026-10-21: render always (no content-visibility) — done.** |
| D9 | Landing logo carousel jumped half a copy every ~32s (wrapped at 1.5 of 3 copies) | **Decided 2026-10-21: fixed** (loops after one set). |

## Log

- 2026-10-20 — Audits done for all four apps; tracker created. Phase 0 done.
- 2026-10-20 — Phase 1 done and tested (local prod builds of landing, tools,
  blog; Chrome before/after). Note: landing's `next build` failed on a
  corrupted generated `.next/dev/types` (written by the running dev server);
  cleared it — the dev server regenerates it.
- 2026-10-20 — Phase 2 done and tested (tools old/new static exports served
  side by side on 3061/3062; landing + blog local prod builds). 2.8 dropped.
- 2026-10-21 — Phase 3 done (3.1, 3.4 partial, 3.5; 3.2 dropped; D6 keep,
  D7/D9 decided). D8 measurement builds failed with "Fatal process out of
  memory" (~2 GB free, 29 node processes incl. the user's dev servers);
  `create-auth-feature.tsx` restored, identical to HEAD. Landing's `.next`
  is from a failed build — rebuild before `next start`.
- 2026-10-21 — Phase 4: blog 4.1–4.3 done and tested on a local prod build;
  dashboard #5 (render part) + #6 done and tested on dev (3040). The old
  3040 dev server's render workers had crashed (memory) — restarted it.
- 2026-10-21 — Phase 5 done. Local note: testing left an in-progress
  full-length attempt for the local test account (local DB only). Machine
  memory was the limiting factor all day (several OOM build/dev crashes);
  stopped my own dev servers (3040, 3060) afterwards.
- 2026-10-21 — Phase 6 done: 6.2, 6.3, 6.4 and D13; D12 and D14 tried and reverted (measured worse / harmful).

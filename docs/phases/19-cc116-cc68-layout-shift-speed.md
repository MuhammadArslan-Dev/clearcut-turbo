# Phase 19 — CC-116 + CC-68: layout shift on Dashboard, Preparation and Payment, and payment page speed

**Status:** Dashboard fixed + verified locally (2026-10-22); preparation left for Sentry re-check — not merged, not deployed
**Jira:** [CC-116](https://clear-cutoff.atlassian.net/browse/CC-116), [CC-68](https://clear-cutoff.atlassian.net/browse/CC-68)
**Repos:** CM `apps/dashboard` (branch `phase-19-layout-shift`, based on phase 18: 1851c4b)
**Size:** medium, layout/perf; must not change the look (DEVELOPMENT_RULES; "no design changes in speed fixes")

## What the tickets say
**CC-116 (Sentry, 14 days, p75). Target: CLS < 0.1.**
| Page | Loads | CLS | Shifting element |
|---|---|---|---|
| /dashboard | 1,725 | **0.53** | `div.grid.grid-cols-1.gap-2.md:grid-cols-2.md:items-stretch.md:gap-4` |
| /preparation/:courseId | 147 | 0.12 | the sidebar `aside … md:w-[var(--preparation-sidebar-width)]` + the full-screen loader `div.fixed.inset-0.z-[9999] … bg-white` |

Asks:
- SSR skeleton cards with fixed heights.
- No banners inserted above content after render.
- Sidebar width at first paint.
- The loader fades with opacity only and never blocks taps.
- img width/height everywhere.
- `font-display: swap` plus preload.
- Reserved space for late items (prices, badges, streaks, WhatsApp widget, toasts).
- Related: CC-102 ("blank area" dead taps).

**CC-68: payment page (monthly averages)**
| Month | LCP | CLS |
|---|---|---|
| Jun | 15.2 s | 0.65 |
| Sep | 4.6 s | 0.90 |
| Oct | 8.5 s | 1.03 |

- Targets: LCP < 2.5 s, CLS < 0.1 on Slow 4G.
- CLS climbs across dashboard → preparation → payment, so suspect a shared header, banner or floating widget.

## What the code shows (2026-10-22, first pass)
- **Already done in CC-61:**
  - /payment/initiated CLS 0.187 → 0.063 (skeleton in the page's frame).
  - No App Router re-navigation on load or plan switch.
  - The CC-68 Sentry/Clarity numbers predate that release, so re-measure first.
- **Dashboard grid:** `components/layout/dasbboard/pages/LearnPage.tsx:141`. The widgets inside it (DailyTestWidget, TodayGoals, NextMilestone, QuickRevision, LearningStreak, AppDownload) load at different times.
- **Sidebar width is NOT set by JS:** `--preparation-sidebar-width: 400px` is already in `styles/tokens.css:9`. The preparation shift is more likely the sidebar's content or the 2md/md breakpoint swap, so re-measure.
- **Full-screen loader:** find the `fixed inset-0 z-[9999] bg-white` owner (not found by a plain grep, probably built from class parts).
- **Payment:** checkout.js is now preloaded on mount (CC-60).

## Measured (2026-10-22, prod build, test user, Playwright)
Phone = 390×844, 4× CPU, 150 ms RTT, 200 KB/s. Desktop = 1440×900, no throttle.

| Page | Before | After |
|---|---|---|
| /dashboard, phone | **0.776** | **0.014** |
| /dashboard, desktop | 0.008 | 0.011 (noise) |
| /preparation, phone | 0.113 | 0.113 (not changed, see below) |
| /preparation, desktop | 0.007 | 0.007 |
| /payment/initiated, phone + desktop | 0 | 0 (CC-61 already fixed it) |

- **Dashboard root cause:** `MyCoursesWrapTwo` mobile swiper had `{isLoading || (orderedCourses.length === 0 && <SkeletonSlide/>)}`. While loading this renders `true`, i.e. nothing. So the only slide was "Studying for more than one exam? Add Exam" (256 px), and `DailyTestWidget` returned null until the course id existed. When courses landed, the 387 px card and the Daily Test card appeared and pushed the whole page down ~450 px. Students also briefly saw the wrong card.
- **Fix:** the skeleton slide shows until the course slides exist. The rule covers LearnPage passing `isFetching` (a background refetch must not add a skeleton slide) and `useMyActiveCourses` filling its list one render after the data. The Daily Test card renders while the course loads (values "-", button waits for the id) and falls back to `courses.active_course`. The look of the loaded page is unchanged. The leftover 27 px is the skeleton (360) vs the card (387).
- **Preparation (0.113):**
  - 0.091: the Level 2/3 paper-tab row (52 px) arrives after the data, above the subject tabs. Whether it renders depends on the paper count *and* `useAvailablePapers` (Add Paper), so it isn't known in advance. D12 tried reserving it (0.33 → 0.84) and was reverted.
  - 0.023: the floating Unlock widget pushes the Index button up 110 px.
  - Sometimes +0.042: the scroll-hide header shrinks 20 px at ~9 s with no user scroll. This is D1, parked.
  - **User decision 2026-10-22:** leave preparation, deploy the dashboard fix, re-check Sentry p75 after 3 days.
- **The full-screen loader** `fixed inset-0 z-[9999] bg-white` the ticket names no longer exists in the code. The Sentry window predates the speed phases.
- **LCP (phone, Slow 4G + 4× CPU, local backend):**

  | Page | LCP | LCP element |
  |---|---|---|
  | payment | 0.45 s | "CLEAR CUTOFF" splash |
  | dashboard | 1.8 s | "Today's Daily Test" |
  | preparation | 3.6 s | the ₹149 floating widget line |

  The field's 8.5 s on payment isn't reproduced locally; the local backend answers in ms. If it stays high after CC-61, look at API latency from India (apptest), not page code.

## Plan
- [ ] Measure first (Playwright at 390px, Slow 4G + 4× CPU, `layout-shift` entries with sources) on /dashboard, /preparation/:id, /payment/initiated, logged-in test user against the local backend. Record before numbers here.
- [ ] Dashboard: give each widget slot a fixed/min height skeleton that matches the loaded card, from the first render; nothing inserted above the grid after load.
- [ ] Preparation: find the real shifting source (sidebar content / breakpoint); the loader fades with opacity and `pointer-events:none` once content is visible.
- [ ] Shared shell: check the header, PaywallFloatingWidget, banners and toasts for late insertion; reserve their space.
- [ ] Fonts: check the `next/font` setup (display swap and preload are usually already handled; verify).
- [ ] Payment LCP: find the LCP element and what blocks it (pricing API, levels API, images).
- [!] 🛑 **D1:** if a widget's skeleton needs a fixed height that differs from today's card on some data (e.g. long names), it's a design call. Discuss before changing any card's look.
- [ ] Verify: CLS < 0.1 on all three pages in the local measurement; then Sentry p75 after 3 days live (ticket's done-when).

## Decision log
| Date | Item | Decision | By |
|---|---|---|---|
| 2026-10-22 | Preparation CLS (paper row) | Leave it; re-check Sentry p75 3 days after the dashboard fix ships | User |

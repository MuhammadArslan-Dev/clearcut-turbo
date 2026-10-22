# Phase 19 — CC-116 + CC-68: layout shift on Dashboard, Preparation and Payment, and payment page speed

**Status:** Not Started
**Jira:** [CC-116](https://clear-cutoff.atlassian.net/browse/CC-116), [CC-68](https://clear-cutoff.atlassian.net/browse/CC-68)
**Repos:** CM `apps/dashboard`
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
| | | | |

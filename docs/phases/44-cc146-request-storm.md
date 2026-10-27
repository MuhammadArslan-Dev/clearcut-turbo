# Phase 44 — Request storm on navigation (analytics/tracking)

**Tickets:** CC-146 (Highest). Related, not in the list: CC-147 (Cloud Run /events), CC-148 (third-party tags)
**Repos:** CM dashboard (+ landing), maybe ASTRO
**Status:** Built + Playwright-tested (not committed). Clarity and the Meta CAPI gateway were left for now (user)

## Build + test (2026-10-27)
- New `src/hooks/useAllowPrefetch.ts`.
- `TabSwitch` gets an optional `prefetch` prop (default true); `PageSwitchTab` passes `useAllowPrefetch()`.
- `RewardBadgeLottie` loads via `whenIdleAfterLoad` and keeps a same-size placeholder.
- tsc 95 = baseline; eslint clean on the touched files.
- Playwright (Sonnet, production build on :3041, 390×844, local BE with a temp token, deleted afterwards):
  - Fast (4g): prefetch of `/hi/test-series/<id>` at 586 ms, unchanged.
  - 3g override (+ CDP 400 kbps/400 ms) and Save-Data: no prefetch in 30 s, and tapping the Test Series tab still navigates (0.25 s unthrottled, 2.6 s throttled).
  - Lottie: requested exactly once, always after `load` (fast 6.0 s vs load 0.3 s; throttled 25.1 s vs 15.2 s).
  - No layout shift when the badge appears: same boxes before/after, and no layout-shift entries after the lottie response.
  - Requests in the first 20 s: 56 fast vs 50 slow (−2 RSC prefetches, −4 test-series chunks, −1 duplicate preparation fetch).
  - No console errors.
- Note: the dotlottie runtime also fetches `dotlottie-player.wasm` from cdn.jsdelivr.net (pre-existing).
**Created:** 2026-10-27 (wave 2, Arslan's list)

## Goal
On Slow 4G a navigation to `/preparation/:courseId` sends <= 10 non-critical requests and none block page/data requests. Meta Purchase/StartTrial and CAPI dedupe keep working.

## Already in place (do not redo)
- Platform-speed phases 0-6 done (platform-speed.md); Sentry lazy loading (phase 17); streak keepalive flush.

## Findings (2026-10-27, read-only: Sentry MCP, live pages, public GTM container + Meta pixel config)
Trace c87dbed2… (FB in-app browser, /hi/preparation, 28.2 s, 38 http.client spans):

| Requests | Count | Duration | Owner |
|---|---|---|---|
| `n.clarity.ms/collect` | 13 | 0.1–15 s (several cut at exactly 15.0 s) | Microsoft Clarity, loaded **only by GTM** tag `o8pe7lwvxo` (GTM-WC2GWW9Z). Dashboard's own `LazyClarity` is off in production: `NEXT_PUBLIC_CLARITY_ID` is not set at build (the live chunk reads `process.env.NEXT_PUBLIC_CLARITY_ID` at runtime → undefined). |
| `7s-d309…ecs.us-west-1.on.aws/events` | 8 | many cut at exactly 6.0 s | **Meta Conversions API Gateway ("openbridge")** set in Meta Events Manager for pixel 1126041265682766 (`connect.facebook.net/signals/config/<pixel>`): endpoint AWS us-west-1, `fallbackDomain` `snofje0za8n8.cloud.run`, `alwaysRetry: true`. Not in our code. |
| `bded8a3c6ae-1-…us-central1.run.app/events` | 5 | 12–22 s | Same gateway software (identical 404 page); not in the current pixel config → older/second gateway (CC-147). |
| `analytics.google.com/g/collect` | 2 | 1.6–16.6 s | GA4 via GTM |
| `api2.amplitude.com` | 2 | 2.5–4.4 s | Amplitude (defaults, `fetchRemoteConfig:false`) — minor |
| page GET `/hi/test-series/<id>` + `/hi/preparation/<id>` | 2 | 28 s each | `PageSwitchTab` (Preparation / Test Series tabs are `Link`s) → Next prefetches the sibling route during the navigation |
| `/lotifiles/current-chapter.lottie` | 1 | 19 s | `RewardBadgeLottie` (TestCard, topic-list-card) |
| app API (get-course, get-sections, …) | ~8 | 1.3–5.9 s | ours — competing with the above |

14-day production totals (Sentry, sampled): Clarity 26.7k POSTs, CAPI gateway (on.aws) 23.2k (p75 0.5 s, every browser incl. desktop), Amplitude 17.1k, GA 10k, run.app gateway 270 (p75 13 s, mostly Facebook IAB).

Not reproducible locally: GTM/Clarity/Meta only load on production hosts, so request counts per navigation need a production session (no prod credentials here).

## Steps
1. [ ] Open trace c87dbed2... via Sentry MCP, list every POST (URL, owner, count, duration) — table on the ticket.
2. [ ] Count requests per navigation (dashboard, onboarding, preparation, test-series, payment) on a local prod build, Slow 4G.
3. [ ] Find the owner of `*.run.app/events` (Amplitude proxy? server-side GTM? CAPI?).
4. [ ] Amplitude batching (`flushQueueSize`/`flushIntervalMillis`, `sendBeacon` on pagehide).
5. [ ] Duplicate route fetches (`/preparation` + `/test-series` in one navigation) and `next/link` prefetch on slow connections.
6. [ ] Client timeouts, no retry storms on non-critical calls.

## Decisions needed (🛑 stop here until the user answers)
- **D1:** include CC-147 and CC-148 in this phase? They are the same storm (not in your list).
- **D2 ⚠️ analytics data:** batching/delaying events can lose events when a user closes the tab fast, and changes event timing in Amplitude. Approve the batch settings after the measurement table.
- **D3 ⚠️ prefetch:** turning off prefetch on slow connections makes the next tap slower to open; approve per screen.

## Decision log
| Date | Decision | By |
|---|---|---|
| 2026-10-27 | Scope: only CC-146 (CC-147/148 not added) | User |
| 2026-10-27 | Preparation/Test Series tab prefetch: off on slow connections (Save-Data or effectiveType slow-2g/2g/3g); unchanged on fast | User |
| 2026-10-27 | Reward badge Lottie: load after the page is idle (space reserved, no layout shift) | User |
| 2026-10-27 | Clarity (GTM tag) and Meta CAPI gateway (Events Manager): leave for now | User |

## Verification
Before/after request counts + HAR on local prod build; Meta Purchase test (Events Manager test code); Amplitude events still arrive.

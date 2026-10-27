# Phase 49 — Backend TTFB and slow endpoints

**Tickets:** CC-149 (High)
**Repos:** BE, CM dashboard (server fetches)
**Status:** Waiting — needs 3 days of Laravel server spans after the Phase 45 deploy (`SENTRY_TRACES_SAMPLE_RATE=0.1`)
**Created:** 2026-10-27 (wave 2, Arslan's list)

## Early look (2026-10-27)
- **Browser-side (`http.client`, prod, 14 d):**
  - `GET /api/blog/exam`: 1,490 calls, p75 11 s, p95 357 s. The p95 is a page left in the background — the browser's clock, not the server's.
  - `get-section-chapters`: 1,420 calls, p75 3.6 s.
  - get-course / get-sections: 3.5–8.4 s.
  - daily-test history: 3.5–12 s.
  - `blog/get-subject`: 26.8 s (n=20).
- **Local server time** (local MySQL copy): blog/exam 60–175 ms, get-my-active-courses 80–130 ms, resume-state 70–165 ms, pricing 77–97 ms.
- So most of the browser time is network + device (in-app browsers, slow 4G, the request storm from Phase 44), but production server time is unknown until CC-145 data arrives. Don't optimise blind.
- Known server-side problem: Sentry LARAVEL-BACKEND-F5. Deadlocks on the MySQL **database cache store** (`insert ignore into cache`) under concurrent `get-sections`. Moving the cache to Redis (if the server has it) is a decision for this phase.

## Goal
`browser.request` p75 < 800ms; top-15 endpoints p75 < 500ms (< 1s heaviest); no DB exceptions on `/api/blog/get-questions` and `/api/v2/interactions`.

## Already in place (do not redo)
- Blog question caching + version invalidation (QuestionCacheService). Phase 4 of platform-speed removed SSR waterfalls in blog. D10 (backend fix left from platform-speed).

## Steps
1. [ ] Wait for 3 days of phase 45 data; top 15 by p75 x count.
2. [ ] Per endpoint: EXPLAIN, N+1, indexes, payload size; fix top 5.
3. [ ] Cache rarely-changing data (course, sections, chapters, pricing, exam meta, blog subjects).
4. [ ] PDOException root cause on the two endpoints.
5. [ ] Cache-Control/ETag + gzip on JSON where safe.

## Decisions needed (🛑 stop here until the user answers)
- **D1 ⚠️ DB indexes on prod tables** (migration, lock time) — approve each.
- **D2 ⚠️ cache TTLs** = how long a content/pricing change takes to show; approve per data type.
- **D3:** rate limit 60/min (429 on preparation) — leave or raise (flagged earlier).

## Decision log
| Date | Decision | By |
|---|---|---|
| 2026-10-27 | Cache store (MySQL `cache` table deadlocks, F5): leave for now, decide after CC-145 data | User |

## Verification
Before/after p75 table locally (same data) + in prod after deploy.

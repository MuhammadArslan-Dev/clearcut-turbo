# Phase 78 — Backend speed: slow APIs, TTFB, caching (CC-149)

**Tickets:** CC-149 (Perf-3). Related: CC-145 (Laravel tracing), CC-142 (the `apptest` host is production), CC-146, CC-43
**Repos:** BE (`C:\laragon\www\clearcutoff-main-backend`) · CM-dashboard/blog (SSR fetches, only if decided)
**Branch:** not created yet. Plan: isolated backend worktree from `main`, branch `perf/cc149-backend-speed`. Not committed, not pushed.
**Created / start date:** 2026-11-05
**Status:** Blocked – Decision. Plan written, nothing implemented. Waiting for the answers in section 5.

> Rule from the user: no implementation before this plan is reviewed, and any step that needs a decision from the user is asked first, not started.

---

## 1. Problem / objective
Production API calls are slow (Sentry p75, 14 days, host `apptest.clearcutoff.in` which is production): `GET /api/blog/get-subject` 26.8 s (n=20), `GET /api/v2/daily-tests/<id>/history` 12.1 s and 6.5 s, `GET /api/v2/preparation/get-course/<id>` 8.4 s, `GET /api/v2/preparation/get-sections/<id>` 8.0 s, `POST /api/v2/daily-tests/<id>/tests/<id>/start` 6.3 s. The document request (`browser.request`) is 1.5 s p75. Targets in the ticket: `browser.request` p75 < 800 ms, top-15 endpoints p75 < 500 ms (< 1 s for the heaviest), no `PDOException` on `/api/blog/get-questions` and `/api/v2/interactions` for 7 days, and a before/after p75 table posted on CC-149.
The sample counts are small (n = 10 to 20), so the ticket itself says to confirm with CC-145 data before choosing priorities.

## 2. Scope
- **In:** measure first (find the real top endpoints by p75 x count), fix the top 5 slow queries, cache rarely changing data, the two `PDOException`s, gzip/brotli and `Cache-Control`/ETag where safe, and the before/after table.
- **Out (explicitly not doing):** renaming or filtering the `apptest` host (CC-142), the Cloud Run `/events` endpoint (CC-147), client-network slowness (CC-146), any design or behaviour change in the apps.

## 3. Implementation plan
What I found in the code so far (read only, no changes):
- `blog/get-subject` is already wrapped in `Cache::remember(..., 3600)` (`BlogExamRepository::getSubject`, key versioned by `QuestionCacheService`). So 26.8 s is most likely the cold path (the non-CTET branch does `QuestionNew ... distinct pluck('section_id_b')` with `LIKE` on a big table) or the cache store itself is slow/not shared. Production `CACHE_STORE` exists in Coolify but its value is not readable by me; `.env.example` defaults to `file`. Redis env vars (`REDIS_HOST`, `REDIS_CACHE_DB`) are set, so Redis is available.
- `daily-tests/{course}/history` (`DailyTestController::history`) calls `ensureTodaysTest()` first. That is a write path (generates today's assignment) inside a GET, then loads assignments and attempts. Likely cost: generation work plus N+1 style loads.
- `preparation/get-course` and `get-sections` are in `PreparationController` (it already has some `Cache::` use); not read in depth yet.

Steps:
- [ ] 1. Baseline: pull the real top endpoints from Sentry traces (needs CC-145 spans on `laravel-backend`; if not live, use the `http.client` spans from the apps) and save the before table in this file.
- [ ] 2. Per endpoint: reproduce with the query log on a local DB clone (never write to prod), find N+1 and missing indexes (`EXPLAIN`), fix the top 5.
- [ ] 3. Caching: course, sections, chapters, pricing, exam metadata, blog subjects. Reuse `QuestionCacheService` versioned keys and `FlushCacheAfterSync` for invalidation (do not invent a second mechanism).
- [ ] 4. `PDOException` on `/api/blog/get-questions` and `/api/v2/interactions`: find the query and cause.
- [ ] 5. Compression and cache headers for JSON where safe (public blog endpoints only; never for user-specific or payment responses).
- [ ] 6. SSR waterfalls in the Next apps (`Promise.all`, Suspense) only if the user picks which app/pages.
- [ ] 7. Re-measure after deploy, post the before/after table on CC-149.

## 4. Progress / completed changes
- 2026-11-05: plan and code reading only. No files changed in any repo.

## 5. Decision log
| Date | Question | Answer (who) |
|---|---|---|
| 2026-11-05 | 🛑 Is the first pass only CC-149, or more tickets? The message listed `[149, ]` with an empty second item | open |
| 2026-11-05 | 🛑 Production cache store: is `CACHE_STORE` `redis` or `file`? If `file`, moving it to Redis is the single biggest and cheapest fix, but it is a production env change | open |
| 2026-11-05 | 🛑 May I read production data for measurement: Sentry traces (read only) and the read-only Grafana MySQL datasource for `EXPLAIN`/row counts? No writes, ever | open |
| 2026-11-05 | 🛑 Staleness: how stale may course, sections, pricing and exam metadata be (for example 5 min, 1 h, until a sync flushes it)? Pricing is the sensitive one | open |
| 2026-11-05 | 🛑 Do you want the Next.js SSR waterfall work (step 6) in this phase, and for which app (blog, landing, dashboard)? | open |
| 2026-11-05 | 🛑 Delivery: backend auto-deploys on push to `main`. Push only a feature branch and wait for your OK before merging? (my default) | open |

## 6. Blockers / risks
- ⚠️ The production backend serves the Android app, old app versions included. Any response-shape or route change can break them. Changes here must be cache/query only, same JSON.
- ⚠️ Caching user-specific data under a shared key would leak one student's data to another. Only cache public or per-key (course/exam) data, never per-user.
- ⚠️ A cache that is not flushed after a sync shows stale course or price data. Invalidation must be tested with a real sync.
- Small sample sizes in Sentry: do not pick priorities from n = 10 to 20 alone.
- Local DB must be a throwaway or clone (see memory: backend tests wipe the DB).

## 7. Dependencies / packages added
None planned. Possible env change (only if you approve): `CACHE_STORE=redis` in Coolify for the backend.

## 8. Tests and verification
- [ ] Per fixed endpoint: same JSON before and after (diff), query count before/after, timing before/after.
- [ ] Pest tests for any changed repository/controller, on a scratch MySQL DB (not the local main one).
- [ ] Cache invalidation test with a question sync.
- [ ] Production p75 table (Sentry) 7 days after deploy.

## 9. Next steps
Get the answers in section 5, then start at step 1 (baseline). Nothing starts before that.

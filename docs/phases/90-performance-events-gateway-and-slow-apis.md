# Phase 90 — Performance: `/events` gateway (infra note) + slow backend APIs

**Tickets:** CC-147 (High, queue 05) + CC-149 (High, queue 06)
**Repos:** BE, CM (`apps/blog` server code); CC-147 = infrastructure outside our repos
**Branch:** `perf/slow-apis-safe-wins` — not created yet, not committed, not pushed
**Created / start date:** 2026-11-09
**Status:** Blocked – Decision (infra steps are the user's; code changes only where the JSON response stays identical)
**Continues:** phase 44 (CC-146, request storm — CC-147 note), phase 49 (CC-149, "waiting for 3 days of server spans")

> User rule: investigate; fix only if nothing can break, otherwise tell the user. API response JSON must stay byte-identical; we do not change response shapes.

---

## 1. Problem / objective
CC-147: the Meta Conversions API gateway `/events` takes ~12.4 s at p75 (330 calls/14 days). CC-149: slow production APIs (browser `http.client` times): `get-subject` 26.8 s (n=20), daily-tests history 12.1 s, `get-course` 8.4 s, `get-sections` 8.0 s, daily-test start 6.3 s; PDOException on `blog/get-questions` and `v2/interactions`.

## 2. Scope
- **In:** the user's infra checklist (CC-147); safe backend/Next.js optimisations with before/after identical-JSON proof (CC-149).
- **Out:** anything that could change a response shape; DB index migrations and cache TTL/store changes without approval; RN app.

## 3. Findings (read-only, 2026-11-09)
**CC-147 — not in any repo.** It is the Meta Conversions API Gateway (identified in phase 44): a Cloud Run copy in `us-central1` (`*.us-central1.run.app/events`) plus the primary AWS endpoint; Meta's own `fbevents.js` calls it and the 6 s / 15 s retries are the pixel's (`alwaysRetry`), not ours. Our pixel loader: `apps/dashboard/src/components/thirdparties/FacebookPixel.tsx`, `lib/analytics/facebook-pixel.ts`. **Nothing to change in code.**
**CC-149** (tracing is in main: `config/sentry.php` `traces_sample_rate` only if `SENTRY_TRACES_SAMPLE_RATE` is set; money/login/webhook paths sample 1.0; dashboard propagates `sentry-trace`):
- `GET /api/blog/get-subject` → `BlogExamRepository::getSubject` (l.177–253): already `Cache::remember` 3600 s with a versioned key; for non-CTET exams it scans `question_news` filtered by `stage_id_b LIKE 'X_L1%'` and **`stage_id_b` has no index**; the cache key md5s the whole request (extra query params fragment it).
- `GET /api/v2/daily-tests/{id}/history` → `DailyTestController::history` (l.226–337): ~8 queries, no N+1, indexes exist; heavy only when `ensureTodaysTest` must generate today's test (a write on a read endpoint); list unbounded.
- `GET /api/v2/preparation/get-course/{id}` → `getCurrentCourse` (l.161–194): one enrolment query + expiry + subscription; already light — no safe code win.
- `GET /api/v2/preparation/get-sections/{id}` → `getSections` (l.43–155): already cached 30 min; cold misses heavy; this is the route behind the MySQL `cache` table deadlocks (LARAVEL-BACKEND-F5).
- `POST …/tests/{id}/start` → `DailyTestController::start` (l.340–410): `isPaidForSection` calls `getOrderedSections` per enrolment (small repeat).
- PDOException on get-questions / interactions: almost certainly the throttle limiter's cache writes deadlocking (F5); `RetryOnDeadlock` is in main; `CACHE_LIMITER` env (commit `149eaa3`, `config/cache.php:25`) lets the limiter use `file`/`redis`. `getQuestions` also caches up to 500 translation rows in a `mediumText` value (packet-size risk). Side finding: `UserLearningInteractionController` returns `'error' => $e` in 500 responses (info leak — report only).
- Next.js: sequential awaits in `apps/blog/src/app/[locale]/(blog)/[examName]/[level_id]/year/page.tsx` l.70–81 (independent `get-years` fetch after `tryLoadExamIndex`); the pattern to copy is `level_id/page.tsx:130`. Dashboard server code has no waterfalls.
- Server-side p75 is **unknown** (all ticket numbers are browser time; local server time 60–175 ms) → check `SENTRY_TRACES_SAMPLE_RATE` is set on Coolify and collect server spans before bigger changes.

## 4. Implementation plan
**CC-147 — user checklist (we write it, the user executes; we verify with an Events Manager test code):**
1. Meta Events Manager → Data Sources → the pixel → Settings → Conversions API Gateway: remove/disable the stale `us-central1` `run.app` gateway (primary AWS one already shows p75 ~0.5 s); check `fallbackDomain` is the intended, healthy one.
2. If a Cloud Run gateway is kept: min instances 1, region `asia-south1` (Mumbai), higher concurrency, CPU boost; the gateway must answer 202 before forwarding.
3. Verify with a Test Events code: Purchase, StartTrial, dedupe by `eventID`.

**CC-149 — safe candidates (each: before/after identical JSON via `jq -S`, same token, `php artisan cache:clear` between runs):**
- [ ] A. `CACHE_LIMITER=file|redis` on prod — **config only, user decision** (phase 49 deferred it; biggest known contention fix).
- [ ] B. Cache `getOrderedSections($stageId)` for 30 min inside `isPaidForSection` (same pattern as `group_sections`).
- [ ] C. Normalise the `blog/get-subject` cache key to exam id + slug only.
- [ ] D. Blog `year/page.tsx`: start the `get-years` fetch before awaiting the exam index.
- [ ] E. Index on `question_news.stage_id_b` → **migration on a prod table — NOT done without approval (phase 49 D1)**.
- Not done: any response-shape change, gzip/ETag work unless Cloudflare/Coolify is not already compressing.

## 5. Decision log
| Date | Question | Answer (who) |
|---|---|---|
| 2026-11-09 | 🛑 **A — `CACHE_LIMITER`** `file` or `redis` on prod? (needs Redis available; `file` is the safe fallback) | open |
| 2026-11-09 | 🛑 **E — approve the `question_news.stage_id_b` index migration?** (table-lock time on a large prod table; recommend off-peak) | open |
| 2026-11-09 | 🛑 **Cache TTL for B/C** (how long a content/pricing change takes to appear) | open |
| 2026-11-09 | 🛑 **CC-147 console steps** — the user performs them (we cannot access Meta/Cloud Run) | open |

## 6. Blockers / risks
- Cannot be verified from code: whether `SENTRY_TRACES_SAMPLE_RATE=0.1` is set on prod (not in `.env.example` — check Coolify), whether Redis is reachable, real server p75.
- B changes caching of an access check — must keep results identical per user/stage; C changes cache keys (one cold miss after deploy).

## 7. Dependencies / packages added
None. E would add one migration (approval needed).

## 8. Tests and verification
- [ ] identical-JSON proof per touched endpoint; [ ] backend tests (sqlite memory); [ ] `tsc`/lint for the blog change; [ ] user: before/after p75 in Sentry once server spans exist

## 9. Next steps
Give the user the CC-147 checklist and the A/E questions; implement only B, C, D after the user agrees they are safe to ship (each with its identical-JSON proof).

# Phase 90 — Performance: `/events` gateway (infra note) + slow backend APIs

**Tickets:** CC-147 (High, queue 05) + CC-149 (High, queue 06)
**Repos:** BE, CM (`apps/blog` server code); CC-147 = infrastructure outside our repos
**Branch:** frontend `perf/blog-year-page-parallel-fetch` (D, committed, not pushed); backend: no change made (B and C dropped, see 4a)
**Created / start date:** 2026-11-09
**Status:** In Progress — D done; B, C and E judged not worth it with evidence; A and the CC-147 console steps are the user's
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

## 4a. Result of the investigation (2026-11-09)
**Key measurement (local DB copy, read-only): the get-subject cold query is NOT slow.** `question_new` has ~37k rows; the non-CTET query (`DISTINCT section_id_b WHERE stage_id_b LIKE 'HTET_L1%'`) takes 60-180 ms, EXPLAIN = full index scan of `question_new_section_id_b_index` (37,283 rows). Nowhere near the 26.8 s in the ticket. So server-side query cost does not explain the ticket's browser numbers.
- **D — done** (`apps/blog/.../[level_id]/year/page.tsx`): the `get-years` fetch now starts together with the exam-index check (same pattern as the level page); the awaited result and any error are unchanged; an unused request after an early `notFound()` gets a no-op catch. **Proof (blog dev server on the local backend, same URLs before/after):** `/ctet/paper-1/year` 200 and byte-identical HTML; `/ctet/paper-9/year` and `/htet/level-3/year` 404 and identical (only the per-request `__next_r` id and dev-mode stack-trace paths/chunk ids differ, which also differ between two runs of the SAME code). eslint 2/9 before and after; tsc 33 = clean main 33. Effect is small (saves one index-check wait on a render that is cached anyway); it is safe, not a fix for the ticket.
- **B — not done:** `isPaidForSection` runs one small `getOrderedSections` query per enrolment (a student has 1-3) and stops at the first match. Caching it for 30 min would save a few ms and would put an access check behind a cache.
- **C — not done:** the blog sends only `exam_id` + `slug` (two spellings of the exam may give two cache keys at most); normalising saves almost nothing, and the cold query it protects is 60-180 ms.
- **E — recommend NO:** a `stage_id_b` index cannot help `LIKE 'HTET_L1%'` much on 37k rows (already an index scan, 60-180 ms) and it would be a migration on a prod table. Dropped unless prod measurements say otherwise.
- **What is left (needs prod data/decisions, not code):** (1) **A: `CACHE_LIMITER=file|redis`** — the known contention source (LARAVEL-BACKEND-F5, the MySQL `cache` table used by the throttle limiter deadlocks under load and also explains the PDOExceptions on `get-questions` / `v2/interactions`); (2) check `SENTRY_TRACES_SAMPLE_RATE` is set on Coolify and read server spans after 3 days — the ticket's numbers are browser times (network + cold starts + the limiter), the server share is unknown; (3) `getSections` cold misses (30 min cache) are the heavy ones.
- Reported, not changed (security): `UserLearningInteractionController` returns `'error' => $e` in its 500 responses (internal exception text to the client).

### CC-147 checklist for the user (we cannot access Meta or Cloud Run)
1. Meta Events Manager → Data Sources → the pixel → Settings → Conversions API Gateway: remove or disable the old `us-central1` `run.app` gateway (the primary AWS one already answers in ~0.5 s at p75); check the fallback domain is the intended, healthy one.
2. If a Cloud Run gateway is kept: min instances 1, region `asia-south1` (Mumbai), higher concurrency, CPU boost; it must answer 202 before forwarding.
3. Verify with an Events Manager Test Events code: Purchase and StartTrial arrive, de-duplicated by `eventID`.
Nothing in our repos changes for CC-147; the 6 s / 15 s retries are Meta's own `fbevents.js`.

## 5. Decision log
| Date | Question | Answer (who) |
|---|---|---|
| 2026-11-09 | 🛑 **A — `CACHE_LIMITER`** `file` or `redis` on prod? (needs Redis available; `file` is the safe fallback) | open |
| 2026-11-09 | 🛑 **E: `question_new.stage_id_b` index migration** - recommendation is NO (measured in 4a). Confirm the drop? | open |
| 2026-11-09 | B and C dropped (no TTL decision needed) | Claude, with evidence in 4a |
| 2026-11-09 | 🛑 **CC-147 console steps** — the user performs them (we cannot access Meta/Cloud Run) | open |

## 6. Blockers / risks
- Cannot be verified from code: whether `SENTRY_TRACES_SAMPLE_RATE=0.1` is set on prod (not in `.env.example` — check Coolify), whether Redis is reachable, real server p75.
- B changes caching of an access check — must keep results identical per user/stage; C changes cache keys (one cold miss after deploy).

## 7. Dependencies / packages added
None. E would add one migration (approval needed).

## 8. Tests and verification
- [x] D: identical HTML before/after on three URLs (4a); eslint and tsc unchanged. No backend endpoint was touched, so no JSON proof was needed.
- [ ] user: `CACHE_LIMITER` (A), `SENTRY_TRACES_SAMPLE_RATE` on Coolify, CC-147 console steps, and p75 in Sentry once server spans exist.
- Not verified: production timings (all my numbers are the local snapshot), the effect of D on real latency, whether Redis is reachable for A.

## 9. Next steps
User: do the CC-147 console steps, decide A, set/check the tracing env var; then re-measure from Sentry server spans before touching any other endpoint.

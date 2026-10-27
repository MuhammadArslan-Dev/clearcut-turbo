# Phase 45 — Performance tracing on laravel-backend

**Tickets:** CC-145 (High)
**Repos:** BE, CM dashboard (trace propagation)
**Status:** Built (not committed). Waiting on: deploy BE + dashboard, user sets `SENTRY_TRACES_SAMPLE_RATE=0.1` on the production server, then 3 days of data
**Created:** 2026-10-27 (wave 2, Arslan's list)

## Goal
`laravel-backend` sends transactions with DB/HTTP/queue spans in production; frontend traces link to Laravel transactions.

## Already in place (do not redo)
- `config/sentry.php` reads `SENTRY_TRACES_SAMPLE_RATE` from env (null = off). Errors already arrive.

## Steps
1. [x] sentry-laravel ^4.15; every tracing integration (SQL, SQL origin, HTTP client, queue, cache, views, notifications) already defaults on. Only `traces_sample_rate` is missing in production.
2. [x] `app/Support/Sentry/TracesSampler.php` + `config/sentry.php` `traces_sampler` (set only when `SENTRY_TRACES_SAMPLE_RATE` is set):
   - Payment, subscription, Razorpay webhook and login/Truecaller paths: 1.0.
   - Others follow the browser's `sentry-trace` decision, else the env rate.
   - `tests/Unit/TracesSamplerTest.php`: 12 pass. Pint clean.
3. [x] CORS already `allowed_headers: ['*']` on `api/*`. Dashboard `TRACE_PROPAGATION_TARGETS` (sentry-shared.ts) = same-origin + the `NEXT_PUBLIC_LARAVEL_MAIN_BACKEND` origin, wired in `instrumentation-client.ts`. Before this the default was same-origin only, so API calls never carried `sentry-trace`. tsc 95 = baseline.
4. [ ] Local test against a local Sentry DSN or dev env; overhead check.
5. [ ] After 3 days: top 15 endpoints table on the ticket (feeds phase 49).

## Decisions needed (🛑 stop here until the user answers)
- **D1 💰 sample rate vs Sentry quota:** free plan shares one span quota for the org. Pick 0.05 / 0.1 / 0.2 (payments + login always 1.0).
- **D2 📞 prod env:** you set `SENTRY_TRACES_SAMPLE_RATE` on the server (Coolify) and deploy.

## Decision log
| Date | Decision | By |
|---|---|---|
| 2026-10-27 | D1: default rate 0.1 (`SENTRY_TRACES_SAMPLE_RATE=0.1` on production); money/login/webhook paths 1.0 via the sampler | User |

## Verification
Local transaction visible; prod query `span.op:http.server project:laravel-backend` returns parameterised routes.

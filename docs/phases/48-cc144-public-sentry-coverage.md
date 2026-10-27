# Phase 48 — Sentry coverage for public pages

**Tickets:** CC-144 (Medium, supersedes CC-114)
**Repos:** CM landing, blog, tools, packages/error-reporting
**Status:** Built (not committed). Build/smoke test running. User: tools DSN at build, SENTRY_AUTH_TOKEN on the public builds
**Created:** 2026-10-27 (wave 2, Arslan's list)

## Goal
Parameterised transactions, LCP/FCP/TTFB/CLS/INP and ad-traffic tags for landing, Academy, tools and blog; INP on the app.

## Audit (Sentry, last 7 days, 2026-10-27)
- **clearcutoff-public pageloads:**
  - `/:locale/start` 20.1k, LCP p75 1.4 s, CLS 0.011.
  - `/` 8.1k, LCP 1.9 s.
  - Academy = **apps/blog** (academy.clearcutoff.in, Vercel): the ISR question pages are named by **raw URL** (e.g. `/ctet/paper-2/subject/social-studies/pedagogy-history` 2.5k, LCP p75 **7.1 s**; `/ctet/paper-1/subject/hindi/pedagogy-hindi/page/*` LCP **9.7 s**). One parameterised blog route exists (`/:locale/:examName/…/page/:page`), from a non-ISR render.
- **Cause:** blog + landing ran `@sentry/nextjs` 9.47. On the App Router, v9 takes the parameterised name from the server render. ISR pages served from cache have none, so v9 falls back to the URL. The dashboard (v10.67) builds a route manifest for the client.
- **INP is not missing.** It arrives as `ui.interaction.*` spans, not on the pageload: preparation 430 ms, dashboard 308, payment/initiated 392, exam 878, **test-series 1244**, /start 168.
- **Onboarding CLS is reported now** (20 samples/7 d, p75 0.039). Dashboard CLS p75 0.38 (60 samples) and preparation 0.20 — input for Phase 50.
- **Tools:** no data. `NEXT_PUBLIC_SENTRY_DSN` was not set at build, so the SDK is never bundled.
- **ASTRO** (`go` pages): `packages/analytics/src/lib/sentry.ts` `initSentry()` is never called, so nothing reports. Left alone (the repo has unrelated WIP; no DSN).
- **CC-142 dependency:** not blocking. Public apps already send only from production hosts (`publicSentryAllowedHere`) with `NEXT_PUBLIC_SENTRY_ENVIRONMENT`.

## Built (2026-10-27)
1. `apps/blog` + `apps/landing`: `@sentry/nextjs` ^9 → ^10.62.0 (10.67.0, same as dashboard). `pnpm-lock.yaml` updated (−942 lines: the old v9 tree). tsc: landing 0, blog 33 = baseline.
2. `packages/error-reporting/src/traffic-tags.ts` (+ export, 5 tests): `exam`, `utm_campaign`, `has_fbclid` (yes/no, never the id) and `in_app_browser` (facebook/instagram/none).
   - Captured at module load from the landing URL.
   - Added to errors and transactions in `apps/{blog,landing,tools}/src/lib/page-errors.ts`.
3. `apps/tools/src/lib/page-errors.ts`:
   - `toolsTransactionName()` → `/:locale/tools/resizer/:slug`, `/tools/age-eligibility-calculator/:examSlug`, set via `browserTracingIntegration({ beforeStartSpan })`.
   - Test `page-errors.test.ts`: 2 pass.
4. Tests: error-reporting 39/39 pass.

## Steps
1. [x] Audit.
2. [x] Parameterised names: blog/landing via the v10 upgrade, tools via its own naming. ASTRO not applicable (no reporting).
3. [x] Tags.
4. [x] INP/CLS: already reported — the ticket's "null" was a query artifact.
5. [ ] Source maps + releases: needs `SENTRY_AUTH_TOKEN` on Vercel (blog), Coolify (landing) and the tools build (user).
6. [ ] Tools: set `NEXT_PUBLIC_SENTRY_DSN` (+ `NEXT_PUBLIC_SENTRY_ENVIRONMENT=production`) at tools build time, then rebuild and deploy (user).
7. [ ] After deploy: re-run the pageload query. Academy names should be parameterised, and the tags present.

## Decision log
| Date | Decision | By |
|---|---|---|
| 2026-10-27 | Fix blog naming by upgrading blog + landing to @sentry/nextjs v10 (same major as dashboard) | User |
| 2026-10-27 | Keep traces at 0.1 on public pages (volume is already far above 100/week) | User |
| 2026-10-27 | Scope: only the listed tickets; CC-142 turned out not to block | User |

## Verification
Production build + manifest check + Playwright smoke (Sonnet). After deploy: `environment:production transaction.op:pageload` in clearcutoff-public lists parameterised blog routes and the new tags.

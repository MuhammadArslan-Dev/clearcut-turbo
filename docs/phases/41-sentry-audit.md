# Phase 41 — Sentry audit across the monorepo

**Status:** Audit done, dashboard fixes on branch `sentry-dashboard-fixes` (not pushed). Some fixes need the user (Vercel / Sentry settings).
**Date:** 2026-10-24
**Sentry org:** `clear-cutoff` (region de). **Projects:** `clearcutoff-nextjs-app`, `laravel-backend` — nothing else.

## Status matrix

| App | SDK | Where it runs | Sentry project | Current state | Issues | Fix |
|---|---|---|---|---|---|---|
| dashboard | `@sentry/nextjs` ^10.62 (10.67 installed) | Vercel `clearcut-turbo-dashboard` → `app.clearcutoff.in` | `clearcutoff-nextjs-app` | Reports. Client (`src/instrumentation-client.ts`), server + edge (`sentry.*.config.ts` via `src/instrumentation.ts`, `onRequestError`), `error.tsx` + `global-error.tsx` capture. | 1. **No source maps / release upload:** every Vercel build logs "No auth token provided. Will not upload source maps" for server, edge and client. 2. **Local dev reports into the live project:** `enabled: Boolean(DSN)` + DSN in local `.env`; 2 of the top 3 unresolved issues were `environment:local` (dev compile error, local test user). 3. **Preview = production:** `NEXT_PUBLIC_SENTRY_ENVIRONMENT` has one value for preview and production. 4. **PII:** `setUser` sent email + phone (ProtectedPage) and email + name (sentry-logger). 5. No tunnel: ad-blockers drop some browser events. 6. `/sentry-example-page` + `/api/sentry-example-api` are live in production. 7. `sentry.client.config.ts` placeholder → deprecation warning on every build. | 1. **User:** re-enter `SENTRY_AUTH_TOKEN` on Vercel (see below). 2–4 fixed in code. 5. Not enabled on purpose (Vercel Hobby limits; every tunnelled event is a function call). 6–7. Left (delete-nothing rule); listed for the user. |
| React Native app (other repo) | `@sentry/react-native` | Android/iOS | `clearcutoff-nextjs-app` (!) | Reports into the dashboard's project. | Mixed with web issues; stack traces unsymbolicated (`index.android.bundle:1:2022645`). | Own project `clearcutoff-app` + the Expo Sentry plugin's source-map upload (RN repo). |
| landing | `@sentry/nextjs` ^9 | Coolify (`clearcutoff.in`) | none | Inert by design: no DSN, so no SDK bytes ship (`instrumentation-client.ts` at the app root does load — checked, Turbopack resolves it). Page-tag + redaction wiring ready. | No project, no DSN. v9 vs dashboard v10. | When wanted: create project, set DSN + env at build, `SENTRY_AUTH_TOKEN`, bump to ^10. |
| blog | `@sentry/nextjs` ^9 | Vercel `clearcut-turbo-blog` (behind `academy.clearcutoff.in`) | none | Inert, same as landing. | Same. | Same. |
| tools | `@sentry/browser` ^10.62 | Cloudflare Pages (static export) | none | Inert until `NEXT_PUBLIC_SENTRY_DSN` at build. No server/edge (static). | No project. | Same; source maps via `sentry-cli sourcemaps upload out/` in the manual deploy. |
| backend | Laravel | — | `laravel-backend` | Separate, not in scope. | — | — |

## What changed in code (branch `sentry-dashboard-fixes`)
- `sentry-shared.ts`:
  - `SENTRY_ENABLED` = DSN **and** a build (`NODE_ENV=production`), or `NEXT_PUBLIC_SENTRY_LOCAL=1` for a deliberate local test.
  - `SENTRY_ENVIRONMENT` is `preview` when `NEXT_PUBLIC_VERCEL_ENV=preview`.
- Client, server and edge `Sentry.init` use `enabled: SENTRY_ENABLED`.
- `setUser` sends `{ id }` only (ProtectedPage, sentry-logger).
- `turbo.json`:
  - `NEXT_PUBLIC_SENTRY_LOCAL` and `NEXT_PUBLIC_VERCEL_ENV` added to the build/dev env lists;
  - `passThroughEnv`: `VERCEL_ENV`, `VERCEL_GIT_COMMIT_SHA`, `VERCEL_URL` (release naming / environment, outside the cache hash).
- Verified on the local dev server (DSN in `.env`): a thrown error sends **no** request to `sentry.io`; the SDK (10.67) is loaded but disabled.

## User actions
1. **Sentry → Settings → Auth Tokens:**
   - create an org token with `project:releases` + `org:read`, or reuse a valid one.
   - Why we think the Vercel value is empty: the Vercel variable exists (type *sensitive*), was created in the same second as every other variable (a bulk paste from a `.env`), and `.env.example` has `SENTRY_AUTH_TOKEN=` empty. The DSN pasted the same way works, so env passthrough is fine; the token itself is missing. This is a deduction, not something we could read (Vercel hides sensitive values).
2. **Vercel → clearcut-turbo-dashboard → Settings → Environment Variables:** replace `SENTRY_AUTH_TOKEN` (Production + Preview). Redeploy.
   - The build log should then say the source maps were uploaded, instead of "No auth token provided".
3. Optional: `NEXT_PUBLIC_SENTRY_ENVIRONMENT=production` for Production only (preview is now detected automatically).
4. RN app repo: own Sentry project + DSN, `@sentry/react-native/expo` plugin with `SENTRY_AUTH_TOKEN` in EAS secrets.
5. Decide for landing / blog / tools: separate projects (better triage, more free-plan quota use) or stay off. Cost note: Sentry free plan = one quota for the org.

## Verification (after the token is in place)
Dashboard (production build), each must appear in `clearcutoff-nextjs-app` with `environment:production`, the commit SHA as release, and **file names + line numbers from `src/`** (not `chunks/…js`):

| Runtime | How |
|---|---|
| Client | `https://app.clearcutoff.in/sentry-example-page` → "Throw error" |
| API route (node) | `GET https://app.clearcutoff.in/api/sentry-example-api` |
| Server component | any page with a forced throw on a preview deploy (`?__sentry_test=1` guard if added) |
| Edge | the proxy has no Sentry call of its own; edge init is covered by the build log ("[@sentry/nextjs - Edge]") |

Locally:
- `pnpm --filter dashboard dev` + a thrown error → no `sentry.io` request.
- With `NEXT_PUBLIC_SENTRY_LOCAL=1` → event with `environment:development`.

## Checklist for a new app
1. `@sentry/nextjs` at the **same major** as dashboard (or `@sentry/browser` for a static export).
2. Its own Sentry project; DSN in `NEXT_PUBLIC_SENTRY_DSN`, set per environment at **build** time.
3. `instrumentation-client.ts` + `src/instrumentation.ts` (in `src/` when the app dir is `src/app`) with `onRequestError`; `global-error.tsx` in `src/app/`.
4. One shared module for env name, `enabled` (off in `next dev`), sample rates, ignore lists, `beforeSend` scrubbing and page tags. Blog/landing/tools: `@clearcut/error-reporting`; dashboard keeps its own copy.
5. `withSentryConfig` with `org`, `project`, `authToken: process.env.SENTRY_AUTH_TOKEN`; the build log must show the upload. List every new env var in `turbo.json`.
6. `setUser({ id })` only.
7. Sampling:
   - traces 0.1 in production, 1.0 locally only when enabled;
   - replays 0.05 session / 1.0 on error, dashboard only.
8. A tunnel route only if the host has room: on Vercel Hobby each tunnelled event is a function invocation.
9. Run the verification table above once.

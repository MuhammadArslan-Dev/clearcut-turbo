# Phase 118 — CC-192 A/B experimentation: GrowthBook Cloud (assignment) + Amplitude (analysis)

**Tickets:** CC-192 (High, assignee Muhammad Arslan)
**Repos:** CM (`apps/landing`, `apps/dashboard`, new `packages/experiments`)
**Branch:** `feat/cc-192-growthbook` (from main 7fcb81d)
**Created / start date:** 2026-11-17
**Status:** Implemented and verified in a real browser against the real GrowthBook CDN (landing text experiment, dashboard per-`user_id` card test). Inert in production until the two env vars below are set in Coolify. The landing text pilot was REMOVED again from `CourseCard.tsx` at the user's request (the package and `apps/landing/src/lib/experiments.ts` stay); the dashboard QA page `/growthbook-test` is the practice surface. LCP/CLS before/after not measured.

---

## 1. Problem / objective
A repeatable way to run A/B tests on the landing pages and the main app without custom code per test. GrowthBook Cloud (Starter) assigns the variant; Amplitude stays the source of truth for events and results (GrowthBook cannot read Amplitude without a warehouse). Ticket text: CC-192 in Jira.

## 2. Scope
- **In (this phase):** GrowthBook project + SDK connection + pilot experiment; shared package `@clearcut/experiments`; wiring in `apps/landing` and `apps/dashboard`; Amplitude exposure (`$exposure` + `exp_<key>` user property); performance guardrail (500 ms timeout, no flicker); pilot = landing exam-card CTA copy.
- **Out:** Astro `/go` pages (decision D1: not now, own sub-phase later), warehouse export, GrowthBook stats engine on Amplitude data, backend experiments, migrating existing tests (onboarding test, Amplitude flags `hard_gate` / `soft_gate` / `autopay-offer-99` are untouched), Confluence how-to (draft later; publish after the user picks a space).

## 3. Decisions (user, 2026-11-17)
- **D1** Only the Next landing (clearcutoff.in code) and the dashboard. Astro excluded for now.
- **D3** One environment: `production` only (Starter has default environments only). Experiments are additionally gated in code to the production hosts, so localhost/staging/previews never enter an experiment (same rule as analytics, CC-94: `analyticsAllowedHere()` or localStorage `cc-analytics-local=1`).
- **D4** Own sticky id cookie `cc_exp_id` (1 year, `Path=/`, `SameSite=Lax`, `Domain=.clearcutoff.in` on production hosts, `Secure` on https), mirrored in localStorage. Deliberately NOT Amplitude's deviceId: landing's Amplitude loads deferred (idle + 1.5 s) and forcing a deviceId would re-identify existing users. Amplitude already adopts the `ampDeviceId` URL param natively (CC-122), so it is not touched.
- GrowthBook UI work is done by me (the user logged in); anything I cannot do is reported.

## 4. Verified facts (official docs read 2026-11-17)
- `@growthbook/growthbook` 2.1.0: `init({ timeout })` never throws, returns `{ success, source: init|cache|network|error|timeout }`; until features load every feature is `null`. localStorage cache key `gbFeaturesCache` (stale 60 s, ignored after 4 h). The SDK captures `fetch` at import, so tests use `setPolyfills`.
- `trackingCallback(experiment, result)` runs whenever a user is put into an experiment; only `experiment.key`, `result.key`, `user.attributes`, `result.featureId` are documented.
- Starter: 3 users, **1 project**, default environments only, CDN 1M requests/month and 5 GB/month.
- Landing pages are static/ISR, so a per-visitor variant is resolved client-side (the page cache is not broken).

## 5. What was built
- `packages/experiments` (`@clearcut/experiments`, source-only, subpath exports `./id ./attributes ./exposure ./client ./react`, no barrel, no Tailwind classes):
  - `id`: `cc_exp_id` read/create/mirror, never throws.
  - `attributes`: `id`, `user_id`, `exam`, `utm_source`, `utm_campaign`, `locale`, `platform`, `is_logged_in`, `is_paid`, `plan_type`; empty values dropped.
  - `exposure`: tracking callback → `$exposure { flag_key, variant }` + user property `exp_<key>`; once per experiment+variant per page; try/catch.
  - `client`: `resolveConfig` (null = experiments off), `createExperimentsClient` with 500 ms init timeout; any error or type mismatch → control.
  - `react`: `createExperimentsHooks({ getClient, configured })` → `useExperimentValue`, `ExperimentText`. No provider: the SDK is only loaded on pages that mount an experiment element. `ExperimentText` is `visibility:hidden` (space kept, no layout shift) only while the assignment is unknown (≤ 500 ms) and only when configured + enabled; it never swaps after settling; copy is trimmed plain text, max 60 chars, else control.
- `apps/landing/src/lib/experiments.ts`: lazy singleton; Amplitude via the existing `logAmplitudeEvent` / `setUserProperties` (queued until the deferred init). The first pilot put `<ExperimentText flagKey="lp_all_cta_copy_202611" control={t.startFree} enabled={locale === defaultLocale} />` into `CourseCard.tsx` (English only) and was verified (§8); it was then removed again, so no landing page renders an experiment today. To run a landing test, use `ExperimentText` / `useExperimentValue` from this file.
- **Dashboard QA page `/growthbook-test`** (`app/[locale]/(public-pages)/growthbook-test/page.tsx` + `components/features/growthbook-test/GrowthbookTest.tsx`): shows an "Old card" or a "New card" from the String flag `dash_all_test_card_202611` (`old` / `new`) plus a debug panel (flag, `user.uuid`, the `user_id` GrowthBook holds, status, value served, card shown). 404 in production unless `NEXT_PUBLIC_ENABLE_GROWTHBOOK_TEST=true` (same pattern as `/animation-preview`). English only (QA page, like animation-preview). Nothing is shown until the answer is known (space is kept, no old-then-new flicker); the experiment component is `key`ed by `user.uuid` so it is re-evaluated when the server-confirmed user differs from the cached one.
- **Targeting by user, never by phone.** Only `user_id` (= `users.uuid`) is sent; the phone number is not an attribute. Reason: GrowthBook rules are served from a PUBLIC CDN URL that anyone can open with the client key (verified by reading our own payload), so a phone number in a rule would be public. A uuid identifies nobody. Get the uuid with `SELECT phone, uuid FROM users WHERE phone IN (...)` (production DB: run by the user / backend owner).
- `apps/dashboard/src/lib/experiments.ts` + `experiment-user.ts`: same pattern; `AnalyticsProvider` calls `setExperimentUser({ user_id, is_logged_in: true })`; `lib/analytics/browser.ts` gained `trackReservedEvent` and `setAnalyticsUserProperty` (exact event name, same gating as the rest of that file). No dashboard code uses an experiment element yet.
- Env (both apps, build time): `NEXT_PUBLIC_GROWTHBOOK_CLIENT_KEY`, `NEXT_PUBLIC_GROWTHBOOK_API_HOST` (`.env.example` of dashboard updated; landing's `.env.example` is git-ignored).

## 6. GrowthBook state (real, app.growthbook.io)
- Project `clearcutoff`; SDK connection `sdk_19g6dmwkflald`; client key `sdk-dIndvZ1qzJJOPrh0` (client keys are public by design); host `https://cdn.growthbook.io`; environment `production` only.
- Feature `lp_all_cta_copy_202611` (String, default `Start for free`), Revision 2 live: experiment "Landing CTA copy: Start for free vs Try it for free", hash attribute `id`, tracking key = feature key, 100 % traffic, 50/50, control `Start for free` / variation 1 `Try it for free`, no data source (results are read in Amplitude). Confirmed in the live CDN payload.
- Feature `dash_all_test_card_202611` (String, default `old`), Revision 2 live: one Force rule "QA: show the new card to one test user_id": condition (Advanced JSON, because `user_id` is not in the default attribute dropdown) `{"user_id": "7fd0a79a-6742-4850-807f-b7a4994fbb39"}` → `new`. That uuid is the local test user `9988776655`; it matches nobody in production. A Force rule does not call the tracking callback, so no `$exposure` is sent for it (only experiment rules do).
- `lp_all_cta_copy_202611` is still live in GrowthBook but nothing reads it any more. Switch it off in GrowthBook if it should not stay.
- Naming: `<surface>_<exam|all>_<what>_<yyyymm>`.
- Switching the feature or the experiment off in GrowthBook → everyone gets control without a deploy (CDN payload changes; caches follow within the SDK stale window).

## 7. To do by the user
- [ ] Coolify, landing AND dashboard, build-time vars: `NEXT_PUBLIC_GROWTHBOOK_CLIENT_KEY=sdk-dIndvZ1qzJJOPrh0`, `NEXT_PUBLIC_GROWTHBOOK_API_HOST=https://cdn.growthbook.io`, then redeploy. Without them the code is inert (everyone gets control, nothing hidden or fetched).
- [ ] Optional: `NEXT_PUBLIC_ENABLE_GROWTHBOOK_TEST=true` on the dashboard build to open `/growthbook-test` in production (404 otherwise).
- [ ] Real Android 4G screen recording for the flicker acceptance (only the user can do it).
- [ ] Merge/push to main only on the user's explicit go-ahead (pushing main auto-deploys).

## 8. Tests and verification
Done (2026-11-17):
- [x] `pnpm --filter @clearcut/experiments test`: 27 tests (real SDK, stubbed HTTP) pass; package typecheck clean.
- [x] `pnpm --filter landing typecheck` clean; eslint on touched landing files clean; `pnpm check:colors` clean (no new colours).
- [x] `pnpm --filter dashboard typecheck`: 92 errors, all pre-existing backlog, none in the touched files. eslint on dashboard touched files: 1 `any` error (`analytics/browser.ts:93`) and 1 unused-var warning (`AnalyticsProvider.tsx:18`), both on pre-existing lines.
- [x] Real browser (Playwright, 390 px, landing dev server with the real key, real GrowthBook CDN, real Amplitude traffic, `/teaching`):
  - both copies are served (8 fresh visitors: 6 variant / 2 control; earlier run 14: 10 / 4), only the two configured texts appear;
  - exactly one `$exposure { flag_key: lp_all_cta_copy_202611, variant: "0"|"1" }` per page view, matching the copy on screen; user property `exp_lp_all_cta_copy_202611` set via `$identify`;
  - no flicker (a visitor never sees two texts), nothing left hidden;
  - sticky across reload and a second page; cookie cleared + localStorage kept → same id, same copy;
  - GrowthBook CDN down, and CDN slower than 500 ms → control, no exposure event, no page error, no later swap;
  - Hindi page (`/hi/teaching`): zero GrowthBook requests, Hindi copy untouched;
  - click-through: CTA opens the login sheet as before (no OTP sent), "View more details" opens `/teaching/htet`; console 0 errors.

Dashboard (2026-11-17, local backend + the dashboard dev server with the real key, 2 local test users A=9988776655 whose uuid is in the rule and B=9988776644):
- [x] Logged-in `/dashboard` and `/dashboard/profile` load, 0 errors; zero GrowthBook requests and no GrowthBook/experiments chunk on pages without an experiment element (the SDK is lazy).
- [x] `/growthbook-test`: A → New card, B → Old card, in a fresh browser and on a normal reload; the `user_id` GrowthBook holds equals the DB `users.uuid`; one visible state per load.
- [x] Also: typecheck 92 = baseline (none in the new files), eslint and `check:colors` clean.

Two behaviours found by testing, both worth knowing before the next experiment:
1. **A change in GrowthBook reaches a returning visitor one page view late.** The SDK uses its localStorage payload cache (`gbFeaturesCache`, stale after 60 s, kept 4 h) immediately and refreshes in the background. First load after publishing: old value; the next load: new value. New visitors (no cache) wait for the network (max 500 ms, else control). If QA "does not show", reload once.
2. **Cached user.** `AuthProvider` renders the localStorage user (≤ 5 min) first and confirms it with the server 2-4 s later. If the cached user is not the logged-in one (another login on the same browser without logout), the answer was first computed for the wrong user and was never re-evaluated (reproduced: user B got A's card). Fixed in the page with `key={user.uuid}`; the remaining effect is that in that rare case the previous user's card shows for the confirmation delay. Rule for dashboard experiments targeted by `user_id`: key the experiment component by `user.uuid`.

**Not verified:**
- Production: `/growthbook-test` (404 until `NEXT_PUBLIC_ENABLE_GROWTHBOOK_TEST=true`), anything behind the live login. `testLogin` was only ever called against the local backend, never in production.
- `useExperimentValue` swapping a whole component was only exercised on the QA page; an experiment (not a Force rule) on the dashboard, including its `$exposure`, has not been run.
- LCP/CLS before/after (ticket asks for numbers), request count to the GrowthBook CDN per page view against the 1M/month quota, real Android 4G.
- Production hosts (tested on localhost with the `cc-analytics-local` opt-in), and that the events show up in the Amplitude UI (only the outgoing request was read).
- Facebook/Instagram in-app browser → Chrome escape: the cookie jars differ, so the visitor may be re-bucketed; Safari ITP caps JS-set cookies at 7 days (the id is restored from localStorage, which ITP also limits). Accepted limitations.
- Starter quota behaviour, and the feature's behaviour with a second experiment on the same page.

## 9. Security note (not part of this ticket)
`POST /api/v1/auth/testLogin` (`routes/Apis/V1/authapi.php`, `AuthController::testLogin`) has no environment guard and no auth middleware: it creates the user if needed and returns a Sanctum token for any Indian mobile number. Wherever that backend is deployed with this route, anyone can obtain a session for any phone. Reading the code only; not tested in production. Needs an owner decision (remove, or guard by `app()->environment('local')`).

## 10. Next steps
1. User sets the two env vars in Coolify and redeploys landing (and dashboard).
2. Measure LCP/CLS before/after on an ad-traffic landing page; check the first `$exposure` events in Amplitude; read the result in Amplitude after enough traffic.
3. Draft the Confluence how-to (create/read/stop an experiment, naming, one experiment per surface per exam); publish after the user picks the space.
4. Later sub-phase: Astro `/go`.

# Phase 118 — CC-192 A/B experimentation: GrowthBook Cloud (assignment) + Amplitude (analysis)

**Tickets:** CC-192 (High, assignee Muhammad Arslan)
**Repos:** CM (`apps/landing`, `apps/dashboard`, new `packages/experiments`)
**Branch:** main has `feat/cc-192-growthbook` (50a32a6) and `feat/cc-192-server-payload` (28f93b4, section 5b); `feat/cc-192-growthbook-webhook` (section 5c, instant cache expiry) is committed locally, NOT merged, NOT pushed
**Created / start date:** 2026-11-17
**Status:** Implemented and verified in a real browser against the real GrowthBook CDN (landing text experiment, dashboard per-`user_id` card test). Inert in production until the two env vars below are set in Coolify. The landing text pilot was REMOVED again from `CourseCard.tsx` at the user's request (the package and `apps/landing/src/lib/experiments.ts` stay); the dashboard QA page `/growthbook-test` is the practice surface. LCP/CLS before/after not measured. Production env vars were set on Oracle Coolify for the dashboard (2026-11-17): `NEXT_PUBLIC_GROWTHBOOK_CLIENT_KEY`, `NEXT_PUBLIC_GROWTHBOOK_API_HOST`, `NEXT_PUBLIC_ENABLE_GROWTHBOOK_TEST`; `/growthbook-test` is live on app.clearcutoff.in. Landing does not have the vars yet (no landing experiment).

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

## 5b. Server-fetched payload (follow-up, branch `feat/cc-192-server-payload`)
Client requirement (2026-11-18): keep the 5-minute cache, but the FIRST view of a new visitor must already show the right variant (not only after a refresh) and page speed must stay good.
- `packages/experiments/src/payload.ts`: `fetchFeaturesPayload({ clientKey, apiHost })` runs on the server with the Next.js data cache `next.revalidate = 300` (= the 5-minute cache: one GrowthBook request per 5 minutes per server instead of one per visitor). It never throws; no key, network error, non-200, bad JSON, wrong shape or a 1.5 s timeout all return `null`.
- `client.ts`: `createExperimentsClient({ payload })` calls `initSync({ payload })`: the SDK decides synchronously, no request, no 500 ms wait; `ready` resolves with `source: "server-payload"`. No payload (or one the SDK rejects) keeps the previous browser path (500 ms, then control), so nothing gets worse.
- Dashboard: `components/features/experiments/ExperimentsPayload.tsx` (server component, reads `NEXT_PUBLIC_GROWTHBOOK_CLIENT_KEY` / `_API_HOST`) and `ExperimentsBootstrap.tsx` (client; hands the payload to `lib/experiments.ts` `setServerPayload` before the client is created). Put `<ExperimentsPayload />` on every page that renders an experiment element (done for `/growthbook-test`). The QA page debug panel shows `source`.
- Effect: first view correct; zero GrowthBook requests from visitors (the 1M/month CDN quota stops being a concern); no hidden time except until hydration; flag changes and the kill switch reach visitors within ~5 minutes (server cache); one cache layer instead of two.
- Landing (not done): its pages are static/ISR (`revalidate` 3600 / 86400), so a payload baked into the page is as stale as the page. Before a landing experiment, the page that renders it needs `revalidate = 300`, or the payload has to come from a cached route.

## 5c. GrowthBook webhook: a flag change reaches visitors in seconds (branch `feat/cc-192-growthbook-webhook`)
Why: with the 5 minute server cache (5b) a kill switch needs up to ~5-6 minutes (the first request after the window still gets the stale copy and refreshes in the background). For sensitive pages (payment) that is too slow, so GrowthBook tells the app when something changed and the app drops the cached payload at once. The normal 5 minute cache stays for everything else.
- Docs checked 2026-11-18 (docs.growthbook.io/app/webhooks/sdk-webhooks, nextjs.org revalidateTag): the webhook is a POST fired on any change that affects the SDK connection's payload (publish, flag on/off, rule edit, experiment change); headers `webhook-id`, `webhook-timestamp`, `webhook-signature` = `v1,<base64>` of HMAC-SHA256(secret, `<id>.<timestamp>.<raw body>`), the secret used as a plain string (the docs' Node example); any non-200 is a failure and is retried up to 2 more times; Cloud calls from `52.70.79.40`. In Next.js 16, from a Route Handler, `revalidateTag(tag, { expire: 0 })` makes the next request a blocking refetch (no stale copy).
- `packages/experiments/src/webhook.ts` (`verifyWebhookSignature`, WebCrypto only, never throws, constant-time compare, 5 minute replay window, several `v1,` entries allowed). `payload.ts`: the payload fetch now carries `next.tags = ["growthbook"]` (`GROWTHBOOK_CACHE_TAG`).
- Dashboard route `POST /api/growthbook-webhook` (`apps/dashboard/src/app/api/growthbook-webhook/route.ts`): 503 when `GROWTHBOOK_WEBHOOK_SECRET` is not set (never accepts unsigned calls; GrowthBook retries), 413 over 1 MB, 401 on a bad/missing/expired signature, 405 for GET, 200 `{revalidated:true}` after `revalidateTag("growthbook", { expire: 0 })`. The body is not parsed or trusted: a valid signature only means "something changed, refetch".
- Env (dashboard, RUNTIME only, server-side, never `NEXT_PUBLIC_`): `GROWTHBOOK_WEBHOOK_SECRET` = the secret GrowthBook shows for the webhook (SDK Connections > the connection > Webhooks). Landing does not need it (no landing experiment, ISR pages).
- Setup (after this is deployed): GrowthBook > SDK Configuration > SDK Connections > ClearCutOff web > Webhooks > Add webhook, URL `https://app.clearcutoff.in/api/growthbook-webhook`, method POST, payload type "Standard (no SDK Payload)" (smaller; the body is ignored anyway); copy the shared secret into Coolify (dashboard app, runtime variable `GROWTHBOOK_WEBHOOK_SECRET`) and redeploy; check the delivery status under the SDK connection.
- Limits: the webhook is GrowthBook calling us, it does not use the CDN request quota (1M/month). Each change makes the next page view refetch once (1 CDN request); the baseline is at most one request per 5 minutes per server (~8,600/month). Even 1,000 flag changes a month add ~1,000 requests: far below 1M. The webhook fires for ANY change on the SDK connection, so an unrelated flag edit also drops the cache once (harmless).
- Tests: 6 unit tests (`webhook.test.ts`, vector computed independently with Node's `createHmac`: valid, several signatures, wrong secret, tampered body, different id/timestamp, malformed headers, replay older/newer than 5 minutes), `payload.test.ts` also checks the tag. Local end-to-end (real Next.js dev server and its real data cache, a mock GrowthBook features endpoint so the cache can be proven without publishing real flags), 14 of 14 checks: first view asks GrowthBook once, second view is cached (0 requests), a change without the webhook is NOT seen, GET 405, no/wrong/tampered/1-hour-old signature all 401 and leave the cache alone, a correctly signed webhook returns 200 and the VERY NEXT page view has the new payload (158 ms) with exactly one new request, then it is cached again.
- Not verified: a real delivery from GrowthBook (signature format with the real secret: the docs show a plain-string secret, the Standard Webhooks spec uses base64, so confirm on the first real delivery and fix the key handling if GrowthBook shows 401), whether the Starter plan allows the webhook (the "Add webhook" button is active on the SDK connection, not tried), the real timing from "flag off" to "Old card" on production, and a single server instance (the cache is per instance; Coolify runs one container for the dashboard today).

## 6. GrowthBook state (real, app.growthbook.io)
- Project `clearcutoff`; SDK connection `sdk_19g6dmwkflald`; client key `sdk-dIndvZ1qzJJOPrh0` (client keys are public by design); host `https://cdn.growthbook.io`; environment `production` only.
- Feature `lp_all_cta_copy_202611` (String, default `Start for free`), Revision 2 live: experiment "Landing CTA copy: Start for free vs Try it for free", hash attribute `id`, tracking key = feature key, 100 % traffic, 50/50, control `Start for free` / variation 1 `Try it for free`, no data source (results are read in Amplitude). Confirmed in the live CDN payload.
- Feature `dash_all_test_card_202611` (String, default `old`), Revision 2 live: one Force rule "QA: show the new card to one test user_id": condition (Advanced JSON, because `user_id` is not in the default attribute dropdown) `{"user_id": "7fd0a79a-6742-4850-807f-b7a4994fbb39"}` → `new`. That uuid is the local test user `9988776655`; it matches nobody in production. A Force rule does not call the tracking callback, so no `$exposure` is sent for it (only experiment rules do).
- The user practised the kill switch on this flag (Revision 3, 2026-11-17: production OFF, published; the flag disappears from the CDN payload and everybody gets control). Revision 4 (2026-11-18) switched production back ON for the server-payload tests. Environment on/off: Overview > Enabled Environments > Change ("Publish now" or a draft); a published revision also has "Roll back".
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
1. **In the browser-fetch design a GrowthBook change reaches visitors late: up to ~5-10 minutes plus a reload.** Two caches stack: the SDK localStorage payload (`gbFeaturesCache`, stale after 60 s, kept 4 h; the cached answer is used immediately and refreshed in the background) and the browser HTTP cache of the CDN answer (`Cache-control: public, max-age=300, stale-while-revalidate=3600`, read from the live header). Verified on production: after the flag was switched off and published, the CDN payload dropped it within seconds, but the browser kept showing the New card until the 5 minutes were over, then Old. A new visitor (no cache) waits for the network for max 500 ms, else control, so the first view often shows control and only a refresh shows the variant. Both effects are removed by section 5b.
2. **Cached user.** `AuthProvider` renders the localStorage user (≤ 5 min) first and confirms it with the server 2-4 s later. If the cached user is not the logged-in one (another login on the same browser without logout), the answer was first computed for the wrong user and was never re-evaluated (reproduced: user B got A's card). Fixed in the page with `key={user.uuid}`; the remaining effect is that in that rare case the previous user's card shows for the confirmation delay. Rule for dashboard experiments targeted by `user_id`: key the experiment component by `user.uuid`.

Server payload (2026-11-18, branch `feat/cc-192-server-payload`; local backend, dashboard dev server, the real GrowthBook payload):
- [x] `pnpm --filter @clearcut/experiments test`: 37 tests (10 new in `payload.test.ts`, real SDK): `initSync` decides with NO fetch (targeted user gets `new`, others `old`); a flag missing from the payload gives control; an experiment rule tracks exactly one exposure; no payload keeps the old browser path; every `fetchFeaturesPayload` failure mode returns `null` (HTTP error, network error, bad JSON, wrong shape, timeout, no key). Package typecheck clean.
- [x] Dashboard typecheck 92 = baseline (none in the changed files), eslint and `check:colors` clean.
- [x] Browser (Playwright, flag ON, rule on the user_id of A): A as a fresh visitor (all storage wiped) gets the New card on the FIRST load, 3 of 3; B gets the Old card, 2 of 2; `source: server payload` every time; 0 browser requests to cdn.growthbook.io, and the same result with that host blocked in the browser; with a stale cached user (A/B swapped without logout) the final card is correct.
- [x] The 5-minute cache showed itself: right after switching the flag ON the first fresh visit still got Old (the server payload from before the change), then New once the window was over. That is the requirement, not a bug.
- Not measured: LCP/TTFB before/after on a production build (dev server TTFB was ~200-420 ms and the card was visible ~700-900 ms after navigation start; dev numbers only).

**Not verified:**
- The server-payload branch is not on production yet (production still uses the browser fetch).
- Production: `/growthbook-test` (404 until `NEXT_PUBLIC_ENABLE_GROWTHBOOK_TEST=true`), anything behind the live login. `testLogin` was only ever called against the local backend, never in production.
- `useExperimentValue` swapping a whole component was only exercised on the QA page; an experiment (not a Force rule) on the dashboard, including its `$exposure`, has not been run.
- LCP/CLS before/after (ticket asks for numbers), request count to the GrowthBook CDN per page view against the 1M/month quota, real Android 4G.
- Production hosts (tested on localhost with the `cc-analytics-local` opt-in), and that the events show up in the Amplitude UI (only the outgoing request was read).
- Facebook/Instagram in-app browser → Chrome escape: the cookie jars differ, so the visitor may be re-bucketed; Safari ITP caps JS-set cookies at 7 days (the id is restored from localStorage, which ITP also limits). Accepted limitations.
- Starter quota behaviour, and the feature's behaviour with a second experiment on the same page.

## 9. Security note (not part of this ticket)
`POST /api/v1/auth/testLogin` (`routes/Apis/V1/authapi.php`, `AuthController::testLogin`) has no environment guard and no auth middleware: it creates the user if needed and returns a Sanctum token for any Indian mobile number. Wherever that backend is deployed with this route, anyone can obtain a session for any phone. Reading the code only; not tested in production. Needs an owner decision (remove, or guard by `app()->environment('local')`).

## 10. Next steps
1. Merge `feat/cc-192-growthbook-webhook` (production deploys on push), create the webhook in GrowthBook, put `GROWTHBOOK_WEBHOOK_SECRET` in Coolify, redeploy, then flip the test flag and time how long the Old card takes to appear (target: seconds). Then measure LCP/TTFB before/after on a production build.
1b. Landing: set the two env vars in Coolify only when a landing experiment exists, and give that page `revalidate = 300`.
2. Measure LCP/CLS before/after on an ad-traffic landing page; check the first `$exposure` events in Amplitude; read the result in Amplitude after enough traffic.
3. Draft the Confluence how-to (create/read/stop an experiment, naming, one experiment per surface per exam); publish after the user picks the space.
4. Later sub-phase: Astro `/go`.

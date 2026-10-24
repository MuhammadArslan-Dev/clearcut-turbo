# Phase 38 — CC-95 (rest): Sentry errors on signup, onboarding and payment say which page and language

**Status:** Built + verified locally (2026-10-24), branch `phase-38-cc95-sentry-tags` (on top of Phase 37). Not pushed. Source-map check + top-5 list after a week still open.
**Jira:** [CC-95](https://clear-cutoff.atlassian.net/browse/CC-95)
**Repos:** CM `apps/dashboard`, `apps/landing`
**Size:** small

## What is left of the ticket
- `crossorigin` on Razorpay was declined on 2026-10-23 (user's decision, Phase 34), so payment-page "Script error." stays unreadable. That part is closed.
- **Still to do:**
  - Every Sentry event on signup (`/start`), onboarding and payment pages gets the tags `page` and `language`.
  - Confirm that production builds upload source maps.
  - After a week, list the top 5 real errors.

## Plan
- [ ] Dashboard: in `lib/sentry/sentry-shared.ts` (the one place the three runtimes share), add a `beforeSend` step that sets:
  - `page`: the route group — `payment` / `onboarding` / `start` / other, taken from the URL path without the locale prefix.
  - `language`: `en` / `hi` / `mr`, from the locale prefix.
- [ ] Landing: the same two tags in its `lib/page-errors.ts` Sentry init (`/start`, `/onboarding` live there).
- [ ] The tag values come from the path only, never from query strings, so the `token`/`otp` scrubbing in `redact.ts` stays the only path for request data.
- [ ] Source maps: check that `SENTRY_AUTH_TOKEN` is set in Coolify for dashboard and landing. That is a check, not a code change; the user runs it on the server.
- [ ] One week after deploy: pull the top 5 issues by users for `page:payment|onboarding|start` with the Sentry MCP. Post them on CC-95.

## Verification
- In local dev with a test DSN: throw on `/hi/onboarding`, `/payment/initiated` and `/mr/start`. The event shows `page` and `language` tags, and no query values.

## What was built
- `packages/error-reporting/src/page-tags.ts`:
  - `pageTags(url, locales, defaultLocale)` → `{ page: payment|onboarding|start|other, language }`, from the path only.
  - `tagPage(event, …)` reads `request.url` (browser) or `contexts.nextjs.request_path` (server).
  - Tests: `page-tags.test.ts`, including "never copies the query string".
- Landing: browser `lib/page-errors.ts` and server `instrumentation.ts` call it in `beforeSend`, right after `scrubSensitiveData`.
- Dashboard: its own `tagPage` in `lib/sentry/sentry-shared.ts` (dashboard keeps its own copies). It is called from the three runtimes' `beforeSend` (`instrumentation-client.ts`, `sentry.server.config.ts`, `sentry.edge.config.ts`).
- A `/en/...` prefix counts as English too.

## Verification (2026-10-24)
- error-reporting tests 31/31. The dashboard copy, run on sample events:
  - `/payment/initiated?token=…` → payment/en
  - `/hi/onboarding` → onboarding/hi
  - server `/mr/payment/failed?otp=…` → payment/mr
  - existing `runtime` tag kept
- Typecheck clean (dashboard, landing, error-reporting). Lint: no new problems (2 old `any` errors in `sentry-shared.ts` remain).
- **Not verified end to end:** no Sentry DSN locally. After deploy, look for the `page` / `language` tags on a new issue.

## For the user (server)
- Coolify → dashboard and landing → Environment: check that `SENTRY_AUTH_TOKEN` is set, so stack traces are not minified.
- One week after deploy: top-5 issues for `page:payment`, `page:onboarding`, `page:start` (Sentry MCP), posted on CC-95.

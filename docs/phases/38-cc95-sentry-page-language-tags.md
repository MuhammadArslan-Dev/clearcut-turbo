# Phase 38 — CC-95 (rest): Sentry errors on signup, onboarding and payment say which page and language

**Status:** Planned (2026-10-24)
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

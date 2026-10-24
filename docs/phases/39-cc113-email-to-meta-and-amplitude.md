# Phase 39 — CC-113: the student's email (Truecaller and others) goes to Meta and Amplitude

**Status:** Planned (2026-10-24)
**Jira:** [CC-113](https://clear-cutoff.atlassian.net/browse/CC-113)
**Repos:** CM `apps/dashboard`, `apps/landing`, `packages/auth`; BE (read only, unless `/auth-user` lacks `email`)
**Size:** small–medium

## What the user asked (2026-10-24)
- Truecaller gives us the email; send it to Meta and Amplitude.
- If the user has an email, send it; if not, send nothing ("null").

## What the code shows
- BE `AuthController` (Truecaller login) already saves `onlineIdentities.email` into `users.email` when it was empty. The email is lower-cased, validated, and skipped if another account already uses it. Manual entry on the account page also writes `users.email`.
- So `users.email` is the one place to read the email from, whatever its source.
- **Meta:**
  - Pixel advanced matching sends only `ph` + `external_id` today. The cached user is read in dashboard `lib/analytics/facebook-pixel.ts` and `components/thirdparties/FacebookPixel.tsx`, and in landing `FacebookPixel.tsx` + `packages/auth`.
  - There is **no Meta CAPI** in the backend, so the ticket's "CAPI" part has nothing to attach to.
- **Amplitude:** dashboard `lib/analytics/browser.ts` sets user properties with `Identify` after `setUserId`. Landing `services/analytics.ts` has `setUserProperties`.

## Plan
- [ ] Pixel: add `em` next to `ph` wherever the cached user is turned into advanced-matching data. Plaintext, trimmed and lower-cased; the Pixel hashes it.
  - Only when it is a real email. Skip empty values, invalid ones, and placeholders: `test@`, `noreply@`, or `<phone>@…` from the payment gateway.
  - No email → no `em` key at all. Meta's rule: never an empty or hashed-empty value. That is what "null" means on the Meta side.
- [ ] Remember the Meta Pixel quirk from 2026-10-08: advanced matching is read only from the FIRST `init()`. So `em` must go into the same first-init data as `ph`.
- [ ] Amplitude: user property `email` set to the email when present. When absent, `unset` (Amplitude has no null value). Use the same `Identify` call as today, in dashboard and landing.
- [ ] Check that `/auth-user` (dashboard) and the auth package's user object include `email`; if not, add it to the BE resource.
- [!] **Not in this phase:** a server-side Meta CAPI (the ticket's server part). It does not exist yet and is its own piece of work. Say so on CC-113.

## Verification
- Test user with an email (set it on the account page locally) and one without:
  - `fbq` init payload contains `em` / doesn't.
  - Meta Pixel Helper or the request query shows advanced matching.
  - Amplitude `Identify` request contains `email` / `$unset`.
- Production check after deploy: Events Manager → Test Events shows `em` for a logged-in test account. Compare EMQ after 7 days (baseline: Purchase 7.6, CompleteRegistration 7.8).

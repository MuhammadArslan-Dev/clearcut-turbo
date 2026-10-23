# Phase 31 — CC-54 + CC-89: the newest OTP fills in, and students stay in the language they chose

**Status:** Not Started
**Jira:** [CC-54](https://clear-cutoff.atlassian.net/browse/CC-54) (with [CC-86](https://clear-cutoff.atlassian.net/browse/CC-86)), [CC-89](https://clear-cutoff.atlassian.net/browse/CC-89)
**Repos:** CM `packages/auth` (OTP screens), `apps/landing` (StartAuthForm, /start), `apps/dashboard` (onboarding locale), ASTRO (`/mr` → `/mr/start` links)
**Size:** medium

## What the tickets say
**CC-54** (no description; title + CC-86):
- When a new OTP is triggered (resend), the keyboard/SMS auto-read should fill the **new** OTP, not the old one.
- **CC-86 (related, not in this batch):**
  - One input with `autocomplete="one-time-code"` and auto-submit.
  - Web OTP API on Android Chrome.
  - Show where the OTP was sent, resend timer, SMS/WhatsApp resend.
  - October verify rate is 69%.

**CC-89 — students are switched to a language they didn't choose:**

| Language | Signup sessions | Onboarding sessions |
|---|---|---|
| Marathi | 143 | 286 |
| English | 705 | 1,148 |

- **What Clarity shows:**
  - `/hi/onboarding?lang=hi` redirects to `/mr/onboarding` in 0.07 s.
  - Hindi signup → English onboarding.
  - Marathi ad → English `/start`.
  - `?lang=` (empty).
- **Rule:** the language comes from the page the student came from and carries through landing → /start → onboarding → dashboard. Never auto-detect once known; an empty `lang` uses the previous page's language. Marathi pages link to `/mr/start`. Save the language on the user at signup.

## What the code shows (2026-10-23, first pass)
- **OTP screens:** `packages/auth/src/screens/*` (+ landing `StartAuthForm`). Check whether a Web OTP `AbortController` is kept per request, and whether the input clears on resend.
- **Locale:** `packages/i18n/routing.ts` (en/hi; dashboard has mr too), dashboard `src/proxy.ts` (next-intl middleware, "detection off" per its CLAUDE.md), onboarding `?lang=` handling, `appLanguage` store.
- **ASTRO:** `/go` `StartLinkEnhancer` builds `/start` links per locale.

## Plan
- [ ] **CC-54:**
  - On resend: abort the previous `navigator.credentials.get({otp})`, clear the field, and start a new one.
  - Ignore an auto-read OTP that arrives for an older request (match by request time).
  - Test on Android Chrome (Web OTP) and iOS Safari (one-time-code).
- [ ] **CC-89:**
  - Trace every hop for hi/mr/en (landing → /start → OTP → onboarding → dashboard) with Playwright and log each URL + `lang`.
  - Find the redirect to `/mr` and the empty `lang=`.
  - Pass the locale explicitly and never read the browser/phone language.
  - Save the user's language at signup (BE field if one exists).
- [ ] **CC-89:** ASTRO/landing Marathi CTAs → `/mr/start` (check every /mr page).
- [!] 🛑 **D1:** if the BE has no user language field, add one (migration) or keep it client-side?
- [ ] **Verify:**
  - Playwright hi → hi, mr → mr, en → en across all steps.
  - The empty-lang URL keeps the previous language.
  - Resend → the new OTP fills (simulated Web OTP).

## Decision log
| Date | Item | Decision | By |
|---|---|---|---|
| | | | |

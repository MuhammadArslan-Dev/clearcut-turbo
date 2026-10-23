# Phase 31 — CC-54 + CC-89: the newest OTP fills in, and students stay in the language they chose

**Status:** Built + verified locally (2026-10-23), CM `phase-31-otp-language`. Not merged.
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

## What was found (2026-10-23)
- **CC-54:**
  - WebOTP (`navigator.credentials.get`) is already off (20 Oct; the SMS lacks the `@host #code` line). Autofill is the keyboard's one-time-code chip.
  - On Resend none of the three OTP screens (`otp-screen`, `inline-auth-flow`, landing `StartAuthForm`) cleared the field or remounted it. The old code stayed in it, and the keyboard kept offering the old SMS's code.
- **CC-89:**
  - `inline-auth-flow` (landing/blog onboarding login) read the language from `localStorage "locale"`, which nothing in the monorepo writes. Always `""`: `?lang=` empty and **English onboarding for every Hindi/Marathi signup** through that flow. The other screens use the page's path.
  - A returning student (has a course) was always sent to `/dashboard` (English), whatever the page's language.
  - Live `/mr/go/*` and `/hi/go/*` CTAs already point to `/mr/start` / `/hi/start` (CC-106). Dashboard routing has `localeDetection: false` and nothing else rewrites the locale from storage, so no ASTRO/dashboard change was needed.
- **Security note (not changed, user's instruction):**
  - `POST /api/v2/auth/varify-otp` and `/api/v2/auth/resend/otp` return a Sanctum token for any phone with no OTP check and no auth. That is account takeover by phone number.
  - The user sends direct login links through them, so they stay. Proposed hardening that keeps the links working: a server-signed, short-lived token in the link, required by these routes. Needs the link format from the user.

## What was built
- **CC-54:** on a successful Resend, all three screens clear the OTP, clear the error, and remount + refocus the input (`otpFieldKey` / `otpRefocusKey`, the existing remount keys).
- **CC-89:**
  - `inline-auth-flow` uses `getCurrentLocale()` (path) like the other screens.
  - `buildPostVerifyRedirectUrl` keeps the locale prefix for `/dashboard` too.

## Verification (local)
- [x] Redirects:

  | Lang | Has a course | New student |
  |---|---|---|
  | en | `/dashboard` | `/onboarding?lang=en` |
  | hi | `/hi/dashboard` | `/hi/onboarding?lang=hi` |
  | mr | `/mr/dashboard` | `/mr/onboarding?lang=mr` |

- [x] Browser: `/hi/dashboard?token=…` and `/mr/dashboard?token=…` take the token, strip it from the URL and stay in hi/mr (Marathi title "शिका | क्लियर कटऑफ").
- [x] tsc (landing, tools) has no errors in touched files; eslint equal to main (4 = 4).
- [ ] On a phone: Resend → the keyboard chip shows the new code (Android Gboard + iOS). Ganesh.

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
| 2026-10-23 | /v2 OTP-less login routes | Keep (direct links use them); nothing is deleted | User |

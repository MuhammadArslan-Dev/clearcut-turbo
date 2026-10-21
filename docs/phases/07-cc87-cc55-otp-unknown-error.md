# Phase 07 — CC-87 + CC-55: the real reason behind OTP "unknown_error"

**Status:** Not Started
**Jira:** [CC-87](https://clear-cutoff.atlassian.net/browse/CC-87), [CC-55](https://clear-cutoff.atlassian.net/browse/CC-55)
**Repos:** CM (`packages/auth`, `packages/api`, `apps/landing` StartAuthForm, dashboard analytics types), optionally BE and RN

## Root cause (verified, 2026-10-21)

**Every web OTP failure is logged as `unknown_error`.**
- landing, blog and tools all use `createApiClient`. Its interceptor replaces the axios error with an `ApiError` (`packages/api/src/client.ts:58-68`, `errors.ts:8-58`). The status is on `.status`; there is **no `.response`**.
- `getAuthFailureReason` reads `err.response?.status` (`packages/auth/src/verification-events.ts:76`), which is always undefined.
- So 422 (wrong or expired OTP), 429 and 500 all become `unknown_error`. Only offline gives `network_error`.
- The same broken check drives the UI:
  - `/start` shows "कुछ गलत हो गया" instead of "invalid OTP", and doesn't clear the OTP (`StartAuthForm.tsx:572-586`). The Oct 20 chip fix (713ab14) never runs on /start.
  - The modal `otp-screen.tsx:228-243` has the same problem (blog, landing, tools).
  - The inline flow `inline-auth-flow.tsx:251-258` shows "Invalid OTP" for every error, even network errors.
  - Truecaller sends no `Authentication Outcome` at all.
- **Why ~12 Oct (guess):** web could never send `incorrect_otp` since the classifier landed on Sep 26 (208addf). The RN app classifies correctly. The shift is probably a traffic-mix change (more web, fewer app logins). Confirm by splitting by platform in Amplitude.

**Backend contract** (`AuthController.php:672-807`; body `{status:"error", message}`)

| Case | Response |
|---|---|
| Wrong / used OTP | 422 "Invalid OTP" |
| Expired | 422 "OTP has expired" |
| User not found / validator | 400 |
| Too many | 429 (10/min per phone, 40/min per IP) |
| Other | 500 |
| SMS provider failure | Never reaches the client: delivery is queued, login returns 200, and the user simply never gets an SMS |

- `Log::info($th)` at `Fast2SMSService.php:227` runs on every wrong OTP. It may be creating Sentry noise.

## Proposed mapping

| Backend | failure_reason | UI message |
|---|---|---|
| 422 Invalid OTP | `incorrect_otp` | errOtpInvalid; clear and refocus |
| 422 OTP has expired | `otp_expired` (new) | "OTP की समय सीमा खत्म, नया OTP भेजें" + resend |
| 429 | `too_many_attempts` | new copy |
| 5xx | `server_error` | errServer |
| 400 | `invalid_request` (new) | errGeneric |
| offline / timeout | `network_error` / `timeout` (new) | errNoInternet |
| Zod / other | `client_error` (new) | errGeneric |

## Plan
- [ ] Add a shared `getHttpStatus(err)` (`err.status ?? err.response?.status`) in `verification-events.ts`. Use it in the classifier **and** in the UI branches (StartAuthForm, otp-screen, inline-auth-flow).
- [ ] Distinguish expired from invalid by message, or by `error_code` (see D2).
- [ ] Sentry: report only `server_error` and `client_error`/`unknown_error`, tagged `auth_step=otp_verify`. Inert until `NEXT_PUBLIC_SENTRY_DSN` is set.
- [!] 🛑 **D1:** add new reasons (`otp_expired`, `timeout`, `invalid_request`, `client_error`), or keep the existing 5? New values also need dashboard `lib/analytics/events/auth.ts:57-63` and the RN union.
- [!] 🛑 **D2:** should the backend add a machine-readable `error_code` (additive; `message` stays for RN), or keep string-matching the message?
- [!] 🛑 **D3:** add an Authentication Outcome event for Truecaller logins?
- [!] 🛑 **D4:** add an event for OTP **send** failures? Today `/login` failures (429/500) all show errLoginFailed and fire nothing. This is part of the 65% send rate in CC-84.
- [!] ⚠️ **System impact:**
  - `packages/auth` is shared by blog, landing (modal, inline onboarding, /start) and tools. Verify each login.
  - Amplitude: from release day `unknown_error` drops and `incorrect_otp` appears for web. **Annotate the Amplitude charts**; web history since Sep 26 can't be split.
- [ ] 📞 **C1:** RD: hi/mr/en copy for wrong / expired / too-many-attempts. Is an annotation on the dashboards OK?
- [ ] After 1 week: share the failure-reason breakdown with RD (ticket requirement).
- [ ] Verify locally: wrong OTP → `incorrect_otp` + correct message; expired; 429 (hit 10 verifies); offline. Check the event payloads in the console.

## Decision log
| Date | Item | Decision | By |
|---|---|---|---|
| | | | |

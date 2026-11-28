# Phase 134 — Login funnel: lost success events, /start gap, storage crash, OTP delivery

**Tickets:** (new, from user, 2026-11-28) — follows the login drop investigation of the same day; related docs/phases/123
**Repos:** CM (apps/landing, packages/auth) · BE (clearcutoff-main-backend)
**Branch:** `fix-login-tracking-otp` in CM and in BE — not committed, not pushed
**Created / start date:** 2026-11-28
**Status:** In Review — all four fixes built; fix 1 completed with a server-side event (option a); verified locally with stubs; nothing committed

---

## 1. Problem / objective
The login funnel in Amplitude showed a 46% drop after "OTP sent". Investigation (3 read-only agents: code, Amplitude, backend + Sentry) found most of it is tracking loss, not users:
- `Authentication Outcome: successful` is lost when the page redirects to the dashboard before Amplitude sends it. Outcome/Sent was 70–85% until 11-04, 24–40% from 11-05/06 to 11-19, 77–84% since the 11-20 flush fix; of the users still shown with no outcome, 55% started a test the same day. Real post-OTP drop ≈ 11% of OTP-sent users (November).
- The real drop is before the OTP: `Authentication Initiated` fires on /start page load; 29.8% never request an OTP (iPhone 37%, Facebook in-app 44%) and nothing records whether they typed.
- `/start` crashes on `localStorage` SecurityError in in-app browsers (Sentry CLEARCUTOFF-PUBLIC-4/5/8); the guard fix `6430f4d` was reverted on 11-19 (`a0f403a`).
- Backend answers "OTP sent" once the job is queued; AuthKey success is judged by HTTP 2xx only, no delivery record (AuthKey 404s on 2026-11-18 evening, Sentry LARAVEL-BACKEND-H8).

## 2. Scope
- **In:** (1) success event survives the redirect on every login surface (/start, modal, shared OTP screen, inline flow, Truecaller); (2) events that explain the /start pre-OTP gap, reusing existing event names; (3) storage guards so blocked storage never crashes or blocks login; (4) backend: AuthKey response parsed, failures visible and falling back, real vendor recorded.
- **Out:** UI/design changes, OTP rules (length, expiry, throttle), WebOTP auto-read, SMS provider change, any production DB or Amplitude/GrowthBook change, deploy.

## 3. Implementation plan
- [~] FE (Opus agent, CM): fixes 1–3 in `apps/landing` + `packages/auth` (additive, blog/tools unchanged).
- [~] BE (Sonnet agent): fix 4 in `CommunicationService` / `SendOtpNotificationJob` / `Fast2SMSService`, no response-contract change, no migration unless unavoidable.
- [ ] Review both diffs, run checks, Playwright verification (Sonnet agent) on landing /start and the modal.
- [ ] Update DEVELOPMENT_RULES / CLAUDE.md where a rule changed; report; commit/merge only on the user's go-ahead.

## 4. Progress / completed changes
- 2026-11-28: investigation done, branches created, agents started.
- 2026-11-28 BE (Sonnet agent, reviewed): `app/Services/Communication/GatewayResponseParser.php` (+ `tests/Unit/GatewayResponseParserTest.php`, 7 tests), `CommunicationService` (`sendOtpSms` / `sendOtpWhatsApp` return a parsed result; a 2xx with an explicit error body is "not sent" so the Fast2SMS fallback fires; secrets stripped from exception logs), `Fast2SMSService::sendOTPWithResult`, `SendOtpNotificationJob` (optional `otpId`, `otp_vendor` = AUTHKEY / FAST2SMS / FAILED, error "OTP SMS not delivered by any gateway" only when both gateways fail on the last attempt). No contract change, no migration. AuthKey success shape from 48 real log lines: `{"LogID","Message":"Submitted Successfully"}` (31) or an EMPTY 2xx body (17, still counted as sent). AuthKey publishes no error body: the error markers are a guess.
- 2026-11-28 FE (Opus agent, reviewed): fix 1 `flushAmplitudeBeforeUnload` (beacon transport + flush, cap 600 ms) in landing `services/analytics.ts`, optional `beforeRedirect` hook in `@clearcut/auth` (`redirect.ts`, cap 1500 ms; OTP screen, modal Truecaller, InlineAuthFlow), `packages/utils/src/settle-within.ts`; fix 2 `Authentication Form Interacted` (`phone_started` / `phone_completed` / `submit_invalid` + `validation_error`) via `createFormInteractionTracker` (`verification-events.ts`), also fired by the shared login screen (blog/tools modals); fix 3 `packages/utils/src/safe-storage.ts`, guards in `token.ts`, `truecaller.ts`, `inline-auth-flow.tsx`, `new-user-flag.ts`, `StartAuthForm.tsx`, landing `api/axios.ts`, and `useHydrateStore` tolerates a store without `persist` (crashed every page mounting AuthModal when storage is blocked).
- 2026-11-28 Playwright (Sonnet agent, Chromium 390px, backend + Amplitude STUBBED so no SMS and no real events): happy path /start, /hi/start and the modal send the success event 20–56 ms before the navigation; wrong OTP / send 500 / hung send, double actions, form events, blocked storage (incl. Instagram UA) and layout pass.

- 2026-11-28 fix 1, option (a), server-side: BE `AmplitudeEvent::AuthenticationOutcome`, `UserService::trackAuthSuccess()` + pure `authSuccessProperties()` (`outcome: successful`, `auth_method` phone_otp / truecaller, `platform`, `tracked_by: server`, attribution_*), called from `verifyUser()` (first verification and every Truecaller login) and from `varifyOtp`'s returning-user branch; `tests/Unit/AuthSuccessPropertiesTest.php`. Queued through the existing `AmplitudeService::track` (insert_id fixed at dispatch). FE `verification-events.ts`: client success and failed outcomes carry `tracked_by: "client"`. Reading it: unique users of `Authentication Outcome` (outcome = successful) is now complete; for event totals filter `tracked_by = server`. Failed outcomes stay client-only.

## 5. Decision log
| Date | Question | Answer (who) |
|---|---|---|
| 2026-11-28 | Apply all four fixes, using Sonnet/Opus agents | yes (user) |
| 2026-11-28 | Fix 1 still loses the event on a slow network: server (a), dashboard (b) or accept (c)? | (a) track on the server (user) |
| 2026-11-28 | Remove the browser's success event? | No: kept (old app builds send it anyway, and it carries page context); both copies are marked `tracked_by` (me, to confirm) |

## 6. Blockers / risks
- ⚠️ `packages/auth` is shared by landing, blog and tools: changes must be additive (§5).
- ⚠️ Login is the top of the paid funnel: no behaviour change for the user, only tracking, guards and backend visibility.
- ⚠️ Backend: never send real SMS in tests, never run `RefreshDatabase` tests against `clearcut`, AuthKey response format must come from docs/logs, not guesses.
- Why the loss got worse on 11-05 is still unknown.
- 🛑 **Fix 1 does not cover its main case.** With an earlier Amplitude upload still in flight, or the SDK not started yet, the success event is NOT sent (the SDK skips flush; the 50 ms retries did not help); the redirect still happens at ~620 ms. On a normal network the old `flushAmplitude(500)` probably passed too, so the gain on /start is unproven; the proven gain is the modal / shared OTP screen. Options: (a) track `Authentication Outcome: successful` on the SERVER at OTP verify, like `Signed Up` (recommended; needs the browser event removed or renamed to avoid double counting), (b) track it in the dashboard on arrival with `?token=`, (c) accept the remaining loss.
- Blocked-storage test needed the dev-only `agentation` toolbar (`DevAgentation.tsx`) excluded; it is not in production.
- Pre-existing: a submit within 100 ms of the 10th digit sends 2 OTP requests (auto-submit timer + tap, no re-entry guard in `handleLogin`). Not fixed here.

## 7. Dependencies / packages added
None expected.

## 8. Tests and verification
- [ ] Baseline measured on the OLD code (is the success request sent before the redirect: yes/no, per surface)
- [ ] Break-it pass (§8.1)
- [ ] **Not verified:** the server event in a real Amplitude funnel (does it join `Verification Sent` for RETURNING users whose browser was never linked to their uuid? new signups are linked at OTP send), production `AMPLITUDE_ENABLED` + queue worker, real Amplitude ingestion of beacon payloads, real phone / FB-IG in-app browser, Truecaller and InlineAuthFlow paths, modal under blocked storage, backend retry and both-gateways-fail paths (read-through only), real AuthKey error bodies, old-code comparison

## 9. Next steps
User decides the fix 1 option (a / b / c); then commit, and merge only on the user's go-ahead. Production follow-ups: Sentry alert on "OTP SMS not delivered by any gateway", ask AuthKey for error formats, watch the queue worker and `failed_jobs`.

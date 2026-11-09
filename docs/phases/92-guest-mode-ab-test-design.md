# Phase 92 — Guest mode A/B test (DESIGN ONLY — no code)

**Tickets:** CC-179 (Medium, queue 19) — "let ad visitors explore first, ask for OTP only on key actions"
**Repos:** BE (largest piece), CM (`apps/landing`, `apps/dashboard`, `packages/auth`)
**Branch:** none — documentation only this round
**Created / start date:** 2026-11-09
**Status:** Blocked – Decision — the user chose "phase file + plan only, no code" (2026-11-09)

---

## 1. Problem / objective
Ad visitors must give phone + OTP **before** seeing anything. In 90 days about 1,770 paid sessions opened signup and never entered the app; recordings show landing → signup → landing loops (https://clarity.microsoft.com/player/o8pe7lwvxo/1sy40zy/1um1lke). Test: Control = today's flow; Variant = the landing button opens the app as a guest (choices in a cookie), OTP only on key actions (download notes, start a test, play a video), then continue where they were and save guest choices to the account. 50/50 on one exam's ad traffic (avoid CTET while it is scaled before the exam).

## 2. Scope
- **In:** this design, risks, phased breakdown, decisions, prerequisites.
- **Out (this round):** any code.

## 3. What exists today (verified read-only 2026-11-09)
- Handoff: landing `apps/landing/src/components/pages/StartAuthForm.tsx` verifies the OTP → `setToken` → `buildPostVerifyRedirectUrl` (`packages/auth/src/redirect.ts`) → `app/{/hi|/mr}/dashboard?token=…` (has course) or `…/onboarding?token=…&lang=…&course=…&meta_lead=…`.
- Dashboard `providers/AuthProvider.tsx` reads `?token=`, `setAuthToken` (localStorage `auth_token` + cookie, `lib/auth-token-client.ts`), strips the param, renders from the 5-minute user cache, revalidates via `getMeApi`.
- The gate is **client-side**: `features/auth/ProtectedPage.tsx:36` does `window.location.href = "https://clearcutoff.in"` when `!loading && !user`; a 401 triggers `redirectToLogin()`. `src/proxy.ts` is i18n only.
- Flags: `lib/experiments/experimentFlag.ts` `getFlagVariant(key, userId)` (plain fetch to Amplitude, 10-min cache, 1.5 s timeout, never throws, **returns `null` with no `userId`**); wrappers `practiceTestFlag.ts`, `autopayFallback.ts`. Closest precedent: tools `hard_gate`/`soft_gate` (`apps/tools/src/lib/experiment.ts`, `downloadMode.ts`) + `useLoginGate`/`ToolsAuthGate` + `createAuthFeature({onAuthenticated})` (login without leaving the page).
- Phase 42 (CC-143, token out of URLs) is parked and conflicts with any new handoff — do not redo it.

## 4. Biggest risks
1. **Backend:** almost every dashboard API is `auth:sanctum`; a guest has no enrollment uuid → `get-current-course`, preparation, syllabus, notes, tests all fail. Needs new public read endpoints **or** a server-created anonymous Sanctum user merged at OTP.
2. New `isGuest` auth state vs `ProtectedPage`/401 redirect; cache/cookie semantics change.
3. Experiment identity: flags need a user id; guests have none (device id breaks "same variant after signup"); Amplitude `device_id → user_id` merge at login (`analytics/browser.ts` identifies only after login).
4. Attribution: phase 70 writes first/last touch only in `verifyOtp` → keep the guest session's utm/referrer until OTP; Meta Pixel advanced matching and `meta_lead` handoff assume login on landing; `FacebookPixel.tsx` reads `auth_user_cache` at load.
5. Onboarding/enrolment must be created at OTP time; guest actions (exam picked, progress) carried over.
6. Auth UI: reusing `packages/auth` `AuthModal`/`LoginCopy` in the dashboard breaks the "dashboard is a partial consumer, never import `@clearcut/auth`" rule → needs a deliberate exception.
7. Analytics: add a `guest_mode` property to existing events (DEVELOPMENT_RULES §2.5), no new event names. Ticket events: `guest_started`, `otp_prompt_shown` (which action), `otp_verified`.

## 5. Proposed phased breakdown (when approved)
P0 decision + backend spike (public endpoints vs anonymous user; OTP trigger list) → P1 flag (`guest_mode`, keyed on a device/landing scope id like tools) + `useGuest()` fail-open → P2 OTP gate on notes / test start / video with resume-after-login → P3 guest→user merge (attribution, Amplitude id merge, pixel re-init via `trackFacebookEventWithUserData`, onboarding) → P4 metrics/dashboards/rollout. Feasibility medium-high; a prototype is possible with the anonymous-user option + a flag; full guest browsing is multi-week and mostly backend.

## 6. Prerequisites (ticket)
- CC-84 (signup button fix) **verified first** — Jira status on 2026-11-09: **Testing** (Ganesh).
- Meta Pixel/CAPI must still fire lead + registration at OTP verify.
- CC-164 (free topic unlocks) waits for CC-133 — the two tests must not mix.

## 7. Decision log
| Date | Question | Answer (who) |
|---|---|---|
| 2026-11-09 | Do this round: phase file + plan only | user (answered) |
| 2026-11-09 | 🛑 Which actions trigger OTP (notes download, test start, video play — others?) | open |
| 2026-11-09 | 🛑 Which exam gets the 50/50 split | open |
| 2026-11-09 | 🛑 Guest model: (a) public read endpoints (less data per guest, more backend surface) vs (b) anonymous Sanctum user merged at OTP (closer to today's flow, needs cleanup/merge logic) | open |
| 2026-11-09 | 🛑 Allow a dashboard exception to import `@clearcut/auth` (AuthModal) or build a dashboard-local OTP gate | open |

## 8. Dependencies / packages added
None (design only).

## 9. Next steps
Nothing until the user answers the 🛑 items and CC-84 is verified.

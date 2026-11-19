# Phase 120 — A/B test: paper-airplane OTP wait + resend interaction on /start (GrowthBook + Amplitude)

**Tickets:** (new, from the user, no Jira key yet)
**Repos:** CM (`apps/landing`, `packages/experiments`, possibly `packages/auth`) · GrowthBook (flag, no code repo)
**Branch:** `feat/otp-airplane-experiment` (from main) — not created yet, nothing committed
**Created / start date:** 2026-11-19
**Status:** In Review (local) — implemented and tested on localhost with both variants forced; nothing committed/pushed/deployed; GrowthBook flag NOT created yet. Waiting for the user's review of the screenshots and go-ahead for flag creation / commit.

> Builds on phase 118 (GrowthBook + Amplitude experiments, DEVELOPMENT_RULES §10A) and phase 101 (Nibbu `/start` redesign). Reference design: `C:\Users\Admin\Downloads\otp-waiting-prototype-v3.html` (prototype only: its demo toolbar, fake "OTP arrives" and fake verify are NOT product).

---

## 1. Problem / objective
After the phone number is submitted, `/start` shows the OTP step. The user wants to test whether a "paper airplane" wait experience (Nibbu throws a plane when the OTP is sent, it circles above the OTP boxes while the resend countdown runs, flies back to Nibbu when the countdown ends and the Resend button becomes active) improves OTP completion and resend behaviour. Today's OTP experience stays the **control** and the default; the airplane is a **variant** shown only to learners assigned to it. No rollout and no removal of the old version before the results are reviewed and explicitly approved.

## 2. Scope
- **In:** only the airplane animation + the resend interaction of the prototype, on the page that is already built (`apps/landing/.../StartAuthForm.tsx`): plane launches from Nibbu when the OTP is sent / re-sent, circles above the OTP boxes, resend countdown shows a progress ring + the seconds, at 0 the plane returns to Nibbu, the Resend button becomes active (ring nudge), a resend relaunches the plane. A GrowthBook String flag with the existing control path untouched. Amplitude measurement (section 3.4). en/hi/mr (only existing strings are reused; no new visible copy planned). `prefers-reduced-motion` support. Unit tests + real-browser checks.
- **Out (not doing):** the prototype's layout, 4-box input redesign, bubble microcopy changes, "plane lands in the boxes / OTP arrives" animation, auto-fill/WebOTP changes, confetti, the demo toolbar, changing the OTP length (the page uses `OTP_LENGTH` and `OtpBoxInput`, kept as is). The shared `@clearcut/auth` modal OTP screen (blog/landing modal/tools) is NOT touched (see decision D1). Verify/send/resend backend calls and their error handling are unchanged. No change to the control experience. No default flip.

## 3. Implementation plan
### 3.1 What exists today (read 2026-11-19)
- `/start` = `StartAuthForm.tsx` (client island, `StartPage` is a server shell, route `app/[locale]/start`). Steps `phone` -> `otp` -> `done`. OTP send happens in `handleLogin` (calls `authApi.loginUser`, then `trackVerificationSent`, then `setStep("otp")`); resend = `handleResendOtp` (30 s `RESEND_INTERVAL`, `trackVerificationResent`); verify = `handleVerify` (`trackAuthSuccess` / `trackAuthFailure`). Nibbu is `StartMascotStage` + `useStartMascot` (`mascotRef`, `say`, `setMood`, `lookAtEl`); `otpWrapRef` wraps the OTP boxes. Resend UI is the `.resend` block at the bottom of the OTP panel.
- Existing events (Amplitude via `logAmplitudeEvent`, defined in `packages/auth/src/verification-events.ts`): `Verification Sent`, `Verification Resent`, `Verification Failed`, `Authentication Outcome` (`successful|failed`, `failure_reason`). `logAmplitudeEvent` queues until Amplitude's deferred init.
- Experiments on landing: `apps/landing/src/lib/experiments.ts` (lazy client, `useExperimentValue`). **Landing has no GrowthBook env vars in Coolify yet** and its pages are static/ISR.
- Landing visitors are logged out, so the unit is the sticky `cc_exp_id` (attribute `id`), not `user_id`.

### 3.2 Variant design (additive, control byte-for-byte)
- [ ] `start/OtpAirplane.tsx` (new, client, `"use client"`): a `position:fixed`, `pointer-events:none` flight layer (plane SVG + a light canvas trail), driven by `requestAnimationFrame`, ported from the prototype's flight engine (launch arc from the mascot, orbit above `otpWrapRef`, return to the mascot). Props: `active`, `mascotEl`, `targetEl`, `launchKey` (bumps on every OTP send/resend), `returning` (countdown reached 0). No state inside `StartAuthForm` changes shape; the component owns its animation state. Cleans up on unmount/step change/verify, reduced motion = plane parked (no flight), tab hidden = loop paused.
- [ ] `start/ResendRing.tsx` (new, tiny): the ring + seconds + ready nudge used inside the existing `.resend` button only in the variant. The control keeps today's markup exactly.
- [ ] `StartAuthForm.tsx`: ONE new hook call `useOtpAirplaneVariant()` read where the learner sees the OTP step (see 3.3), and the two small conditionals (render `OtpAirplane`; render the ring inside the resend button). No existing handler, state, request, validation or analytics call is changed or duplicated. The timer and resend logic stay the single existing `resendTimer`/`handleResendOtp`.
- [ ] `start.module.css`: classes for the ring, the plane layer and the ready nudge using existing `--s-*` / design tokens only (no new colours; the plane's blues come from tokens, `check:colors` must stay at baseline).

### 3.3 Experiment wiring (follows DEVELOPMENT_RULES §10A)
- [ ] Flag: GrowthBook String `lp_all_otp_airplane_202611` (`control` default = today / `airplane`), type String, tracking key = flag key, experiment rule hashed on `id` (anonymous `cc_exp_id`, shared cookie `.clearcutoff.in`), 50/50 (or the client's split, D3). Created with production OFF and the rule as an unpublished draft; the user/client starts it.
- [ ] Pure value file `start/otpAirplaneValue.ts` (+ unit test): flag key, `OTP_AIRPLANE_CONTROL = "control"`, `isAirplaneValue(v)` = `v === "airplane"` only (every failure path = control).
- [ ] Hook `start/useOtpAirplane.ts`: reads the flag with the landing `useExperimentValue`. It must live in a child/section that exists **only on the OTP step**, so `$exposure` fires when the learner actually sees the OTP screen, not on page load (§10A.9). The experiments client is warmed up when `/start` mounts (`getExperiments()` only creates the client and starts the load; it evaluates no flag, so it sends no exposure), so by the OTP step the answer is normally ready without waiting; if it is not ready the plane layer and the ring stay off and the page behaves as control (never swap after settling).
- [ ] Landing payload: either (a) set the two env vars in Coolify for landing and give `/start` `revalidate = 300` + the server payload (like the dashboard), or (b) use the browser path (SDK cache + 500 ms, then control) because the variant is only needed one step after the first paint. **Plan: (b) first** (no ISR/cache change on a live acquisition page); if first-OTP-view assignment rate is too low in testing, move to (a). Needs D2.
- [ ] Both variants render the same page; the variant never changes layout size (plane layer is fixed/overlay, ring uses the space the existing count text uses).

### 3.4 Measurement (Amplitude) — reuse existing events, add properties
- `$exposure { flag_key, variant }` + user property `exp_lp_all_otp_airplane_202611` are sent by `@clearcut/experiments` when the OTP step opens (the "experiment exposure" and "variant assignment").
- The same identifiers on every funnel event so both variants can be compared without joins: add to `Verification Sent`, `Verification Resent`, `Verification Failed` and `Authentication Outcome` the properties `experiment_flag` (flag key) and `experiment_variant` (`control` | `airplane`) **only on /start and only when the flag is configured** (via the existing `extra` argument / a small shared helper `experimentEventProps()` in `apps/landing`; `packages/auth` stays untouched unless D1 changes). Existing properties are unchanged. Identity: Amplitude device/user id as today (`setUserId` after signup) plus `cc_exp_id` sent as `experiment_id` on those events so a pre-signup `$exposure` and the later outcome join on one id.
- Two interaction signals with no existing event, so exactly **two** new events (justified: nothing records them today): `Resend Enabled` (countdown reached 0; props `experiment_flag`, `experiment_variant`, `resend_count`, `seconds_waited`) and `Resend Clicked` (the learner pressed Resend, before the request; props same + `resend_count`). `Verification Resent` (already exists) stays the "resend succeeded" event. Both new events fire in **both** variants (control included) so the comparison is fair. Title Case names, added to the landing catalog comment and sheet note.
- How to compare (to be documented in the result note): funnel `Verification Sent` -> `Authentication Outcome (successful)` per `experiment_variant`; resend rate = `Resend Clicked` / `Verification Sent`; time-to-verify; `Verification Failed` by variant; downstream dashboard events by `exp_lp_all_otp_airplane_202611`.

### 3.5 Tests
- [ ] Unit (vitest in `packages/experiments` is the only runner; landing has none): the pure value file and the flight-geometry/state helpers are written as pure functions and tested where a runner exists (put them in `@clearcut/experiments`-style pure modules only if the user agrees; otherwise verified in the browser).
- [ ] Real browser (Playwright, local backend, landing dev server with the real GrowthBook key and `cc-analytics-local=1`): both variants forced through a mock/real flag; plane launches on send, orbits, returns at 0, Resend enabled, resend relaunches; 30 s timing and a shortened run; reduced motion; 390 px and 1440 px; hi/mr; double tap on Resend (one request); network failure on send/resend; wrong OTP; verify success; flag absent/500 = control; assignment distribution on fresh visitors; the events and their properties in the outgoing Amplitude requests; **OTP delivery** (a real SMS needs the real gateway: see Blockers).

## 4. Progress / completed changes
- 2026-11-19 — Phase doc written after reading the prototype, `StartAuthForm.tsx`, `StartMascotStage.tsx`, `useStartMascot.ts`, `verification-events.ts`, `services/analytics.ts`, `lib/experiments.ts`. No code, no GrowthBook change, no branch yet.

- 2026-11-19 — Implemented on branch `feat/otp-airplane-experiment` (uncommitted): `start/otpAirplaneValue.ts`, `start/OtpAirplane.tsx` (flight engine, portalled to body), `start/OtpWaitExtras.tsx` (resend row, exposure, `Resend Enabled` / `Resend Clicked`, tab-title countdown, slow line), `start/start.module.css`, `start/startCopy.ts` (`say.slow` en/hi/mr), `StartAuthForm.tsx` (funnel events via `trackFunnel`, lane, warm-up), plus DEVELOPMENT_RULES §9 (agent starts dev servers / sets local env). Local `apps/landing/.env` got the two GrowthBook lines (git-ignored).
- 2026-11-19 — Matched to the reference (v3 prototype) for the parts in scope: plane gradient and trail, launch arc / orbit / banking / lazy "slow" lap / return, Nibbu throw + catch + eyes follow the plane + tap victory lap, empty lane above the OTP boxes, glowing dots in empty boxes, resend ring + `0:SS` + nudge at ready, "slow network" line a third into the countdown, tab title `(0:SS) ...`. Not copied by design: layout, the 4-box component, arrival animation, confetti, demo toolbar.

## 5. Decision log
| Date | Question | Answer (who) |
|---|---|---|
| 2026-11-19 | Which OTP screen | **`/start` (`StartAuthForm`)**: the prototype's "Step 2 of 2", Nibbu mascot, "Verify & Start" and legal line match it (me, from the code). 🛑 D1: the modal OTP screen in `@clearcut/auth` (blog, landing AuthModal, tools) is a different screen; confirm it is NOT part of this test. |
| 2026-11-19 | Which tool | You wrote "Amplitude Experiment" and also "follow our GrowthBook/Amplitude rules". DEVELOPMENT_RULES §10A says new A/B tests use **GrowthBook for assignment + Amplitude for exposure and results**; Amplitude flags are only the older tests. **Plan: GrowthBook.** 🛑 D4: confirm (an Amplitude Experiment on landing would need a new SDK + deployment key and a second assignment system). |
| 2026-11-19 | Naming | `lp_all_otp_airplane_202611`, values `control` / `airplane` (default by me) |
| 2026-11-19 | Assignment unit | anonymous `id` (`cc_exp_id`), 50/50 (default by me). 🛑 D3: confirm the split and a stop rule. |
| 2026-11-19 | Landing payload | browser path first, no ISR change (default by me). 🛑 D2: OK, or do you want the server-payload path (needs landing env vars in Coolify + `revalidate = 300` on `/start`)? Either way the landing Coolify build needs `NEXT_PUBLIC_GROWTHBOOK_CLIENT_KEY` / `_API_HOST` (not set today). |
| 2026-11-19 | New events | Only `Resend Enabled` and `Resend Clicked` are new; everything else reuses existing events with added properties (default by me, per the analytics rule). 🛑 D5: OK? |

## 6. Blockers / risks
- ⚠️ **/start is the main acquisition page.** A slow or broken variant would cost signups: the plane layer is overlay-only, paused on hidden tabs, off under reduced motion and on any error, and never touches the verify button or the OTP input focus (keyboard/Chrome one-time-code chip, CC-54 remount stay as is).
- ⚠️ Low-end Android: a canvas + rAF loop must stay cheap (trail length capped, DPR capped at 2, loop stopped when not flying). Measure frame time on a throttled CPU before asking to start.
- ⚠️ The fixed overlay plane crosses the card; in the phone one-screen layout (`useOneScreen`, `data-kb` keyboard state) the OTP row may be partly covered by the keyboard, so the orbit target must follow the OTP boxes' real position and the mascot's visibility (small mascot row on phones). Check at 390 px with the keyboard up.
- ⚠️ OTP delivery cannot be tested end to end locally without the real SMS/WhatsApp gateway; locally the backend accepts the dummy number `9988776655` (OTP `4321`). Delivery rate is not something this experiment changes: the plane is cosmetic, it must not delay or gate the send/verify calls. Real SMS tests need your phone and your OK.
- ⚠️ Fake numbers/`testLogin`: only local backend users (see phase 118 §9).
- ⚠️ Learners from the FB/IG in-app browser may be re-bucketed (accepted limitation, §10A.11).
- ⚠️ The shared `@clearcut/auth` package is not touched, so the modal OTP screen shows no airplane and sends no experiment properties. Landing's `/start` Amplitude events from the modal flow are unchanged.

## 7. Dependencies / packages added
None planned (no animation library; plain React + CSS module + `requestAnimationFrame`). Env: landing build vars `NEXT_PUBLIC_GROWTHBOOK_CLIENT_KEY` / `NEXT_PUBLIC_GROWTHBOOK_API_HOST` (user, Coolify). GrowthBook: one new flag (created OFF).

## 8. Tests and verification
- [ ] Baseline on the OLD code: OTP step layout at 390 and 1440, request list for send/resend/verify, the current events and their properties, frame cost of the page.
- [ ] Unit tests, typecheck vs baseline, eslint on touched files, `pnpm check:colors`, `pnpm --filter landing build` (needs `CMS_URL`).
- [ ] Real-browser matrix and events check from 3.5.
- [ ] Break-it pass (DEVELOPMENT_RULES §8.1).
- [x] Local (landing dev server, local backend `clearcutoff-main-backend.test`, number 9988776655, GrowthBook CDN answer forced in the browser with an experiment rule; real GrowthBook flag not touched): airplane desktop 1280x800 and phone 390x844 (plane launches, orbits above the boxes, dots light up, returns at 30 s, ring + "Resend OTP" turn active, resend relaunches); control (`weights [1,0]`): no plane, no ring, no lane, resend row identical to today, exposure variant `0`; flag absent: no exposure, nothing changes; wrong OTP: error shown, plane keeps flying, `Authentication Outcome failed` carries `experiment_flag/variant/id`; send failure (backend 429): stays on the phone step with the message; events seen: `$exposure` (1 per page), `Resend Enabled` (`seconds_waited` 31), `Resend Clicked`, `Verification Resent` with the experiment properties; slow line at 10 s, title countdown, no horizontal scroll at 390.
- [x] Static: `tsc` no errors in the touched files, eslint 0 errors (1 pre-existing warning), `pnpm check:colors` no new colours.
- Bug found and fixed by testing: the plane flew off-screen because a transformed ancestor became the containing block of `position: fixed`; the layer is now portalled to `<body>`.
- **Not verified:** the real GrowthBook flag and its split (not created), real SMS delivery, a real phone / Android 4G frame rate, reduced-motion, hi/mr screens of the new line (translations are mine, need review), keyboard-open phone layout, a successful verify with the variant on, FB/IG in-app browser.

## 9. Next steps
1. You answer D1-D5 (or say "defaults ok").
2. I create branch `feat/otp-airplane-experiment`, implement 3.2-3.4, run 3.5, update this file and DEVELOPMENT_RULES §10A (landing experiment notes).
3. GrowthBook flag created OFF + draft rule; you set the landing env vars, merge on your go-ahead, and start the test when you decide.

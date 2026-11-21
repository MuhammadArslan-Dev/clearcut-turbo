# Phase 123 — Investigation: signup conversion drop after 2026-11-19

**Tickets:** (new, from user)
**Repos:** CM (apps/landing /start, apps/dashboard) · BE (read only) · Amplitude 673721 · Sentry · Grafana maindb
**Branch:** none (investigation only, nothing changed)
**Created / start date:** 2026-11-21
**Status:** In Review — client decision 2026-11-21: remove the OTP A/B test; /start reverted to the Nov 18 code (+ Amplitude flush kept), pushed to main

---

## 1. Question
The user reports signup conversion falling from ~90% to 75–80% after 2026-11-19, when `/start` changed and the GrowthBook OTP "airplane" A/B test (`lp_all_otp_airplane_202611`) started. They want to know where users drop, what caused it, and whether reverting `/start` and its modal to the Nov 18 code would fix it.

## 2. Timeline (IST)
| When | What | Effect on learners |
|---|---|---|
| 11-18 11:36 | Last landing build of Nov 18 | baseline |
| 11-18 21:51–23:16 | Backend Sentry LARAVEL-BACKEND-H8 "AuthKey OTP SMS Failed": 32 events | DB shows normal FAST2SMS sends and verifies in those hours |
| 11-19 13:46 | CC-108 sticky-bar pill opens signup | none on the OTP step |
| 11-19 16:09 → 18:32 | localStorage-safe fix for the FB in-app crash, deployed then **reverted** | crash class back to its Nov 18 state |
| 11-19 16:16 | Phase 120 airplane code deployed | inert: GrowthBook key not in the build |
| 11-19 18:06 | Landing build switched from Nixpacks to Dockerfile | infra only; env confirmed in the bundle |
| **11-19 18:43** | Dockerfile key fallback | **airplane test actually starts (50/50)** |
| 11-20 10:04 | Late GrowthBook answers applied; `gb_source` on funnel events | — |
| **11-20 10:54** | `flushAmplitude(500)` before the /start redirect | Amplitude "Authentication Outcome: successful" counts jump (≈half were lost before) |
| 11-20 11:53 | Backend: per-user 180/min API limit for signed-in users | guest/OTP limiters unchanged |
| 11-20 13:51 | CC-174: optional `extraContent` in the auth modal (tools only) | none on /start |
| — | Backend auth / OTP / SMS / Truecaller code | **unchanged since Nov 16** |

## 3. Findings

### 3.1 DB (source of truth, Grafana `cepskuvmeqx34e`, IST days; Nov 21 partial)
**New users** (verified % = verified of new users; enrolled = enrolled within 1 day, as % of verified):

| Day | New users | Verified | Verified % | Enrolled | Enrolled % of verified |
|---|---|---|---|---|---|
| 11-12 | 43 | 40 | 93.0 | 36 | 90 |
| 11-13 | 83 | 70 | 84.3 | 67 | 96 |
| 11-14 | 79 | 76 | 96.2 | 74 | 97 |
| 11-15 | 81 | 76 | 93.8 | 75 | 99 |
| 11-16 | 82 | 70 | 85.4 | 69 | 99 |
| 11-17 | 96 | 81 | 84.4 | 78 | 96 |
| **11-18** | **111** | **102** | **91.9** | **97** | **95** |
| 11-19 | 85 | 72 | 84.7 | 69 | 96 |
| 11-20 | 48 | 39 | 81.3 | 37 | 95 |

**OTP users verified** (`u_auth_otps`): 91.3, 84.5, 94.3, 93.2, 85.6, 86.3, **90.0** (Nov 18), 86.2, 82.2.

What the DB says:
- The only step that dipped is **new user → OTP verified**: about 92% on Nov 18, 85% on Nov 19, 81% on Nov 20.
  - Nov 13, 16 and 17 were just as low (84–85%), before any change.
  - Pooled, Nov 12–18 is 89.6% (515/575) and Nov 19–20 is 83.5% (111/133). z ≈ 1.8 (p ≈ 0.08), so this is not significant.
  - OTP users show the same pattern: 89.2% before vs 84.7% after, z ≈ 1.6.
- **Onboarding did not drop.** Verified new users enrolled within 1 day: 95–96% on Nov 19–20, the same as before.
- **Volume fell about 50% on Nov 20**: 111 new users on Nov 18, 48 on Nov 20. Sentry /start pageloads fell by the same amount (330 on Nov 18, 130 on Nov 20). This is less traffic, not more failure.

### 3.1b Grafana dashboards (added after the user asked "Grafana bhi naap lo")
- The "Clear Cutoff" / "Clear Cutoff Hostinger" dashboards (Users [Daily], Failed to Register…) query the **old** DB datasource `aedwtyr5jrshsd` (table `otps`), which times out. They do not reflect the current app. The live dashboard is "Clear Cutoff — Business (AARRR)" on maindb. Data freshness: every feed was current on 11-21 ~13:05 IST.
- **Daily signups by source** (AARRR panel 20 + a verified split, IST):

| Day | source=paid (ads) | verified | source=unknown | verified | **never verified** |
|---|---|---|---|---|---|
| 11-13 | 64 | 64 | 18 | 5 | 13 |
| 11-16 | 68 | 68 | 14 | 2 | 12 |
| 11-17 | 77 | 77 | 19 | 4 | 15 |
| **11-18** | **94** | 94 | 17 | 8 | **9** |
| 11-19 | 66 | 66 | 19 | 6 | 13 |
| 11-20 | 32 | 32 | 16 | 7 | **9** |
| 11-21p | 10 | 10 | 8 | 2 | 6 |

  **Users who never verify did not increase** (about 9–15 a day, flat). Ad-attributed signups fell from 94 to 66 to 32, all verified. So the verified % drops only because the denominator shrank while the small constant pool of unverified OTP requests stayed the same. This is a mix effect, not OTP failures.
- **Journey funnel** (`u_journey_events`, AARRR panel 30):

| | Lead | Trial started | Trial / Lead | Paid / Lead |
|---|---|---|---|---|
| Nov 12–18 (7 days) | 575 | 531 | 92% | 12.9% |
| Nov 19–21 (2.5 days) | 151 | 127 | 84% | 14.6% |

  Paid per lead did not fall.

### 3.2 Amplitude (673721)
- The ratio that matches "90% → 75–80%" in Amplitude is **Signed Up (server) → Onboarding Started (dashboard)**:
  - by day: 80% (Nov 18), 73% (Nov 19), 65% (Nov 20);
  - on `/hi/start`: 87.6% before vs 78.3% after.
  - The DB shows those same learners **do enrol** (95–96%). So this is an **analytics identity gap**: the dashboard's Onboarding Started is not tied to the same Amplitude user. It is not real user loss.
  - The gap is concentrated in Android in-app WebView (Meta ad traffic, utm `ctet_sales_20261013`): 87% → 71% there, while Chrome Mobile stayed at 88% → 88%.
- **The dip started before the experiment was live.**
  - Nov 19 00–12 IST: 68%.
  - Nov 19 19–23 IST, after the 18:43 start: 92%.
- **Airplane vs control (Nov 19–21, small samples):**
  - Signed Up → Onboarding Started: airplane 80% (30→24), control 68% (25→17), not exposed 73%.
  - On the login step itself (this session's earlier query of tagged Authentication Outcome): successful 26 airplane vs 28 control, failed 2 vs 1, Resend 2 vs 1.
  - **No evidence that airplane is worse.**
- Failure reasons (incorrect OTP, timeout, Truecaller, network) are small and flat. Resends are flat.
- Measurement caveat: client "Authentication Outcome: successful" counts before 11-20 10:54 IST are undercounted by about half (fixed by the flush). Do not compare Authentication-success rates across that time.

### 3.3 Sentry / errors / performance
- **Landing:** no new or spiking issue on /start, auth, OTP, GrowthBook, chunk-load or hydration.
  - The FB in-app localStorage crash (PUBLIC-4/5) has 9 events in total, last on Nov 19.
- **Dashboard:** nothing on the token handoff or onboarding. A few single-user 429s on Nov 19.
- **Backend:** H8 SMS failures on the night of Nov 18 (DB shows OTPs were still verified). Nothing after.
- **/start p75 LCP** rose from 2346 ms (Nov 18) to 2750 ms (Nov 19) and 2934 ms (Nov 20).
  - Small samples; likely the traffic mix and the extra GrowthBook/airplane JS.
  - Worth watching, but not enough to explain a conversion drop.
- No 429/5xx logs exist for `/api/v1/auth/*`: Loki has no data after Nov 14, and Prometheus has no HTTP metrics.

## 4. Conclusions (evidence-backed)
1. **There is no confirmed conversion collapse.**
   - The real DB funnel (OTP sent → verified → enrolled) moved within its normal daily noise.
   - OTP verification is about 4–6 points lower on Nov 19–20, but that is not statistically significant and matches Nov 13/16/17.
2. **The "90% → 75–80%" figure is an Amplitude measurement artefact.**
   - The ratio is Signed Up → Onboarding Started.
   - The DB shows those learners do enrol, so the dashboard event is not stitched to the server-side Signed Up user, mostly in the Meta in-app WebView.
3. **The visible business drop is volume.** Signups halved on Nov 20 because ad traffic into the WebView fell (OTP senders about 40/day down to 17). That is a marketing/traffic question, not a /start code question.
4. **The airplane experiment is not the cause.**
   - The dip began before it went live (18:43 Nov 19).
   - The airplane group converts no worse than control.
   - Backend auth was unchanged.
5. **Reverting `/start` + modal to Nov 18 would not fix anything measurable**, and it would:
   - remove the Amplitude flush fix, so half the success events would be lost again;
   - remove the experiment, `Resend Enabled` / `Resend Clicked` and `gb_source`;
   - not touch the in-app-browser crash, the backend, the traffic drop, or the analytics identity gap.

## 5. Recommended recovery plan (for approval; nothing done yet)
1. **Do not revert `/start`.** If you want zero risk while the data matures, use the GrowthBook kill switch on `lp_all_otp_airplane_202611` (production OFF = everyone sees the Nov 18 OTP UI; reversible in about 30 s). This is not needed on current evidence.
2. **Measure signup from the DB, not Amplitude.** Daily: OTP-verified % of new users, and enrolled within 1 day. Re-check on Nov 25–26 with more days. If OTP-verified stays below 85% for 3+ days, investigate the WebView path on a real Android phone with the FB/IG app.
3. **Fix the Amplitude identity gap** (separate small task). Make sure the dashboard calls `setUserId(uuid)` before `Onboarding Started` fires, and that the user id matches the backend's Signed Up user id, especially after the `?token=` handoff in the in-app WebView. Until then, Signed Up → Onboarding Started in Amplitude will understate onboarding.
4. **Traffic:** ask marketing why Meta ad traffic (`ctet_sales_20261013`) to /start fell on Nov 20. That is the main reason signups halved.
5. **Optional hardening:**
   - re-land the reverted localStorage-safe fix for the FB in-app browser (8112243 was reverted at 18:32 on Nov 19), after checking why it was reverted;
   - ask FAST2SMS/AuthKey for delivery reports (the DB cannot see undelivered SMS).

## 6. Not verified
- No real-device test of /start in the FB/IG in-app browser (airplane or control).
- No SMS delivery reports from the provider.
- No 429/5xx logs for auth endpoints (none exist after Nov 14).
- Nov 20–21 are partial, and their 1-day windows are still open.
- Samples are small (30–110 signups a day); ±8 points is normal day-to-day noise.
- The practice-skip dashboard experiment (started Nov 18) was not separated out. It acts after onboarding, so it should not affect signup.

## 7. Decision and action (2026-11-21)
- Client: remove the A/B test from login and revert to the Nov 18 code, for the /start page and login modal only (not tools, blog or dashboard).
- Done on branch `fix/revert-start-login-to-nov18`:
  - `StartAuthForm.tsx`, `start/start.module.css` and `start/startCopy.ts` restored to d5a8b17;
  - `start/OtpAirplane.tsx`, `OtpWaitExtras.tsx` and `otpAirplaneValue.ts` deleted;
  - the Amplitude flush before the redirect (48f1aa6) re-applied at the user's request.
- **Login modal NOT reverted:** `packages/auth` changed after Nov 18 only for the tools consent checkbox (CC-174). It has no A/B code and is not used by /start. Reverting it would break tools.
- Checks: landing tsc (no errors in these files), eslint 0 errors, 44 landing tests pass. No local browser run (landing dev server was not running).
- 2026-11-21 ~13:07 IST: GrowthBook `lp_all_otp_airplane_202611` production OFF (revision 5 published); the public payload no longer contains it.

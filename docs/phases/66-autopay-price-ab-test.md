# Phase 66 — Allow-listed ₹99 autopay offer, controlled from Amplitude (temporary test)

**Tickets:** (new, from user) — lineage: CC-62 "price test" (see [phase 29](29-cc69-cc98-checkout-renewal-events.md))
**Repos:** CM (`apps/dashboard`) **only**. Backend: deliberately NOT touched (user decision, twice).
**Branch:** `feature/autopay-price-experiment` in worktree `D:\clearcutoff-projects\clearcut-master-exp`, created from `main` so it ships without the first-enrollment Practice Test. Not committed, not pushed.
**Created / start date:** 2026-10-29
**Status:** Built and verified locally (mocked Amplitude/Razorpay, no real charge). Amplitude flag created, **disabled**. Nothing deployed, no public rollout. Not yet tried against the real Amplitude (needs a client deployment key, see §9).

> History: this phase started as a random ₹99-vs-₹149 A/B test. It was reworked (2026-10-29) into an **allow-list offer**: ₹99 only for users and exams you pick in Amplitude, everyone else keeps their exam's own price. The old experiment object and metrics in Amplitude are obsolete (§7).

---

## 1. What it does
For a user you select in Amplitude, on the exams you select in Amplitude, the monthly **autopay** plan is the ₹99 plan (`subscription_plans.id = 1`). Everyone else, on every exam, sees and buys exactly what they did before.

| Exam | Default autopay (unchanged) | Default plan id | Offered ₹99 plan id |
|---|---|---|---|
| HTET, HPTET, MAHATET | ₹149 | 2 | 1 |
| UGC | ₹249 | 3 | 1 |
| CTET, UPTET, UP TGT, UP PGT, REET, … (no own plan) | ₹99 | 1 | n/a: already ₹99, **never changed, never exposed** |

One-time (₹229 / ₹449 …) and annual (₹799 / ₹1999 …) prices never change.

## 2. Control: everything is in Amplitude (feature flag `autopay-offer-99`)
Flag [`autopay-offer-99`](https://app.amplitude.com/experiment/clear-cutoff/673721/config/1578324) (id 1578324, remote evaluation, bucketing key `user_id`): one variant **`price-99`**, default allocation **0 %**, created **disabled**, no deployment, no inclusions.

| I want to… | Do this in Amplitude |
|---|---|
| Switch the whole thing on / off | Flag **enabled** on / off (off ⇒ nobody gets a variant ⇒ default prices) |
| Allow-list specific users (me, the client) | **Individual inclusions** → add their user IDs (the uuid, same as Amplitude user id) to variant `price-99` |
| Remove a user | Remove the ID from the inclusions; next page load shows the default |
| All eligible exams | Edit variant `price-99` **payload** to `{"scope":"all"}` |
| Only some exams | Payload `{"scope":"exams","exams":["HTET","HPTET"]}` (any of HTET, HPTET, MAHATET, UGC; case/space tolerant) |
| Internal testers | Targeting segment: user property `internal_tester` **is** `true`, 100 % → `price-99`. The dashboard also sends this property explicitly for uuids in `NEXT_PUBLIC_EXPERIMENT_INTERNAL_UUIDS` so it matches at once |
| A cohort | Targeting segment on a cohort synced to Experiment (see "Cohorts and events") |
| Nobody else is affected | Keep the **All users** segment / default allocation at **0 %** |

The payload only chooses WHERE the offer applies. The plan id and the ₹99 amount are fixed in code (`lib/experiments/autopayPrice.ts`), never read from Amplitude. A missing, unclear or wrongly-cased payload (`"ALL"`, empty exam list, no `scope`) means **no offer**.

### Cohorts and events (what Amplitude can and cannot do)
- Sources: [Experiment evaluation](https://amplitude.com/docs/feature-experiment/implementation), [remote evaluation](https://amplitude.com/docs/feature-experiment/remote-evaluation), [cohort targeting](https://amplitude.com/docs/feature-experiment/cohort-targeting).
- **An event never switches the feature on by itself.** Only a rule you write (inclusion, user-property segment or cohort) assigns `price-99`.
- **Past event / past purchase ("bought plan X")**: Amplitude can only use it through (a) a **behavioral cohort** synced to Experiment (dynamic cohorts sync **hourly**, not real time; the docs' only example is a `Sign Up` event, so "event with property plan = X in the last N days" must be tried in the UI first), or (b) a **user property**. Our backend already sets user properties such as `subscription_plan` (e.g. `149_autopay`) on payment events, and remote evaluation reads a user's stored properties, so a segment on that property works with less delay than a cohort (a just-set property may race, which is why `internal_tester` is sent explicitly). Anything that must be exact and instant would need backend logic, which is out of scope here.
- Remote evaluation merges stored properties with those sent in the fetch; the ones sent win.
- Unverified in the docs: whether Individual inclusions bypass the allocation % (implied, not stated). Confirm on the first live test with your own account.

## 3. Fail-safe behaviour (never ₹99 by accident)
Default (existing) price, **no exposure event**, in all of these: experiments off (no key / analytics off / host not allowed), flag disabled, user not selected, exam out of scope, exam not a discount exam, another variant, unclear payload, SDK error, SDK timeout (2.5 s), no answer. **No cache**: an answer lives in memory for one page load; the SDK's own remembered variant is cleared before every fetch, so a removed user or a failed fetch can never show an old offer (tested).

## 4. Where the price is decided (one place)
`useAutopayOffer(examShortName)` → `{ ready, offer, exposable, expose }`. The payment page, My Courses card (`MyCourseCard`), floating widget (`PaywallFloatingWidget`), locked test cards (`FullTest/SectionalTest/ChapterTest`) and the checkout request all read it; `getPriceForVariant`, `getSubscriptionPlanId` and `getPlanAnalytics` take it as an optional argument (without it every price is exactly as before). While Amplitude is being asked, a user who could be offered ₹99 sees the page skeleton (payment page) or a blank note (cards) for at most 2.5 s, never a price that changes. Exams that are not discount exams are ready instantly.
Exposure (`$exposure {flag_key, variant: "price-99"}`): once per page load, from `/payment/initiated`, only when the user is really shown ₹99. Funnel events (`Purchase Intent Initiated`, `Plan Switched`, `Payment Initiated`, `Checkout Opened`, `Payment Outcome`, `Continue Free Clicked`) get the optional property `price_offer: "price-99"` only for offered users. Internal testers get the user property `internal_tester: true`.

## 5. What is NOT implemented (and why it matters)
- **No backend validation (your decision: a few days, controlled from the frontend).** `POST /v2/subscription/create` still bills any active `plan_id` the browser sends, so a user who edits the request can buy plan 1 (₹99) on any exam, selected or not. That gap exists today for every plan, independent of this feature. Consequence: use this for your own, the client's and internal accounts; **do not enable it for the public** without a server check. A server design (plan must be the exam's default, or the entitled ₹99 offer; 409 otherwise) and its tests were built and then removed on request; the patch is outside the repo (`scratchpad/backend-autopay-offer-enforcement-NOT-USED.patch`, earlier draft `backend-autopay-experiment-NOT-USED.patch`).
- One-time orders (`POST /v2/payment/create`) take `amount` straight from the browser, a separate, older gap (not touched).
- `POST /v2/payment/verify` only reads the transaction state set by the Razorpay webhook; it contains no price logic, and the amount of a subscription is whatever the Razorpay plan bills.
- No consent gate for the SDK (it has no consent API). The SDK sends user id, device id, browser/OS and the page URL to Amplitude (never phone/email: tested).
- Not verified against the real Amplitude evaluation (no deployment key exists, and Amplitude's own evaluation can't be exercised from here). Verified: the SDK request/response contract (`GET https://api.lab.amplitude.com/sdk/v2/vardata`, response `{ "autopay-offer-99": { key, value, payload } }`) with a mocked server.

## 6. Test matrix and results (2026-10-29, local)
Unit: **58 Vitest tests pass** (`pnpm --filter dashboard test`): payload parsing, offer decision per exam, defaults, tripwire on `EXAM_PRICE_OVERRIDES`, runtime (no cache, one fetch, failure, user switch, exposure once), SDK wrapper (clears before fetch, timeout, error, ids only). tsc: no errors in touched files; eslint: no new problems (0 in new files, touched files equal to `HEAD`); `check:colors` clean.
Playwright (real Chromium, headed, dev server on 3021, Amplitude evaluation/ingestion + Razorpay + `/v2/subscription/create` mocked, third parties blocked; fixture enrolments HTET/HPTET/MAHATET/UGC/CTET). Every price read from the page, every event from captured traffic:

| Scenario (Amplitude answers…) | Autopay card / My Courses / widget | Checkout `plan_id` | Exposure | `price_offer` |
|---|---|---|---|---|
| **Feature off** (no key) | HTET ₹149, CTET ₹99 | 2 / 1 | none; 0 requests to Amplitude | none |
| **Global**, selected user (`{"scope":"all"}`) | HTET, HPTET, MAHATET, UGC all **₹99**; CTET ₹99 (default) | 1 (1 each) | exactly 1 per payment-page load, CTET none | `price-99` |
| **Selected exams** HTET+UGC, selected user | HTET ₹99, UGC ₹99; HPTET ₹149, MAHATET ₹149 | 1, 1, 2 | HTET, UGC only | only those |
| **Not selected** (`{}`) / other variant / bad payload | HTET ₹149 | 2 | none | none |
| **SDK failure** (request aborted) | ₹149 in 2.3 s | 2 | none | none |
| **SDK timeout** (never answers) | ₹149 after ~3.8 s (2.5 s ceiling + load) | 2 | none | none |
| **Stale cache**: offered, then removed in Amplitude | ₹149, **₹99 never painted** during the load | n/a | none | n/a |
| Offered, then Amplitude fails on the next load | ₹149 (SDK's stored variant ignored) | n/a | none | n/a |
| Old build's `cc-exp:` cache pre-seeded + failing Amplitude | ₹149 | n/a | none | n/a |
| **Cross-device**: two fresh browsers, two loads each | HTET ₹99 every time | n/a | one per load (2 → 2) | n/a |
| **All surfaces** (selected HTET): My Courses cards HTET ₹99 / HPTET ₹149 / MAHATET ₹149 / UGC ₹249 / CTET ₹99; floating widget HTET ₹99; test-series page only ₹99 | consistent | | | |
| **All surfaces** (not selected / global) | defaults (149/149/149/249/99) / all ₹99 | | | |
| Internal tester | `internal_tester: true` in Identify and in the SDK request (explicit property); no phone/email in the SDK request | | | |

Also checked: one-time and annual prices unchanged on every exam; CTET locked test cards still say "Included in the ₹99 plan"; no horizontal scroll at 390 and 1440 (screenshots read: card and "Unlock Full Access for ₹…" button agree, ₹99 and ₹149 states).
Not verifiable here: the **HTET locked test cards** (no tests exist for HTET in the local data; the code path is the same hook as the other surfaces); the **real** Amplitude evaluation; hi/mr rendering (no new copy added).
No real charge, no write to production Amplitude/DB.

## 7. Amplitude objects (project 673721)
- **Used:** flag `autopay-offer-99` (id 1578324, disabled, 0 %).
- **Obsolete, created earlier today for the abandoned 50/50 test, untouched, you may delete them:** experiment `autopay-price-test` (id 1578235, never started) and metrics `zip5j1ah`, `2kjmufrs`, `apdlrexj`, `yi3npvpt`, `i3c9ncex`. Pre-existing and left alone: flag `test` (1578090), cohort "Payment attempted".
- Measurement: this is an allow-list rollout, not a statistical test. To compare behaviour of offered users, chart `Payment Initiated` / `Payment Outcome` / backend `Payment Completed` split by `price_offer` and by `plan` (`99_autopay` vs `149_autopay`); sample sizes will be tiny (see the old traffic numbers: ≈ 650 eligible users/month), so read them as anecdotes.

## 8. Dependencies
`@amplitude/experiment-js-client` ^1.24.0, `vitest` ^3.2.7 (+ `"test"` script, `vitest.config.ts`), optional env `NEXT_PUBLIC_AMPLITUDE_EXPERIMENT_KEY` (override, or `off`), `NEXT_PUBLIC_AMPLITUDE_EXPERIMENT_SERVER_ZONE`, `NEXT_PUBLIC_EXPERIMENT_INTERNAL_UUIDS`; the client key itself is hardcoded (public by design). Files: `lib/experiments/{autopayPrice,config,client,runtime,useAutopayOffer}.ts` (+4 tests), `store/experiments/useExperimentStore.ts`, `lib/analytics/{browser,paymentFunnel}.ts`, `lib/payment/{examPriceOverrides,planAnalytics}.ts`, `providers/AnalyticsProvider.tsx`, payment page, `MyCourseCard`, `PaywallFloatingWidget`, `FullTest/SectionalTest/ChapterTest`.

## 9. Runbook
**Go live for yourself / client / testers (needs your explicit go-ahead first):**
1. Amplitude: client deployment `testing_price_99` (id 234889) exists and is attached to flag `autopay-offer-99` (done 2026-10-29). Its public client key is **hardcoded** in `lib/experiments/config.ts` (`DEFAULT_EXPERIMENT_DEPLOYMENT_KEY`), so no env var is needed. Confirm the data region (default `us`).
2. Deploy the dashboard (Amplitude is now on by default: `NEXT_PUBLIC_AMPLITUDE_ENABLED` is only an opt-out when set to `false`; a production host is still required, as for analytics). With the flag disabled, or a user not selected, nothing changes. Optional per-build overrides: `NEXT_PUBLIC_AMPLITUDE_EXPERIMENT_KEY=client-…` (other deployment) or `=off` (SDK off for that build); `…_SERVER_ZONE=eu` if the project is in the EU.
3. In the flag: add your user IDs under Individual inclusions, set the payload scope, **enable** the flag. First live check with your own account: price, plan id in the checkout request, exposure, and a second (non-listed) account staying on the default.
4. Add the client / internal testers the same way.
**Stop at any time:** disable the flag in Amplitude (default prices on the next page load). Because the key is hardcoded, emptying the env var no longer switches it off; use `NEXT_PUBLIC_AMPLITUDE_EXPERIMENT_KEY=off` and redeploy, or revert the commit.
**Remove after the few days:** disable and delete the flag; remove the hardcoded key / any env override; (optional) revert the branch / delete `lib/experiments`, `store/experiments`, the `autopay` arguments and `price_offer`; delete the obsolete Amplitude objects in §7.

## 10. Local leftovers (not in git)
Fixture user "PW Phase57 Tester" (id 19392, local DB): token `pw-exp66`; four extra enrolments `pw66HTET00001`, `pw66HPTET0001`, `pw66MAHAT0001`, `pw66UGC000001` (trial, `stage_id` 62 so their cards show the price note). `apps/dashboard/.env` in this worktree (gitignored): copy of the main one + fake experiment key `pw-test-deployment-key`. Playwright harness and screenshots: `scratchpad/pw/` (`HEADED=1 node run.js <tag> <scenarios>`, `SMODE=` for surfaces).

## 11. Decision log
| Date | Question | Answer |
|---|---|---|
| 2026-10-29 | Where is the work done? | Worktree from `main` (user) |
| 2026-10-29 | Backend? | Not touched: frontend only, a few days then removed (user, twice; backend drafts deleted) |
| 2026-10-29 | Who controls who sees ₹99? | Amplitude (user): flag, inclusions, segments, cohorts, payload scope |
| 2026-10-29 | What is "global mode"? | Payload `{"scope":"all"}` = every exam where ₹99 is a discount; still only for users Amplitude selects (Claude's reading) |
| 2026-10-29 | Exams that already sell ₹99 (CTET…) | Never changed, never exposed (Claude) |
| 2026-10-29 | Cache | None; SDK store cleared before every fetch (user requirement) |
| 2026-10-29 | Tests run in the foreground and headed | user |

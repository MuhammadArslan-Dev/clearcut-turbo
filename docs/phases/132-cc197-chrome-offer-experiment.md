# Phase 132 — CC-197: "Continue in Chrome" offer for Android FB/IG users, A/B split by GrowthBook

**Tickets:** CC-197 (replaces CC-123; builds on CC-122 / phase 40)
**Repos:** ASTRO (`apps/go-marketing`) · CM (`apps/landing` `/start`, `packages/experiments`, `packages/utils`) · dashboard (tag only)
**Branch:** `cc-197-chrome-offer-experiment` in each repo (to create once the plan is approved) — not committed, not pushed
**Created / start date:** 2026-11-28
**Status:** In Progress — plan approved 2026-11-28 (D1–D3 answered), building

---

## 1. Problem / objective
Amplitude (30 days, biased) shows users who landed in the FB/IG in-app browser and later used Chrome convert checkout→paid at 15.6%, against 3.7% for users who stayed in the in-app browser. Prove or disprove that offering Chrome gives **more paid users per lander**, with a test fully inside Meta's ad policies (no cloaking, no hidden redirect).

**Change from the ticket (user, 2026-11-28):** the split is done by **GrowthBook**, not by two Meta ad sets with different `utm_content`. The ticket listed GrowthBook as out of scope; that line no longer holds. Results are still read in Amplitude.

## 2. Scope
- **In:** the Chrome offer on CTA tap (bottom sheet, en/hi), GrowthBook flag that decides who sees it, Amplitude identity kept across the jump, `Chrome Escape` result values fixed, landed event on Chrome, variant on key events and as a Sentry tag, kill switch.
- **Out:** iOS, offering the Android app as an exit, any change to the Meta campaign structure (one URL for everyone, so no second ad set is needed), Amplitude dashboards beyond the funnel chart.

## 3. Implementation plan
What exists today (read 2026-11-28):
- `StartLinkEnhancer.astro` (ASTRO `apps/go-marketing`, merged in main with CC-122): on Android + FB/IG a tap on a `/start` CTA **immediately** opens `intent://…` Chrome, no choice, 1.5 s fallback, events `Chrome Escape attempted|failed`. Kill switch is a build env (`PUBLIC_IAB_ESCAPE=off`, needs a rebuild).
- Landing `/start` (`services/analytics.ts`): `src=iab_escape` → `Chrome Escape opened`; `persistFbcFromUrl()` restores `_fbc`/`_fbp`; the Amplitude SDK adopts `ampDeviceId` from the URL.
- Dashboard already sends `in_app_browser: fb|ig|none` on the payment events (`inAppBrowserKind()`).

Steps:
- [ ] **A. Flag.** GrowthBook String flag `go_all_chrome_offer_202611`, values `control` (default) / `chrome_offer`, experiment rule 50/50 hashed on `id` (`cc_exp_id`), created with production OFF and the rule as an unpublished draft (§10A.8: the user starts it).
- [ ] **B. Assignment in the go page.** Read the flag **only** when Android + FB/IG in-app browser, so `$exposure` counts exactly the eligible landers. Everyone else is never evaluated and sees today's page. Any failure (no key, timeout, wrong value) = control.
- [ ] **C. Control = plain link, no Chrome hand-off** (see decision D2), so A and B differ only by the offer.
- [ ] **D. Variant `chrome_offer`:** on CTA tap show a bottom sheet "Continue in Chrome (smooth payment)" / "Continue here" (hi + en). Chrome button reuses the existing intent flow; "Continue here" opens the normal link; a failed jump falls back to the in-app link with no blank screen. Sheet reuses the go page's own styles/tokens, no new colours.
- [ ] **E. Same user across the jump:** `ampDeviceId` (already) + `cc_exp_id` + variant in the Chrome URL; `/start` writes `cc_exp_id` so GrowthBook keeps the same bucket (different cookie jar, §10A.11) and Amplitude user property `exp_go_all_chrome_offer_202611` is on the same device id.
- [ ] **F. Events** (reuse `Chrome Escape`, Title Case): `result` = `offer_shown`, `attempted`, `declined`, `opened`, `failed`, plus `variant`. Chrome side: one landed signal (see D3).
- [ ] **G. Tracking on key events:** `in_app_browser` on checkout / `Payment Initiated` / `Payment Outcome` where missing (Payment Outcome is empty on `/payment/initiated`); variant read from the `exp_` user property; Sentry tag `lp_variant` on landing + dashboard.
- [ ] **H. Kill switch:** GrowthBook flag OFF = everyone control, no deploy (webhook route is dashboard-only, so go page cache time applies; to measure).
- [ ] **I. Docs:** DEVELOPMENT_RULES §10A (Astro now has a client), phases README row, this file.

## 4. Progress / completed changes
- 2026-11-28: ticket + rules + CC-122 code read, plan written; D1–D3 answered.
- 2026-11-28 ASTRO (`cc-197-chrome-offer-experiment`): `apps/go-marketing/src/lib/chromeOffer.ts` (flag, sticky id, lazy GrowthBook, `$exposure`), `src/i18n/chromeOffer.ts` (en/hi/mr copy), `src/components/StartLinkEnhancer.astro` (control = plain link; variant = bottom sheet; events offer_shown/attempted/declined/opened/failed; `ccv` param), `packages/analytics/src/lib/amplitude.ts` (`runWhenAmplitudeReady` queue), `.env.example`, dependency `@growthbook/growthbook@2.1.0` (go-marketing `package.json` + `pnpm-lock.yaml`; the lockfile already carried the user's uncommitted academy changes).
- 2026-11-28 CM (`cc-197-chrome-offer-experiment`): landing `services/analytics.ts` (`Chrome Escape result=landed` + `variant`), `packages/error-reporting` `traffic-tags.ts` (+test; Sentry tag `lp_variant`, additive), DEVELOPMENT_RULES §10A.
- Changed from the plan: `cc_exp_id` is NOT passed to Chrome (landing evaluates no flag; the variant reaches Chrome as `ccv` and the `exp_` user property rides the same Amplitude device id). `lp_variant` event property on Signed Up/checkout dropped in favour of that user property (§2.5 reuse rule); `in_app_browser` already exists on the payment events.

- 2026-11-28 Playwright (Sonnet agent, Chromium 390px, network stubbed): 11/11 scenarios pass (variant sheet en/hi/mr, one intent on double tap, declined once, Escape/backdrop, early tap = plain link, control, GrowthBook 500/hang, Chrome/iOS UA never request GrowthBook, desktop regression). Found: (1) double tap on the CTA opened then closed the sheet (second tap hit the backdrop) — fixed, backdrop ignored for 400 ms; (2) `$exposure.variant` is the variation INDEX ("0"/"1"), as for every other flag here. GrowthBook SDK chunk 15.4 KB gzip, requested only for Android FB/IG.
- **GrowthBook (done 2026-11-28, via the browser):** flag `go_all_chrome_offer_202611` (project clearcutoff, String, default `control`), production environment **OFF**. Revision 2 = **draft, not live**: experiment rule "Go page: Continue in Chrome offer (Android FB/IG)", hash attribute `id`, 100% traffic, 50/50, variations `Control`=`control` and `Chrome offer`=`chrome_offer`, no targeting, no metrics (analysis is in Amplitude). Same as the other flags, the Amplitude `exp_go_all_chrome_offer_202611` value is the variation index: **0 = control, 1 = chrome_offer**. To start: Review & publish the draft, then switch production ON (the user does this).

## 5. Decision log
| Date | Question | Answer (who) |
|---|---|---|
| 2026-11-28 | Split by GrowthBook instead of Meta A/B ad sets | GrowthBook (user) |
| 2026-11-28 | **D1** GrowthBook on Astro `/go` — §10A.4(f) says "out of scope until its own phase"; there is no experiments client in the Astro repo | Yes, add a small GrowthBook client to Astro go-marketing; update §10A (user) |
| 2026-11-28 | **D2** Today's live CC-122 behaviour silently opens Chrome on tap for everyone (no choice) — conflicts with policy rule 2. Control must be a plain link, so deploying this phase removes that for all | Control = plain link (user) |
| 2026-11-28 | **D3** Ticket asks a new event `Chrome Landed`; our reuse rule says add a result value to `Chrome Escape` instead | `Chrome Escape` result=`landed`, no new event (user) |

## 6. Blockers / risks
- ⚠️ Meta policy: GrowthBook buckets by browser id, so a Meta reviewer may land in either variant. That is fine only because both look the same until the tap; the code must never detect Meta's crawler/reviewer.
- ⚠️ `go` pages are static; the flag is read in the browser on the tap path, so the page itself never changes (no flicker risk) but the first tap may happen before the flag is known → treat as control for that tap.
- ⚠️ Payments: the Chrome jump must keep `fbclid`/`_fbc`, or Meta Lead/Purchase stop matching. Verify in Events Manager.
- Real-device behaviour (FB/IG in-app browser → Chrome) cannot be proven locally.

## 7. Dependencies / packages added
`@growthbook/growthbook` (or the shared client) in the Astro app; env `PUBLIC_GROWTHBOOK_CLIENT_KEY` (+ API host) in go-marketing build; GrowthBook flag + attribute `id` already exist for the project.

## 8. Tests and verification
- [ ] Baseline on OLD code: Playwright with Android IG user agent, record the current tap → intent behaviour and event sequence
- [ ] Break-it pass (§8.1): dead taps · double tap on CTA and on the sheet · flag missing/500/slow → control · hi/en at 390px · sheet never blocks the "continue here" path · analytics sequence `offer_shown → attempted → Chrome landed` as one user
- [ ] **Not verified:** real Android phone (FB + IG), Meta Events Manager dedup/EMQ, Meta policy review, Amplitude funnel with real traffic

## 9. Next steps
Get answers to D1–D3, then create the branches and start with steps A–C.

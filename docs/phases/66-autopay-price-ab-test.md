# Phase 66 — Autopay ₹99 offer / A/B test: built, then REMOVED from the dashboard

**Repos:** CM (`apps/dashboard`) only. Backend never touched.
**Status:** **Removed (2026-10-29, on request)**. The dashboard code is back to exactly what it was before (`8f188b3`). The A/B test will be done later on the **Practice Test**, not on the payment page.
**Where the implementation lives:** git history of `main`, commits `d8e9af0` (allow-list offer), `e8972f6` (hardcoded client key, Amplitude on by default), `5b4429a` (A/B variant), and the revert commit that removes them. Use them as a pattern for the Practice Test A/B (`git show d8e9af0`).

## What was built (and verified)
- ₹99 autopay plan (plan id 1) offered only to users chosen in Amplitude (flag `autopay-offer-99`, variant `price-99`, payload `{"scope":"all"}` / `{"scope":"exams",...}`) on exams whose default autopay is dearer (HTET/HPTET/MAHATET ₹149, UGC ₹249); everyone else and every failure kept the default price, no cache, no exposure.
- Then a random A/B variant (experiment `autopay-offer-ab`, arms `control` / `price-99`, both exposed, allow-list wins).
- Verified locally with 58–75 Vitest tests and headed Playwright runs (mocked Amplitude/Razorpay), and live with the real Amplitude evaluation (the allow-listed account saw ₹99 on the HTET payment page, a non-listed user ₹149).

## Why it was removed
Decision by the user: the payment page is not where the A/B will run; it goes on the Practice Test instead.

## What to remember for next time (learnings)
- **Amplitude targeting that works:** *Individual inclusions* by user ID (uuid). A targeting segment on the `phone` user property **never matched** in evaluation (tried both `phone`/user and `user_properties.phone`/context, with the property passed explicitly), so an allow-list by phone number does not work through the API; use the uuid (`JSON.parse(localStorage.auth_user_cache).uuid` in the user's own session).
- Client SDK request: `GET https://api.lab.amplitude.com/sdk/v2/vardata` with `Authorization: Api-Key <client key>` and `X-Amp-Exp-User: base64(JSON user)`; the answer is `{ "<flag>": { key, value, payload, metadata } }`. A public client key can be used to check an evaluation from a terminal (it logs an `[Experiment] Assignment` event).
- The Experiment SDK stores its last variants in localStorage (`amp-exp-<instance>-<key tail>`); clear it before each fetch if a stale assignment must never show.
- Experiments need an exposure event for **both** arms, the same payload on both variants, and no weight changes after start; a feature flag cannot become an experiment (a different key is needed).
- **Traffic is the limit:** the payment page gets ~1,000 visitors a month and only a few dozen to ~100 of them are on HTET/HPTET/MAHATET/UGC; a price A/B there cannot reach significance (≈ 800 users per arm for a 20 % lift on pay-tap rate).
- **Backend gaps found (not fixed, see DEVELOPMENT_RULES §10):** `POST /v2/subscription/create` trusts the browser's `plan_id`, and one-time `POST /v2/payment/create` takes `amount` straight from the browser. `POST /v2/payment/verify` only reads the transaction state set by the Razorpay webhook.
- Playwright against the local backend: it rate-limits at 60 requests/min (429), so space scenarios out; the test user's enrolment needs a `stage_id` for the My Courses card to show its price note.

## Leftovers outside the repo
- **Amplitude (project 673721), now unused — delete in the UI:** flag `autopay-offer-99` (id 1578324, still enabled with one inclusion), experiment `autopay-offer-ab` (1578717, never started), experiment `autopay-price-test` (1578235, never started), the five experiment metrics (`zip5j1ah`, `2kjmufrs`, `apdlrexj`, `yi3npvpt`, `i3c9ncex`) and the client deployment `testing_price_99` (id 234889) if nothing else uses it. Until the removal is deployed the live dashboard still reads `autopay-offer-99`, so disable that flag as soon as you want ₹99 gone for the test account.
- Local test data (not in git): fixture user 19392 with enrolments `pw66HTET00001`, `pw66HPTET0001`, `pw66MAHAT0001`, `pw66UGC000001` and token `pw-exp66`.

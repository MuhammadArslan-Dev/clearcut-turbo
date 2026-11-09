# Phase 89 — Exam on every payment + correct acquisition source

**Tickets:** CC-173 (High, queue 11) + CC-171 (High, queue 12) — two closely related data tasks (same goal: the team can judge ads per exam and per channel from our own data)
**Repos:** BE, CM (`apps/dashboard` events, `packages/auth/src/attribution.ts`)
**Branch:** backend `feature/payment-exam-and-source-data` (commit `3d5194f`, not pushed); frontend: this docs branch only
**Created / start date:** 2026-11-09
**Status:** In Progress — CC-173 additive event properties built and tested (backend); everything that changes behaviour (paid_at, Meta params, source default, cookie, backfills) waits for its 🛑
**Supersedes / continues:** phase 62 (CC-136/CC-137 — "reported done, no code found") and phase 70 (acquisition attribution — **already merged to main**: backend `961615f`, frontend `7f96638`).

> Both tasks touch money-adjacent and ad-optimisation data. Nothing is backfilled or deployed without approval; every backfill is dry-run first.

---

## 1. Problem / objective
**CC-173:** we cannot tell which exam a payment belongs to; Meta undercounts purchases by ~30–50%; Amplitude `Payment Completed` has a blank exam on every new payment 28 Oct–5 Nov (example: HTET looked like ₹2,174 per payer when it was ~₹530).
**CC-171:** `users.source` is wrong — from May to 30 Oct almost every signup was saved as `organic` though nearly all come from Meta ads; since 30 Oct a `paid` value appears but the rule is unclear → CAC, paid-vs-organic and Grafana source panels are wrong.

## 2. Scope
- **In:** exam fields in server + client payment events and the Meta Purchase payload; `purchase_id` link; the source/channel rules, first-touch cookie, raw values; dry-run backfills.
- **Out:** Grafana panels (outside the repos — user), Meta Events Manager config, a new `transactions.exam_id` column (not needed, see below), renewals (CC-98).

## 3. Findings (read-only, 2026-11-09)
**Exam of a payment — existing relationship, no new column needed.** `subscriptions.enrollment_id` (nullable FK → `u_exam_enrollments`) and `subscriptions.group_code`; `Subscription::currentEnrollment()` resolves the enrollment by `group_code` (→ `exam_id`); `transactions` has `subscription_id` and `group_code`; `Subscription::transactions()` exists. So the exam comes from `transaction → subscription/group_code → enrollment.exam_id`. (`group_code` can map to several enrollment rows/levels of the same exam — fine; verify no `group_code` spans two exams.)
**CC-173 genuine gaps:** (a) server `Payment Completed` (`PaymentAnalytics::paid/renewed` → `send()`) adds `exam` (short name) and `course_id` but not `exam_id`, `exam_name`, `transaction_id`; `statusChanged` sends `exam_id` as the group_code string (misleading); (b) client `Payment Initiated/Outcome` (`useRazorpayPayment`, `payment/initiated/page.tsx`) send `exam_name`/`exam` but `payment_session_id` is the integer `transactions.id`, not `transactions.uuid`; (c) Meta `Purchase` is browser-pixel only (no server CAPI in the backend) with `value/currency/amount_paid/plan` and no `content_category/content_ids` — single place to change: `MetaPurchaseService::payload`; (d) `u_exam_enrollments.purchase_id` is never set for one-time purchases; (e) `paid_at` = webhook time in `activateEnrollment` (gateway capture time = `payment.entity.created_at`); (f) 19 of 83 successful payments in the last 30 days had an empty `exam_name` → some flow bypasses the existing lookup `PaymentAnalytics::examName`.
**CC-171 already in main (phase 70):** `AttributionService` (sanitize, classify, locked merge into `users.metadata.attribution`; first_touch once, last_touch each verify), prefixed Amplitude `attribution_*`, frontend `packages/auth/src/attribution.ts`. **Gaps:** first-touch only in localStorage/sessionStorage (blog/dashboard origins are separate → lost); raw `fbclid/gclid` stored as `true` only; no `users.acquisition_channel`; `AuthController::login` still `'source' => $request->source ?? 'organic'` (l.282) and the DB default is `organic`; no `referral` class; mobile app/blog/Truecaller map to `other` not `unknown`; no Amplitude backfill; no Grafana changes; campaign ids not on transactions (overlaps phase 62). `users.source` is read by `User.php` (~l.164–184), Grafana and Meta lead flows.
**Stale docs:** phase 70's "NOT committed" status and the Jira status are out of date (fixed in this change set).

## 3a. Read-only trace result (2026-11-09; local DB copy = prod snapshot to 23 Sep / users to 29 Oct)
- **Most likely cause of "blank exam on Payment Completed 28 Oct–5 Nov":** the server event (`PaymentAnalytics`, added 23–27 Oct, commits `d39e2eb`, `4a91041`, `c3ac332`) sent the exam only as `exam` (short name) and `course_id`; the client events and the dashboards use `exam_name`. So every server `Payment Completed` had no `exam_name`/`exam_id`/`transaction_id` property. The window matches the date the server events went live.
- Secondary cause: `examName()` returns null when the group code has no enrolment row: 12 of 523 group codes behind successful payments (2.3%) have no row at all, even soft-deleted (rows hard-deleted by the old delete-and-recreate in `enrollExam`, replaced by in-place updates in phase 26); plus 1 successful transaction with no `group_code`. Too small to explain 19/83 in the last 30 days on its own; the prod number is unknown.
- **No `group_code` spans two exams (0 of 523)** → the exam can safely be derived from the group code. Mix of successful transactions: 684 subscription + 114 one-time.
- `u_exam_enrollments.purchase_id` is set on **0 of 14,241** rows (never used). All 114 one-time successful transactions in the snapshot have `paid_at` NULL (old rows; the current code writes `paid_at = now()` in `activateEnrollment`) → check on prod.
- **CC-171, `users.source` today (local snapshot, before phase 70 data):** 17,379 `organic`, 597 `meta_lead`, nothing else; the column default is `organic`; no user has `metadata.attribution` yet (the snapshot predates phase 70). Matches the ticket.
- **Correction to my earlier note:** `AttributionService::channel()` already has `referral` (another site) next to `search` / `direct` / platform names; only `users.source` has no `referral`/`unknown`. And `source()` maps `app=landing` → `paid` for ANY landing OTP (not only ad clicks), `tools` → `organic`, everything else (blog, app, Truecaller) → `other`; `users.source` is only overwritten once, from `organic`, by `paid`/`organic` (`record()` l.345).

## 4a. Built (2026-11-09, backend commit `3d5194f`) — additive only
- `PaymentAnalytics::send` now ADDS `exam_name`, `exam_id` (the real exam id) next to `exam` and `course_id`; the exam comes from the caller when known (`activateEnrollment` passes its `$examId`), else from the enrolment of the group code. A property a caller already set is never overridden (`statusChanged` keeps its group-code `exam_id` as before).
- `Payment Completed` also carries `transaction_id` (= `transactions.uuid`): one-time from `activateEnrollment`, autopay first charge and renewals from the Razorpay payment id.
- 6 tests (`PaymentAnalyticsExamTest`, MySQL scratch DB): 4 fail on the old code, all 6 pass now; `AmplitudeServiceTest`, `AccessAuthorityTest`, `EventTrackingServiceTest`, `RazorpayWebhookBackfillTest` still green (70 passed); pint clean. No migration, no new event name.
- Not done yet: the client `Payment Initiated/Outcome` `transaction_id` (the create-order response only returns the integer id; sending the uuid needs one additive field in `POST /v2/payment/create`), `purchase_id`, Meta params, `paid_at`, all CC-171 work, backfills.

## 4. Implementation plan
- [x] 1. **Read-only trace** of every payment flow to find where the exam is not resolved: one-time (`PaymentController::createPayment`, `PaymentService::activateEnrollment`), autopay (`SubscriptionService::createSubscription`, `handleRenewalSuccess`), QR path, client events. Reuse `PaymentAnalytics::examName`. Output: the list of flows behind the 19/83 blanks, written here.
- [x] 2a. BE: add `exam_id`, `exam_name`, `transaction_id` (= `transactions.uuid`) to the `Payment Completed` props (done, see 4a). [ ] 2b. set `purchase_id` on one-time (nothing reads it today; wait for the user's call); the misleading `statusChanged` `exam_id` (group code) is left as is, a dashboard may rely on it (🛑 below).
- [ ] 3. CM: add `transaction_id`/`exam_id` to the existing `Payment Initiated`/`Payment Outcome` payloads (`src/lib/analytics/events/monetization.ts`). No new event names (DEVELOPMENT_RULES §2.5).
- [ ] 4. Meta Purchase: `content_category` (exam short name) + `content_ids` via `MetaPurchaseService::payload`; **`event_id` unchanged**.
- [ ] 5. CC-171: cookie helper in `packages/auth/src/attribution.ts` (domain `.clearcutoff.in`, first-touch only, 30 days, never overwritten); keep raw click ids; `referral` + `unknown` in `AttributionService::classify`; default `unknown` in `AuthController::login`; migration `users.acquisition_channel`; raw values in `metadata.acquisition`.
- [ ] 6. Backfill commands (dry-run first): `purchase_id`/exam for old transactions only where one `group_code` ↔ one exam; `users.source` from Amplitude `initial_utm_*` (anything unmatched → `unknown`).
- [ ] 7. Tests: BE PHPUnit (sqlite memory; MySQL-only tests on a throwaway DB), event-payload assertions, frontend unit tests for the cookie helper.

## 4b. Built after the user said "do what you recommend" (2026-11-09) — all uncommitted-to-main, local branches only
**Backend** (`feature/payment-exam-and-source-data`, commits `d6aa6b7`, `9fbb5cc`):
- **#6** `POST /v2/payment/create` also answers `transaction_uuid` (both the new-order and the reused-order answer). Additive.
- **#8** `MetaPurchaseService` payload adds `content_category` (exam short name) and `content_ids` (`[exam id]`) only when the exam is known; `event_id`, `value`, `send`, `plan`, `currency`, `amount_paid` are untouched (test asserts the old key list for the unknown-exam case). 3 tests.
- **#9** `users.source`: the `User` creating hook sets `unknown` when the caller gave no source (covers every creation path, no migration); `AuthController::login` default is `unknown`; `AttributionService::record()` now also upgrades `unknown` (and still `organic`/empty) to `paid`/`organic` at the first verification; `meta_lead` and any deliberate value are never overwritten. `AttributionTest` updated for the new default (+1 test); 21 pass. Existing users are not touched. DB column default stays `organic` (not needed, the hook sets the value).
- Pre-existing, not mine: `PaymentReconcileTest`, `PaymentRecoveryTest`, `PaymentSafetyTest`, `SyllabusTrackerApiTest` = 35 failed / 12 passed on the scratch DB on clean `main` AND on this branch (identical).
**Frontend** (`feature/payment-exam-and-source-data`, commits `50fd005`, `f1982bc`):
- **#10** first-touch cookie: `packages/utils/src/first-touch-cookie.ts` (pure, 7 tests) + `packages/auth/src/attribution.ts`. Cookie `cc_attr_first`, 30 days, `SameSite=Lax`, `Secure` on https, `Domain=.clearcutoff.in` on our hosts (host-only elsewhere), written ONCE (never overwritten); stores the landing path, referrer HOST, utm values and only the PRESENCE of click ids (never their value). A browser with an older localStorage first-touch gets the cookie too; a browser with no localStorage entry adopts the cookie's first touch. Browser test on the blog dev server: cookie written with the first visit; a second visit with other UTMs did not change it; after clearing localStorage the cookie's first touch was adopted (not the new page); the click id value was not stored.
- **#8** the four Purchase pixel sites (`useRazorpayPayment` x2, `payment/initiated`, `payment/success`) spread `metaContentParams(meta)`: nothing when the backend sends nothing.
- **#6** one-time `Payment Outcome` (success, failed, cancelled, verification failed, return check) and `Checkout Opened` carry `transaction_id` (= `transactions.uuid`) when the backend sent `transaction_uuid`; the saved attempt keeps it for the return check. Autopay events are unchanged.
- tsc: dashboard 93 = clean main 93; `packages/auth` 0; `packages/utils` 0; blog 33 = clean main 33. Vitest: dashboard + utils green (utils 99, dashboard 6 in `src/lib/payment`). `check:colors` passes.
- Not verified: the Meta Events Manager side (a test code is needed before this ships: check `content_category` / `content_ids` are accepted and that Purchase optimisation does not shift), the cookie on the real domains and in FB/IG in-app browsers, consent wording (the cookie holds no personal id, but a privacy-policy line may be wanted), a real payment end to end, and the effect of `unknown` on Grafana panels that still look for `meta_lead`/`organic` (outside the repos).
- Merge note: `useRazorpayPayment.ts` is also changed on `feature/upi-waiting-screen` (phase 88); the two edits are in neighbouring lines and will need a small manual merge.

## 5. Decision log
| Date | Question | Answer (who) |
|---|---|---|
| 2026-11-09 | `statusChanged` keeps the group code as `exam_id` (the recommendation, unchanged) | user: "do what you recommend" |
| 2026-11-09 | `transaction_uuid` added to the create-order answer; client one-time events send it (4b) | user: "do what you recommend" |
| 2026-11-09 | `paid_at` stays webhook time (not changed) | user: "do what you recommend" |
| 2026-11-09 | Meta Purchase `content_category` / `content_ids` built (4b); still to be checked with an Events Manager test code before it is merged | user: "do what you recommend" |
| 2026-11-09 | `users.source` default `unknown` built for new users (4b) | user: "do what you recommend" |
| 2026-11-09 | First-touch cookie built, first-party, 30 days (4b); privacy-policy wording is the user's call | user: "do what you recommend" |
| 2026-11-09 | 🛑 **Any backfill** (`purchase_id`/exam, `users.source` from Amplitude): approve each dry-run list before applying. | open |

## 6. Blockers / risks
- Risk: medium. `users.source` is read by analytics, Grafana and Meta lead flows. Meta param changes may change optimisation.
- Cannot be verified from code: prod distribution of `users.source` and `metadata.attribution`, Amplitude `initial_utm_*` coverage, Grafana queries, Meta Events Manager parameter acceptance, how many prod transactions lack `paid_at`. Grafana panel fixes ("Daily signups by source", "Signup source mix", "Organic signups per week" still look for `meta_lead`) are outside the repos — user.
- Backend deploy first; the optional `attribution` request field already exists.

## 7. Dependencies / packages added
Migration `users.acquisition_channel` (only if the source decision is approved). No new packages. No `transactions` migration.

## 8. Tests and verification
- [x] BE tests for 4a (see above); [ ] CM tests; [ ] Playwright/real-phone check of first-touch cookie across landing → academy → app (user)
- [ ] After deploy (user): last-7-days payments 100% carry exam in Amplitude; Amplitude vs DB successful payments within 5%; shared SQL "payments by exam × campaign" (from phase 62 acceptance)

## 9. Next steps
Do the read-only trace (step 1) and post the flow list here; ask the 🛑 questions together with it; implement only the approved parts.

# Phase 89 — Exam on every payment + correct acquisition source

**Tickets:** CC-173 (High, queue 11) + CC-171 (High, queue 12) — two closely related data tasks (same goal: the team can judge ads per exam and per channel from our own data)
**Repos:** BE, CM (`apps/dashboard` events, `packages/auth/src/attribution.ts`)
**Branch:** `feature/payment-exam-and-source-data` — not created yet, not committed, not pushed (split into two branches if the decisions arrive separately)
**Created / start date:** 2026-11-09
**Status:** Blocked – Decision — read-only tracing can start; every behaviour change below waits for its 🛑 answer
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

## 4. Implementation plan
- [ ] 1. **Read-only trace** of every payment flow to find where the exam is not resolved: one-time (`PaymentController::createPayment`, `PaymentService::activateEnrollment`), autopay (`SubscriptionService::createSubscription`, `handleRenewalSuccess`), QR path, client events. Reuse `PaymentAnalytics::examName`. Output: the list of flows behind the 19/83 blanks, written here.
- [ ] 2. BE: add `exam_id`, `exam_name`, `transaction_id` (= `transactions.uuid`) to `PaymentAnalytics::send` props; set `purchase_id` on one-time; fix the misleading `statusChanged` `exam_id`.
- [ ] 3. CM: add `transaction_id`/`exam_id` to the existing `Payment Initiated`/`Payment Outcome` payloads (`src/lib/analytics/events/monetization.ts`). No new event names (DEVELOPMENT_RULES §2.5).
- [ ] 4. Meta Purchase: `content_category` (exam short name) + `content_ids` via `MetaPurchaseService::payload`; **`event_id` unchanged**.
- [ ] 5. CC-171: cookie helper in `packages/auth/src/attribution.ts` (domain `.clearcutoff.in`, first-touch only, 30 days, never overwritten); keep raw click ids; `referral` + `unknown` in `AttributionService::classify`; default `unknown` in `AuthController::login`; migration `users.acquisition_channel`; raw values in `metadata.acquisition`.
- [ ] 6. Backfill commands (dry-run first): `purchase_id`/exam for old transactions only where one `group_code` ↔ one exam; `users.source` from Amplitude `initial_utm_*` (anything unmatched → `unknown`).
- [ ] 7. Tests: BE PHPUnit (sqlite memory; MySQL-only tests on a throwaway DB), event-payload assertions, frontend unit tests for the cookie helper.

## 5. Decision log
| Date | Question | Answer (who) |
|---|---|---|
| 2026-11-09 | 🛑 **`paid_at` = gateway capture time instead of webhook time?** Behaviour change for date-based payment reports. Options: (a) change + backfill last 90 days from `webhook_logs`/entity `created_at`; (b) keep, document the delay. | open |
| 2026-11-09 | 🛑 **Meta Purchase params (`content_category`, `content_ids`)** can shift ad optimisation/attribution in Meta. Options: (a) add (recommended, `event_id` unchanged, test code in Events Manager first); (b) skip. | open |
| 2026-11-09 | 🛑 **Default `users.source` → `unknown` (never `organic`)** reclassifies only new users; Grafana/Meta-lead logic reads this column (`meta_lead` must stay protected). Options: (a) change default + `referral`/`unknown` rules (recommended); (b) keep `organic` default and add only `acquisition_channel`. | open |
| 2026-11-09 | 🛑 **First-touch cookie on `.clearcutoff.in`** — privacy/consent implications. Options: (a) cookie, first-party, 30 days; (b) keep localStorage only (loses blog/dashboard origins). | open |
| 2026-11-09 | 🛑 **Any backfill** (`purchase_id`/exam, `users.source` from Amplitude): approve each dry-run list before applying. | open |

## 6. Blockers / risks
- Risk: medium. `users.source` is read by analytics, Grafana and Meta lead flows. Meta param changes may change optimisation.
- Cannot be verified from code: prod distribution of `users.source` and `metadata.attribution`, Amplitude `initial_utm_*` coverage, Grafana queries, Meta Events Manager parameter acceptance, how many prod transactions lack `paid_at`. Grafana panel fixes ("Daily signups by source", "Signup source mix", "Organic signups per week" still look for `meta_lead`) are outside the repos — user.
- Backend deploy first; the optional `attribution` request field already exists.

## 7. Dependencies / packages added
Migration `users.acquisition_channel` (only if the source decision is approved). No new packages. No `transactions` migration.

## 8. Tests and verification
- [ ] BE + CM tests; [ ] Playwright/real-phone check of first-touch cookie across landing → academy → app (user)
- [ ] After deploy (user): last-7-days payments 100% carry exam in Amplitude; Amplitude vs DB successful payments within 5%; shared SQL "payments by exam × campaign" (from phase 62 acceptance)

## 9. Next steps
Do the read-only trace (step 1) and post the flow list here; ask the 🛑 questions together with it; implement only the approved parts.

# Phase 26 — CC-129 + CC-120: paid access ends when the paid period ends; deleted accounts stop being charged

**Status:** Built + verified locally (2026-10-23) — BE `phase-26-paid-expiry` (8220529, 07fced3). **Update 2026-11-01: both BE commits are now on backend `main`** (merged between 2026-10-23 and 2026-10-27; the exact deploy time is not verifiable from git, confirm in Coolify). Rollout steps below were written before the merge. Addendum 1 (investigation) and Addendum 2 (full audit) at the end; no code written for either.
**Jira:** [CC-129](https://clear-cutoff.atlassian.net/browse/CC-129), [CC-120](https://clear-cutoff.atlassian.net/browse/CC-120)
**Repos:** BE (main work), CM `apps/dashboard` (grace banner + renewal paywall)
**Size:** large; touches live access, so a backfill list goes to the team **before** enforcing

## What the tickets say
**CC-129 (maindb, 22 Oct):** 304 students whose last payment ended 1–4 months ago, with no later payment and no active subscription.
- **34 kept studying** after their month ended. 28 of them already have `status = 'expired'` enrollments yet still submit tests: user 4354 submitted 50 tests in 22 days; others 20–28.
- **61 still look paid:**
  - 27 are `active` with `valid_till` in the past.
  - 18 are `active` with `valid_till` NULL.
  - 17 have `valid_till` about 60 days after a single 30-day payment.

Asks:
- **One-time payment** sets `valid_till` = payment + 30 days. **Each `subscription.charged`** extends it by one period. Only a successful payment ever sets it, and a paid enrollment never has NULL.
- **Daily job:** `status = 'expired'` where `valid_till < NOW()` and there's no active subscription.
- **Server-side gate** on every paid action (start/open locked test, video, notes), not only at login. API returns 403 and the app shows the renewal paywall.
- **3-day grace** with a banner: "आपका प्लान खत्म हो गया है, X दिन में access बंद होगा".
- **Free allowance** keeps working for expired students.
- **One-time backfill** of `valid_till` from transactions. Share the list before enforcing.
- **Verification query** (in Jira) must return 0 rows.

**User's instruction (22 Oct):** whenever a student opens the app or course, check whether their paid access has expired and expire it right then. The existing `/subscriptions/expire-overdue` endpoint can help, or do it in code directly.

**CC-120:**
- Deleting an account doesn't cancel the Razorpay subscription. #118 has been charged about 2 × ₹99 since its account was deleted on 23 Aug; #1530 is also active.
- The webhook then crashes because `$subscription->user` is null for a soft-deleted user (Sentry LARAVEL-BACKEND-GX, 96 events; Razorpay retries make bursts).
- Fix:
  - Cancel the subscription on account deletion.
  - The webhook loads the user `withTrashed()`. For a deleted user it cancels in Razorpay, skips notifications and returns 200.
  - Notifications are wrapped in try/catch so they never stop billing or access processing.

## What the code shows (2026-10-23, first pass)
- **`GET|POST /api/v2/subscriptions/expire-overdue`** (`SubscriptionController::expireOverdue`, token `SUBSCRIPTION_CRON_TOKEN`) → `SubscriptionService::expireOverdueAccess()`. It only handles **subscriptions** that are `cancelled|paused` with `next_billing_at` in the past. **One-time payments and NULL `valid_till` are never touched.**
- **`CheckExpiredSubscriptionsJob`** (scheduled daily at 02:00) also only covers enrollments with a `subscription_id` whose subscription is cancelled/expired/completed. Same gap.
- **`expire-trials`** at 03:00 handles trials only.
- **Writers of `valid_till`:** PaymentService, SubscriptionService, QrPaymentController, ReferralService, MigrateEnrollments, UExamEnrollment/UEnrollment models. Each needs auditing for the "+60 days" and NULL cases.
- **Access gate:** `$hasAccess = status not in (trial, trial_end)` in `PreparationController`/`ContentController`, so an `active` row with a past `valid_till` still has full access.

## What was found (2026-10-23)
- **The real leak: every access check was "status is not trial/trial_end".**
  - The checks are in Preparation, Content, FullLengthExam x2 and DailyTestService x2.
  - So an enrollment marked **`expired` still unlocked everything**, and so did an `active` row whose `valid_till` passed weeks ago. Hence the 28 "expired" students still submitting tests.
- **`/v2/exam/create-exam` had no lock check at all.** Locked tests were locked only in the app; any enrolled student could start any paid test through the API.
- **The +60 days bug:** `handleAuthenticated` (mandate step) sets `valid_till = now + 30` as provisional access. The first `subscription.charged` then saw a future `valid_till` and added another 30, so one payment of ₹99/₹149 gave ~60 days.
- **Expiry only covered subscriptions.** The `expire-overdue` endpoint and `CheckExpiredSubscriptionsJob` never touched one-time payments or NULL `valid_till`.
- **`valid_till` wasn't cast**, so `optional($e->valid_till)->toDateString()` called a method on a string (SubscriptionController, notifications).
- **`getEnrollmentsByCourse` didn't select `valid_till`.**
- **CC-120:** webhook `$subscription->user` was null for soft-deleted users, so notifications threw and Razorpay retried. Account deletion never cancelled the subscription.

## What was built
**BE**
- **`EnrollmentAccessService`:**
  - `hasPaidAccess()` = `active` and `valid_till` + 3 days not passed. NULL dates keep access until backfilled.
  - `accessState()` returns paid / grace / expired / trial / trial_end + grace days left.
  - `expireOverdueForUser()` / `expireAllOverdue()` skip courses whose subscription can still renew (active/authenticated).
- **All 6 access checks** use `hasPaidAccess()`.
- **Expire on open (user's ask):**
  - get-course (per course)
  - get-my-courses, get-my-active-courses (all of the user's courses)
- **Same rule for everyone:** the nightly `CheckExpiredSubscriptionsJob` and `/subscriptions/expire-overdue` (`paid_enrollments_expired` in its summary).
- **create-exam gate:** 403 `error_code: renewal_required` unless the test is the free first one (lowest `test_number` per section/chapter; lowest `st_order` per paper — the same rule as the lists).
- **First charge** after `authenticated` sets now + 30; later charges extend the paid period by 30.
- **get-course** returns `access {state, valid_till, grace_days_left}`. `valid_till` is cast to datetime. `ApiResponse::forbidden()` takes an optional `error_code`.
- **`enrollments:backfill-valid-till`:**
  - Dry-run CSV in `storage/app/private`.
  - `--fill-null` sets NULL dates and fixes too-short ones.
  - `--shorten` also cuts dates the payment doesn't support.
  - Ambiguous one-time payments (no plan recorded) → `review`, never touched.
  - 10-day tolerance.
- **CC-120:**
  - `deleteAccount` cancels created/authenticated/active/paused/halted subscriptions first.
  - The webhook loads the user withTrashed; billing is recorded; notifications are skipped for deleted users and try/caught for all; a deleted account's subscription is cancelled.

**CM dashboard**
- `CountDownModal`: a 403 `renewal_required` closes the countdown and opens the payment page (source `renewal_required`); it used to hang.
- **Floating Unlock widget:**
  - Also shows for `expired` and during grace.
  - Grace line (en/hi/mr): "Your plan has ended. Access closes in N days".
  - Source `plan_grace_widget`.
- The Learn card's "Expired" pill renews like "Trial Ended".

## Verification (local, test user 9988776655, HTET; every test change restored)
- [x] create-exam as trial_end:
  - Free sectional 133 / full-length 84 → attempt created.
  - Locked 134 / 85 → 403 `renewal_required`.
- [x] Paid (+10 d): access `paid`; 134 unlocked in the list and created.
- [x] Grace (-1 d): access `grace`, 2 days left; still unlocked; widget line shows in en + hi.
- [x] Past grace (-5 d): my-active-courses turns both rows `expired`; 134 locked; create → 403.
- [x] Stale list (opened in grace, plan expired meanwhile) → start → create-exam 403 → app lands on the payment page with `source=renewal_required`.
- [x] Rolled-back transaction:
  - First charge → 30 days; second → 60 days.
  - Deleted user's `subscription.charged`: no exception, billing row recorded, subscription → cancelled (the Razorpay call fails locally and is logged).
- [x] Nightly job dry run (rolled back) on the 23-Sep DB copy: 55 rows expired in 0.1 s; Jira query 127 → 72 (the rest are NULL dates for `--fill-null`).
- [x] Backfill dry run (local copy): 303 courses
  - ok 131, fill_null 31, shorten 62 (mostly ₹99/₹149 subscriptions at +60 days → +30), review 47, no_payment_found 31, extend 1.
- [x] php -l, Pint. Dashboard tsc clean for touched files; eslint 15 = 15; check:colors passes.

## Rollout (needs the team; a push to main deploys at once)
1. **Preview who gets locked on deploy** (production, read-only):

```sql
SELECT DISTINCT e.user_id, u.phone, e.group_code, ex.short_name, e.valid_till, e.enrollment_type
FROM u_exam_enrollments e
JOIN users u ON u.id = e.user_id
LEFT JOIN exams ex ON ex.id = e.exam_id
WHERE e.deleted_at IS NULL AND e.status = 'active' AND e.valid_till IS NOT NULL
  AND e.valid_till < NOW() - INTERVAL 3 DAY
  AND NOT EXISTS (SELECT 1 FROM subscriptions s
                  WHERE s.user_id = e.user_id AND s.group_code = e.group_code
                    AND s.status IN ('active','authenticated') AND s.deleted_at IS NULL);
```

   Plus everyone already `expired` (they lose the access the bug gave them):

```sql
SELECT DISTINCT e.user_id, u.phone, e.group_code, e.valid_till
FROM u_exam_enrollments e JOIN users u ON u.id = e.user_id
WHERE e.deleted_at IS NULL AND e.status = 'expired';
```

2. RD/ops contact those students if wanted.
3. Merge + push (BE first or together; the dashboard copes with `access` missing).
4. On the server:
   - `php artisan enrollments:backfill-valid-till` (dry run) → share the CSV.
   - `--fill-null` after a look.
   - `--shorten` only after RD approves.
5. Ops (CC-120): cancel #118 and #1530 in the Razorpay dashboard; decide the #118 refund.

## Plan
- [x] **A. On-open check (user's ask):** one service method `refreshAccess($user, $enrollment)` that expires the enrollment if `valid_till < now()` and there's no active subscription (incl. one-time payments and NULL fixes). Call it where the app loads a course: get-course, get-sections, my-active-courses. Cheap, indexed, idempotent.
- [x] **B. Daily job:** extend `CheckExpiredSubscriptionsJob` / `expireOverdueAccess()` to the same rule (one-time payments too) and log counts.
- [x] **C. `valid_till` writers:** one-time = +30 days; `subscription.charged` = +1 period from the later of now and the current `valid_till`; never from anything else; never NULL on paid.
- [x] **D. Server gate (create-exam; video/notes links still come from list APIs, like the PYQ note):** `$hasAccess` uses `status` **and** `valid_till` (+3-day grace). Locked test/video/notes endpoints return 403 past grace.
- [x] **E. App (dashboard):**
  - 3-day grace banner (en/hi/mr).
  - A 403 on a paid item opens the existing renewal paywall.
  - Free allowance unchanged.
- [x] **F. CC-120:** cancel Razorpay subscriptions on account delete; webhook uses `withTrashed()`, skips notifications for deleted users, returns 200; try/catch around notifications.
- [x] **G. Backfill command (dry run first):** recompute `valid_till` for paid enrollments from transactions; export the affected list (user, exam, old/new `valid_till`) for RD before enforcing.
- [!] 🛑 **D1:** grace length (ticket says 3 days) and where the banner shows.
- [!] 🛑 **D2:** backfill go-ahead after RD sees the list (students to be contacted first).
- [ ] 📞 **Ops (CC-120):** cancel #118 and #1530 in the Razorpay dashboard; refund decision for #118.
- [ ] **Verify:**
  - Tinker/Pest-free checks on a local copy: the Jira query returns 0 rows after the job.
  - Expired student gets 403 + paywall; grace shows the banner; a subscription charge extends `valid_till`; deleted user's webhook returns 200 with no exception.
  - Playwright on the dashboard for the banner/paywall.

## Addendum (2026-11-01) — a cancelled monthly autopay expires a later, valid annual purchase

**Status:** investigation only. No code, DB or production change made. Waiting for approval. Backend repo: `C:\laragon\www\clearcutoff-main-backend`.
**Report:** student bought autopay for Aug + Sep, cancelled before Oct, then bought the 1-year plan. When the expire-overdue endpoint/job runs, the course is deactivated although the year is paid.

### Confirmed (read in code)
**Root cause: `SubscriptionService::expireOverdueAccess()` (`app/Services/SubscriptionService.php:352-413`), the body of `GET|POST /api/v2/subscriptions/expire-overdue` (`SubscriptionController::expireOverdue`, `SUBSCRIPTION_CRON_TOKEN`, n8n/Postman).**
1. It selects every `Subscription` with `status IN (cancelled, paused)` and `DATE(next_billing_at) < today`. A cancel never changes `next_billing_at`, so the cancelled Aug/Sep subscription keeps a date from its last charge (about last charge + 30 days) and matches forever.
2. For each match it runs `UExamEnrollment ... WHERE status='active' AND (subscription_id = X OR (group_code = X.group_code AND user_id = X.user_id)) -> status='expired'`. **It never looks at `valid_till`, at other subscriptions, or at other payments.**
3. The annual purchase is a one-time order: `PaymentService::activateEnrollment()` (`:55-210`) sets `valid_till = base + 1 year`, `status='active'`, `enrollment_type='1year'`. It does **not** clear `subscription_id` and does **not** touch the old subscription. So the annual enrollment still points at the cancelled subscription, and the second `OR` branch matches it by `group_code + user_id` anyway.
4. Result: annual row (`valid_till` about 2027) -> `expired`. Every access check needs `status = 'active'` (`EnrollmentAccessService::hasPaidAccess`), so access is gone. Nothing re-activates it except a new payment.
5. The nightly `CheckExpiredSubscriptionsJob` pass 1 (`:22-34`) uses `valid_till < now()`, so it would not hit this row; pass 2 (`expireAllOverdue`) honours `valid_till + 3 days` and renewing subscriptions. **Only the endpoint path (and its pass 1) is wrong.** If the report came from the nightly job, the cause is different: check that user's `valid_till`.

**Not verified (needs production data):** that this exact user hit this path. SQL below proves it in one query.

### The same bug pattern in other places (all confirmed in code, all unconditional on `valid_till`)
| # | Where | Problem |
|---|---|---|
| 1 | `SubscriptionService::handleHalted` `:250-263` (`subscription.halted`) | Expires **all** rows of `group_code + user_id`. A late `halted` of an old subscription kills a newer annual. |
| 2 | `RefundService` `:47-51` | Refund of any payment expires the whole `group_code`, even if a newer payment is valid. Also cancels the transaction's subscription. |
| 3 | `SubscriptionService::handleAuthenticated` `:418-429` | Sets `valid_till = now()+30` **unconditionally**. A mandate authorised after an annual purchase **shortens** a year to 30 days. `SubscriptionController::create` only blocks a second *subscription*, not an existing one-time plan. |
| 4 | `handleRenewalSuccess` `:138-209` | Hard-codes 30 days (`current_end`, `next_billing_at`, `valid_till`) and never reads the plan interval or Razorpay's `current_end`/`charge_at`. If a `yearly`/`quarterly` plan exists in `subscription_plans` (schema allows it; **not verified in prod data**), the student gets 30 days for a year's payment. Also overwrites `price`. |
| 5 | Webhook ordering | `handleAuthenticated` and `handleRenewalSuccess` set `status` to `authenticated`/`active` whatever it was. A delayed `authenticated` after `cancelled` flips the cancelled subscription back and re-activates enrollments for +30 days. |
| 6 | Duplicate webhooks | `handleRenewalSuccess` does `exists()` then `create()`. **Corrected in audit 2:** the local DB has a UNIQUE index `transactions_gateway_payment_id_unique` (no migration in the repo defines it, so prod must be checked), which turns a racing duplicate into a rolled-back exception + webhook 400 + Razorpay retry, not a double extension. `activateEnrollment` is safer still (`lockForUpdate`, status re-check). |
| 7 | `activateEnrollment` | Updates **all enrollment rows of `exam_id`** (not `group_code`), so a purchase for one group code extends other group codes of the same exam. |
| 8 | `expireOverdueAccess` race | Reads subscriptions, then runs an unconditional UPDATE. A payment webhook landing between the read and the UPDATE is expired right after activation. A `valid_till` condition inside the UPDATE removes the window. |
| 9 | Endpoint hygiene | Mutating action on `GET` with the token allowed in the query string (rules §7: no secrets in URLs/logs). No lock against two overlapping runs (idempotent in outcome, not in side effects). |
| 10 | Pass 1 of the job and `expireOverdueAccess` ignore the 3-day grace | Access ends at `valid_till` there, but `hasPaidAccess` promises `valid_till + 3 days`. Inconsistent with phase 26 D1. |

### Current logic in one picture
```
payment kind          writes valid_till             writes subscription_id   can revoke access
one-time (order)      base+1y or +1 month (stacks)  never                    refund, expireAllOverdue
autopay authenticated now+30 (overwrites!)          yes                      -
autopay charged       first: now+30, later: +30     yes                      halted
cancel (user/RZP)     -                             -                        expireOverdueAccess (ignores valid_till)  <- bug
expireAllOverdue      -                             -                        valid_till+3d passed AND no active/authenticated sub  <- correct rule
```
Dates: app timezone `Asia/Kolkata`, DB session `+05:30`, all `now()`-based, so no UTC mixing inside the backend (Razorpay's own timestamps are never stored). `whereDate(next_billing_at) < today` truncates to a calendar day. Carbon 3.9.0 **overflows** (tested): `2028-02-29 + 1 year = 2029-03-01`, `2026-01-31 + 1 month = 2026-03-03`; `addYearNoOverflow()` gives `2029-02-28`. Minor, but a student can get 1-3 extra days.

### Why not the proposed fix ("set missing expiry from purchase start + plan duration")
- In this case `valid_till` is **not missing**: `activateEnrollment` always sets it. The row is expired by a rule that never reads it, so filling dates changes nothing here.
- NULL `valid_till` exists only for old legacy rows. `hasPaidAccess` already keeps them active, and `enrollments:backfill-valid-till` (this phase, G) fills them from transactions with a dry run and review cases. Recomputing from "start + duration" would ignore stacked renewals, referral days and QR payments, and could silently shorten access.
- Keep the backfill as separate hygiene. It is not the fix.

### Recommended fix (smallest safe change)
Principle: **`valid_till` (paid-through date) is the only authority for ending access. A subscription's status/cancel/halt never ends access by itself; it only stops future renewals.** `EnrollmentAccessService` already encodes this rule (`expire()`); make every revoke path use it.
1. **One revoke method** in `EnrollmentAccessService`, e.g. `expireLapsed(userId, groupCode, reason)`: a single conditional UPDATE `status='expired' WHERE user_id, group_code, status='active' AND valid_till IS NOT NULL AND valid_till < now() - grace` and no `active/authenticated` subscription for that course. NULL `valid_till` = unknown, never auto-revoked by a subscription event (same as `hasPaidAccess`). Atomic, so it also closes the race (#8).
2. **`expireOverdueAccess`**: keep selecting cancelled/paused subscriptions, but only to set `ended_at` and to call the new method; remove the `OR group_code` blanket UPDATE. The `expireAllOverdue()` call stays. Same for pass 1 of `CheckExpiredSubscriptionsJob` (or delete it: pass 2 covers it).
3. **`handleHalted`**: keep marking the subscription `expired`, and expire enrollments only through the new method (halted means "stop renewing", not "revoke a paid year").
4. **`RefundService`**: revoke only when no other successful, non-refunded payment for that `group_code` still covers today. Needs a decision (D3).
5. **`handleAuthenticated`**: `valid_till = max(existing future valid_till, now+30)` (never shorten). Also guard the `status` transitions: do not move `cancelled/completed/expired` back to `authenticated/active` (#5).
6. **`handleRenewalSuccess`**: stop hard-coding 30 days; derive the period from the plan (`interval`, `interval_count`) or Razorpay's `current_end`/`charge_at` in the payload. First check what plans exist in prod (D4). No new unique index is needed if prod already has it (see audit 2); just confirm it.
7. **Leave `subscription_id` alone** on annual purchase. With 1-2 the stale link becomes harmless, and clearing it would change the Profile -> Subscriptions tab (it reads active/expired from the enrolment). Whether to also cancel a still-active autopay when an annual is bought (double billing) is a product decision (D5).
8. **Endpoint**: POST only, token in the header only, `Cache::lock('expire-overdue')`, and return per-reason counts. Keep the response shape for n8n.
9. Optional: `addYearNoOverflow()` / `addMonthNoOverflow()` in `activateEnrollment`.
10. **Repair data** (separate, approved step) for rows already wrongly expired: set `status='active'` only where `valid_till > now()` and no refunded transaction exists; dry-run CSV first, like the backfill command. Reuse the pattern, no new tool needed.
11. Phase 64 (enrollment table migration) will move these writes to a single enrollment write service; implementing 1 as that one method now avoids porting five copies later.

### Required changes by area
| Area | Change |
|---|---|
| Backend code | items 1-6, 8, 9 above (`EnrollmentAccessService`, `SubscriptionService`, `RefundService`, `SubscriptionController`, `CheckExpiredSubscriptionsJob`, `PaymentService`) |
| Database | none for the fix (superseded by audit 2: no migration required). |
| Endpoint | `expire-overdue`: POST + header token + lock; response keeps `paid_enrollments_expired` etc. Update the n8n/Postman call from GET to POST in the same release. |
| Webhooks | monotonic status transitions; plan-based period; idempotent insert |
| Jobs | nightly job: pass 1 removed or made `valid_till`-aware; keep pass 2 |
| Frontend | none (the app only reads `access.state`) |

### Implementation plan (after approval)
- [ ] **0. Prove it on the affected user** with the SQL below; confirm `status='expired'` while `valid_till` is in the future and the subscription is cancelled with an old `next_billing_at`.
- [ ] **1. Tests first** (Pest/PHPUnit with a rolled-back DB; the repo has none for this area): the scenarios in the testing section, written to fail on current code.
- [ ] **2. Fix 1+2+3** (revoke method, `expireOverdueAccess`, job, `handleHalted`) - this alone resolves the report.
- [ ] **3. Fix 5** (never shorten, no status regression).
- [ ] **4. Fix 4** (refund) after D3.
- [ ] **5. Fix 6** (period from plan, unique index) after D4.
- [ ] **6. Endpoint hardening** (POST, lock) + change the n8n call.
- [ ] **7. Data repair**: dry run -> share CSV -> go-ahead -> apply.
- [ ] **8. Pint, run tests, one Playwright smoke** of the paywall for an annual student after the job.
- [ ] **9. Rollout:** push = auto-deploy. Deploy the code first (it can only *stop* wrongful expiry), then repair data.
- [!] 🛑 **D3:** refund of an old payment while a newer one is valid: revoke nothing, revoke only the refunded period, or keep today's "expire all"?
- [!] 🛑 **D4:** do `yearly`/`quarterly` autopay plans exist or are planned? (`SELECT id, name, interval, interval_count, amount, is_active FROM subscription_plans`.)
- [!] 🛑 **D5:** when an annual is bought while autopay is active, cancel the autopay automatically, warn, or leave it?

### Read-only SQL for production (run yourself; nothing here writes)
```sql
-- 1) The affected student (replace :uid): enrolments, subscriptions, payments side by side
SELECT id, group_code, status, enrollment_type, valid_till, subscription_id, updated_at FROM u_exam_enrollments WHERE user_id = :uid AND deleted_at IS NULL;
SELECT id, group_code, plan_id, status, paid_count, current_end, next_billing_at, cancelled_at, ended_at FROM subscriptions WHERE user_id = :uid;
SELECT id, group_code, transaction_type, status, amount, paid_at, subscription_id, JSON_UNQUOTE(JSON_EXTRACT(JSON_UNQUOTE(metadata),'$.purchase_type')) AS purchase_type FROM transactions WHERE user_id = :uid ORDER BY id;  -- one-time rows are double-encoded JSON strings, a plain JSON_EXTRACT returns NULL for them

-- 2) Everyone else hit by the same bug: expired while paid-through date is still ahead
SELECT e.user_id, u.phone, e.group_code, e.enrollment_type, e.valid_till, e.status, s.status AS sub_status, s.next_billing_at
FROM u_exam_enrollments e
JOIN users u ON u.id = e.user_id
LEFT JOIN subscriptions s ON s.id = e.subscription_id
WHERE e.deleted_at IS NULL AND e.status = 'expired' AND e.valid_till > NOW();
-- Exclude refunds before repairing: rows with a transactions.status = 'refunded' for the same group_code are legitimate.

-- 3) Is a late webhook the trigger? (halted/authenticated after cancelled)
SELECT event_type, status, entity_id, created_at FROM webhook_logs WHERE JSON_EXTRACT(payload,'$.subscription.entity.id') = :rzp_sub_id ORDER BY id;
```

### Testing strategy
**Normal:** monthly charge extends 30 days from the later of now/valid_till; one-time 1-year sets +1 year; nightly job expires a lapsed monthly student after `valid_till + 3 days`.
**The reported case (must fail today, pass after):** sub A (paid_count 2, cancelled, `next_billing_at` in the past) + annual one-time (`valid_till` +1 year) -> run `expireOverdueAccess()` and the job -> annual row stays `active`. Run twice -> same state.
**Edge cases:** cancelled sub + monthly one-time still in future; cancelled sub + `valid_till` yesterday (within grace stays, after grace expires); paused sub; two subscriptions for one course (old cancelled, new active); NULL `valid_till` legacy row (not revoked by a subscription event); `halted` of old sub after annual; refund of old payment after annual (per D3); `authenticated` after annual (valid_till must not shrink); `authenticated`/`charged` after `cancelled` (no status regression); duplicate `subscription.charged` (one transaction, one extension, also in parallel); month-end purchase on 31 Jan / 29 Feb; two group codes under one exam; deleted user.
**Concurrency:** payment activation committed between the job's read and its UPDATE -> row stays active (conditional UPDATE); two overlapping endpoint calls -> second returns "already running".
**Regression:** `EnrollmentAccessService` states (paid/grace/expired/trial/trial_end), the 403 `renewal_required` gate, `/get-course` `access` block, Profile -> Subscriptions Active/Expired, analytics events unchanged.
**Production safety:** deploy code first; run the endpoint once in a dry-run mode (return what *would* expire, no UPDATE) and compare with SQL 2; repair data only from a reviewed CSV; keep the old behaviour behind nothing - the new rule can only expire fewer rows, never more.

## Addendum 2 (2026-11-01) — full audit of autopay + one-time access, and the safest design

**Status:** audit done, **nothing implemented**, no write query run, no config/flag touched. Waiting for approval of the plan and of decisions D3-D9.
**Evidence labels:** **[code]** read in the backend repo (`main`, clean tree, includes phase 26). **[local]** `SELECT`/`SHOW` only, on the local DB copy (`clearcut`, `127.0.0.1`). **[assumed]** reasoned, not proven. **[open]** needs production data or a person.
**Local data caveat:** the copy is from about 2026-09-23 (phase 26 mentions a "23-Sep DB copy") but `NOW()` is today, so every time-relative count (past/future `valid_till`) is only indicative. Re-run the queries on production before any decision. Audit scripts used: `scratchpad/audit.php`, `audit2.php`, `audit3.php` (SELECT only).

### 1. The reported case, reproduced in data [local]
Group `699c89190655b` (two enrollment rows, ids 24828/24829):
- Autopay subscription **#548**: charges 2026-06-13 and 2026-07-13 (`paid_count` 2), cancelled by the student 2026-07-13, `next_billing_at` 2026-08-12, **`ended_at` 2026-08-22 11:20:35** (stamped by the first sweep).
- One-time order, tx **#1913**, `purchase_type` `1year`, ₹599, `status` success, **`paid_at` NULL**, no subscription link. Gave `valid_till` **2027-09-01 11:34:04**, `enrollment_type` `1year`.
- Both enrollment rows are `expired`, `updated_at` **2026-09-16 11:20:36**, i.e. one second after a sweep run at 11:20 on a day the annual plan was already paid. No refund exists for the group.

So the annual plan was bought after the first sweep, and a **later** run killed it. Why a later run can: `expireOverdueAccess()` selects `status IN (cancelled,paused)` and `next_billing_at < today` **without excluding subscriptions whose `ended_at` is already set** [code]. A cancelled subscription is re-swept on every run, forever, and each run expires every `active` row of that `user_id + group_code`. The sweep is not a one-time closing action, it is a standing kill switch against whatever the student buys next. (The timestamps suggest the endpoint is called daily around 11:20, probably by n8n [assumed].)

### 2. How the two payment models work today [code unless marked]
| | Autopay (Razorpay subscription) | One-time (Razorpay order) |
|---|---|---|
| Plans offered now | `subscription_plans`: only two **monthly** plans (₹99, ₹149) [local]; the dashboard offers `1month` (autopay) | `1month-onetime` and `1year` (`PLAN_VARIANTS` in the payment page). `6months` / `15months` are legacy values still present in old rows (see N2) |
| Created by | `SubscriptionController::create` -> `SubscriptionService::createSubscription` | `V2/PaymentController::createPayment` -> Razorpay order; `purchase_type` + amount **come from the request** |
| Activation | `subscription.authenticated` -> `handleAuthenticated`: all rows of `group_code` -> `active`, **`valid_till = now+30` (overwrites)**; `subscription.charged` -> `handleRenewalSuccess`: first charge `now+30`, later charges previous `valid_till + 30`, group-wide | `payment.captured` / `qr_code.credited` / `checkoutReturn` -> `PaymentService::activateEnrollment`: **all rows of `exam_id`**, `valid_till = (future valid_till or now) + 1 year`, anything else `+1 month`, stacks on remaining time |
| Links | `subscriptions.group_code`, `u_exam_enrollments.subscription_id` (set group-wide), `transactions.subscription_id`, `subscription_billing_history` (paise) | `transactions.group_code`, `transactionable_id` = enrollment id; metadata is a **double-encoded JSON string** (111 success + 730 initiated rows [local]) |
| Cancel | `cancelSubscription`: Razorpay cancel (**errors swallowed**) + local `cancelled`; enrollment untouched, ends via `valid_till` | n/a |
| Refund | `RefundService`: tx -> `refunded`, **all rows of `group_code` -> `expired`**, cancels the tx's subscription | same |

**Who decides access.** Read side: `EnrollmentAccessService::hasPaidAccess` = `status='active'` AND (`valid_till` NULL, or `valid_till + 3 days` ahead, or a `status='active'` subscription whose `current_end + 3 days` is ahead). It is the single choke point for the six access checks, `create-exam`, and the `access` block, so **`valid_till` is already the de-facto authority** on the read side.

**Who revokes access (complete list).**
| Writer | Rule | Safe against a newer purchase? |
|---|---|---|
| `EnrollmentAccessService::expire` (open-app + nightly pass 2) | `valid_till + 3d` passed AND no `active/authenticated` subscription | **Yes** |
| `CheckExpiredSubscriptionsJob` pass 1 | `valid_till < now` AND linked sub cancelled/expired/completed | Yes (no grace, minor) |
| `SubscriptionService::expireOverdueAccess` (endpoint) | cancelled/paused sub with old `next_billing_at`; ignores `valid_till`; re-runs forever | **No (root cause)** |
| `handleHalted` | expires all `group_code` rows on `subscription.halted` | **No** |
| `RefundService` | expires all `group_code` rows | **No** (and may be right, see D3) |
| `ExpireTrials` | `trial` -> `trial_end` | n/a |

**Who grants access.** `activateEnrollment`, `handleAuthenticated`, `handleRenewalSuccess` (all with `valid_till`); `ReferralService` (writes `u_enrollments`, the new table, not `u_exam_enrollments` [code]; effect on access [open], phase 64); and **legacy paths that set `status='active'` with no `valid_till` and no payment verification**: `V1/PaymentController::paymentSuccess` and `paymentSuccessFull`, `V1/Payment/PaymentController::phonepeWebhook` and `PhonePePayment::verify`, `TestPaymentController::verify` (see N4).

### 3. New findings (in addition to the 10 in Addendum 1)
| # | Finding | Evidence |
|---|---|---|
| N1 | **The sweep is not one-shot** (no `ended_at` filter), see section 1. Any later purchase for a swept course is exposed until the student's `group_code` has no cancelled/paused subscription left, which never happens. | code + local |
| N2 | **`6months` / `15months` one-time purchases get only +1 month** in `activateEnrollment`: their arms are commented out (`PaymentService.php:138-139`), so they fall into `default => +1 month`. `BackfillPaidValidTill` treats them as 6 / 15 months, so its `extend` action would add 5 / 14 months. The UI no longer offers them, but 56 + 6 successful rows exist locally. Their granted days could not be measured because `paid_at` is NULL on these rows. | code + local; amount of student impact [open] |
| N3 | **Price and plan are client-controlled.** `createPayment` has no validation: `amount` and `type` are taken from the request, the Razorpay order is created for `max(1, amount)` paise, and `activateEnrollment` grants by the stored `type`. A request with `type=1year` and a tiny amount would be activated as a year. Not tested, read only. | code |
| N4 | **Unauthenticated activation endpoints.** `GET\|POST /buy/success` and `/buy/success/full` (`routes/web.php`, no auth, no signature) set the enrollments named in `productinfo` (for the user whose `phone` is given) to `active` and mark a matching transaction `success`; a row activated this way has NULL `valid_till`, which `hasPaidAccess` treats as paid forever. `POST /api/payments/verify` (`routes/api.php:48`, outside any auth group) verifies a Razorpay signature, then activates the **`user_id` / `exam_id` from the request body**. `POST` PhonePe webhooks activate by `productinfo` ids with no visible signature check. Whether prod still uses PayU/PhonePe [open]; the routes exist either way. Fingerprint of unexplained actives locally: **29** group-level rows `active` + NULL `valid_till` + no successful transaction at all (could also be admin/manual/referral grants, not proof). | code + local |
| N5 | **`valid_till` is not always trustworthy.** 5 rows are `active` with `valid_till` 28-30 days beyond the cancelled subscription's last paid period (subs 871, 878, 1122, 520, 513): the old +60-day bug (phase 26, fixed for new charges only). The endpoint would cut them at the right-ish date; a pure `valid_till` guard keeps the ~30-day over-grant until the date passes (bounded revenue leak, no wrong lock-out). Needs the `--shorten` decision (D2) for a proper cleanup. | local |
| N6 | `cancel()` builds its message from `$subscription->enrollment`, a relation that does not exist on `Subscription`, so the "Access continues until ..." date is always empty. Cosmetic. | code |
| N7 | `cancelSubscription` swallows the Razorpay error and still marks the subscription `cancelled`. If Razorpay did not cancel, the next `charged` webhook flips it back to `active` and extends access (consistent: they paid) but the student believes autopay is off. | code |
| N8 | Scoping differs: `activateEnrollment` updates by `exam_id`, everything else by `group_code`; 9 user+exam pairs have more than one `group_code` locally, so one purchase can extend a sibling group. | code + local |
| N9 | **No automated tests** cover subscriptions, expiry or payment activation (`tests/` has none of these). | code |
| N10 | `paid_at` is NULL on tx #1913 [local], and the legacy activation paths never set it [code]. Any evidence query must use `COALESCE(paid_at, updated_at, created_at)` (the backfill command already does). | local + code |
| N11 | **Corrections to Addendum 1:** the unique index on `gateway_payment_id` exists locally (row 6); plan intervals: only monthly plans locally (open item D4 stays for prod); the 3-day grace gap in pass 1 is real but minor. | local |

Local data points that matter for sizing [local, indicative]: groups with divergent status/`valid_till` between their rows: **0** (so group-level `valid_till` is a safe unit); user+group pairs with both a one-time purchase and a subscription: **18** (15 never-completed `created` mandates, 2 cancelled with expired enrollment, 1 trial_end); enrollments active today but exposed to the sweep: **5**; refunded transactions: **2**; transactions where `purchase_type` is only readable after a double `JSON_UNQUOTE`: all one-time rows.

### 4. Is the previously proposed approach the best fit? Compared with the alternatives
| Approach | Fixes the report | Both models | Refund / overlap | Needs migration | Risk | Verdict |
|---|---|---|---|---|---|---|
| **A. Phase-26 guard only** (revoke only if `valid_till` + grace passed) | Yes | Yes | Refund left open, NULL rows undecided | No | Low | Right core, incomplete |
| **B. Transactions as the authority** (compute access from successful payments) | Yes | Yes | Best on paper | No | **High** | **Reject.** Ledger cannot express referral/QR/admin days, the client-controlled `type` (N3), 6/15-month rows that were granted +1 month (N2), NULL `paid_at`, or legacy rows with no record. Would silently change access for many students |
| **C. Write-time only** (detach `subscription_id`, cancel old autopay on annual purchase) | Only new cases | Partly | No | No | Medium | Reject as the fix. Old rows and the other three revoke paths stay broken; clearing `subscription_id` changes the Profile -> Subscriptions tab |
| **D. New access/entitlement table** | Yes | Yes | Yes | **Yes** | High, collides with phase 64 | Defer until phase 64 lands; revisit |
| **E. Recommended hybrid: `valid_till` stays the single runtime authority; every revoke is lapse-based and atomic; grants are monotonic; refund/NULL handled by evidence; transactions used only for audit + reconciliation (shadow)** | Yes | Yes | Yes | **No** | Low-medium, reversible by code revert | **Recommended** |

Why E fits **this** code: (1) the read side and the nightly job already use `valid_till`, so no consumer changes; (2) only **3** revoke writers are wrong (endpoint, `handleHalted`, `RefundService`); (3) rows of a group are consistent [local], so group-level updates are safe; (4) transactions are good evidence but not good authority (N2, N3, N10).

### 5. Recommended backward-compatible strategy
**Rules (the whole design in six lines)**
1. **R1 lapse-only:** a subscription event (cancel, pause, halt, overdue) may only expire a row whose `valid_till + grace` has passed (the existing `expire()` rule), expressed as a **conditional UPDATE** so it is atomic against a concurrent payment.
2. **R2 NULL `valid_till`:** subscription-driven sweeps keep today's behaviour (expire) **unless** a successful one-time payment for the same `user_id + group_code` is newer than the subscription's last billing; then protect the row and log it for review. This keeps pure-autopay legacy rows behaving as before and protects the annual buyer.
3. **R3 monotonic grants:** one helper (`grantUntil`) used by `handleAuthenticated`, `handleRenewalSuccess`, `activateEnrollment`: new `valid_till = max(current if future, computed)`. Only the explicit `--shorten` backfill may reduce a date, and only with approval.
4. **R4 explicit revokes (refund, admin) are evidence-based, not time-based:** revoke only if the refunded transaction is the only successful, non-refunded payment covering today for that `group_code`; otherwise do **not** auto-revoke, raise an alert for manual review (D3).
5. **R5 webhook state is compare-and-set:** `authenticated` / `charged` never move a `cancelled`/`completed`/`expired` subscription back; a late `charged` still records the payment and extends the paid period (money was taken).
6. **R6 the sweep closes a subscription once:** skip subscriptions with `ended_at` set. Alone this is not enough (a cancelled-but-not-yet-swept sub still hits a new annual), so R1 stays required.

**Minimum change set**
| Tier | Change | Files | Schema |
|---|---|---|---|
| 0 (resolves the report) | R1 + R6 in `expireOverdueAccess`; R1 in `handleHalted`; remove the blanket `OR group_code` UPDATE; delegate enrollment expiry to one `EnrollmentAccessService` method; keep `expireAllOverdue()` | `SubscriptionService`, `EnrollmentAccessService` | none |
| 1 | R3 helper + R5 guards; R4 in `RefundService`; `activateEnrollment` scoped to `group_code` after D7 | `SubscriptionService`, `PaymentService`, `RefundService`, `SubscriptionWebhookService` | none |
| 2 (separate security ticket, own approval) | remove or protect N4 routes; server-side price/plan table for N3 | routes, `PaymentController` | none |
| 3 | read-only reconciliation command (shadow mode, CSV + Sentry breadcrumb), endpoint `dry_run=1`, POST-only + lock | new command, `SubscriptionController` | none |
| Later | entitlement table / per-payment periods after phase 64 | - | yes |

No migration is required for tiers 0-3, so a rollback is a code revert with nothing to undo in the database.

### 6. Data classification (what may be corrected automatically)
| Class | Scenario | Local count | Automatic? |
|---|---|---|---|
| **Correctly handled** | autopay first/renewal charge after phase 26; `1month-onetime` and `1year` one-time; duplicate success webhook (unique index + `exists` + lock); trial expiry; cancel then lapse via `expire()`; renewal while still paid (stacks) | most rows | n/a |
| **Safely recoverable** | (a) `expired`, `valid_till` in the future, one-time success tx present, no refund after it (the reported case: 1 group) -> set `active`; (b) `active` + NULL `valid_till` + exactly one successful payment with a **recorded** `purchase_type` in `{1month-onetime, 1year}` or a subscription charge -> `fill_null` (existing command) | (a) 1 group; (b) a subset of 76 groups | Yes, **only** after dry-run CSV + sign-off + table backup |
| **Ambiguous (manual review)** | NULL `valid_till` with no transaction (29 groups); NULL + one-time tx with no `purchase_type`; legacy `6months`/`15months` rows (62; N2); the +60-day cohort (5; N5); users with >1 `group_code` per exam (9); refunded group with a later payment; autopay + one-time overlap (18 pairs); QR/admin payments (type forced to `1year`, arbitrary amount); rows with `paid_at` NULL | counts as listed | **No** - report only |
| **Potentially dangerous** | re-activating rows without payment evidence (could legitimise N4 activations); `--shorten` without RD; `extend` for 6/15-month rows (grants 5 / 14 months, a business call); any bulk `status` update during the nightly window; running the **current** endpoint repeatedly; enforcing hard gating before NULL rows are classified; copying statuses blindly in the phase 64 backfill | - | **Never** automatic |

### 7. Race conditions and failure scenarios
| Scenario | Today | After the plan |
|---|---|---|
| Payment lands between the sweep's read and its UPDATE | row expired right after activation | conditional UPDATE: row stays `active` |
| Two sweeps overlap (n8n retry + nightly) | idempotent in outcome, double work | `Cache::lock`; second call returns "already running" |
| Duplicate / parallel `subscription.charged` | unique index rejects the second insert; webhook 400; Razorpay retries; `exists()` then no-ops | unchanged (confirm the index in prod) |
| `authenticated` after `cancelled` (late delivery) | reactivates, +30 days, status regresses | R5 blocks status regress; R3 never shortens |
| `charged` after `cancelled` | records payment, extends, sets `active` | records and extends, status stays `cancelled` (decision D8) |
| `halted` of an old subscription after an annual purchase | expires the whole group | R1: expires only if lapsed |
| Refund of an old monthly payment after an annual purchase | expires the whole group | R4: no auto-revoke, alert |
| Mandate authorised after an annual purchase | annual shortened to 30 days | R3: stays at the annual date |
| Razorpay cancel call fails | local `cancelled`, Razorpay keeps charging (N7) | log + alert; keep local status until confirmed (D9) |
| Annual and active autopay both exist | double billing | D5 (cancel / warn / leave) |
| Account deleted | subscription cancelled, webhooks 200 | unchanged |
| Month-end dates | `29 Feb + 1y = 1 Mar`, `31 Jan + 1m = 3 Mar` (tested, Carbon 3.9.0) | optional `*NoOverflow` |

### 8. Read-only audit queries (run on **production**, SELECT only)
Queries marked [ran] had their logic executed on the local copy without error; a few are shown with small tidy-ups (`deleted_at` filter, `EXISTS` sums) that were not run verbatim, so run them once with `LIMIT` first.
```sql
-- AQ1 [ran] stale sweep targets: active rows with a future valid_till under a swept/cancelled/paused subscription
SELECT e.id, e.user_id, e.group_code, e.enrollment_type, e.valid_till, s.id sub_id, s.status, s.next_billing_at, s.ended_at,
       DATEDIFF(e.valid_till, s.next_billing_at) days_beyond_sub
FROM u_exam_enrollments e JOIN subscriptions s ON s.user_id=e.user_id AND s.group_code=e.group_code
WHERE s.status IN ('cancelled','paused') AND s.next_billing_at IS NOT NULL AND DATE(s.next_billing_at) < CURDATE()
  AND e.status='active' AND e.valid_till > NOW() AND e.deleted_at IS NULL;

-- AQ2 [ran] already damaged: expired but paid through the future, with payment evidence and no refund
SELECT e.user_id, e.group_code, e.enrollment_type, e.valid_till,
  (SELECT COUNT(*) FROM transactions t WHERE t.user_id=e.user_id AND t.group_code=e.group_code AND t.status='success') success_tx,
  (SELECT COUNT(*) FROM transactions t WHERE t.user_id=e.user_id AND t.group_code=e.group_code AND t.status='refunded') refunded_tx
FROM u_exam_enrollments e WHERE e.status='expired' AND e.valid_till > NOW() AND e.deleted_at IS NULL;

-- AQ3 [ran] NULL valid_till with / without any successful payment
SELECT SUM(EXISTS(SELECT 1 FROM transactions t WHERE t.user_id=e.user_id AND t.group_code=e.group_code AND t.status='success')) with_payment,
       SUM(NOT EXISTS(SELECT 1 FROM transactions t WHERE t.user_id=e.user_id AND t.group_code=e.group_code AND t.status='success')) without_payment
FROM u_exam_enrollments e WHERE e.status='active' AND e.valid_till IS NULL AND e.deleted_at IS NULL;

-- AQ4 [ran] one-time purchase types and their outcomes (note the double unquote)
SELECT JSON_UNQUOTE(JSON_EXTRACT(JSON_UNQUOTE(metadata),'$.purchase_type')) pt, status, COUNT(*) n
FROM transactions WHERE transaction_type='purchase' GROUP BY pt, status;

-- AQ5 [ran] 6/15-month purchases: what date did they get? (use COALESCE, paid_at is often NULL)
SELECT t.id, t.user_id, t.group_code, COALESCE(t.paid_at,t.updated_at,t.created_at) paid, e.status, e.valid_till,
       DATEDIFF(e.valid_till, COALESCE(t.paid_at,t.updated_at,t.created_at)) days_granted
FROM transactions t JOIN u_exam_enrollments e ON e.user_id=t.user_id AND e.group_code=t.group_code
WHERE t.status='success' AND JSON_UNQUOTE(JSON_EXTRACT(JSON_UNQUOTE(t.metadata),'$.purchase_type')) IN ('6months','15months');

-- AQ6 [ran] overlap of one-time and autopay on one course, with current states
SELECT s.status sub_status, e.status enr_status, COUNT(DISTINCT CONCAT(t.user_id,'|',t.group_code)) n
FROM transactions t JOIN subscriptions s ON s.user_id=t.user_id AND s.group_code=t.group_code
JOIN u_exam_enrollments e ON e.user_id=t.user_id AND e.group_code=t.group_code
WHERE t.status='success' AND t.transaction_type='purchase' GROUP BY s.status, e.status;

-- AQ7 [ran] rows of one group that disagree (expected 0)
SELECT user_id, group_code FROM u_exam_enrollments WHERE group_code IS NOT NULL
GROUP BY user_id, group_code HAVING COUNT(DISTINCT status)>1 OR COUNT(DISTINCT valid_till)>1;

-- AQ8 [ran] more than one group_code per user+exam (activateEnrollment scope, N8)
SELECT user_id, exam_id, COUNT(DISTINCT group_code) FROM u_exam_enrollments GROUP BY user_id, exam_id HAVING COUNT(DISTINCT group_code)>1;

-- AQ9 [ran] is the unique index on transactions.gateway_payment_id present, and any duplicates?
SELECT INDEX_NAME, NON_UNIQUE FROM information_schema.STATISTICS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='transactions' AND COLUMN_NAME='gateway_payment_id';
SELECT gateway_payment_id, COUNT(*) FROM transactions WHERE gateway_payment_id IS NOT NULL GROUP BY gateway_payment_id HAVING COUNT(*)>1;

-- AQ10 which plans exist (D4)
SELECT id, name, `interval`, interval_count, amount, total_cycles, is_active FROM subscription_plans;

-- AQ11 how often is the endpoint hit, and when? (webhook_logs holds Razorpay events only, so use app logs/n8n execution history; or grep storage/logs for "expireOverdueAccess ran")

-- AQ12 N4 usage: did anything arrive on the legacy routes? (web server access logs, filter /buy/success, /api/payments/verify, /payment/phonepe/webhook, /payment/payu/webhook)
```

### 9. Dry-run, tests, rollout, monitoring, rollback
**Dry-run (before any behaviour change)**
1. Add `dry_run=1` to the endpoint (returns what it would expire, with the reason per row, no UPDATE) and a read-only `access:reconcile` command that, per active/expired group, compares `valid_till` with the evidence from transactions and prints the class from section 6 as CSV. Both are write-free.
2. Run them on production for a week next to the unchanged endpoint; compare `would_expire` with what the old rule did (AQ1). Expected diff: only rows with a future `valid_till`.

**Tests (write first, must fail on current code)**
Reported case; sweep run twice; sub swept before the annual purchase (R6); not swept yet (R1); NULL `valid_till` with/without newer one-time tx (R2); `halted` after annual; refund of old payment after annual (R4); `authenticated` after annual (R3); `authenticated`/`charged` after `cancelled` (R5); duplicate and parallel `charged`; month-end; two group codes under one exam; 6/15-month rows (assert no change); pure autopay lapse still expires after grace (no regression); `hasPaidAccess` / `accessState` states unchanged; `create-exam` 403 `renewal_required` unchanged; endpoint auth (token header), POST only, lock. Concurrency: simulate activation between read and UPDATE.

**Gradual rollout (a push to `main` auto-deploys)**
1. Deploy dry-run + reconcile (no behaviour change). Review CSV with RD.
2. Deploy Tier 0 behind an env switch `ACCESS_GUARD_MODE` = `log` (old behaviour + logs "would have protected N rows"), then `enforce`. The switch is a plan item only; none was created or changed in this audit.
3. After a clean week in `enforce`, Tier 1.
4. Data repair last, from the approved CSV, per class (a) then (b) of section 6.
5. Tier 2 (security) as its own ticket; it can ship earlier if the N4 routes turn out to be in use.

**Monitoring**
Counters in logs/Sentry: `access_guard.protected` (rows the old rule would have expired), `access_guard.expired` by reason, `refund.manual_review`, `webhook.status_regress_blocked`, reconcile mismatch count per class (alert on growth of "dangerous"), support tickets tagged "course locked after payment". Weekly: re-run AQ1/AQ2/AQ3; expected `AQ2 = 0` after repair.

**Rollback**
Tiers 0-3 have no schema or data change, so rollback = revert the commit (auto-deploy). For the data repair: before it, the person running it takes a copy of the affected rows (`CREATE TABLE ... AS SELECT` for the exact ids) and keeps the dry-run CSV with old `status`/`valid_till`; undo = restore from that copy. Never run a repair without both.

### 10. Open questions [open]
1. Is the endpoint called by n8n, Postman, or both, how often, and with which method? (affects the GET -> POST change)
2. Are PayU / PhonePe / `/buy/success*` / `/api/payments/verify` still used by anything? If not, remove; if yes, they need signatures before they can stay.
3. Is the unique index on `transactions.gateway_payment_id` present in production (no migration defines it)?
4. How many students hold `6months`/`15months` plans and what did they actually receive (AQ5)? Business call on honouring the purchased period.
5. Do referral rewards (`u_enrollments`) affect access anywhere, or only after phase 64?
6. Does the prod `subscription_plans` contain yearly/quarterly plans (D4)?
7. When exactly did phase 26 reach production (git only shows it is on `main`)?

### 11. Implementation plan (not started; each step needs your approval)
- [ ] **S0 Confirm on production** AQ1-AQ9, AQ12 and the open questions above. Read-only.
- [ ] **S1 Tests first** (section 9) - no behaviour change.
- [ ] **S2 Dry-run + reconcile command**, deploy, observe a week.
- [ ] **S3 Tier 0** under `ACCESS_GUARD_MODE=log`, then `enforce`.
- [ ] **S4 Tier 1** (R3, R4, R5, `group_code` scoping) after D3, D5, D7, D8, D9.
- [ ] **S5 Data repair** class (a), then (b), from approved CSV with backup.
- [ ] **S6 Security ticket** (N3, N4) - can run in parallel, own approval.
- [ ] **S7 Cleanup:** update `DEVELOPMENT_RULES.md` with "a subscription event never ends access; only `valid_till` does", close phase 26 D2.
- [!] 🛑 **D3** refund while another payment covers today: do nothing + alert (recommended), revoke only that period, or keep "expire all"?
- [!] 🛑 **D5** annual bought while autopay is active: cancel it, warn, or leave?
- [!] 🛑 **D6** honour the full period of historic `6months` / `15months` purchases (needs a one-off data fix) or leave as granted?
- [!] 🛑 **D7** scope `activateEnrollment` to `group_code` instead of `exam_id`?
- [!] 🛑 **D8** a late `charged` after `cancelled`: extend access and keep status `cancelled` (recommended) or reactivate?
- [!] 🛑 **D9** Razorpay cancel fails: keep the subscription `active` locally and alert (recommended) or keep marking it `cancelled`?

## Addendum 3 (2026-11-01) — implementation record (backend branch `phase-26b-access-authority`)

**Status:** implemented and tested locally. **Not committed, not pushed, not deployed.** No production data was touched, no feature flag changed. Branch cut from `main` (clean tree) at `ebd33ae`. Frontend repo: documentation only.
**Decisions applied by default (you did not answer D3-D9 individually):** D3 = recommended (a refund never revokes access another payment still covers; logs for manual review). **D8 deviates from the audit's recommendation on purpose:** a late `charged` still sets the subscription back to `active` (as today), because if Razorpay did not really cancel (N7) the truth is "still charging" and the student must be able to see and cancel it. **D5, D6, D7, D9 are NOT implemented** (see Pending).

### What was built (mapped to the audit plan)
| Step | Result |
|---|---|
| S1 tests first | `tests/Feature/AccessAuthorityTest.php` (29 tests), `tests/Feature/CourseEditIntegrityTest.php` (10). MySQL-only, skip themselves on sqlite/CI like `UserStateTest`. |
| S2 dry-run + reconcile | `expire-overdue?dry_run=1`; `php artisan access:reconcile` (read-only CSV); `AccessReconciler` service |
| S3 Tier 0 (guard) | `EnrollmentAccessService::expireForSubscription` (R1, R2, R6), used by `expireOverdueAccess()` and `handleHalted()`; `ACCESS_GUARD_MODE` switch |
| S4 Tier 1 | `extendRows` (R3: never shortens, locked, per row) used by `handleAuthenticated` and `handleRenewalSuccess`; plan-length from `SubscriptionPlan::accessDays()` (monthly stays 30); late `authenticated` on a closed subscription ignored (R5); refund decision `expireAfterRefund` (R4); renewal serialised with `lockForUpdate` on the subscription row |
| S5 repair tooling | `php artisan access:restore-expired` (dry run default; `--apply` backs up to a table first; `--rollback=<table>`; only the `wrongly_expired` class) — **never run against real data** |
| Course integrity | `enrollExam` rewritten (in place, in a transaction), `enrolledToCourse` / `enrolledToCourseByName` guarded, `editExam` validated |
| Endpoint | lock (409 while another run holds it), `dry_run`, summary now has `guard_mode`, `enrollments_protected` |

**Files changed (backend):** `config/payment.php`, `.env.example`, `app/Models/SubscriptionPlan.php`, `app/Services/{EnrollmentAccessService,SubscriptionService,SubscriptionWebhookService,AccessReconciler}.php`, `app/Services/Payments/RefundService.php`, `app/Jobs/CheckExpiredSubscriptionsJob.php`, `app/Http/Controllers/API/V2/{SubscriptionController,EnrollmentController}.php`, `app/Http/Controllers/API/V1/Course/ExamController.php`, `app/Console/Commands/{AccessReconcile,AccessRestoreExpired}.php`, 2 test files. **Database: no migration, no schema change.**

### What is live on deploy vs behind the switch
`ACCESS_GUARD_MODE` defaults to **`log`**: the old revoke behaviour still runs, and every row the guard *would* have protected is logged (`access_guard.would_protect`, `access_guard.refund_would_keep_access`, `access_guard.would_block_status_regress`). Set it to `enforce` (then `php artisan config:clear`) to turn the guard on. **So the reported bug is not fixed on deploy until the switch is flipped.**
- **Behind the switch:** R1/R2/R6 in the sweep and in halted, the refund rule, the late-`authenticated` block, skipping pass 1 of the nightly job.
- **Immediate on deploy (not gated):** renewals/mandate never shorten a date and use the plan's length (identical numbers for today's monthly plans), renewal lock, endpoint lock + `dry_run`, and all three course-edit fixes below (bug fixes with tests).

### Course creation / editing audit (verified by reading the code; the subagent report was checked against the source)
There is **no admin CRUD for exams, levels or pricing** in this backend (exam/level data comes from the BigQuery sync); "course" here is the student's enrollment group. Findings and fixes:
| Path | Problem (verified) | Fix |
|---|---|---|
| `POST /api/v1/exam/selectedexam` (`enrollExam`, used when a student adds/removes a paper) | hard-deleted every row of the exam, then inserted new ones: lost `valid_till`, `subscription_id`, `trial_converted_at`, `purchase_id`, paid `enrollment_type`, regenerated the row `uuid`, orphaned `transactions.transactionable_id`. An active student ended with a NULL `valid_till` = never-expiring access. No validation, no transaction (a missing `selections` was a 500 *after* the delete). | validate first (422); one transaction; rows updated **in place**; a new level inherits the paid profile; only removed levels are deleted and their transactions re-pointed; trial rows behave exactly as before |
| `POST /api/v2/enrollment/create` and `/create-by-name` | for an existing row: forced `status=trial`, `price=0`, `enrollment_type=full_exam`, reset metadata/progress: locked out an active student, wiped the plan | a row with paid history (active, or has `valid_till` / `trial_converted_at`) is never reset; only `last_accessed_at` / `active_level` / a missing `stage_id` are touched. New and trial behaviour unchanged |
| `POST /api/v1/exam/editexam/{id}` | the not-found / invalid branches called `ApiResponse::error()`, **a method that does not exist** (always a 500); an unknown level id threw after acceptance | level ids validated, 404/422 via the real helpers; only `stage_id` + level names change, other metadata/paid fields untouched |

### Evidence (what was actually run)
- **New tests:** 39 pass on a scratch MySQL schema (`clearcut_p26b_test`, empty, local). Run: `DB_CONNECTION=mysql DB_DATABASE=clearcut_p26b_test php artisan test --filter="AccessAuthorityTest|CourseEditIntegrityTest"`.
- **They test the fix, not the test:** against the original code 19 of the first 24 access tests and 7 of the 10 course tests fail; the rest are "must not change" behaviours and pass on both (the 5 tests added later - reconcile/restore tooling - are new code and were not mutation-checked).
- **No regression:** default suite (sqlite) identical to the baseline recorded before any change: 42 failed / 73 passed in the same 7 pre-existing files (tables missing on sqlite), 45 -> 84 skipped (the 39 new MySQL-only tests skip on sqlite). `EventTrackingServiceTest`, `UserStateTest`, `FirstPracticeTestTest`, `RazorpayWebhookBackfillTest`, `RazorpayKeyGuardTest` on MySQL: 41 passed / 28 skipped, same on old and new code.
- **Real concurrency:** 5 rounds x 3 processes firing the same `subscription.charged` at once on the scratch DB. New code: 1 transaction per payment, `paid_count` 5, one `valid_till` (+150 days = 5 x 30). Original code, same race: duplicate transactions, `paid_count` 7 (+180 days) and deadlock 500s. (The scratch schema had no unique index on `gateway_payment_id`; with it, the old code errors instead of double-counting. The race between a sweep and a payment is covered by the conditional-UPDATE test, not by a multi-process run.)
- **Shadow run on the real data copy (dev DB, dry-run, no writes):** old rule would sweep 257 subscriptions; with the guard 40 are still open and 6 enrollment rows are protected. Reconcile over 536 courses: ok 330, **wrongly_expired 1** (the reported group), over_granted 62, legacy_long_plan 38, null_date_fill_candidate 47, null_date_unclear 29, null_date_no_payment 29. The 62 matches the "shorten 62" of the original phase-26 backfill dry run.
- `php -l` clean on every touched file, Pint clean on new files (pre-existing style issues in `ExamController`, `RefundService`, `SubscriptionPlan` were left alone to keep the diff reviewable), commands and routes load. No frontend code changed, so there is no frontend build to run; the backend has no build step.

### Historical records that need a person (counts from the dev copy, re-run on production)
| Class | Count | Why not automatic |
|---|---|---|
| wrongly_expired | 1 | the only auto-restorable class; needs your go-ahead + backup |
| over_granted | 62 | old +60 day bug; shortening needs RD (D2) |
| legacy_long_plan | 38 | 6/15-month purchases activated as 1 month; business call (D6) |
| null_date_fill_candidate | 47 | use `enrollments:backfill-valid-till --fill-null` after review |
| null_date_unclear | 29 | payment type unreadable / several payments |
| null_date_no_payment | 29 | active with no payment: admin grant, referral, or an unauthenticated legacy activation (N4) |

### Pending / not done (explicitly)
- **D5** (annual bought while autopay is active), **D6** (honour 6/15-month purchases), **D7** (`activateEnrollment` by `group_code`), **D9** (Razorpay cancel failure): not implemented, waiting for decisions.
- **Security (N3/N4):** client-controlled `amount`/`type` in `createPayment`; unauthenticated `/buy/success*`, `/api/payments/verify`, legacy PhonePe/PayU activation; `enrolledToCourseByName` is a public endpoint that matches by `LIKE` on phone and course name; admin migration endpoints open to any logged-in user; live Razorpay keys, the webhook secret and a default cron token are written in `config/payment.php`. All verified in code, none changed here (needs your approval, and a check that n8n/WhatsApp flows do not depend on them).
- `startLearning` (`updateOrCreate` keyed without `user_id`, rewrites transaction `group_code`) and the 6 other `ApiResponse::error()` calls to a non-existent method: left as is, flagged.
- Referral rewards write the new `u_enrollments` table: whether they affect access is still unanswered (phase 64).
- Data repair has **not** been applied anywhere except the scratch DB inside tests.
- Production questions from Addendum 2 (who calls the endpoint, legacy routes in use, unique index present, yearly plans, deploy date of phase 26) are still open.

### Deployment sequence
1. Review and merge the branch (a push to `main` auto-deploys). Default mode is `log`, so revoke behaviour is unchanged; the immediate changes listed above go live.
2. On production run **read-only**: AQ1-AQ9 (Addendum 2 section 8), `php artisan access:reconcile`, and `GET /api/v2/subscriptions/expire-overdue?dry_run=1` with the token header. Check `would_protect` log lines for a few days.
3. Set `ACCESS_GUARD_MODE=enforce` in Coolify, `php artisan config:clear`. Watch the monitoring list below for a week.
4. Only then, with the CSV reviewed: `php artisan access:restore-expired --limit=5` (dry run), then `--apply --limit=5`, then the rest.
5. Security items and the open decisions as separate approvals.

### Monitoring
Log keys (grep / Sentry breadcrumbs): `access_guard.would_protect`, `access_guard.protected`, `access_guard.refund_kept_access` (**manual review**), `access_guard.status_regress_blocked`, `access.restore_expired applied|rolled back`, `expireOverdueAccess ran` (now with `guard_mode`, `enrollments_protected`). Weekly: AQ1/AQ2/AQ3 and `access:reconcile`; expected AQ2 = 0 after the repair. Support tickets tagged "course locked after payment".

### Rollback
- Guard misbehaves: set `ACCESS_GUARD_MODE=log` + `php artisan config:clear` (seconds, no deploy).
- Code problem: revert the merge (no schema or data change to undo).
- Data repair: `php artisan access:restore-expired --rollback=<backup table printed by --apply>`; the backup table is kept.
- Course-edit changes: revert the two controller changes; the in-place rows are ordinary rows, nothing to migrate back.

## Decision log
| Date | Item | Decision | By |
|---|---|---|---|
| 2026-11-01 | Implementation | Built on branch `phase-26b-access-authority`, guard default `log`; D8 kept as today; D5/D6/D7/D9 + security items pending | - |
| 2026-11-01 | Audit 2 | Hybrid E recommended; no migration; security track separate; waiting for approval (D3, D5-D9 open) | - |
| 2026-10-22 | Expiry trigger | Check and expire when the student opens the app/course; may use `/subscriptions/expire-overdue` or do it directly | User |
| 2026-11-01 | Annual purchase expired by cancelled autopay | Investigated; fix plan above, awaiting approval (D3-D5 open) | - |

# Phase 26 — CC-129 + CC-120: paid access ends when the paid period ends; deleted accounts stop being charged

**Status:** Built + verified locally (2026-10-23) — BE `phase-26-paid-expiry` (8220529), CM `phase-26-paid-expiry` (20be34e). **Not merged: push = auto-deploy = lapsed students locked at once; RD must see the list first.**
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

## Decision log
| Date | Item | Decision | By |
|---|---|---|---|
| 2026-10-22 | Expiry trigger | Check and expire when the student opens the app/course; may use `/subscriptions/expire-overdue` or do it directly | User |

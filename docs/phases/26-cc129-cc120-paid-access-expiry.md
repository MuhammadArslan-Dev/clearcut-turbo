# Phase 26 — CC-129 + CC-120: paid access ends when the paid period ends; deleted accounts stop being charged

**Status:** Not Started — **very important** (money)
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

## Plan
- [ ] **A. On-open check (user's ask):** one service method `refreshAccess($user, $enrollment)` that expires the enrollment if `valid_till < now()` and there's no active subscription (incl. one-time payments and NULL fixes). Call it where the app loads a course: get-course, get-sections, my-active-courses. Cheap, indexed, idempotent.
- [ ] **B. Daily job:** extend `CheckExpiredSubscriptionsJob` / `expireOverdueAccess()` to the same rule (one-time payments too) and log counts.
- [ ] **C. `valid_till` writers:** one-time = +30 days; `subscription.charged` = +1 period from the later of now and the current `valid_till`; never from anything else; never NULL on paid.
- [ ] **D. Server gate:** `$hasAccess` uses `status` **and** `valid_till` (+3-day grace). Locked test/video/notes endpoints return 403 past grace.
- [ ] **E. App (dashboard):**
  - 3-day grace banner (en/hi/mr).
  - A 403 on a paid item opens the existing renewal paywall.
  - Free allowance unchanged.
- [ ] **F. CC-120:** cancel Razorpay subscriptions on account delete; webhook uses `withTrashed()`, skips notifications for deleted users, returns 200; try/catch around notifications.
- [ ] **G. Backfill (dry run first):** recompute `valid_till` for paid enrollments from transactions; export the affected list (user, exam, old/new `valid_till`) for RD before enforcing.
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

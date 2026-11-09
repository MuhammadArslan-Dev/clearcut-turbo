# Phase 77 — "Access expired, student buys again": end-to-end audit + plan

**Tickets:** (new, from user)
**Repos:** BE (`C:\laragon\www\clearcutoff-main-backend`) · CM (`apps/dashboard`)
**Branch:** BE feature/phase-77-renewal (worktree C:/laragon/www/clearcutoff-backend-p77), FE feature/phase-77-renewal-ui (worktree D:/clearcutoff-projects/clearcut-master-p77), both from origin/main; nothing committed, pushed or deployed
**Created / start date:** 2026-11-04
**Status:** In Progress — approved by the user 2026-11-04. Phase 0, A, most of B and the core of C are built and tested locally; the rest of C, D (full E2E) and E (rollout) are pending. **Nothing is deployed and no production data was changed.**

> Related, not repeated here: 23 (payment pages), 26 + 26b (paid access expiry and the access guard), 27 (payment reliability), 29 (checkout/renewal analytics events), 66/67 (pricing), 75 (abandoned attempts + autopay fallback). This doc only records what this audit adds.

---

## 1. Objective
Verify what really happens when a student's course access expires and they buy again: what they see, how the order is created, how the payment is confirmed (client, webhook), how access and `valid_till` are restored, where they land, and what goes wrong in the unhappy paths (cancelled autopay, failed or pending payment, duplicates, a different plan, several courses). Then propose the safest backward-compatible fixes.

## 2. Method and limits (be honest about what was proven)
- **Read-only code audit** of BE `main` at `6da0f5b` (includes 26b guard in `log` mode and phase 75) and FE `origin/main` at `f5727fb` (`apps/dashboard`), by two parallel read-only agents (frontend, backend), with file:line evidence. The two security findings in 4.1 were re-verified by hand from the code.
- **Not done:** no runtime test, no real payment, no production data query. Anything marked *[runtime]* or *unknown* needs the verification in section 6, phase A. Production values that the code cannot tell (`ACCESS_GUARD_MODE` on prod, whether n8n calls `expire-overdue`, the `autopay_fallback` Amplitude flag state, the unique index on `transactions.gateway_payment_id`) are open questions, not findings.
- The earlier live-copy dry run (phase 26b, 2026-11-04) is the only data-backed result: with the guard in `log` mode, the expiry sweep would have expired 10 rows of which 5 are protected by the guard.

## 3. What was verified to work
- **Webhook replays are safe.** One-time: second activation is a no-op (payment id check + `lockForUpdate` re-check, `PaymentService.php:64,101`). Autopay: `gateway_payment_id` checked before and after the lock (`SubscriptionService.php:144,157`).
- **A paid order always activates**, in any attempt status, found by order id (phase 27), including late payments for a cancelled/replaced attempt, `payment.authorized` capture, and the signed `checkout-return` path.
- **Order creation is mostly safe against double clicks:** 409 `already_paid` within 1 hour of a success, reuse of the same open order for 30 minutes, cancel-on-plan-switch, `lockForUpdate`, frontend single-flight guards (`inFlightRef`, `payBusyRef`).
- **Renewal after expiry reuses the same enrollment rows** (no duplicate rows): status back to `active`, `valid_till` restarts from now (grace days are free), every level of the exam is updated.
- **Renewal while still active extends from `valid_till`** (never shortens: `extendRows` keeps the later date).
- **Prices shown match the phase 67 list** (autopay ₹99 / one-time 1 month ₹139 / one year ₹699); the stale backend pricing response is ignored.
- **Failed payments:** `/payment/failed` has Try again / Pay once / WhatsApp help; one-time failure only marks its own order.
- **Signatures:** webhook and `checkout-return` verify Razorpay signatures; unknown subscription events are ignored safely.

## 4. Findings
Severity: **S1** money lost or account at risk · **S2** student pays and may not regain access / stuck · **S3** confusing, wrong copy, missing action · **S4** hygiene.

### 4.1 Security — found on the way, outside the renewal flow (S1, verified from code)
1. **`POST /api/v2/payment/check-status` is public and hands out a login token.** `routes/Apis/V2/payment.php:23` (outside the `auth:sanctum` group). `PaymentController::checkStatus` (`:815-882`) takes `user_id`, `course_id` (a `group_code`) and `amount` (never compared to anything), finds that user's non-`active` enrollment for the group and returns `$user->createToken('auth_token')->plainTextToken`. Anyone who knows or guesses a user id and a group code of a trial/expired student can log in as that user. The dashboard and landing apps do not call it. The comparison with a transaction is commented out in the code.
2. **The admin refund route is open to every logged-in user.** `routes/Apis/V2/admin.php:15-33`: group is `auth:sanctum` only (the file's own comment says to add a role/permission middleware "before going live"); `PaymentController::refund` → `RefundService::refund` has no owner or role check. Any student can refund any transaction id (money goes back to the payer, access is revoked, mandate cancelled).
3. Also in `admin.php`: `enrollment-migration/run` and `cache/prune` sit in the same unprotected group; the admin QR route is public and forces `purchase_type=1year` (known, phase 00/N4).

### 4.2 Money / access — backend
| # | Sev | Finding | Evidence |
|---|---|---|---|
| B1 | S2 | **Money without access** paths, each only a log line or a `webhook_logs` row, no alert and no reconciliation job: transaction not found (webhook row says `success`); `exam_id` missing → 0 (transaction marked `success`, no row updated); notes without `userId`/`group_code` (`skipped`); `subscription.charged` for an unknown subscription (also an orphan Razorpay subscription if the local insert fails); capture of an authorized payment failing (still 200). | `PaymentService.php:91-99,176-187`, `RazorpayWebhookController.php:46-79,117-120`, `SubscriptionWebhookService.php:33-40`, `SubscriptionService.php:114-132` |
| B2 | S2 | **Amount is never compared** to the paid amount, and an unknown order id falls back to the *latest `initiated` row of the group*, which can attach a payment to the wrong attempt/plan. | `PaymentService.php:86-88` |
| B3 | S1 | **Price and plan are client-decided** (`amount`, `type` unvalidated). If `type` is missing activation defaults to `'1year'`, so a ₹1 order with no `type` grants a year *[runtime]*. Phase 27 D1 accepted client prices; this adds the missing-type hole. | `PaymentController.php:76,207`, `PaymentService.php:114`, `RazorpayPayment.php:76` |
| B4 | S1 | **Autopay + one-time overlap is not prevented.** `subscription/create` never looks at an existing one-time paid period; `payment/create` only checks for a running mandate when `source=autopay_fallback`. Both get charged, no refund, access just stacks (D5 in phase 26). Two captured orders from two tabs also stack. | `SubscriptionController.php:96-110`, `PaymentController.php:307-341` |
| B5 | S3 | **Date math:** one-time uses calendar months/years (overflow on 31st), autopay uses flat 30 days, mixed on the same rows. An `expired` row whose `valid_till` is still in the future (wrongly expired / refunded) loses its remaining days on re-buy. Autopay first charge uses *max(old, now+30)*, so remaining days are not added. `authenticated` grants 30 days before the first debit. | `PaymentService.php:129-150`, `SubscriptionService.php:212-217,515-544`, `EnrollmentAccessService.php:343-361` |
| B6 | S2 | **One-time activation is keyed by `exam_id`, not `group_code`**, so a purchase for one course moves sibling courses of the same exam (N8/D7, known). `createPayment` and `subscription/create` pick the *first* enrollment row. | `PaymentService.php:116-118`, `PaymentController.php:64-67` |
| B7 | S2 | **`ACCESS_GUARD_MODE=log` (default, now deployed):** the expiry sweep can still expire a freshly renewed course because of an old cancelled subscription, and refunds/halts expire the whole group. Needs the answers to "what is prod set to?" and "does n8n call `expire-overdue`, how often?". | `SubscriptionService.php:443-510`, `EnrollmentAccessService.php:217-220` |
| B8 | S3 | A `created` (not yet approved) mandate is not "renewing", so the open-app expiry can expire a lapsed row while the student is mid-checkout (the next webhook re-activates it). `subscription/create` also re-points *all* rows' `subscription_id` at the unapproved subscription at once. | `EnrollmentAccessService.php:28,186`, `SubscriptionService.php:126-129` |
| B9 | S2 | **Refunds:** no `refund.*` / `order.paid` webhook branch, so refunds made in the Razorpay dashboard never revoke access. `RefundService` does `json_decode($transaction->metadata)` on a column cast to array (autopay rows are arrays) → probable TypeError for autopay refunds *[runtime]*. | `RazorpayWebhookController.php:182`, `RefundService.php:25-31`, `Transactions.php:45` |
| B10 | S4 | `transactions.status = 'pending'` is never set; `verify` returns `pending` for anything not failed; early returns after `beginTransaction()` without rollback in `createPayment`; cancel message prints an empty valid-till date (N6). | `PaymentController.php:57-74`, `SubscriptionController.php:246` |

### 4.3 Student experience — frontend
| # | Sev | Finding | Evidence |
|---|---|---|---|
| F1 | S2 | **Autopay success is not verified.** The Razorpay handler pushes `/payment/success` unconditionally, never polls and never invalidates `my-courses` / `get-current-course`; the success page says "Access Unlocked". Cached "Expired" can show for up to 5 min (my courses) / 15 min (current course). The mandate itself is only confirmed by webhook. | `payment/initiated/page.tsx:683-757`, `useMyActiveCourses.tsx`, `useGetCurrentCourse.tsx` |
| F2 | S2 | **`?pending=1` success page is a dead end:** no polling, no retry, no support link; the one-time pending path does not invalidate the current-course query; chapter/syllabus/test-list queries (30/5/5 min) are never invalidated after paying (*[runtime]* to confirm locks stay). | `success/page.tsx`, `useRazorpayPayment.ts:361-369` |
| F3 | S2 | **Live back-arrow path pays with legacy data:** `PaymentFailedWarningModal` creates an order with `Number(data?.price)` (old list price / NaN) and bypasses `examPriceOverrides.ts`; on success it opens a modal that is not mounted on payment pages. Unverified beyond code reading. | `payment-failed-warning-modal.tsx:~38-47`, `failed/page.tsx:64-92` |
| F4 | S3 | **Expired students get trial copy:** My Courses card shows "Free trial is limited for 3 days only" and "₹99 only • Subscription per month"; the autopay card says "Best for new students". Only the status pill carries "Your plan has ended. Renew to continue"; the floating bar, locked-content modal and `renewal_required` use the generic "Unlock Full Access". The widget says ₹99/month while the page preselects the ₹139 one-time plan. | `MyCourseCard.tsx:261-287`, `paymentHeadline.ts`, `PaywallFloatingWidget.tsx:121-130`, `messages/en*.json` |
| F5 | S3 | **`valid_till` is never shown** and `access.state` is read in one place. No "Access until <date>", a cancelled-autopay student still inside the paid period looks identical to a normal active one, and Profile → Subscriptions / Payments has no Renew action. | `types/Exam.ts:115-120`, `SubscriptionWrap.tsx:128-136` |
| F6 | S3 | "Resume" on the success page mixes `activeCourse` (stage) and the purchased `course` (group) and does nothing when `activeCourse` is null. | `success/page.tsx:112-127` |
| F7 | S3 | No frontend duplicate-payment guard for an *active* student on a direct URL (only backend 409 within an hour). Subscribe duplicate handler uses `alert()` (often suppressed in WebViews). | `payment/initiated/page.tsx:565-605` |
| F8 | S4 | Dead code that still creates payments if wired (`MainPaywall`, `PreparationPaywall`, `full-course-payment-modal`), unused `/api/payment-init` posting to an n8n test URL, hard-coded English "/month • All subjects", `isFreeUser` treats expired like trial, `autopay_fallback` (phase 75) only works while its Amplitude experiment is on. | various, see agent notes in section 10 |

## 5. Scenario matrix (today)
| Scenario | UI | Backend | Verdict |
|---|---|---|---|
| Expired subscription (autopay lapsed) | "Expired" pill + "Buy Full Course"; trial copy under the button; generic floating bar | After `valid_till`+3 days → `expired`; rebuy reuses rows | Works, **copy wrong** (F4) |
| Cancelled autopay, still paid through | Looks like normal "Active"; no end date, no renew | Access kept to `valid_till`; in `log` mode the sweep may expire it early | **Confusing** (F5) / **risky** (B7) |
| Cancelled autopay, period over | Expired; Profile has no action | Expires after grace; rebuy via either path | Works; no renew in Profile |
| Failed payment | `/payment/failed` recovery | marks only that order | OK (retry-inside-modal unknown) |
| Pending / authorized | One-time ~80 s polling then `pending=1` dead end; autopay none | `payment.authorized` captured; verify says pending | One-time OK with gaps; **autopay unverified** (F1) |
| Repurchase, same plan | One-time invalidates two queries; autopay none | stacks if active, restart from now if expired | One-time OK; autopay **stale** |
| Different plan after expiry | free plan switching | no plan comparison; autopay-after-annual wastes days; client price decides | **Risky** (B3, B4, B5) |
| Duplicate payment | single-flight in one tab | 409 within 1 h; autopay+one-time both charged | **Risky** (B4) |
| Expired enrollment re-bought | page works via my-courses | same rows reused, status back to `active` | OK; in `log` mode may be re-expired (B7) |
| Several courses/exams | per-course card; desktop shows only the active course's card | exam-wide update (B6); "first row" picked | **Risky/confusing** |
| Refund after renewal | — | `log`: whole group expired; autopay refund likely errors; dashboard refunds not synced | **Risky** (B9) |
| RN WebView entry | not found (deep link works for signed-in users) | — | unknown |

## 6. Proposed phased plan (nothing started; every phase is backward compatible and separately approvable)
**Phase 0 — Security hotfix (recommend doing first, independent of renewal).** ⚠️ prod backend change.
- [ ] 0.1 Remove or protect `payment/check-status` (not used by any app): delete the route, or require `auth:sanctum` and never mint tokens.
- [ ] 0.2 Put the admin group behind a real role/permission check; move `enrollment-migration/*`, `cache/prune`, refund and QR into it; add an owner/role check inside `RefundService`.
- [ ] 0.3 Review other public routes in `payment.php` (`check-payment-by-user`, `check-course-by-user`) for the same pattern.

**Phase A — Prove it (no code change).**
- [ ] A.1 Runtime script on the live-data copy (`clearcut_live_0411`, inside a transaction, rolled back) for the scenarios in section 5, using the service methods listed in section 10 (activation after expiry, replay, stacking, missing `purchase_type`, unknown order, autopay first/second charge, `authenticated` grant, sweep vs repurchase per guard mode, refund after renewal incl. autopay).
- [ ] A.2 Read-only production checks (user runs prod queries/commands): `ACCESS_GUARD_MODE`; n8n schedule for `expire-overdue`; unique index on `transactions.gateway_payment_id`; **Razorpay payments captured in the last 60 days with no `success` transaction** (money without access); orphan subscriptions; Amplitude `autopay_fallback` flag state.
- [ ] A.3 Real-device Razorpay *test mode* click-through of expired → renew (one-time, autopay, fail, dismiss) to settle the *[runtime]* items in F2/F3.

**Phase B — Backend safety (flag-guarded, additive).**
- [ ] B.1 Reconciliation job + alert: captured/authorized Razorpay payments with no activated enrollment → Sentry/Slack and a repair command (dry run first).
- [ ] B.2 Log (then enforce) amount mismatch; stop the "latest initiated row" fallback; stop `1year` as the silent default and validate `type` against an allowlist.
- [ ] B.3 Handle `order.paid` and `refund.*`; fix `RefundService` for array metadata.
- [ ] B.4 `activateEnrollment` by `group_code` (behind a flag), keep remaining days for an `expired` row with a future `valid_till`, consistent month/day math.
- [ ] B.5 Server-side guard for overlap: if the course is already covered (one-time period or running mandate) answer 409 `already_covered` with the covered-until date, for both starters.
- [ ] B.6 Count `created` mandates as renewing for expiry; stop re-pointing all rows at an unapproved subscription.
- [ ] B.7 Decide and schedule the `enforce` switch for the 26b guard (see D1).

**Phase C — Frontend renewal UX (reuse existing components/tokens/i18n en+hi+mr).**
- [ ] C.1 One helper `getRenewalState(course)` from `access.state` + `valid_till` + subscription status (trial / active / active-cancelled-ends-on / grace / expired) used everywhere.
- [ ] C.2 Renewal copy for expired students on the My Courses card, floating bar, locked-content modal, `renewal_required`; remove trial strings for returning students; autopay badge "Best for new students" only for first-time; align the ₹ line with the preselected plan.
- [ ] C.3 Show "Access until <date>" and the cancelled-autopay notice; Renew action in Profile → Subscriptions/Payments.
- [ ] C.4 Central `invalidateAfterPayment()` (my-courses, current-course, chapters, syllabus, test lists, daily tests) used by one-time, autopay, pending and Resume.
- [ ] C.5 Autopay success: verify/poll the subscription before "Access Unlocked"; pending state with retry and support link; same for the one-time `pending=1` page.
- [ ] C.6 Fix Resume (use the purchased course), replace `alert()`, repair or remove the back-arrow modal payment path, delete dead paywalls.

**Phase D — Tests.** Backend feature tests per scenario (expired rebuy, replay, stacking, overlap 409, refund incl. autopay, webhook ordering); Playwright E2E (sonnet) for expired → renew on 390 and 1280 with Razorpay test mode; analytics events unchanged.

**Phase E — Rollout.** BE first (flags off), reconciliation dry run, then enable; FE after BE; monitor `webhook_logs`, Sentry, Amplitude `Payment Outcome`; rollback = flag off / revert merge.

## 7. Decisions needed 🛑
| # | Question | My recommendation |
|---|---|---|
| D1 | Phase 0 security fixes now, as a separate small change, before the rest? | **Yes, first.** |
| D2 | When to switch `ACCESS_GUARD_MODE` to `enforce` (needs A.2 answers) | after 1–2 days of `log` data, and once n8n's schedule is known |
| D3 | Overlap policy: block (409) a second purchase while the course is covered, or allow and credit the days? | block, with the covered-until date and a "buy anyway from <date>" later |
| D4 | Server-side prices: move one-time `amount`/`type` to server-side plan ids (supersedes phase 27 D1) or only validate/log mismatches first | log first, enforce later |
| D5 | Renewal wording for returning students (en/hi/mr) | reviewed by the client before shipping |
| D6 | Who runs the production queries in A.2 | the user (per standing rule) |

## 8. Risks
- ⚠️ Phase 0 and B touch production payment code: flag everything, deploy BE before FE, keep rollback = revert.
- ⚠️ Enforce-mode and `group_code` activation change who keeps/loses access; run the dry-run commands before enabling.
- Existing purchases, subscriptions, payment history and active users are not modified by any proposed step; reconciliation/repair commands are dry-run by default with backup + rollback (same model as `access:restore-expired`).

## 9. Verification (to run when approved)
Per phase: backend tests + the live-copy script (rolled back), `tsc`, `eslint`, `check:colors`, Playwright desktop 1280 + mobile 390 in en/hi/mr, Razorpay test mode only, Grafana/Sentry check after deploy.
- [ ] A.1 live-copy script  - [ ] A.2 prod checks  - [ ] A.3 test-mode click-through  - [ ] all later phases

## 10. Reference: how to prove the backend scenarios (for phase A.1)
Run inside `DB::beginTransaction()` … `rollBack()` on `clearcut_live_0411` (never use `RefreshDatabase` against it). Methods: `EnrollmentAccessService::expireOverdueForUser / expireAllOverdue / accessState / expireAfterRefund`; `PaymentService::activateEnrollment(int $userId, int $examId, string $groupCode, array $paymentData)`; `SubscriptionService::handleRenewalSuccess / handleAuthenticated / handleHalted / expireOverdueAccess`; `RefundService::refund`; HTTP `POST /api/v2/payment/create` and `/subscription/create` with `Sanctum::actingAs` and a mocked `RazorpayPayment` (see `tests/Feature/PaymentRecoveryTest.php`); webhook via HMAC-signed `POST /api/webhooks/razorpay`. Fixtures: user, exam, two enrollment rows sharing a `group_code`, a plan row, `initiated` transactions with JSON-string metadata. Not provable by script: production guard mode, n8n schedule, real Razorpay behaviour.

## 11. Progress log
- 2026-11-04 — Audit done (code reading + two verification reads); this doc written; report presented for approval. Nothing implemented, nothing committed.

## 12. Implementation progress (2026-11-04)

### Phase 0 — security hotfix (built, tested, NOT deployed)
- `POST /api/v2/payment/check-status` now answers 410 and mints no token (nothing in the dashboard, landing, RN, Astro, CMS or backend calls it; n8n callers could not be checked, see prerequisites).
- New `admin` middleware (`App\Http\Middleware\EnsureAdminUser`, allowlist `ADMIN_USER_IDS` / `ADMIN_PHONES`, **fails closed**). Applied to the whole `admin` group (refund, enrollment-migration, cache prune, daily-test admin) and to the formerly public `admin/qr-payment` routes.
- The two phone lookups (`check-payment-by-user`, `check-course-by-user`; public, they leaked enrollment rows and could send WhatsApp reminders) now need the automation key (`X-Api-Key`, same as the other n8n endpoints).
- Tests: `tests/Feature/SecurityHotfixTest.php` (6).

### Phase A — production database verification (read-only, through the Grafana SQL datasource `MySQL - Clear Cutoff [maindb]`; aggregates only, no customer data in this doc)
- **Environment verified as current production:** database `maindb`, MySQL 8.4.11, 21,493 users (the 2026-11-03 dump had 21,422), newest user and transaction from today.
- `transactions.gateway_payment_id` has **no unique index** (only `uuid` is unique); there are 0 duplicate payment ids today, so a unique index can be added safely after a re-check (proposal, not done).
- Webhooks, last 60 days: `subscription.charged` 308 success / **15 failed** (all 20-21 Oct, "null user" in `notifyPaymentSuccess`: charges for deleted accounts, phase 26 CC-120; none since 21 Oct); one-time `payment.captured` 42 success; `subscription.halted` 16; `payment.failed` 349.
- **One-time captured payments with no transaction matching the order id: 30** (5 Sep - 22 Oct, none after phase 27). 26 of them belong to students with a success transaction within 48 h and the matching `valid_till` (old flow that stored neither order id nor `paid_at`): access was granted. **4 payments (₹139, ₹229 x3; webhook_logs ids 4275, 4277, 4976, 5042) point at a `userId` that does not exist in `users`** (another environment using the live key?): manual review in the Razorpay dashboard, no automatic action.
- Still unknown (needs the user): `ACCESS_GUARD_MODE` on production, whether n8n calls `expire-overdue` and how often, state of the Amplitude flag `autopay_fallback`.

### Phase B — backend safety (built, tested, NOT deployed; new behaviour is flag-guarded or additive)
- `POST /v2/payment/create` now **rejects a missing or unknown `type`** with 422 `invalid_plan` (allowlist in `config/payment.php` `one_time.types`); before, a missing type silently granted a year. The amount is compared with the plan price (`one_time.prices`, phase 67 list): `PAYMENT_PRICE_CHECK_MODE=log` (default) only logs, `enforce` refuses a lower amount (422 `price_mismatch`).
- `PurchaseOverlapGuard` (`PAYMENT_OVERLAP_GUARD_MODE`, default `log`): a one-time order while autopay is approved, and autopay while the course is already paid; `enforce` answers 409 `autopay_active` / `already_covered` (with `covered_until`).
- `RefundService`: handles array metadata (autopay rows) and legacy JSON-string metadata, refuses a second refund and a refund without a Razorpay payment; the Razorpay client is swappable for tests.
- `payments:reconcile` (**read-only**, ids-only CSV) + `PaymentReconciler`. Run on the 2026-11-03 copy it gives 25 `likely_ok_legacy`, 10 `ok`, 4 `no_user`, 1 `unmatched`, which matches the production SQL above.
- A warning is logged when activation falls back to the `1year` default.
- Tests: `PaymentSafetyTest` (11), `PaymentReconcileTest` (3); earlier suites re-run green: `PaymentRecoveryTest` 21, `AccessAuthorityTest` 29, `CourseEditIntegrityTest` 10.
- **Not done yet in B:** `refund.*` / `order.paid` webhook branches, amount check at the webhook, removing the "latest initiated row" fallback, `activateEnrollment` by `group_code`, counting `created` mandates as renewing, an alert on captured-without-access (the reconcile command is the manual version), the unique index on `gateway_payment_id`. B.4 (keeping the days of an `expired` row with a future `valid_till`) was deliberately NOT changed: a refund produces the same state, so it could hand refunded days back.

### Phase C — frontend (worktree `clearcut-master-p77`; changed files typecheck and lint clean, no new colours; E2E with a mocked API in progress)
- `lib/payment/invalidateAfterPayment.ts` (invalidate every cached query after a confirmed payment), used by the one-time hook, the autopay handler and the success page.
- `lib/payment/waitForMandate.ts`: autopay success is **no longer shown before the backend confirms the mandate** (bounded poll of the subscription status); otherwise the success page opens in the "payment received, activating" state.
- Success page: while pending it re-checks every 5 s for 2 min, flips to the unlocked state by itself, then shows a "do not pay again" message with a WhatsApp support link.
- Expired students: renewal headline whatever opened the page, "Renew plan" on the card, no "free trial" line, "Best value" instead of "Best for new students". en/hi/mr keys added by appending.
- **E2E (Playwright, mocked API, desktop 1280 + mobile 390, en/hi/mr, 2026-11-04): all checks PASS.** Expired card shows Renew plan and no trial line (trial and trial_end behave as designed); plan page shows the renewal headline and Best value for an expired course; pending success page re-checks every 5 s, flips to Access Unlocked by itself and stops polling; after 2 minutes it shows the do-not-pay-again text and the WhatsApp link (wa.me/917404758398, target blank, noopener); autopay waits for the mandate (3 status calls, no early redirect, no pending flag), and with a mandate that never confirms it redirects after the 20 s cap with pending=1; no console errors. Screenshots: scratchpad/shots3. Limits: the API was mocked (no real backend, no real Razorpay), and only my-courses refetches were counted as proof of the all-queries invalidation.
- **Not done yet in C:** "Access until <date>" and the cancelled-autopay notice (the my-courses payload has no `valid_till`/subscription data yet), a Renew action in Profile → Subscriptions, the Resume button fix, `alert()` replacement, the back-arrow modal payment path and dead paywall code, floating-widget copy for expired.

## 13. Before deployment: production DB changes, backup, rollback, prerequisites
**Production database changes so far: none.** No migration, no data repair, nothing written. The only production access was read-only SELECTs.

**Environment needed before the backend deploy (the admin group fails closed otherwise):**
1. `ADMIN_USER_IDS` and/or `ADMIN_PHONES` with the staff who use the blog admin (daily tests) or refunds; otherwise those screens answer 403.
2. Check n8n for workflows that call `check-payment-by-user` / `check-course-by-user` (they must send `X-Api-Key`) or `check-status` (retired). "Payment Initiated Flow" and "Whatsapp Bot" are the likely ones and are not visible through the MCP.
3. `PAYMENT_PRICE_CHECK_MODE` and `PAYMENT_OVERLAP_GUARD_MODE` stay `log`; move to `enforce` only after reading a day of the warnings in the logs.
4. Hard-coded fallback secrets exist in `config/services.php` (automation API key) and `config/payment.php` (subscription cron token): set real values in the environment and rotate, then remove the defaults in a follow-up (not done here: removing them would break any caller that relies on the default).

**Rollback:** every change is a code revert of the merge (BE auto-deploys on `main`); the modes are env flags (`php artisan config:clear`, no deploy); there is no schema change, so nothing to undo in the database.

**Deploy order:** BE first (with the env above), then FE. The FE works with an old and a new backend (`already_covered` / `autopay_active` are only returned in `enforce`).

## 14. Remaining risks and open items
- Phase 0 is ready but undeployed: the two vulnerabilities are still live until it ships.
- The 4 orphan captures, and the unknown guard mode, n8n schedule and flag state (section 12, phase A).
- The `1year` default at activation, client-sent prices and the "latest initiated row" fallback remain until B is finished and `enforce` is chosen.
- Full end-to-end evidence (Razorpay test mode on a device, every payment scenario) is not complete; see section 8.

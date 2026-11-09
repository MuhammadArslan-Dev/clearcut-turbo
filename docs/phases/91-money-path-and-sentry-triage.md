# Phase 91 — Money-path & Sentry triage (mostly read-only)

**Tickets:** CC-49 (High, queue 03) + CC-153 (High, queue 13)
**Repos:** BE, CM (small); Sentry/Razorpay consoles are the user's
**Branch:** `fix/cc-153-expected-404-breadcrumb` (frontend, item b, committed locally, not pushed); (c) and CC-49 alert: no branch, waiting for the user
**Created / start date:** 2026-11-09
**Status:** In Progress — CC-49: no code; CC-153 (b) built and unit-tested; CC-153 (c) and the CC-49 alert are `Blocked – Decision`
**Continues:** phase 27 (CC-71/CC-59 one order per attempt, auto-capture) and phase 47 (CC-153 error triage, mapping done 2026-10-27)

> Razorpay is strictly READ-ONLY. We never capture, refund or edit anything there.

---

## 1. Problem / objective
CC-49: some Razorpay payments end `authorized` instead of `captured` (student money blocked, auto-refunded later). CC-153: Sentry still shows errors on payment, login and test pages; match every group to a ticket and fix only what has none.

## 2. Scope
- **In:** record the Razorpay finding; optional alert-only follow-up for CC-49; refresh phase 47 against today; the safe code-side CC-153 items.
- **Out:** auto-capture code (real money), Sentry alert rules and resolving groups (Sentry console), RN app errors (RN repo), PII-in-logs hardening (the user decided "leave for now" on 2026-10-27).

## 3. Findings (read-only, 2026-11-09)
**CC-49 — Razorpay dashboard (live mode):** Payments filtered `Status: Authorized`, 10 Sep–9 Nov 2026 → **"No payment in selected duration"**. Nothing is stuck authorized right now. Code already in main (phase 27): both live order paths send `payment_capture => 1` (`RazorpayPayment::createOrderLive/createOrderTest`), and `RazorpayWebhookController` (l.87–120) captures on `payment.authorized` if still authorized. Remaining gap only: the capture runs once, with no retry/sweep; a failed capture is logged (`WebhookLog` status `failed`) and the webhook still returns 200; orders created before phase 27, QR payments and `qr_code.credited` are not covered.
Also seen: many recent UPI payments `Customer – Payment Timed Out` / `Created` (→ phase 88, CC-70).
**CC-153 — what is already in main:** GX (Razorpay webhook, deleted account) `8220529`; HE/HG (duplicate phone from a soft-deleted account) CC-128 `21f30ca`/`74897d2`; F5 (cache deadlocks) `RetryOnDeadlock` + `CACHE_LIMITER` `149eaa3` (phase 90); 82 (bank decline as error) and SyntaxErrors 7K/AC (Facebook in-app browser) `cb6e21e`; B3 (get-course 404) `2408b35`; CC-112 `1c72bbd` (reload once on stale deploy, quieter Sentry); read-only `payments:reconcile` command in `cca3c4f`. **Still open, no code needed:** run `payments:reconcile` on prod and compare with the Razorpay dashboard; Sentry alert rules (webhook + payment-page errors); resolve GX/HE in Sentry after 7 clean days.
**Groups with no ticket (per phase 47):** ApiError on `/:locale/exam/:examId` and `/:locale/preparation/:courseId` (B3 explains the preparation 404; no exam-page mapping found), `/_error` ~40 (Pages-router fallback; likely stale-deploy chunk errors, CC-112 partly), PDOException (see phase 90), AxiosError 20 (AP "Network Error" ×19 comes from the RN app).

## 4. Implementation plan
- [ ] CC-49 — **no code change now.** Record the finding in phase 27 (pointer added). Optional later, alert-only: scheduled check for `webhook_logs` rows `payment.authorized` with no later `payment.captured` for the same entity → `Log::error` only. **Never auto-capture** (refund/duplicate-capture risk).
- [x] CC-153 (a) phase 47 status refreshed (see 4a/§3; fresh Sentry numbers still need the user).
- [x] CC-153 (b) expected 404/403 as breadcrumbs, opt-in per call (4a).
- [ ] CC-153 (c) code-side, small: free a soft-deleted account's `email` the way the CC-128 hook frees `phone` (listed "small, not built" in phase 47).
- Not code: Sentry alerts (webhook errors, payment-page errors), resolving groups — Sentry web UI (user).

## 4a. Built (2026-11-09) — CC-153 (b), frontend only
- `lib/sentry/sentry-api-client.ts`: a new OPT-IN context option `expectedStatuses`. When a call's `ApiError` status is in that list it is recorded as a breadcrumb ("API call answered 404 (expected)") instead of an error issue. The error is always rethrown, so every caller behaves exactly as before; anything else (5xx, other 4xx, network blips) is reported as before. Not a global rule: a 404 from an endpoint that should exist must stay visible.
- Opted in only where an unknown / not-enrolled id is a normal answer the page already handles: `useGetCurrentCourse` (`/current-course`, behind `/preparation/:courseId`; 403/404) and `useGetExam` + `useGetExamReport` (`getExamById`, behind `/exam/:examId`; 403/404).
- 5 Vitest tests (`sentry-api-client.test.ts`): expected 404 = breadcrumb and rethrown; 500 with 404 expected = still an error; 404 without the option = error as before; network failure = breadcrumb (unchanged); success = no log. tsc 93 = clean main 93; eslint unchanged (2 errors / 10 warnings in the touched files before and after).
- **Honest limit:** I cannot see Sentry, so I did not confirm that those two groups are 403/404 (phase 47 only says "no mapping found"). If the groups turn out to be 5xx or another status, this changes nothing for them. The user can check the group's `status` tag (`sentryApiClient` already sets it) and tell me.
- Verified in a browser: not run (a logging-only change with no UI; covered by the unit tests). Not verified: effect on real Sentry volume (needs ~7 days of data).

## 5. Decision log
| Date | Question | Answer (who) |
|---|---|---|
| 2026-11-09 | 🛑 CC-153 (c) — free the soft-deleted account's `email`: touches account/auth data. Approve building it? Options: (a) yes, same hook pattern as `phone`; (b) leave. | open |
| 2026-11-09 | 🛑 CC-49 follow-up — add the alert-only `payment.authorized` sweep? (a) yes alert-only; (b) no, Razorpay shows none stuck. Recommendation: (b) for now, revisit if the list is ever non-empty. | open |

## 6. Blockers / risks
- Authorized-status check shows the **current** state; a payment authorized earlier and auto-refunded would appear under Refunded/Failed — not examined (user may check "Refunded" for the same window).
- CC-153 numbers date from 2026-10-27; fresh Sentry data is needed (user).
- Risk: low (no money-moving code).

## 7. Dependencies / packages added
None.

## 8. Tests and verification
- [x] (b): 5 unit tests, tsc, eslint (4a). [ ] (c) if approved: backend test on a throwaway DB. [ ] user: Sentry groups after 7 days; user: Sentry alert rules, resolve GX/HE after 7 clean days, run `payments:reconcile` on prod.

## 9. Next steps
Wait for the two 🛑 answers ((c) and the CC-49 alert); then build only the approved items.

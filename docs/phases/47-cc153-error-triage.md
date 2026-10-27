# Phase 47 — Triage production errors on money paths

**Tickets:** CC-153 (High)
**Repos:** read-only first (Sentry, Jira), then BE/CM fixes
**Status:** Mapping done (2026-10-27). Every group is mapped; no new code needed. Open items: Razorpay reconciliation (user), Sentry alerts (user)
**Created:** 2026-10-27 (wave 2, Arslan's list)

## Goal
Every error group on payment, login and exam/preparation paths is mapped to an existing ticket or has a fix/explanation.

## Mapping (Sentry production, last 14 days, read 2026-10-27)

### Backend (`laravel-backend`)
| Sentry issue | Events (14d / total) | Cause found | Maps to | Status |
|---|---|---|---|---|
| [LARAVEL-BACKEND-GX](https://clear-cutoff.sentry.io/issues/LARAVEL-BACKEND-GX) Razorpay webhook failed | 15 / 98 | `subscription.charged` for a **deleted account** → `notifyPaymentSuccess(null)` TypeError | CC-120 (Testing) | **Fixed**: `8220529` (Phase 26, on main 2026-10-23). Last event 2026-10-21, none since the deploy. Resolve in Sentry after 7 clean days. |
| [LARAVEL-BACKEND-HE](https://clear-cutoff.sentry.io/issues/LARAVEL-BACKEND-HE) AuthController::login failed | 34 / 77 | Duplicate `users.phone` on INSERT: the conflicting row is a **soft-deleted account**, so its number could never sign up again | CC-128 (Phase 30) | **Fixed**: `21f30ca`/`74897d2` (on main 2026-10-23 12:11). The `User::creating` hook frees the deleted row's phone (`x<id>-<digits>`). Last event 2026-10-21. Resolve after 7 clean days. |
| [LARAVEL-BACKEND-HG](https://clear-cutoff.sentry.io/issues/LARAVEL-BACKEND-HG) Truecaller login failed | 12 / 20 | Same duplicate-phone INSERT (same person and minute as an HE event) | CC-128 | **Fixed** by the same commit |
| [LARAVEL-BACKEND-F5](https://clear-cutoff.sentry.io/issues/LARAVEL-BACKEND-F5) Deadlock on `insert ignore into cache` | 9 (4 users) | Database cache driver (MySQL `cache` table) deadlocks under concurrent `get-sections` | Phase 49 (CC-149 caching) | Covered by 49 — the cache store choice (Redis vs DB) belongs there |
| [LARAVEL-BACKEND-HW](https://clear-cutoff.sentry.io/issues/LARAVEL-BACKEND-HW) `s_chapters.subject_id` null | 2 | `bigquery/syncChapters` row with no subject (content data) | content sync | Data issue; tell the content team (row without subject) |
| [LARAVEL-BACKEND-JS](https://clear-cutoff.sentry.io/issues/LARAVEL-BACKEND-JS) Truecaller profile fetch failed | 2 | Truecaller API call failed (external) | CC-118 area | Expected/external; keep watching |
| [LARAVEL-BACKEND-JQ](https://clear-cutoff.sentry.io/issues/LARAVEL-BACKEND-JQ) Amplitude DNS timeout | 1 | Transient; the job retries | — | Expected |

Not seen in the last 14 days: `PDOException` on `/api/blog/get-questions` and `/api/v2/interactions`. They are listed in the ticket but have no open issue now. Watch them in Phase 49.

### Frontend (`clearcutoff-nextjs-app` — also receives the React Native app's events)
| Sentry issue | Events | Source | Maps to | Status |
|---|---|---|---|---|
| AY, AW, AZ, B1, B0 `captureOtpAutofillDiag` | 23+16+11+4+4 | RN app diagnostic messages (iOS OTP autofill investigation) | memory: RN iOS OTP autofill bug | Diagnostics, not errors — remove once the autofill fix is confirmed (RN repo) |
| AS Meta Pixel not running | 22 (10 users) | Dashboard pixel watchdog (ad blockers / blocked fbevents) | CC-115/CC-131 | Diagnostic; fine as is |
| AP AxiosError: Network Error | 19 | RN app (`index.android`) | CC-112 area (RN) | Network blips in the RN app; RN should treat them as breadcrumbs, like the dashboard's `isNetworkFailure` |
| B2 Cannot find native module 'TruecallerIos' | 14 (11 users) | RN Android | **CC-118 (To Do)** | Open RN bug, already ticketed |
| 82 Subscription payment failed: bank declined | 10 | Dashboard `/payment/failed` | CC-64/CC-69 | Fixed by `cb6e21e` (2026-10-24, declines are not errors). Last event 6 days ago. |
| B3 API 404 get-course | 4 | Dashboard preparation | — | Fixed by `2408b35` (course 404, 2026-10-24) |
| 7K, AC SyntaxError | 2+1 | Facebook in-app browser injected script | CC-112 | Fixed by `cb6e21e` |
| B5 androidx IllegalArgumentException | 2 | RN Android | RN | Low volume; RN repo |
| AB promise rejection (Event) | 1 | Dashboard preparation | CC-95 (To Do) | Single event; non-Error rejection |
| A8 API 500 POST /v2/interactions | 1 | Dashboard → BE | Phase 49 | Single event |
| 70 TypeError: network error | 1 | Dashboard test-series | — | Network blip |

### Linked Jira tickets (status 2026-10-27)
CC-120 Testing · CC-117 To Do · CC-71 Testing · CC-49 To Do · CC-87 Testing · CC-55 Testing · CC-118 To Do · CC-38 Done · CC-112 Testing · CC-95 To Do.

## Other findings
- **Follow-up (small, not built):** the CC-128 fix frees the deleted account's `phone` but not its `email` (also unique). A returning user who enters the same email on the new account would hit a duplicate-email error.
- **PII in Sentry:** BE `Log::error(...)` contexts send full phone numbers (and a name, via the SQL text) to Sentry (HE/HG `log_context.phone`, the INSERT statement). User decided 2026-10-27: leave as is for now.
- The RN app reports into the dashboard's Sentry project (Phase 41 already noted it). A separate project would make this triage cleaner (RN repo + Sentry settings).

## Steps
1. [x] Pull each group from Sentry and record ids.
2. [x] Map to tickets and to local phase files.
3. [x] Investigate unexplained groups: HE/HG (deleted-account phone, already fixed by CC-128), F5 (cache driver → Phase 49).
4. [ ] Razorpay reconciliation SQL vs the Razorpay dashboard (user runs it on prod).
5. [ ] Sentry alerts for the webhook and payment pages (user / approval).

## Decisions needed
- **D2 📞:** Sentry alert rules for the webhook and payment pages.

## Decision log
| Date | Decision | By |
|---|---|---|
| 2026-10-27 | Deleted account's number → fresh new account. Same as the 2026-10-23 CC-128 decision, already live | User |
| 2026-10-27 | PII (phone numbers in BE Sentry log contexts): leave for now | User |
| 2026-10-27 | Post the mapping as a Jira comment on CC-153 | User |

## Verification
Mapping table complete; each fix verified per DEVELOPMENT_RULES section 8.

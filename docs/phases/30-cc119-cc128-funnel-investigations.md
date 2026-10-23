# Phase 30 — CC-119 + CC-128: why autopay success halved, and what broke the signup funnel in October

**Status:** Done (2026-10-23).
- Investigation complete; the deleted-account login fix is merged and pushed (BE `74897d2`, live).
- Open, outside the code: production SQL for October autopay by exam; Ganesh's HPTET/HTET ad URLs; Jira comments on CC-119/CC-128.
**Jira:** [CC-119](https://clear-cutoff.atlassian.net/browse/CC-119), [CC-128](https://clear-cutoff.atlassian.net/browse/CC-128)
**Repos:** read-only (git history of CM/ASTRO/BE, Amplitude, Sentry, Clarity); fixes later
**Size:** medium (analysis)

## What the tickets say
**CC-119 — autopay success (per user):**

| Month | Success |
|---|---|
| June | **42%** |
| July | 24% |
| Aug | 27% |
| Sep | 21% |
| Oct | **18%** |

- At June's rate, October would have ~97 payers instead of 42.
- One-time payments: 49% in the last 30 days.
- `transactions.payment_method` / `failure_reason` are empty on every row.
- **Step 1 (Ganesh):** Razorpay dashboard: subscription statuses, top failure reasons, method split, mandate settings.
- **Step 2 (Arslan): list everything shipped to the payment page and checkout between end of June and now, with dates, and match it to the drop.**
- **Step 3 (RD):** traffic mix (FB/IG share).
- **Step 4:** save payment_method and failure_reason (also CC-69).

**CC-128:**
- Cost per registration doubled (₹21 → ₹42) since early October.
- The leak is **landing → auth screen**, mainly on Android:

  | Platform | Before (late Sep) | Oct |
  |---|---|---|
  | Android | 44–45% | 33–36% |
  | Desktop | ~20–29% | ~7% |

- After the auth screen, the funnel is fine.
- **Suspects:** the CC-13 login release (Sep 26 → Oct 5), CC-106/107/84 (already fixed and in testing), CTA/redirect/app-vs-web routing.
- **Sentry:** `AuthController::login failed` first seen 4 Oct (43 events, Android app/okhttp); Redis DNS failures.
- RD corrected (22 Oct): 9–11 Oct was ₹0 Meta spend, not an outage.

## What the code shows / where to look (2026-10-23)
- **Git:** `git log --since=2026-06-15` on the CM payment page, `useRazorpayPayment`, `packages/auth`, landing `/start` + StartAuthForm; ASTRO `/go` CTA and `StartLinkEnhancer`; BE `PaymentController`, `SubscriptionController`, `AuthController`.
- **Amplitude:** reachable through the claude.ai Amplitude MCP. Rebuild the landing → "Authentication Options Viewed" funnel by platform/browser/week, and the checkout funnel by plan/browser/month.
- **Sentry:** LARAVEL-BACKEND for `AuthController::login failed` (what it logs, which client).

## Findings (2026-10-23)
### CC-119: autopay success fell mostly because the exam mix changed
- **Local DB copy (to 23 Sep), autopay mandates per student by month:**

  | Month | All | HTET | CTET | HPTET |
  |---|---|---|---|---|
  | June | 41% (508) | **44% (402)** | 27% (37) | – |
  | July | 24% (37) | – | 14% (29) | – |
  | Aug | 27% (186) | – | 28% (144) | 24% (34) |
  | Sep | 21% (269) | 40% (5) | 21% (178) | 24% (54) |

- **June was ~80% HTET**, which converts at ~44% in every month it appears. From July the traffic is CTET and HPTET, which were ~25% from the start.
  - So most of "42% → 18%" is mix, not a broken checkout.
  - The within-exam drop to look at is **CTET 28% (Aug) → 21% (Sep)**.
- **Code changes on the checkout before October were small:**
  - BE: June 15–26 the subscriptions/pricing went live; Sep 3 timeout retries.
  - CM history starts 7 Aug: Aug 22 HPTET plan; Sep 25 MAHATET price; Oct 3 Meta events; Oct 5 floating pay button.
  - No dated change lines up with a step down inside an exam.
- **Attempts per student stayed ~1.0–1.1** (the double-order bug existed but did not drive the rate).
- **The October number needs production data.** Run (read-only):

```sql
SELECT DATE_FORMAT(s.created_at,'%Y-%m') AS m, ex.short_name AS exam,
       COUNT(DISTINCT s.user_id) AS students,
       COUNT(DISTINCT CASE WHEN s.paid_count>0 OR s.status IN ('authenticated','active','paused','halted','completed') THEN s.user_id END) AS mandated
FROM subscriptions s
LEFT JOIN u_exam_enrollments e ON e.group_code=s.group_code AND e.user_id=s.user_id
LEFT JOIN exams ex ON ex.id=e.exam_id
WHERE s.deleted_at IS NULL AND s.created_at >= '2026-06-01'
GROUP BY m, exam ORDER BY m, exam;
```

- **Step 4 (`payment_method` / `failure_reason`) is done** in Phases 27/29; the Razorpay failure reasons now arrive from 23 Oct.

### CC-128: landing → auth screen
- **Amplitude** (page on clearcutoff.in → Authentication Options Viewed, same day): the drop starts the **week of 5 Oct** (Android 44% → 33%, iPhone 51% → 15%, Windows 26% → 6%).
- **By traffic source:** `utm_source=fb` (the ads) stayed **36–46%** every week. Only the no-UTM traffic fell: 49–58% → 16% (5 Oct) → 31% → 28%.
- **Homepage `/` with no UTM:**

  | Week | 7 Sep | 14 Sep | 21 Sep | 28 Sep | 5 Oct | 12 Oct | 19 Oct |
  |---|---|---|---|---|---|---|---|
  | Students | 46 | 49 | 427 | 502 | 187 | 72 | 84 |

  - Ads appear to have sent people to `/` without UTM from 21 Sep, then to `/go/exam/*` with `utm_source=fb` from early October. Plus ₹0 spend 9–11 Oct (RD).
  - What is left on `/` is low-intent organic/desktop, so the blended rate dropped. This is mostly a mix/attribution change, not a broken page.
- **Per page:**

  | Page | 21 Sep | 28 Sep | 5 Oct | 12 Oct | 19 Oct |
  |---|---|---|---|---|---|
  | `/` | 58% | 53% | 18% | 37% | 23% |
  | CTET `/go` | 40% | 39% | 37% | 38% | 35% |
  | **HPTET `/go`** | 36% | 37% | 32% | **24%** | **18%** |

  - **CTET's page is steady, so the shared page code is fine.**
  - **HPTET fell through October with no ASTRO commit between 20 Sep and 21 Oct**, so not code. Likely audience/creative (new ad "HPTET Test Series ₹149/month" on 21 Oct, ₹149 vs CTET ₹99), plus the deferred pixel (Phase 28) hurting Meta's optimisation.
  - Needs: Ganesh's HPTET ad URLs and creatives by week.
- **Real bug found and fixed:** Sentry LARAVEL-BACKEND-HE "AuthController::login failed", 77 events since 8 Sep, okhttp = Android app.
  - It is `Duplicate entry '+91…' for key users_phone_unique`.
  - The number belongs to a **deleted account** (soft-deleted row, e.g. user 4354, deleted 14 Sep). `users.phone` is unique across deleted rows too, so anyone who deleted their account could never sign up or log in again on any path. The race-retry in `login()` couldn't help: the default query hides deleted rows.
  - 63 such accounts in the 23-Sep copy. LARAVEL-BACKEND-HG (Truecaller login failed, 16) is likely the same.
  - **Fix (user's choice: new empty account; merged + pushed 2026-10-23, BE `74897d2`):** `User::creating` frees the number. The deleted row's phone becomes `x<id>-<last 10 digits>` and keeps its data; a new account is created.
  - Verified in a rolled-back transaction: the deleted number logs in (200) with a new account; a second login reuses it; a fresh number still works.

## Proposed next tickets
1. CC-119: run the SQL above for October; if CTET/HPTET drop within the exam, look at Razorpay failure reasons (now stored) by method/browser.
2. CC-128: Ganesh to share the HPTET ad URLs/creatives; compare after Phase 28 (pixel on load) is live a week. Keep UTMs on every ad (one no-UTM campaign hides its funnel).
3. Production count of deleted accounts blocked so far (read-only):

```sql
SELECT COUNT(*) FROM users WHERE deleted_at IS NOT NULL AND phone LIKE '+91%';
```

## Plan
- [x] **CC-119 step 2:** dated timeline of every payment/checkout change since June (price, plan ladder, default autopay, Razorpay config, CC-58/60/61/67 etc.). Overlay it on the monthly success rates.
- [x] **CC-119 step 4:** covered by Phase 27/29 (`payment_method`, `failure_reason`). Note the dependency here.
- [ ] **CC-119:** Amplitude split by in_app_browser/plan where possible. Collect Ganesh/RD inputs from Jira.
- [x] **CC-128:** dated timeline of landing/auth/redirect changes Sep 15 → Oct 22 across CM + ASTRO.
- [ ] **CC-128:** reproduce landing → auth on Android Chrome + FB IAB and desktop (Playwright, prod, analytics blocked): does the CTA respond and land on the auth screen?
- [x] **CC-128:** read the Sentry `AuthController::login failed` events, and fix them if they're ours.
- [x] **Write-up** in this file (Jira comments: after the Atlassian MCP login) plus a Jira comment on each ticket, with the suspected causes ranked and proposed fix tickets.
- [!] No production writes. Read-only queries only, given to the user as SQL.

## Decision log
| Date | Item | Decision | By |
|---|---|---|---|
| 2026-10-23 | Deleted account signs up again | New empty account; old row's phone freed | User |

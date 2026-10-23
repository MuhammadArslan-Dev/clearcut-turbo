# Phase 30 — CC-119 + CC-128: why autopay success halved, and what broke the signup funnel in October

**Status:** Not Started — investigation first (findings → fixes as their own phases)
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

## Plan
- [ ] **CC-119 step 2:** dated timeline of every payment/checkout change since June (price, plan ladder, default autopay, Razorpay config, CC-58/60/61/67 etc.). Overlay it on the monthly success rates.
- [ ] **CC-119 step 4:** covered by Phase 27/29 (`payment_method`, `failure_reason`). Note the dependency here.
- [ ] **CC-119:** Amplitude split by in_app_browser/plan where possible. Collect Ganesh/RD inputs from Jira.
- [ ] **CC-128:** dated timeline of landing/auth/redirect changes Sep 15 → Oct 22 across CM + ASTRO.
- [ ] **CC-128:** reproduce landing → auth on Android Chrome + FB IAB and desktop (Playwright, prod, analytics blocked): does the CTA respond and land on the auth screen?
- [ ] **CC-128:** read the Sentry `AuthController::login failed` events, and fix them if they're ours.
- [ ] **Write-up** in this file plus a Jira comment on each ticket, with the suspected causes ranked and proposed fix tickets.
- [!] No production writes. Read-only queries only, given to the user as SQL.

## Decision log
| Date | Item | Decision | By |
|---|---|---|---|
| | | | |

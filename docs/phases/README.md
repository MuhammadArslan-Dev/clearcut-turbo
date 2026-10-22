# Wave-1 Phases — Tracker

Source: Arslan's top-to-bottom list (2026-10-21). Jira project `CC` (clear-cutoff.atlassian.net).
Investigation done read-only on 2026-10-21 across 4 repos:

| Short | Repo |
|---|---|
| **CM** | `D:\clearcutoff-projects\clearcut-master` (this repo — landing, dashboard, blog, tools, packages) |
| **BE** | `C:\laragon\www\clearcutoff-main-backend` (Laravel API) |
| **ASTRO** | `D:\clearcutoff-projects\Astro-marketing-clearcut` (`/go/*` ad landing pages, academy, Worker) |
| **RN** | `E:\React Native\ClearCutoff-App - New` (WebView wraps dashboard) |

## Rules for every phase

1. Work phases **in order**, top to bottom. Don't start the next phase while the current one is waiting on a decision, unless the user says so.
2. **🛑 DECISION**: stop and ask the user. Don't pick an option yourself.
3. **⚠️ SYSTEM IMPACT**: the change affects other apps, shared packages, backend contracts, prod env, payments or analytics data. Stop, explain the impact, and wait for approval.
4. **📞 CLIENT**: only RD/client can answer. Mark the phase `Blocked – Client` until the answer is written into the phase file.
5. Record every answer in the phase file's **Decision log**, with a date, before continuing.
6. Follow `docs/DEVELOPMENT_RULES.md`: reuse components and tokens, i18n en/hi/mr, verify with tsc, eslint and check:colors, plus screenshots for UI.
7. Never commit or push unless asked, and no Co-Authored-By trailer.

## Status values

`Not Started` · `In Progress` · `Blocked – Decision` · `Blocked – Client` · `In Review` · `Completed`

Within each phase, steps use `[ ]` todo · `[~]` in progress · `[x]` done · `[!]` blocked.

## Tracker

| # | Phase | Tickets | Repos | Status | Waiting on |
|---|---|---|---|---|---|
| 00 | [Security findings (outside the tickets)](00-security-findings.md) | — | BE | Blocked – Decision | User: rotate keys / remove routes |
| 01 | [Razorpay "Test Mode" on live checkout](01-cc58-razorpay-test-mode.md) | CC-58 | BE, CM-dashboard | In Review | Deploy BE then dashboard; live check (no Test Mode); C2 affected-student list |
| 02 | [Stop test traffic reaching live Pixel/Amplitude/Clarity](02-cc115a-cc94-analytics-allowlist.md) | CC-115A, CC-94 | CM, ASTRO (Meta Pixel only) | In Progress | Review + merge; C1: is there a Meta tag inside GTM? |
| 03 | [Raw code text on landing pages](03-cc107-raw-code-text.md) | CC-107 | ASTRO | In Review | Merge + deploy go pages; C1 (screenshot/session from RD) |
| 04 | [₹NaN in Payments tab](04-cc100-payments-nan.md) | CC-100 | CM-dashboard, BE | In Review | Merge + deploy BE then dashboard; C1 (columns/wording/plan name) |
| 05 | [Correct Purchase value to Meta](05-cc53-meta-purchase-value.md) | CC-53 | CM-dashboard, BE | In Review | Merge + deploy BE then dashboard; tell RD Purchase counts/values will change |
| 06 | [Signup form + T&C link](06-cc84-cc85-signup-form.md) | CC-84, CC-85 | CM-landing, packages/ui, packages/auth | In Review | Merge + deploy landing (blog/tools pick up the modal changes on their next deploy); RD: copy (C1–C3) |
| 07 | [Real reason behind OTP "unknown_error"](07-cc87-cc55-otp-unknown-error.md) | CC-87, CC-55 | CM packages/auth + landing, (BE), (RN) | In Review | Merge + deploy BE first, then landing (blog/tools pick up the shared screens on their next deploy); annotate Amplitude; RD copy (C1) |
| 08 | [Landing main button not responding](08-cc106-landing-cta.md) | CC-106 | ASTRO, (CM) | In Review | Merge; deploy ASTRO (go pages) + landing/blog for the mr redirect; Clarity check after a week; C1/C3 with RD |
| 09 | [Pay button does nothing](09-cc60-pay-button.md) | CC-60 | CM-dashboard, (BE) | In Review | Razorpay test-mode click-through (local), merge, deploy dashboard; C2 copy with RD |
| 10 | [Crashes on older phones](10-cc112-older-phone-crashes.md) | CC-112 | CM (all apps), ASTRO | Not Started | D1–D3, C1–C4 |
| 11 | [Payment page loads twice](11-cc61-payment-double-load.md) | CC-61 | CM-dashboard | Not Started | D1, C1 |
| 12 | [Trial copy on landing + in-app](12-cc67-trial-copy.md) | CC-67 | ASTRO, CM-landing, CM-dashboard, CMS admin | Not Started | C1–C3 (copy from RD) |
| 13 | [HPTET landing-page-view tracking (parked)](13-cc115b-hptet-lpv.md) | CC-115 Part B | ASTRO | Not Started | Not in Arslan's list — confirm whether to do it |
| 14 | [Blog Worker CPU limit (503 / error 1102)](14-blog-worker-limit.md) | — (prod incident 2026-10-21) | CM-blog, Cloudflare | Superseded by 15 (rolled back to Oct 13 build; prerender work parked on `blog-worker-cpu`) | — |
| 15 | [Move blog to Vercel](15-blog-vercel-migration.md) | — | CM-blog, Vercel, Cloudflare DNS | Not Started | D1–D5, C1–C2 |
| 16 | [Question rendering: 20/page, render-once HTML, page-only fetch](16-question-rendering-and-page-size.md) | — | CM-blog, (BE for part C) | In Progress | C gated on index check |
| 17 | [Sentry lazy loading, keep page-speed data](17-sentry-lazy-loading.md) | — (user request 2026-10-22) | CM dashboard, blog, landing, tools; ASTRO go/academy | In Review | User checks locally; then merge + deploy dashboard, landing, blog (Vercel), tools (Pages) |

## Cross-phase dependencies

- **01 ↔ 09:** the monthly-autopay checkout opens without a Razorpay `key` (subscription-create returns none). That is the likely cause of both "Test Mode" (CC-58) and some dead pay taps (CC-60).
- **09 → 05:** one-time Purchase events rarely fire today, because verify-polling dies on the first 400. Fixing 09 will **raise Purchase counts in Ads Manager**, so tell the client before it ships.
- **02 → 05:** once the allowlist exists, the Purchase/Subscribe pixel calls must go through it too.
- **06 ↔ 07:** both touch `StartAuthForm.tsx` and `packages/auth`. Do 06 and 07 back-to-back and test login once at the end.
- **03 ↔ 08:** CC-107's fix (move the Lottie script, make the guarantee/price block a link) overlaps CC-106's "price card should link to /start".
- **10 ↔ 02:** the `.at` crash comes from Amplitude's web-vitals plugin. Changing the Amplitude init in 02 is the natural place to set `autocapture.webVitals:false`.

## Change log

- 2026-10-21: created folder, 14 phase files, investigation results copied in.

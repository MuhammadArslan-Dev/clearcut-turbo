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
| 02 | [Stop test traffic reaching live Pixel/Amplitude/Clarity](02-cc115a-cc94-analytics-allowlist.md) | CC-115A, CC-94 | CM, ASTRO (Meta Pixel only) | Done in Phase 28 | — |
| 03 | [Raw code text on landing pages](03-cc107-raw-code-text.md) | CC-107 | ASTRO | In Review | Merge + deploy go pages; C1 (screenshot/session from RD) |
| 04 | [₹NaN in Payments tab](04-cc100-payments-nan.md) | CC-100 | CM-dashboard, BE | In Review | Merge + deploy BE then dashboard; C1 (columns/wording/plan name) |
| 05 | [Correct Purchase value to Meta](05-cc53-meta-purchase-value.md) | CC-53 | CM-dashboard, BE | In Review | Merge + deploy BE then dashboard; tell RD Purchase counts/values will change |
| 06 | [Signup form + T&C link](06-cc84-cc85-signup-form.md) | CC-84, CC-85 | CM-landing, packages/ui, packages/auth | In Review | Merge + deploy landing (blog/tools pick up the modal changes on their next deploy); RD: copy (C1–C3) |
| 07 | [Real reason behind OTP "unknown_error"](07-cc87-cc55-otp-unknown-error.md) | CC-87, CC-55 | CM packages/auth + landing, (BE), (RN) | In Review | Merge + deploy BE first, then landing (blog/tools pick up the shared screens on their next deploy); annotate Amplitude; RD copy (C1) |
| 08 | [Landing main button not responding](08-cc106-landing-cta.md) | CC-106 | ASTRO, (CM) | In Review | Merge; deploy ASTRO (go pages) + landing/blog for the mr redirect; Clarity check after a week; C1/C3 with RD |
| 09 | [Pay button does nothing](09-cc60-pay-button.md) | CC-60 | CM-dashboard, (BE) | In Review | Razorpay test-mode click-through (local), merge, deploy dashboard; C2 copy with RD |
| 10 | [Crashes on older phones](10-cc112-older-phone-crashes.md) | CC-112 | CM (all apps), ASTRO | In Review | Merge; deploy landing, dashboard, tools (Pages), blog auto; #2/#5 need stack traces (C4) |
| 11 | [Payment page loads twice](11-cc61-payment-double-load.md) | CC-61 | CM-dashboard | In Review | Merge + deploy dashboard; C1 (deep links) answered by code search: none |
| 12 | [Trial copy on landing + in-app](12-cc67-trial-copy.md) | CC-67 | ASTRO, CM-landing, CM-dashboard, CMS admin | In Review | Release ASTRO + landing + dashboard together; C3 (live CMS search) |
| 13 | [HPTET landing-page-view tracking (parked)](13-cc115b-hptet-lpv.md) | CC-115 Part B | ASTRO | Covered by Phase 28 | Ganesh: HPTET ad URLs |
| 14 | [Blog Worker CPU limit (503 / error 1102)](14-blog-worker-limit.md) | — (prod incident 2026-10-21) | CM-blog, Cloudflare | Superseded by 15 (rolled back to Oct 13 build; prerender work parked on `blog-worker-cpu`) | — |
| 15 | [Move blog to Vercel](15-blog-vercel-migration.md) | — | CM-blog, Vercel, Cloudflare DNS | Not Started | D1–D5, C1–C2 |
| 16 | [Question rendering: 20/page, render-once HTML, page-only fetch](16-question-rendering-and-page-size.md) | — | CM-blog, (BE for part C) | In Progress | C gated on index check |
| 17 | [Sentry lazy loading, keep page-speed data](17-sentry-lazy-loading.md) | — (user request 2026-10-22) | CM dashboard, blog, landing, tools; ASTRO go/academy | In Review | User checks locally; then merge + deploy dashboard, landing, blog (Vercel), tools (Pages) |
| 18 | [Content + subject-card dead taps](18-cc105-cc83-content-dead-taps.md) | CC-105, CC-83 | CM-dashboard, BE | Built, verified locally (not merged) | Any deploy order (card hides marks until BE is live) |
| 19 | [Layout shift + payment speed](19-cc116-cc68-layout-shift-speed.md) | CC-116, CC-68 | CM-dashboard | Dashboard fixed (0.78→0.01), not merged | Sentry re-check 3 days after deploy; prep left by decision |
| 20 | [Resizer: tabs, plain labels, feedback](20-cc92-cc93-resizer-ui.md) | CC-92, CC-93 | CM-tools | Built, verified locally (not merged) | Build + deploy tools after approval; re-check CC-92 Clarity |
| 21 | [My Courses clarity + exam logos](21-cc111-cc25-my-courses-and-exam-logos.md) | CC-111, CC-25 | CM-dashboard, CM-tools | Built, verified locally (not merged) | Tools deploy (logos + 4 new exams) needs approval |
| 22 | [Landing cards look tappable](22-cc109-landing-cards.md) | CC-109 | ASTRO | Built, verified locally (not merged) | Merge with the WIP stash dance; user deploys ASTRO |
| 23 | [Hindi/Marathi payment page + failed-page recovery](23-cc66-cc64-payment-pages.md) | CC-66, CC-64 | CM-dashboard | Built, verified locally (not merged) | C1 RD copy review; confirm support WhatsApp |
| 24 | [Start-here guide on preparation](24-cc79-start-here-guide.md) | CC-79 | CM-dashboard | Built, verified locally (not merged) | Ganesh reviews hi/mr copy |
| 25 | [Cancel flow: reason + offer + confirmation](25-cc97-cancel-flow.md) | CC-97 | CM-dashboard | Built, verified locally (not merged) | RD: 'too expensive' offer; confirm WhatsApp no. |
| 26 | [Paid access expiry + deleted-account billing](26-cc129-cc120-paid-access-expiry.md) | CC-129, CC-120 | BE, CM-dashboard | Built, verified locally (not merged) | Run preview SQL → RD → then merge; backfill dry-run on server; ops: cancel #118/#1530 |
| 27 | [One order per attempt + FB/IG app payments](27-cc71-cc59-payment-reliability.md) | CC-71, CC-59 (+CC-49) | BE, CM-dashboard | Built, verified locally (not merged) | Real FB/IG phone test; ops: auto-capture on + capture stuck authorized; prod check SQL in file |
| 28 | [Meta Pixel: test-traffic block, fbc, ex-GST, fee](28-cc115-cc130-cc131-cc132-meta-pixel.md) | CC-115, CC-130, CC-131, CC-132 | CM, ASTRO, (BE) | Built, verified locally (not merged) | After deploy: check fbc coverage + no maintest events in Events Manager; Ganesh: HPTET/HTET ad URLs |
| 29 | [Checkout + renewal events](29-cc69-cc98-checkout-renewal-events.md) | CC-69, CC-98 | CM-dashboard, BE | Built, verified locally (not merged) | Check events in Amplitude after deploy; /pay link later |
| 30 | [Investigate autopay drop + signup funnel break](30-cc119-cc128-funnel-investigations.md) | CC-119, CC-128 | read-only | Done (fix live: BE 74897d2) | Prod SQL for Oct autopay by exam; Ganesh: HPTET/HTET ad URLs; Jira comments |
| 31 | [OTP auto-read + language stays](31-cc54-cc89-otp-autoread-language.md) | CC-54, CC-89 | CM (auth, landing, dashboard), ASTRO | Done (pushed) | Phone test of Resend autofill; v2 OTP-less routes wait for link format |
| 32 | [Test screens respond + completion tracked](32-cc102-cc103-cc104-tests-experience.md) | CC-102, CC-103, CC-104 | CM-dashboard | Done (+ locked-card line on branch) | Check new events in Amplitude |
| 33 | [Continue-free exit + headline by source](33-cc63-cc74-payment-page-exit-and-headline.md) | CC-63, CC-74 | CM-dashboard | CC-63 done (branch, not pushed) | CC-74 headline copy (RD) |
| 34 | [Resizer limits + readable script errors](34-cc91-cc95-resizer-limits-script-errors.md) | CC-91, CC-95 | CM-tools, CM | CC-91 merged; tools deploy pending | Tools deploy approval |
| 35 | [Preparation page tour](35-preparation-page-tour.md) | — | CM-dashboard | Built + tested (branch `prep-tour-audit`, not pushed) | Push approval |
| 36 | [Test sites out of Clarity + Amplitude](36-cc94-test-hosts-out-of-clarity-amplitude.md) | CC-94 | CM, ASTRO, BE | Built + verified locally (branches, not pushed) | Push approval; maintest BE `AMPLITUDE_ENABLED=false` |
| 37 | [Payment headline by source](37-cc74-payment-headline-by-source.md) | CC-74 | CM-dashboard | Built + verified locally (branch, not pushed) | Push approval |
| 38 | [Sentry page + language tags](38-cc95-sentry-page-language-tags.md) | CC-95 | CM-dashboard, CM-landing | Built + verified locally (branch, not pushed) | SENTRY_AUTH_TOKEN check on server; top-5 after a week |
| 39 | [Email to Meta + Amplitude](39-cc113-email-to-meta-and-amplitude.md) | CC-113 | CM-dashboard, packages/utils | Built + verified locally (branch, not pushed) | Push approval; server CAPI is a separate job |
| 40 | [/go CTA opens /start in Chrome](40-cc122-go-page-opens-start-in-chrome.md) | CC-122 | ASTRO, CM-landing | Built + verified locally (branches, not pushed) | Real Android phone test; push approval |

## Cross-phase dependencies

- **01 ↔ 09:** the monthly-autopay checkout opens without a Razorpay `key` (subscription-create returns none). That is the likely cause of both "Test Mode" (CC-58) and some dead pay taps (CC-60).
- **09 → 05:** one-time Purchase events rarely fire today, because verify-polling dies on the first 400. Fixing 09 will **raise Purchase counts in Ads Manager**, so tell the client before it ships.
- **02 → 05:** once the allowlist exists, the Purchase/Subscribe pixel calls must go through it too.
- **06 ↔ 07:** both touch `StartAuthForm.tsx` and `packages/auth`. Do 06 and 07 back-to-back and test login once at the end.
- **03 ↔ 08:** CC-107's fix (move the Lottie script, make the guarantee/price block a link) overlaps CC-106's "price card should link to /start".
- **10 ↔ 02:** the `.at` crash comes from Amplitude's web-vitals plugin. Changing the Amplitude init in 02 is the natural place to set `autocapture.webVitals:false`.

## Change log

- 2026-10-21: created folder, 14 phase files, investigation results copied in.

- 2026-10-24: added phases 35–40 (tour, CC-94, CC-74, CC-95 rest, CC-113, CC-122). Jira: CC-51 → Testing; CC-1, CC-44, CC-86 → Done.

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
8. **Phase doc first.** Before any major task, new feature or substantial improvement: check this folder for an existing doc on it (no duplicates), copy `_TEMPLATE.md` to the next free `NN-slug.md`, fill it, add a tracker row, and wait for the user to review the plan. No implementation before that. Keep the same doc updated (progress, decisions, blockers, test results, next steps) so a new session can resume from it. Small fixes and one-line tweaks don't need a phase doc.

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
| 42 | [Login token out of URLs](42-cc143-token-out-of-urls.md) | CC-143 | CM auth + dashboard, ASTRO, BE | Parked — Sentry span/transaction scrub built + Playwright-tested (not committed) | Code flow + revoke: end of wave |
| 43 | [Teaching resizer SEO (7-day target)](43-cc159-teaching-resizer-seo.md) | CC-159 (+CC-160) | CM-tools, tools BE | Built + Playwright-tested (not committed) | Team: sheet edits (43-sheet-edits.md); user: Search Console + deploy tools BE then tools |
| 44 | [Request storm on navigation](44-cc146-request-storm.md) | CC-146 | CM-dashboard | Built + Playwright-tested (not committed) | Deploy dashboard; Clarity/Meta gateway left by user |
| 45 | [Laravel performance tracing](45-cc145-laravel-tracing.md) | CC-145 | BE, CM-dashboard | Built + unit-tested (not committed) | Deploy BE + dashboard; user sets SENTRY_TRACES_SAMPLE_RATE=0.1 |
| 46 | [Razorpay webhooks → Amplitude](46-cc163-razorpay-webhooks-amplitude.md) | CC-163 | BE | Built + verified locally (not committed) | Deploy BE; user runs the backfill (dry run, then --send) |
| 47 | [Money-path error triage](47-cc153-error-triage.md) | CC-153 | read-only | Mapping done, posted on CC-153 | User: Razorpay reconciliation SQL + Sentry alerts |
| 48 | [Public pages Sentry coverage](48-cc144-public-sentry-coverage.md) | CC-144 | CM public apps, ASTRO | Not Started | D1 sampling, D2 CC-142 |
| 49 | [Backend TTFB + slow endpoints](49-cc149-backend-ttfb.md) | CC-149 | BE | Not Started | 3 days of phase 45 data |
| 50 | [Front-end bundles + LCP](50-cc150-frontend-bundles-lcp.md) | CC-150 | CM-dashboard, blog | First pass built + measured: JS -9% dashboard / -22% onboarding (target -25%), not committed | D1 Amplitude defer, D2 Replay cost, D3 prefetch, D4 LazyMotion, auth-spinner LCP |
| 51 | [Public pages delivery](51-cc151-public-delivery.md) | CC-151 | CM public, ASTRO, infra | Not Started | D1 infra |
| 52 | [Slow-network UX](52-cc152-slow-network-ux.md) | CC-152 | CM-dashboard | Built on 4 screens; Playwright found the retry sent no request — fixed, **re-test blocked on an auth token** | User: approve a local-only test token |
| 53 | [Guardrails + close epic](53-cc154-guardrails-cc141-close.md) | CC-154, CC-141 | CI, Sentry | Not Started | after 42–52 |
| 54 | [Blog home + exam page redesign](54-blog-home-exam-redesign.md) | — | CM-blog | Built + Playwright-tested, 1 bug found and fixed (not committed) | Commit approval |
| 55 | [Payment page redesign](55-payment-page-redesign.md) | — | CM-dashboard | Built + Playwright-tested; 4 fixes applied, behaviour unchanged (not committed) | Commit approval |
| 56 | [Profile screens redesign](56-profile-screens-redesign.md) | — | CM-dashboard | All 3 screens built + browser-tested on real data, behaviour unchanged (not committed) | hi/mr + 390 px pass |
| 57 | [First-enrollment Practice Test](57-first-enrollment-practice-test.md) | — | CM-dashboard, backend | Built on branch `feature/first-enrollment-practice-test`; tsc/eslint/colors pass, **not run end to end** (not committed/pushed) | local test token for backend + browser check |
| 58 | [Generic user_states](58-user-states.md) | — | CM-dashboard, backend | Built + tested in Playwright (en, desktop + mobile) and Pest; local branch, not committed | commit approval |
| 59 | [Practice Test results — match new desktop design](59-practice-test-results-design-match.md) | — | CM-dashboard | Task written, not started (needs 3 art/logo decisions) | trophy art, background hills, logo |
| 60 | [SEO: canonical host + leftover test page](60-cc138-cc139-seo-host-and-test-page.md) | CC-138, CC-139 | Cloudflare, SEO | CC-139 done + verified live; CC-138 **not done** (www still 200, needs a Cloudflare Redirect Rule) | Cloudflare rule |
| 61 | [Payment plan cards](61-cc73-cc76-payment-plan-cards.md) | CC-73, CC-76 (CC-74 see 33/37) | CM-dashboard | Reported done; no commit found — verify in testing | Ganesh testing |
| 62 | [Payment attribution: campaign, exam, transaction id](62-cc136-cc137-payment-attribution.md) | CC-136, CC-137 | BE, CM-dashboard | Reported done; no code found on this machine — verify against acceptance list | Ganesh testing |
| 63 | [Question pages: raw LaTeX](63-cc166-academy-math-rendering.md) | CC-166 | CM-blog | Fixed + live (`f672a26`, 2026-10-28) | Ganesh testing |
| 64 | [Enrollments: `u_exam_enrollments` → `u_enrollments` + levels](64-enrollment-table-migration.md) · [runbook](64a-enrollment-migration-runbook.md) | — | BE (CM-dashboard: no change) | Built + tested on the local dev DB (27 tests, races, rollback rehearsal); branch `feature/enrollment-table-migration` in worktrees, **uncommitted**; nothing run on prod | Browser check (needs a backend running the branch), commit approval, prod rollout by the user |
| 65 | [Topic Test results — match new design](65-topic-test-result-design-match.md) | — | CM-dashboard | Built; desktop + mobile checked in en/hi; animation to be watched by eye, mr/reduced-motion left | user review |
| 66 | [Autopay ₹99 offer / A/B test — built, then removed](66-autopay-price-ab-test.md) | — (CC-62 lineage) | CM-dashboard | **Removed** from the dashboard (code identical to before); implementation kept in git history for the Practice Test A/B | Delete the unused Amplitude objects (list in the doc) |
| 67 | [Standardize prices: ₹99 autopay / ₹139 one-time / ₹699 year](67-pricing-standardization.md) | — | CM-dashboard, CM-landing, Astro `/go` | In review: implemented and verified locally, not pushed | Owner sets production `payment.onetime_1year_price` = 699 (command in the doc); approve push |
| 72 | [Feature flag for the first-enrollment Practice Test](72-practice-test-feature-flag.md) | — | CM-dashboard | Built; Amplitude flag `practice_test` enabled at 100 %; browser verification in progress | verify, commit approval |
| 73 | [Google Ads MCP server (read + write) on Coolify](73-cc124-google-ads-mcp-server.md) | CC-124, CC-126 | CM `apps/google-ads-mcp`, Coolify | In Progress: built + 80 tests pass locally, not deployed | User: Google Cloud OAuth client, Ads developer token (Basic), DNS `mcp-ads`, team account list |
| 74 | [GA4 MCP server (read + write) on Coolify](74-cc125-ga4-mcp-server.md) | CC-125, CC-127 | CM `apps/google-analytics-mcp`, Coolify | In Progress: built + 21 tests pass locally, not deployed | User: same Google Cloud/OAuth client + Analytics APIs enabled, DNS `mcp-ga`, team list |
| 76 | [Rich text (bold, blue, links) for FAQ questions and answers](76-faq-rich-text.md) | — | CMS, CM-landing | In Review (built, verified on a DB clone; not committed) | User review; CMS backup + deploy CMS then landing; Hindi slug issue is a separate task |
| 77 | [Renewal after access expiry: end-to-end audit + plan](77-renewal-after-expiry-audit.md) | — | BE, CM-dashboard | In Progress (0, A, most of B, core of C built locally; nothing deployed) | Deploy approval + env prerequisites (doc §13); remaining B, C, D, E |
| 78 | [Backend speed: slow APIs, TTFB, caching (CC-149)](78-cc149-backend-speed.md) | CC-149 | BE | Blocked – Decision (plan written, nothing implemented) |
| 79 | [Motion library (animations package) + preview page](79-motion-library-animations.md) | — | CM `packages/motion`, `apps/dashboard` | In Progress (built + typechecked; visual check pending, not integrated anywhere) | User runs dashboard dev, checks `/animation-preview`; approved-designs PDF; integration instructions |
| 80 | [Daily + Practice Test motion (intro, Nibbu, submit, animated result)](80-daily-practice-test-motion.md) | — | CM `packages/motion`, `apps/dashboard` | In Progress (built + tested locally; nothing committed/pushed/deployed) | User review of final summary; go-ahead to commit/deploy |
| 82 | [Test start + submit animations as overlays (modal / bottom sheet)](82-test-start-submit-overlays.md) | — | CM `packages/motion`, dashboard | Built + tested (mocked API); pending the user's own test. |
| 83 | [Lesson Path loader — trial replacement of the dashboard loader](83-lesson-path-loader-trial.md) | — | CM-dashboard | Trial built + tested locally; one-switch revert; pending approval. |
| 84 | [Onboarding + Enrollment animations adapted to the real screens (previews only)](84-onboarding-enrollment-motion-previews.md) | — | CM-dashboard | Previews built, checked locally; awaiting user review; nothing wired into real screens. |

## Cross-phase dependencies

- **01 ↔ 09:** the monthly-autopay checkout opens without a Razorpay `key` (subscription-create returns none). That is the likely cause of both "Test Mode" (CC-58) and some dead pay taps (CC-60).
- **09 → 05:** one-time Purchase events rarely fire today, because verify-polling dies on the first 400. Fixing 09 will **raise Purchase counts in Ads Manager**, so tell the client before it ships.
- **02 → 05:** once the allowlist exists, the Purchase/Subscribe pixel calls must go through it too.
- **06 ↔ 07:** both touch `StartAuthForm.tsx` and `packages/auth`. Do 06 and 07 back-to-back and test login once at the end.
- **03 ↔ 08:** CC-107's fix (move the Lottie script, make the guarantee/price block a link) overlaps CC-106's "price card should link to /start".
- **10 ↔ 02:** the `.at` crash comes from Amplitude's web-vitals plugin. Changing the Amplitude init in 02 is the natural place to set `autocapture.webVitals:false`.

## Change log

- 2026-10-29: added phase 66 (autopay ₹99 offer / A/B test: built and then removed from the dashboard; learnings kept).
- 2026-10-28: added phases 60–63 (CC-138/139, CC-73/76, CC-136/137, CC-166). CC-95 and CC-74 are covered by phases 34/38 and 33/37.
- 2026-10-21: created folder, 14 phase files, investigation results copied in.

- 2026-10-27: added phases 42–53 (wave 2: CC-143, 159, 146, 145, 163, 153, 144, 149, 150, 151, 152, 154, 141).
- 2026-10-28: added phase 59 (Practice Test results screen — match the new desktop design).
- 2026-10-28: added phases 60–63 (CC-138/139, CC-73/76, CC-136/137, CC-166). CC-95 and CC-74 already covered by phases 34/38 and 33/37.
- 2026-10-28: added phase 58 (generic user_states: onboarding, practice test, guide, topic tour).
- 2026-10-28: added phase 57 (first-enrollment Practice Test).
- 2026-10-27: added phase 54 (blog home + exam page redesign from design screenshots).

- 2026-10-24: added phases 35–40 (tour, CC-94, CC-74, CC-95 rest, CC-113, CC-122). Jira: CC-51 → Testing; CC-1, CC-44, CC-86 → Done.

- 2026-10-30: added phases 68–70 (tools login gate, auth modal redesign, acquisition attribution).
- 2026-10-30: added phase 71 (image download options sheet + free-PDF lead via Amplitude, tools; a DB request table was built and removed again).
- 2026-11-06: added phase 80 (Daily + Practice Test motion: intro, Nibbu, submit animation, animated result; local only, not pushed).
- 2026-11-06: added phase 81 (Chapter / Sectional / Full exam tests motion: start intro, Nibbu note, submit animation, animated result; local only, not pushed).
- 2026-11-06: added phase 82 (test start + submit animations as overlays; local only).
- 2026-11-06: added phase 83 (Lesson Path loader trial, local only).
- 2026-11-07: added phase 84 (onboarding + enrollment animations adapted to the real screens, previews only, local).

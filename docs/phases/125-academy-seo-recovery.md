# Phase 125 — Academy SEO recovery (question URLs, 5xx, canonicals, sitemaps, robots)

**Tickets:** (new, from user) — follows the SEO audit of 2026-11-23
**Repos:** CM (`apps/blog`, `apps/landing`) · BE (`clearcutoff-main-backend`, read-only so far) · ASTRO (`Astro-marketing-clearcut/apps/go-marketing`) · infra (Coolify blog app, Cloudflare)
**Branch:** `phase-125-academy-seo-recovery` in CM (from `main`) and in ASTRO (from `main`). Backend: no change needed, no branch. Local commits only — nothing pushed, merged or deployed.
**Created / start date:** 2026-11-23
**Status:** Implemented on the branches and verified locally (see §0). Not deployed. Search Console untouched.

> Labels used throughout: **Verified** = seen directly (git, code, a live `curl` on 2026-11-23, or a public backend API read). **Inferred** = a conclusion from verified data, not proven. GSC numbers come from the audit report (`seo-audit-clearcutoff.md` in the session scratchpad), not re-read here.

---

## 0. Status — implemented 2026-11-23 (approved structure kept)

**User constraint that overrides this plan:** the one-question pages are NOT coming back (D1 = B, "keep the 301s and make them robust"). Question URLs keep redirecting to the chapter/listing pages; the plan's P0-1 and the question-URL half of P0-4 were adapted to that (below). Decisions taken inside that constraint: D2 = (a), D3 = keep (no structure change), D4 = translate + self-canonical, D5 = landing `/exam/*` canonical, `/go/exam/*` noindex, D6 = 404 (the backend has no soft deletes, so "deleted" cannot be confirmed → no 410), D7 = no data backfill; null-slug questions 301 to their nearest parent page.

Local verification: production build (`next build` + `next start`, port 3004) against the real local backend (Laragon, DB `clearcut`). One local-env fix was needed first: the committed backend migration `2026_11_12_100000_add_incorrect_explanation_to_question_trans_table` was still pending locally (every `get-questions` call answered 403 "Unknown column"); run alone with `--path` (additive nullable column). Local data matches production for the audit's numbers (CTET 34 + HTET 2 wrongly-empty chapters, 253 + 192 questions; question 7276 has `chapter.slug = null`).

### 0.1 Per task

| Task | What was done | Before → after (local curl, Googlebot UA) |
|---|---|---|
| **P0-1 (adapted)** question URLs | No question pages. `question/[...questionId]/route.ts` rewritten: the target comes from the cached question index + exam index (`lib/seo/question-target.ts`, pure) — **0 backend calls per redirect** when warm (was: one `get-questions?id=&limit_q=2` call, ~70 KB, per URL). Ids the index doesn't list: one cached lookup; chapter known → chapter page 1; chapter `slug: null` / not in navigation → nearest existing parent (canonical subject page with questions → level → exam hub). `/en/question/*` rewritten in the middleware → one hop. | `/question/if-you-wish-to-7276` 404 → **301** `/htet/level-1-prt/subject/physics` (its section HTET_PHY locally) → 200 indexable. `/en/question/swarth-ka-vilom-hai-1077` 301→301→200 → **301→200**. All other samples unchanged single 301 (same targets as before, incl. `/page/N#q-` and `/hi` only for genuinely Hindi pages). `does-not-exist-99999999` 404 (now `Cache-Control: public, max-age=600`). |
| **P0-2** no 503 | Exam index and question index keep a last-good copy per instance and serve it when the backend fails (exam index retries the backend every 60 s while stale). Redirect route never answers 5xx: nothing resolvable → **302 `no-store`** to the home page (temporary, Google keeps the URL). Sitemaps: `sitemapResponse()` serves the last sitemap that built on the instance. Hubs are ISR and their reads throw, so a failed regeneration keeps the last good page instead of caching a hub without links. | Backend stopped (pass-through proxy killed): old code `/question/*` **503** ×3, `ctet-questions.xml` **503**, level page 200 with no subject/year links. New code, warm instance: `/question/*` **301** to the right page (from the stale index, no backend), id not in the index **302** home `no-store`, `ctet-questions.xml`/`htet.xml` **200** (last good), hub 200 (ISR). |
| **P0-3** origin speed (in code) | Hubs (level, `/subject`, `/year`) were rendered on every request (`private, no-store`); now ISR (`revalidate 3600`, empty `generateStaticParams`) → `s-maxage=3600`. Redirects no longer call the backend. Infra part (Cloudflare proxy, Coolify sizing, Redis hit rate) not touched — user's call. | `/htet/level-1-prt` `cache-control: private, no-cache, no-store` → `s-maxage=3600, stale-while-revalidate`. |
| **P0-4 (adapted)** sitemaps / re-crawl | No question URLs (they redirect). Sitemaps list listing pages only, every URL checked: all 200, self-canonical, indexable. `<lastmod>` of every `/page/N` is never older than `PAGE_LAYOUT_CHANGED_AT` = 2026-10-21 (the 50 → 20 recomposition, commit 2725014) — a genuine change date, not build time. `/hi` hubs added. Literal route `sitemaps/ctet-questions.xml` removed (the dynamic route serves the same file). | 3,381 URLs (lastmods Feb–Sep 2026) → **3,507 URLs, 3,507/3,507 = 200 + self-canonical + indexable** (full check, not a sample). +72 pages of the 36 previously-noindexed chapters, +/hi hubs. |
| **P1-1** cross-level canonical | D2 = (a): non-canonical chapter/subject copies keep rendering (navigation unchanged) but their title and description now describe the canonical copy (level/subject of the canonical path), so title and canonical agree. Subject pages already link chapters at their canonical path. | `/htet/level-2-tgt/subject/mathematics/number-system` title "…– HTET Level 2 TGT" + canonical Level 1 PRT → title of the Level 1 PRT copy, same canonical. |
| **P1-2** subject/year repeats | Not changed: turning subject pages into chapter lists would change the approved structure. | – |
| **P1-3** wrong noindex | Emptiness from the question index (the list the page renders); `has_questions` only as fallback. | `/ctet/paper-2/subject/mathematics-science/light` `noindex, follow` → **indexable**, in the sitemap (all 36 chapters). |
| **P1-4** `/null` | Level page and `/subject` list skip subjects without a slug; legacy link builders removed (below). `/…/null` stays 404 (no soft-404 redirect to home). | `/HTET/…/mathematics/null` 301 → 404 noindex (unchanged, correct). |
| **P1-5** main robots.txt | `apps/landing/src/app/robots.ts`: removed `Disallow: /_next/` and the `/go/sitemap.xml` line; test `robots.test.ts`. | `Disallow: /_next/` + 3 sitemaps → no `/_next/` rule, 2 sitemaps (`/sitemap.xml`, `/sitemap-tools.xml`). |
| **P1-6** sitemap hygiene | Academy `robots.txt` lists only `sitemaps/index.xml` (it already lists `sitemap.xml` and every exam file). | `Sitemap:` ×2 → ×1. |
| **P1-7** `/go/exam/*` duplicate | ASTRO `exam/[slug].astro`: `<meta name="robots" content="noindex, follow">` (self-canonical kept; no cross-domain canonical next to noindex). Landing `/exam/*` en/hi/mr were already self-canonical with en/hi/mr/x-default hreflang (checked on landing dev, no change). | built `dist/{,hi/,mr/}exam/htet-preparation.html`: no robots → `noindex, follow`. |
| **P1-8** `/hi` hubs | `HubPage` copy (en + hi) via `lib/seo/hub-metadata.ts`; exam, level, `/subject`, `/year` hubs: Hindi title/description/headings/labels on `/hi`, breadcrumbs stay on `/hi`, self-canonical + en/hi/x-default hreflang. Exam-hub level cards are now real `<a href>` (were click-only buttons — the hub had no crawlable link to its levels); the click keeps the step flow. Home `/hi` unchanged (still canonical to English). | `/hi/htet` canonical `/htet`, no hreflang, English title → canonical `/hi/htet`, hreflang en/hi/x-default, Hindi title. Same for `/hi/ctet`, `/hi/htet/level-1-prt`, `/…/subject`, `/…/year`. |
| **P2-1** page weight | Not done (both-language HTML was a 2026-10-20 product decision; measuring and changing it is a separate step). | – |

### 0.2 Legacy code removed (old one-question / client-list structure, no live importer)
`components/blog/assessment-question/{assessment-question-block, question-list-by-subject, questions-list-by-chapter, similar-questions-section, others-exams-section, section-questions-experience, section-question-card}.tsx`, `components/pages/{QuestionsPage, QuestionListByYear}.tsx`, `components/blog/ui/question-card.tsx`, `components/feature/year-list-modal.tsx`, `components/questions/q-option.tsx`, `components/ui/{exam-card, math}.tsx`, `utils/google/{getMcqFaqSchema, get-faqs-schema}.ts`, `getQuestionUrlParam` + `sanitizeAiSlug` (`utils/slugify.ts`), the `QuestionsList` component (the file now holds only the shared types), route `app/sitemaps/ctet-questions.xml/route.ts`. Most of them built `/question/<slug>-<id>` links.

### 0.3 Tests
- Blog vitest 248 passed / 2 skipped: `route.test.ts` rewritten for the new rules (no backend call on an index hit, `/page/N`, /hi rule, canonical path, null-slug parent chain, 404s, 302 on total failure incl. 429 and HTML-instead-of-JSON), `load-exam-index.test.ts` (emptiness from the question index, last-good fallback), `question-pages.test.ts` (layout lastmod floor), `exam-sitemap-entries.test.ts` (/hi hubs), `robots.test.ts`. Landing `robots.test.ts` 2 passed.
- `tsc --noEmit` blog: 58 errors on `main` → 45, **0 new** (compared per file/message; the 13 gone were in deleted files). Lint on touched files: 0 new errors (pre-existing `any`s elsewhere). `pnpm check:colors`: no new colours (blog 221 → 195).
- Curl matrices: scratchpad `seo125/baseline-matrix.txt`, `after-matrix.txt`, `baseline-down.txt`, `after-down-warm.txt`, `baseline-smcheck.txt`, `after-smcheck.txt`, `prod-before.txt` (4 read-only production requests: same as local baseline).
- Playwright (Sonnet subagent): see §0.5.

### 0.4 Remaining risks / not fixed
- A page that was **never rendered** on an instance (no ISR copy) while the backend is down still answers **500** (checked: a non-canonical chapter copy). The same for a sitemap that never built on the instance (503). Nothing stale exists to serve; both are retried by Google. After a deploy everything is cold, so a backend outage right after a deploy is the bad case.
- ISR copies rendered by the old build may be served once before regenerating (seen locally: the first `light` response after the restart was the old `noindex` copy, the second was correct). Production's Redis cache is keyed per build id, so a deploy starts clean.
- The last-good copies are per process memory; a restart loses them (the Next data cache still holds the backend responses).
- Subject pages can be large (local `/htet/level-1-prt/subject/physics` 3.4 MB uncompressed) — P2-1.
- `/hi` level/subject/year hubs list subject names in English (the backend's `get-subject` has no Hindi names); headings, title, description are Hindi.

### 0.5 Playwright
Sonnet subagent, real clicks, 390x844, third-party hosts blocked, screenshots in the session scratchpad `seo125/pw/`. Blog has en + hi only (no mr). Results:
- `#q-<id>` after the redirect: `/question/swarth-ka-vilom-hai-1077`, `/hi/question/a-2701`, `/question/61` land on the chapter page with the card at 96 px from the top (in view).
- en/hi at 390 px: `/htet`, `/hi/htet`, `/htet/level-1-prt`, `/hi/htet/level-1-prt`, `/hi/…/subject`, `/hi/…/year`, `light`: `scrollWidth` 390 (no overflow), Hindi headings on `/hi`, no "undefined"/"null".
- Level cards: click keeps the step flow (CTET Paper 1 shows its language step, HTET levels navigate), Ctrl+click opens a new tab. **Defect found and fixed:** English card hrefs were `/en/htet/level-1-prt` (a 301 hop) because `usePathname()` returns next-intl's internal `/en` path; the component now strips it (re-checked: `/htet/level-1-prt`, `/ctet/paper-1`, `/hi/htet/level-1-prt`).
- Internal links on 7 sample pages (97 links): no status ≥ 400, no `/null`/`undefined`; the only 3xx were the `/en/` card links above (fixed).
- `/htet/level-1-prt/subject`: 24 subject rows, none ends in `/null`.
- Not verified by it: middle click, HTET sub-choice steps, `/hi/ctet` cards, console errors (one per page, not inspected; likely the blocked trackers).

---

## 1. Problem / objective

Google traffic to `academy.clearcutoff.in` (`apps/blog`) collapsed on **2026-10-28**: impressions went from ~3,000–4,500/day to 10–100/day, clicks to 0 from 1 Nov, and indexed pages for the whole `sc-domain:clearcutoff.in` property fell from ~22K to 7.06K (GSC, audit §2.2, §3.1). The academy's long-tail traffic came from individual `/question/<slug>-<id>` pages. The blog changes merged 20–21 Oct turned every one of those URLs into a 301 to a paginated chapter page, added a 503 path, and changed every chapter page's content (50 → 20 per page). The objective is to get the question long tail back into the index without re-creating the cost problems that motivated the change, and to clear the other indexing defects the audit found.

### 1.1 Audit evidence (from the audit report, GSC, Verified there)
| Signal | Before | After |
|---|---|---|
| Academy impressions/day | 1,200–4,500 (May → 27 Oct) | 107 on 28 Oct, then 6–39 |
| Academy clicks/day | 1–19 | 0 since 1 Nov |
| Indexed pages (whole property) | ~22K mid-Oct | ~9K on 24–25 Oct, 7.06K on 16 Nov |
| Not indexed | ~27K | ~42K |
| Page with redirect | – | 10,370 (old `/question/*`, upper-case `/HTET/`) |
| Server error (5xx) | – | 3,478; validation started 10/27, failed 11/7 |
| Google chose different canonical | – | 6,787 |
| Crawled – currently not indexed | – | 16,155 (incl. hubs `/htet`, `/ctet`) |
| Excluded by noindex | – | 137 |

Top academy URL in the 30 days before 28 Oct: `/question/swarth-ka-vilom-hai-1077`, 411 impressions.

### 1.2 Timeline linking code to the drop
| Date (2026) | Event | Source |
|---|---|---|
| 10-13 | Last blog Worker version before the change (`c08099d9`) — individual question pages live | phase 14 |
| 10-16 | `514ff6d` question sitemap gets real lastmod (still lists `/question/*` URLs) | git |
| 10-19 | URL architecture decision: "questions live on chapter pages, not `/question/<slug>-<id>`" | DEVELOPMENT_RULES §10, §11 changelog |
| 10-20 14:20 | `4be3727` commit: question page deleted, catch-all 301 route added, sitemaps rebuilt without question URLs, 50/page pagination | git |
| 10-21 08:40 UTC | Blog deployed to Cloudflare Workers Free → first renders hit "error 1102 / exceededCpu" (503) and `/sitemap.xml` 500 | phase 14 |
| 10-21 | Blog moved to **Vercel Hobby**; `e458725` (Hindi 301 targets, server key), `2725014` (**50 → 20 per page**), `3022e12`, `f303a7f`, `197e56f` (cheap redirects from the cached question index) | phase 15/16, git |
| 10-22 | `8832973` ISR 600 s → 1 day: 247K ISR write units in ~27 h vs 200K/month Hobby quota | git |
| 10-24 | `9322ee7` ISR → 7 days: **563K ISR writes vs the 200K/month limit** | git |
| 10-24/25 | GSC indexed count drops ~22K → ~9K | audit |
| 10-27 | GSC 5xx validation starts | audit |
| 10-28 | Academy impressions fall to 107 | audit |
| 11-02 | Blog moves from Vercel to Coolify (`next start`), no auto-deploy | memory `project_blog_on_coolify` |
| 11-07 | 5xx validation fails | audit |
| 11-14 | Coolify disk filled by ISR files (13.3 GB in 9 days); Redis ISR cache handler added | `docs/BLOG_REDIS_ISR_CACHE.md` |

**Inferred:** the drop is the sum of (a) ~22.6K indexed question URLs (11.3K questions × en/hi, phase 14 inventory) all turned into 301s at once, (b) the 301 target being a page whose content had just been reshuffled (50 → 20 per page the same day) and which lists 20 questions under a chapter title, so the per-question title/description that matched long-tail queries no longer exists anywhere, and (c) 5xx responses during 21 Oct – 2 Nov from three hosting setups in 12 days (Workers CPU limit, Vercel Hobby over quota, the 503 path in the redirect handler). The 7-day lag between the deploy (21 Oct) and the impression drop (28 Oct) matches a recrawl cycle.

---

## 2. Scope
- **In:** `/question/*` behaviour (restore or replace), 503s, canonical rules for chapter/subject/year pages, the empty-chapter noindex, `/null` and other junk URLs, academy and main sitemaps, the main `robots.txt` (`/_next/` block, `/go/sitemap.xml` line), landing vs Astro `/go` course duplicates and tracking parameters, `/hi` academy canonical/hreflang, academy page weight and origin speed, the re-crawl plan and monitoring.
- **Out (explicitly not doing here):** thin landing/hub content and new "mock test / PYQ / syllabus" pages (audit recs 4, 5, 11), tool title rewrites (rec 6), internal linking programme (rec 9), backlinks (rec 10), the AI-bot robots policy (rec 15, business decision). They depend on this phase being done first, or are separate content work.

---

## 3. Commit forensics (what the Oct 20–21 commits changed)

### 3.1 Previous behaviour of `/question/...` (Verified, `git show 4be3727^:apps/blog/src/app/[locale]/(blog)/question/[questionId]/page.tsx`)
- A real page: **200**, server-rendered, one question (plus one neighbour, `limit_q=2`) from `GET /blog/get-questions?id=<id>&limit_q=2`, ISR `revalidate: 3600`.
- Title from the URL slug + exam/paper (`"<slug text> - CTET Paper 1"`), description = the question's own text (155 chars) — written to fix earlier "duplicate without user-selected canonical" flags.
- **Self-canonical** per locale: `/question/<slug>-<id>` (en) and `/hi/question/<slug>-<id>` (hi), with hreflang `en`, `hi`, `x-default`.
- A wrong or missing slug (`/question/61`) **permanentRedirect**ed to the canonical `<ai_slug|first-4-words>-<id>`.
- JSON-LD: Breadcrumb + FAQPage (question/explanation).
- Listed in `sitemaps/<exam>-questions.xml` (en + hi) by `lib/sitemap/build-questions-sitemap-xml.ts` (walk exam → level → subject → chapter → questions).

### 3.2 `4be3727` — 2026-10-20 "Blog SEO: paginated question bank, exact-section subjects, targeted cache revalidation" (179 files)
| Area | Change (Verified) |
|---|---|
| Routes | Deleted `question/[questionId]/page.tsx` (−184 lines). Added catch-all **route handler** `question/[...questionId]/route.ts` (catch-all because old slugs could contain `/`). |
| Redirects | Every `/question/<slug>-<id>` and `/hi/question/...` → **301** to the **English** canonical chapter page `/<exam>/<level>/subject/<subject>/<chapter>[/page/N]?<query>#q-<id>`, `Cache-Control: public, max-age=3600`. 404 (noindex HTML) when the id, exam, chapter slug or canonical path is missing. |
| 5xx | `unavailableResponse()` = **503** + `Retry-After: 300` + `no-store` when the question fetch is non-OK, its JSON is not an array, the exam index throws, or the whole chapter can't be loaded. |
| Pagination | New `/page/N` routes for chapter, subject and year pages, 50 per page, self-canonical with "– Page N", `/page/1` → 308. |
| Canonical logic | `lib/seo/exam-index.ts` + `load-exam-index.ts`: a chapter slug is rendered by exam + slug only (backend ignores level/subject), so every level/subject copy shows the same content and is **canonical to the first path in navigation order**; an unlisted pair → 308 to it. |
| Robots meta | `noindex, follow` for chapters in `emptyChapters` and for subjects with no chapter with questions. |
| Sitemaps | `sitemaps/<exam>-questions.xml` now lists **canonical chapter pages, every `/page/N`** (from `GET /blog/question-index`) instead of question URLs; lastmod = newest `question_trans.updated_at` on that page; a failed build answers 503. `sitemap.xml` = homepage only. |
| Rendering / caching | Question-bank routes ISR 10 min, empty `generateStaticParams`; OpenNext R2 incremental cache + D1 tag cache + DO queue; `POST /api/revalidate` webhook with per-exam tags. |
| Middleware | Upper-case exam segments and `/en/...` 301 to lower case (`lib/seo/url-normalize.ts`). |

### 3.3 `e458725` — 2026-10-21 11:37 "Platform speed phases 0-6, blog question cache + SEO updates"
- `route.ts:44-49`: backend fetch sends `backendServerHeaders()` (own rate-limit bucket).
- `route.ts:81-88`: `/hi/question/*` now 301s to the **/hi chapter page** when that page is "genuinely Hindi" (≥ 50 % bilingual, `lib/question-bank/hindi-page.ts`), else to English.
- Hindi page copy, `locale-alternates.ts`, `generateLocaleMetadata.ts`, sitemap entries for /hi pages, deploy workflow populating OpenNext R2/D1.

### 3.4 `2725014` — 2026-10-21 17:07 "20 questions per page"
- `QUESTIONS_PER_PAGE` 50 → **20** (`lib/question-bank/pagination.ts`). Phase 16 §A records the accepted SEO impact: ~1,533 → ~3,800 indexable URLs, and **every existing `/page/N` URL shows different questions** (page 2 was 51–100, became 21–40). Every 301 target page number changed the same day.

### 3.5 `197e56f` — 2026-10-21 19:17 "cheap /question redirects"
- `route.ts:16-31` `chapterPageOf()`: page number from the cached `/blog/question-index` instead of downloading the whole chapter (2–10 MB, over Next's 2 MB data-cache limit, fetched on every hit; "Google crawls these old URLs heavily"). Falls back to the full chapter; `null` → 503 (`route.ts:99-100`).
- Pagination/chapter links back to plain `<a>`.

### 3.6 Other blog commits 18–24 Oct (Verified, `git log --since=2026-10-15 --until=2026-10-26 -- apps/blog`)
`3022e12` exam index in one backend call (24 h cache) · `f303a7f` fetch only the page's 20 questions, warm-up · `2ac0076` URL alone decides language (`localeDetection: false`) · `0b979e2` titles ≤ 60 / descriptions ≤ 160 · `8832973` ISR 1 day, warm-up manual · `3b8fa8e` robots blocks AI training crawlers · `fbc7a7b` render-once HTML · `9322ee7` ISR 7 days · `bebe7ed`/`3d2c1e6` analytics host gate · `ddff55b` Sentry project.

### 3.7 Why the change was made (Verified, phases 14–16, commit messages)
1. **Render cost.** A chapter/subject page cost 0.3–2 s CPU (markdown → rehype-raw → sanitize → KaTeX per question), and the old question page plus the redirect downloaded 2–16 MB backend payloads. Workers Free allows 10 ms CPU; Vercel Hobby has 4 h CPU/month and 200K ISR writes/month with no overage.
2. **Duplicate content.** The same question appeared on its question page and on chapter/subject/year listings; GSC had flagged "duplicate without user-selected canonical".
3. **Crawl load.** ~22.6K question URLs crawled heavily, each a cold render.

**What is no longer true (Verified):** the blog now runs on Coolify with `next start` (no 10 ms CPU limit, no ISR write quota), and since phase 16 a question's HTML is rendered once and memoised (`lib/markdown/render-rich-text.ts`) and pages fetch only their own questions (`/blog/get-questions-by-ids`). The cost argument against one-question pages is mostly gone; the remaining constraints are the shared VPS's CPU/RAM, its disk (Redis ISR cache, 1 GB cap) and the backend's rate limit.

---

## 4. Live state on 2026-11-23 (Verified, `curl` with a Googlebot UA, ~35 requests)

| URL | Result |
|---|---|
| `/question/swarth-ka-vilom-hai-1077` | 301 → `/ctet/paper-1/subject/hindi/arth-vigyan/page/2#q-1077` |
| `/hi/question/a-sum-of-money-33333` | 301 → `/hi/htet/level-1-prt/subject/general-studies/finance/page/3#q-33333` |
| `/question/61` | 301 → `/ctet/paper-1/subject/english/basic-grammar#q-61` |
| `/question/if-you-wish-to-7276` (a GSC 5xx example) | now **404** — the question exists (HTET_2020 L3, 2 translations) but its chapter "Introduction to Psychology" has **`slug: null`** in `GET /blog/get-questions?id=7276` (also 7274, 7275, 7277, 7278) |
| `/question/does-not-exist-99999999` | 404 noindex |
| `/htet/level-2-tgt/subject/mathematics/number-system` | 200, canonical → `/htet/level-1-prt/subject/general-studies/number-system`, title "…– HTET Level 2 TGT" |
| `/htet/level-1-prt/subject/science/structure-of-the-atom` | 200, canonical → `/subject/chemistry/structure-of-the-atom` |
| `/ctet/paper-2/subject/mathematics-science/light` | 200, **`noindex, follow`**, 415 KB of HTML (questions present) |
| `/HTET/level-1-prt/subject/mathematics/null` | 301 → lower case → **404 noindex** (correct now) |
| `/ctet/up-pgt` | 404 noindex (correct) |
| `/htet` / `/hi/htet` | 200; `/hi/htet` canonical → `/htet`, no hreflang, English `<title>` |
| Chapter page, uncompressed | 0.79–1.13 MB, and the transfer did not finish in 40 s on 3 of 6 pages |
| Same chapter page, gzip | 98.6 KB on the wire, `X-Nextjs-Cache: HIT`, **TTFB 1.5–1.8 s, total 7.4–13 s** (this network) |
| `academy/sitemaps/index.xml` | 5 child sitemaps; 3,380 URLs total (htet 1,736, htet-questions 718, ctet 563, ctet-questions 363), 0 question URLs; lastmods Feb/Jun 2026 |
| `academy/robots.txt` | blocks AI *training* bots only (OAI-SearchBot/PerplexityBot allowed — the audit's note applied to the main site) |
| `clearcutoff.in/robots.txt` | served by `apps/landing/src/app/robots.ts`: `Disallow: /_next/` for `*`; lists `Sitemap: https://clearcutoff.in/go/sitemap.xml` |
| `clearcutoff.in/go/sitemap.xml` | 200 `text/html`, the Astro `/go` index page (meta refresh to `/teaching`, noindex) |
| `/exam/htet-preparation` (landing) and `/go/exam/htet-preparation` (Astro) | both 200, self-canonical, same title |
| `/hi/go/exam/htet-preparation?utm_source=fb&fbclid=abc` | 200, canonical is the clean URL (correct) |

Backend data checks (Verified, public `GET /blog/exam-index` and `/blog/question-index`):
- **CTET: 34 chapters (253 questions) and HTET: 2 chapters (192 questions) are flagged empty but have questions** in the question index, so they render questions with `noindex`. Example: `light` in `CTET_SCI` has `has_questions: false`, 10 questions in the index.
- HTET: 2 chapters in the question index are not in navigation at all (`health-and-hygiene`, `theories-of-learning`, 20 questions).
- Question index totals: CTET 4,613 + HTET 7,179 = 11,792 questions. Questions whose chapter has no slug (e.g. 7276) are in neither index, so no page shows them today.

---

## 5. Decision log
| Date | Question | Answer (who) |
|---|---|---|
| 2026-11-23 | 🛑 **D1** Question URL model: **A** restore indexable one-question pages at the old URLs (recommended), **B** keep the 301s and make them robust, **C** hybrid: restore only for questions that had impressions, 301 the rest | **B** — user: never restore question pages (2026-11-23) |
| 2026-11-23 | 🛑 **D2** Cross-level chapter copies: **a** keep the canonical-to-first-path rule but make title/H1 match the canonical, **b** 308 non-canonical copies to the canonical path, **c** make each level's chapter page level-specific (filter by `stage_id_b`) and self-canonical (recommended if the data supports it) | **a** — keep navigation; non-canonical copies take the canonical title (inside the approved structure) |
| 2026-11-23 | 🛑 **D3** Subject and year pages repeat every chapter question: keep them as full paginated listings, or make subject pages a chapter list (page 1 only) | keep (structure unchanged) |
| 2026-11-23 | 🛑 **D4** `/hi` hubs: translate title/description/intro and make them self-canonical with hreflang, or keep canonical-to-English | translate + self-canonical (user asked to fix it) |
| 2026-11-23 | 🛑 **D5** Course page duplicate: which URL is canonical for HTET course — landing `/exam/htet-preparation` (recommended) or Astro `/go/exam/htet-preparation`; should `/go/exam/*` (ad landing pages) be `noindex` | landing `/exam/*` canonical; `/go/exam/*` noindex, follow |
| 2026-11-23 | 🛑 **D6** Deleted / merged questions: 404 or 410 | 404 (no soft deletes in the backend → deletion can't be confirmed) |
| 2026-11-23 | 🛑 **D7** Chapters with `slug: null`: backfill slugs in the data (BE/BigQuery) or show those questions only on their question page | no backfill; those questions 301 to the nearest parent page |

---

## 6. Target URL and canonical strategy

### 6.1 Page roles
| Page type | URL | Indexable | Canonical | hreflang |
|---|---|---|---|---|
| **Question (detail)** | `/question/<slug>-<id>` | yes | self (slug-normalised; wrong slug 301s in one hop) | `en`, `hi`, `x-default` only when the question has both translations |
| Question, Hindi | `/hi/question/<slug>-<id>` | yes when a Hindi translation exists | self | as above |
| Question, Hindi, no Hindi text | `/hi/question/...` | no | 301 to the English question URL | none |
| Chapter listing | `/<exam>/<level>/subject/<subject>/<chapter>[/page/N]` | yes (canonical copy only) | self per page (page N canonical to page N, never to page 1) | per page, existing `isHindiScopePage` rule |
| Subject / year listing | as today | yes (D3) | self per page | per page |
| Hubs (exam, level, `/subject`, `/year`) | as today | yes | self; `/hi` self only after D4 | after D4 |
| Junk (`/null`, unknown level, wrong exam) | – | no | 404 (keep) | – |

Principles: one question = one URL with its own title (question text) and description; listings link to the detail pages with `<a href>` (crawl path) and are the hubs, not the canonical home of a question. A fragment (`#q-<id>`) is never a canonical target — Google drops it, so 20 questions currently collapse into one URL.

### 6.2 Redirect / status policy
- **200**: the question exists and has at least one translation (even when its chapter has no slug — the page then breadcrumbs to exam/level only).
- **301**: wrong slug / bare id → canonical slug (one hop, no chain); `/hi` without Hindi text → English question URL; upper-case and `/en/` (existing middleware).
- **404**: id never existed or not a numeric id. **410**: id confirmed deleted in the backend (D6). Both `noindex`.
- **Never 503 on a lookup miss.** A backend failure on a page that was rendered before is answered from the last good ISR copy (Next keeps it on a failed regeneration). Only a page that was never cached *and* whose backend call fails may answer 503 + `Retry-After`, and that must be rare and alerted (Sentry).
- If D1 = B (keep 301s): the target comes from a precomputed id → `{exam, path, page, hindi}` map built from `/blog/question-index` (stored in Redis / Next data cache, refreshed on `/api/revalidate`), so a redirect needs no backend call; on a map miss fall back to the backend; on a backend failure use the last known target; 503 only if neither exists.

### 6.3 Sitemaps and re-crawl
- `sitemaps/<exam>-questions.xml` lists question URLs again (en + `/hi` where Hindi exists), split into files of ≤ 10K URLs (`<exam>-questions-1.xml`…) referenced from `sitemaps/index.xml`; chapter/subject/year pages move to `sitemaps/<exam>-pages.xml`.
- `<lastmod>` = newest real `question_trans.updated_at` for a question page. For listing pages, the newest of (content timestamp, **date the page's composition last changed**). Today every `/page/N` still says Feb/Jun 2026 although its questions changed on 21 Oct (50 → 20) — Verified in the sitemaps. A stored "layout version date" per page type (e.g. `2026-10-21` for pagination, the deploy date of this phase for question pages) fixes that without faking dates (DEVELOPMENT_RULES §10 rule: genuine dates only — a real composition change is genuine).
- After deploy: resubmit `sitemaps/index.xml` only (remove the separately submitted child sitemaps), then URL Inspection (read + "Test live URL") on the sample list in §8. Requesting indexing for ~20 sample URLs is the user's call, not part of this plan.

---

## 7. Tasks

Each task: files · root cause · solution · dependencies · tests · SEO risk · rollback · expected outcome.

### P0-1 Restore indexable question pages (replace the question → chapter 301) — D1
- **Files (CM):** `apps/blog/src/app/[locale]/(blog)/question/[...questionId]/route.ts` (replaced by `page.tsx` in the same catch-all segment; route.ts and page.tsx cannot coexist), `route.test.ts`; reuse `lib/seo/question-redirect.ts` (`parseQuestionId`, `examSlugFromQuestion`), `utils/slugify.ts` (`sanitizeAiSlug`, `getQuestionUrlParam`), `lib/markdown/render-rich-text.ts`, `components/question-bank/question-card.tsx` + `question-interaction.tsx`, `utils/google/get-quiz-schema.ts`, `get-breadcrumb-schema.ts`, `lib/seo/generateLocaleMetadata.ts` / `seo-text.ts`, `lib/question-bank/route-cache.ts`, `cache-tags.ts`; listings: `components/question-bank/question-card.tsx` gets a plain `<a href>` "Open question" link to the detail URL; `share-question/share-url.ts` points to the question URL. **BE:** none required (`/blog/get-questions-by-ids?ids=<id>` already returns one question with translations).
- **Root cause (Verified):** `4be3727` removed the question page and 301'd ~22.6K indexed URLs to chapter pages (`route.ts:58-125`); the per-question title/description that matched long-tail queries no longer exists. **Inferred:** this is the main cause of the 28 Oct drop.
- **Solution:** a one-question page at the old URL, ISR (`revalidate` 7 days + on-demand tags, empty `generateStaticParams`), content = question, options, answer, explanation (both languages as on listings, CSS-selected, or only the URL's language — keep it under ~60 KB HTML), breadcrumb exam → level → subject → chapter, "previous / next question" and "all questions in this chapter" links, the chapter page's `#q-<id>` link. Title `"<question text, ≤ 45 chars> – <EXAM> <Paper>"` via `seoTitle`, description = question text (`seoDescription`). JSON-LD: Breadcrumb + `Quiz` with one `Question` (not FAQPage, per DEVELOPMENT_RULES §11 2026-10-17). Canonical/hreflang per §6.1. Slug normalisation as the old page did (one 301). Ship behind an env switch `QUESTION_PAGES=page|redirect` so both behaviours stay in the code until the page is proven.
- **Dependencies:** D1, D6; P0-2 (status rules); P0-3 (origin speed) should land first or together; Redis ISR cache size check (22.6K extra entries × ~15–20 KB compressed ≈ 350–450 MB of the 1 GB cap — measure).
- **Testing:** `pnpm --filter blog test`, `tsc` (compare per file to the 33-error baseline), lint, `next build` + `next start` locally against the real backend; curl table for the sample list (status, `Location`, canonical, robots, hreflang, `<title>`, HTML size): `/question/swarth-ka-vilom-hai-1077`, `/question/61` (→ 301 to slug), `/hi/question/a-sum-of-money-33333`, `/question/if-you-wish-to-7276` (null chapter slug → 200), a Sanskrit-only and an English-only question on `/hi`, a non-existent id (404), a slug with `/` (catch-all); backend stopped → cached page still 200; Googlebot UA = same HTML; en/hi at 390 px screenshot; break-it pass §8.1 (double-click option, no JS, slow 4G). After deploy: GSC URL Inspection "Test live URL" on 10 sample URLs, rendered HTML has the question text.
- **SEO risk:** a second URL change within 6 weeks; mitigated because the old URLs return to what Google indexed before (same URL, same kind of content). Duplicate text between detail and listing pages: normal listing/detail pattern; detail pages carry the unique title. Crawl load returns (~22.6K URLs) on a shared VPS.
- **Rollback:** set `QUESTION_PAGES=redirect` and redeploy (current 301 behaviour). Avoid flip-flopping: decide before deploy, keep the choice ≥ 3 months.
- **Expected outcome:** Google recrawls `/question/*` within 1–4 weeks (they are already known and crawled heavily); "Page with redirect" shrinks; impressions should return toward the old 1–4K/day over **4–10 weeks**, not guaranteed to the old level (the index lost history in between).

### P0-2 Stop the 503s on `/question/*` and make failures safe
- **Files (CM):** `question/[...questionId]/route.ts:41-56, 73-100` (or its replacement), `lib/seo/load-exam-index.ts`, `lib/sitemap/question-index.ts`; Sentry (`lib/page-errors.ts`) for alerting.
- **Root cause:** Verified in code — `unavailableResponse()` (503, `no-store`) on any backend non-OK, malformed JSON, exam-index failure or chapter-load failure, with no cached fallback. Verified (phase 14) — Workers 1102 on 21 Oct. Inferred — Vercel Hobby over its ISR/CPU quota 22 Oct – 2 Nov and Coolify cold renders (P0-3) added more 5xx. GSC examples match (`/question/if-you-wish-to-7276`, `/hi/question/uchch-prathamik-…-1497`). One GSC 5xx example (`/ctet/paper-2/.../light`, last crawl 26 Sep) predates the change: some 5xx are older.
- **Solution:** with P0-1, the question route is an ISR page: failed regeneration keeps the last good HTML; first render failure throws → 500 only when nothing is cached (alert). If D1 = B: precomputed redirect map (§6.2), last-known target on failure, 503 only when no target was ever known. A miss in the map/back end is a 404 (or 410), never a 503. Add a Sentry metric/alert for any 5xx on `/question/*` and on question-bank routes.
- **Dependencies:** D1, D6.
- **Testing:** locally point `BACKEND_URL` at a dead port after warming a page → 200 stale; never-warmed page → 500/503 with `Retry-After`; malformed JSON; 429 from backend; count backend requests per redirect (target 0 with the map). Live: curl 30 `/question/*` URLs from the GSC 5xx export twice, 10 min apart → 0 × 5xx. GSC: "Validate fix" on the 5xx report after one clean week.
- **SEO risk:** low. A 200 stale page is better than 503; a wrong 301 (stale map) is cached 1 h only.
- **Rollback:** revert the commit (503 path returns).
- **Expected outcome:** 5xx count in GSC falls over 2–4 weeks; validation passes.

### P0-3 Origin speed and stability of `academy.clearcutoff.in` (Coolify)
- **Files:** infra (Coolify app `zjszwdcgoht9gh1nrydyqysw`, Redis per `docs/BLOG_REDIS_ISR_CACHE.md`, Cloudflare DNS record is DNS-only), `apps/blog/next.config.ts` (compression), `cache-handler.impl.mjs`.
- **Root cause:** Verified measurement — a cached (`X-Nextjs-Cache: HIT`) chapter page takes TTFB 1.5–1.8 s and 7–13 s total for 98 KB gzip from this network; uncompressed 0.8–1.1 MB did not finish in 40 s. Verified — the ISR disk grew 13.3 GB in 9 days on a 92 %-full server, Redis cache keyed per build id (a deploy starts cold), capped at 1 GB. Inferred — slow or timed-out fetches count as server errors / reduce crawl rate and feed "Crawled – not indexed" and 5xx. Not verified whether the slowness is the server, its bandwidth, or this test network.
- **Solution:** measure first (curl from a second network or Search Console Crawl Stats "average response time" and "host status"); check Coolify CPU/RAM/disk during a crawl; confirm `REDIS_URL` is set and Redis hit rate; consider Cloudflare proxy with an HTML cache rule for question-bank pages (`s-maxage` is already sent) so Googlebot is served from the edge — this changes the DNS record from DNS-only to proxied (needs approval, same note as phase 15 D5); keep `compress: true`.
- **Dependencies:** user access to Coolify/Cloudflare (MCP token does not reach that instance).
- **Testing:** before/after curl timings (TTFB, total) on 10 URLs from 2 networks; GSC Crawl Stats after 1 week.
- **SEO risk:** proxying changes the edge; a wrong cache rule could serve stale/locale-mixed HTML (landing stale-HTML lesson, phase 10). Cache key must include path only (language is in the URL since `2ac0076`).
- **Rollback:** switch the DNS record back to DNS-only; remove the cache rule.
- **Expected outcome:** response time < 1 s for cached pages; Crawl Stats "host status" green.

### P0-4 Recover lost indexed question pages and re-crawl plan
- **Files (CM):** `app/sitemaps/[examName]/route.ts`, `app/sitemaps/index.xml/route.ts`, `app/sitemaps/ctet-questions.xml/route.ts`, `lib/sitemap/question-pages.ts`, `exam-sitemap-entries.ts`, `xml.ts`; reuse `/blog/question-index` (already has `[id, updated_at, bilingual]`; add the question's slug or `ai_slug` — **BE** `BlogExamRepository::getQuestionIndex` additive field, else the blog cannot build the slug URL without one call per question).
- **Root cause (Verified):** question URLs were removed from the sitemaps in `4be3727`; current sitemaps list 3,380 listing URLs and 0 question URLs.
- **Solution:** §6.3: question sitemaps (en + hi), listing sitemaps split, composition-change lastmod, single index submitted. Plus an internal crawl path: every listing card links to its question page.
- **Dependencies:** P0-1, BE slug field (deploy BE first; blog fails closed to 503 for that sitemap only, as today).
- **Testing:** XML well-formed (`xml-well-formed.ts` tests), every `<loc>` in a 200-URL random sample returns 200 + self-canonical + indexable (script, ≤ 2 req/s), counts per exam reconcile with the question index (11,792 + Hindi twins), no `/hi` URL without Hindi text. GSC Sitemaps: status Success, discovered count.
- **SEO risk:** low; a sitemap listing non-canonical URLs would be worse than none — the sample check guards it.
- **Rollback:** revert sitemap commit; resubmit the old index.
- **Expected outcome:** GSC discovers ~11.8K + Hindi question URLs within days; indexed count climbs over 2–8 weeks.

### P1-1 Wrong-path canonicals (cross-level / cross-subject) — D2
- **Files (CM):** `lib/seo/canonical.ts:12-24`, `lib/seo/exam-index.ts:58-121`, `components/question-bank/pages/chapter-questions-page.tsx:36-99` (metadata uses canonical path but the URL's own level in the title and breadcrumb), subject page equivalent; **BE** (option c): `get-questions-by-chapter` / `question-index` filtered by `stage_id_b`.
- **Root cause:** Verified — the canonical is the first navigation path holding the chapter slug (`canonicalChapterPath`), so `/htet/level-2-tgt/subject/mathematics/number-system` → Level 1 PRT General Studies, while its own title says "HTET Level 2 TGT". Verified — the backend serves a chapter by exam + slug, so the copies are byte-similar. Inferred — conflicting title/breadcrumb vs canonical, plus internal links pointing at non-canonical copies, is why Google picks its own canonical for 6,787 URLs.
- **Solution:** preferred (c) if questions carry a usable stage: level-specific chapter pages (TGT copy shows TGT questions), each self-canonical — becomes real distinct content. If not: (a) keep the rule, but give non-canonical copies the canonical's title and make listings link to the canonical path; or (b) 308 them (users lose their level breadcrumb).
- **Dependencies:** D2; BE data check (how many chapter questions have `stage_id_b` per level).
- **Testing:** unit tests in `exam-index.test.ts`; curl the two audit examples + 10 more; GSC URL Inspection "Google-selected canonical" = user canonical after recrawl.
- **SEO risk:** (b)/(c) change many URLs' status/content; do it once, after P0.
- **Rollback:** revert; canonical rule returns.
- **Expected outcome:** "Google chose different canonical" falls over 4–8 weeks.

### P1-2 Repeated questions across chapter, subject and year listings — D3
- **Files (CM):** `components/question-bank/pages/subject-questions-page.tsx`, `year-questions-page.tsx`, `lib/sitemap/question-pages.ts` (`subjectPageEntries`).
- **Root cause (Verified):** subject pages are their chapters' questions concatenated (e.g. `general-studies/page/57`), year pages repeat them again, each with a `/hi` twin. **Inferred:** contributes to "Duplicate without user-selected canonical" (1,649) and "Crawled – not indexed".
- **Solution:** subject page = chapter list with counts + first questions (one page), year pages stay (distinct intent: "<exam> <year> question paper"). With P0-1 every listing links to question pages.
- **Dependencies:** D3, P0-1.
- **Testing / risk / rollback:** as P1-1; removes ~1,000+ paginated subject URLs → they 308 to the subject page (not 404).
- **Expected outcome:** fewer duplicate URLs; crawl budget shifts to question and chapter pages.

### P1-3 Empty-chapter noindex on chapters that have questions (CTET `light`)
- **Files:** CM `lib/seo/load-exam-index.ts:100-111` (`emptyChapters`), `lib/seo/canonical.ts:20`, `chapter-questions-page.tsx:66`; BE `BlogExamRepository::getExamIndex` (`has_questions` from `getQuestionsBySection(exact_section=1)` previews, `BlogExamRepository.php:829-845`).
- **Root cause (Verified):** `has_questions` comes from the section's 3-question preview with an exact section match, while the chapter page renders by exam + chapter. `light` in `CTET_SCI` is `has_questions: false` but has 10 questions in `/blog/question-index`. In total **36 chapters (CTET 34, HTET 2) with 445 questions** are `noindex` though they render questions.
- **Solution:** decide emptiness from the same data the page renders: a chapter is empty only when `questionIndex.chapters[slug]` is empty (blog side, no BE change), or fix the BE flag to count the chapter's questions. Also list HTET's `health-and-hygiene` and `theories-of-learning` (in the index, not in navigation) — data fix in navigation.
- **Dependencies:** none (blog-only variant).
- **Testing:** unit test with the `light` fixture; curl `/ctet/paper-2/subject/mathematics-science/light` → no robots meta, listed in the sitemap; script over all 36 chapters.
- **SEO risk:** low. **Rollback:** revert.
- **Expected outcome:** ~36 chapters (more with pages) indexable; the `light` page (44 impressions, 5 clicks before) back within 2–4 weeks.

### P1-4 `/null` and other junk URLs
- **Files:** CM `components/blog/assessment-question/question-list-by-subject.tsx:143` (old pattern `${pathname}/${item.slug}` with a null slug — no longer imported by a live page except for types), `app/[locale]/(blog)/[examName]/[level_id]/subject/page.tsx:154`; data: chapters with `slug: null` (D7).
- **Root cause:** Verified — `/HTET/.../mathematics/null` 301 → `/htet/.../null` → 404 noindex today (correct). Verified — chapters with `slug: null` exist (chapter of question 7276). Inferred — the old subject page emitted `/null` links from those chapters; GSC still recrawls the history.
- **Solution:** keep 404 (do not redirect junk to home — soft 404). Guard every link builder against null/empty slugs (one helper). Backfill chapter slugs (D7, BE/BigQuery) so those questions get chapter pages too. Optionally 410 for `/null` paths so they drop faster.
- **Testing:** grep for unguarded `${...slug}` link builders; curl the GSC examples; Crawl Stats 404 share.
- **SEO risk / rollback:** none / revert. **Outcome:** junk URLs age out of GSC in 1–3 months.

### P1-5 Main robots.txt `Disallow: /_next/` and the `/go/sitemap.xml` line
- **Files:** CM `apps/landing/src/app/robots.ts:13` (`/_next/`), `:47` (`/go/sitemap.xml`). This file serves `clearcutoff.in/robots.txt` for the whole origin, including `/tools/*` and `/go/*` (Verified, live content matches).
- **Root cause (Verified):** the rule blocks `/_next/static/*` CSS/JS used by landing pages; the listed `/go` sitemap is an HTML redirect page (Astro has no sitemap: no `@astrojs/sitemap` in `astro.config`, `src/pages/index.astro` is a meta-refresh).
- **Solution:** remove `"/_next/"` (or narrow to nothing — `/_next/static` must stay crawlable; `/_next/image` is fine to allow). Remove the `/go/sitemap.xml` line, or add a real sitemap to the Astro app and list it (D5: only if `/go` pages should be indexed at all).
- **Dependencies:** D5 for the `/go` line. Landing deploy (auto on push to main — production).
- **Testing:** landing `robots.test.ts`/`redirects.test.ts` style unit test; `curl /robots.txt`; GSC robots.txt report (fetched version), URL Inspection "Test live URL" on `/teaching/htet` → page resources not blocked.
- **SEO risk:** none known; tools assets are under `/tools/resizer/_next/` and unaffected either way.
- **Rollback:** revert. **Outcome:** landing pages render with CSS for Google immediately on recrawl.

### P1-6 Sitemap errors and hygiene (academy + main)
- **Files:** CM `apps/blog/src/app/robots.ts` (lists `/sitemap.xml` with 1 URL and the index), `app/sitemap.ts`, sitemap routes (P0-4); landing `robots.ts`.
- **Root cause (Verified):** academy `sitemap.xml` has 1 URL and is also inside the index; child sitemaps submitted separately in GSC (audit §3.3); lastmods do not reflect the 21 Oct page recomposition; robots lists an HTML "sitemap" (P1-5).
- **Solution:** robots lists only `sitemaps/index.xml` for academy; GSC: keep only the index submitted (user removes the duplicates — a GSC setting, approval needed); composition lastmod (§6.3).
- **Testing:** fetch every sitemap, status 200 + `application/xml`, sample `<loc>` check. **Risk/rollback:** low / revert. **Outcome:** clean Sitemaps report in days.

### P1-7 Duplicate course URLs (landing vs Astro `/go`) and tracking parameters — D5
- **Files:** ASTRO `apps/go-marketing/src/pages/[...locale]/exam/[slug].astro:191-232` (self-canonical, hreflang), `htet.astro`, `landing.astro`; CM `apps/landing/src/app/[locale]/exam/[slug]/page.tsx`, landing sitemap.
- **Root cause (Verified):** both `/exam/htet-preparation` and `/go/exam/htet-preparation` are 200, self-canonical, same title. Tracking variants already canonicalise to the clean URL (Verified), so the `?utm…&fbclid` GSC row is a symptom of the duplicate pair plus ad-link discovery, not of a missing canonical.
- **Solution:** `/go/exam/*` = paid-traffic landing pages: `<meta name="robots" content="noindex, follow">` and canonical to the landing `/exam/<slug>` (or only noindex — canonical to a different-content page can be ignored by Google). Keep `utm`/`fbclid` handling as is. Not adding a `/go` sitemap.
- **Dependencies:** D5; ASTRO auto-deploys on push to main.
- **Testing:** curl both URLs + a `?utm` variant (robots/canonical); Meta/Google Ads landing pages still 200 and tracked (no change to analytics).
- **SEO risk:** `/go` pages that had impressions drop out (expected, wanted). **Rollback:** revert in ASTRO. **Outcome:** one course URL per exam in 2–6 weeks.

### P1-8 `/hi` academy hubs canonicalise to English — D4
- **Files:** CM `app/[locale]/(blog)/[examName]/page.tsx:80` and `[level_id]/page.tsx:48` (`hiTranslated: false`), `[level_id]/subject/page.tsx`, `year/page.tsx`, `lib/seo/locale-alternates.ts`, `messages/hi.json` (title/description keys), `app/sitemaps/[examName]/route.ts`.
- **Root cause (Verified):** hubs pass `hiTranslated: false`, so `/hi/htet` → canonical `/htet`, no hreflang, English title — a deliberate 2026-10-19 rule ("/hi shows the same English content"). Since `2725014` (21 Oct) `/hi` always shows Hindi question text and the hubs have a Hindi H1, so the rule's premise changed.
- **Solution:** translated `<title>`, description and intro text for `/hi` hubs, then `hiTranslated: true` (self-canonical + en/hi/x-default) and list `/hi` hubs in the sitemap. Question/listing pages keep the per-page Hindi rule.
- **Dependencies:** D4; i18n copy (en/hi; mr not applicable to the blog).
- **Testing:** `locale-alternates.test.ts`; curl `/hi/htet`, `/hi/ctet`, `/hi/htet/level-1-prt` (canonical, hreflang, Hindi title); hi at 390 px screenshot.
- **SEO risk:** Google may still fold `/hi` into English if content is thin; low downside. **Rollback:** set back to `false`. **Outcome:** Hindi hubs eligible for Hindi queries ("ctet ke liye age limit…", audit §5) in 4–8 weeks.

### P2-1 Page weight of question-bank pages
- **Files:** CM `components/question-bank/question-card.tsx`, `rich-text.tsx`, `globals.css` (`data-tr` language CSS), RSC payload of the chapter page.
- **Root cause (Verified):** a 20-question chapter page is 0.79–1.13 MB uncompressed (98 KB gzip). Known contributors (DEVELOPMENT_RULES §10): both languages kept in the HTML (~42 % on bilingual pages, decided 2026-10-20), KaTeX markup, RSC payload duplicating the HTML. Lab PageSpeed 95, so users are fine; Inferred crawl cost.
- **Solution:** measure the split (HTML vs inline RSC script) first; then render only the URL's language server-side (the URL decides language since `2725014`, so the other language block on the same URL is dead weight), lazy-load explanations, trim KaTeX MathML/HTML duplication.
- **Dependencies:** P0-1 (question pages set the small-page pattern). **Testing:** byte size before/after on 10 pages, parity of visible content, en/hi 390 px. **Risk:** low. **Rollback:** revert. **Outcome:** ~50 % smaller HTML; faster crawl.

---

## 8. Rollout order, verification and monitoring

### 8.1 Order
1. Decisions D1–D7 (user).
2. P0-3 measurement (no change) → origin fixes if needed (user runs infra changes).
3. BE: add slug to `/blog/question-index` (additive) — deploy first.
4. Blog branch: P0-1 + P0-2 + P0-4 + P1-3 + P1-6 (one release, behind `QUESTION_PAGES`). Coolify blog has **no auto-deploy**: the user redeploys after merge.
5. Landing: P1-5 (auto-deploys on push to main). ASTRO: P1-7.
6. After 2–3 weeks of P0 data: P1-1, P1-2, P1-8 (they change many URLs; not in the same release as P0, so effects can be told apart).
7. P2-1 last.

### 8.2 Sample URL list for every release (curl + GSC URL Inspection)
`/question/swarth-ka-vilom-hai-1077`, `/question/61`, `/question/if-you-wish-to-7276`, `/hi/question/a-sum-of-money-33333`, `/hi/question/uchch-prathamik-…-1497` (full slug from the GSC 5xx export), a non-existent id, `/htet/level-2-tgt/subject/mathematics/number-system`, `/htet/level-1-prt/subject/general-studies/number-system`, `/htet/level-1-prt/subject/science/structure-of-the-atom`, `/ctet/paper-2/subject/mathematics-science/light`, `/ctet/paper-1/subject/hindi/arth-vigyan/page/2`, `/htet`, `/hi/htet`, `/ctet`, `/HTET/level-1-prt/subject/mathematics/null`, `/sitemaps/index.xml`, `clearcutoff.in/robots.txt`, `/exam/htet-preparation`, `/go/exam/htet-preparation`. Check: status, `Location`, canonical, robots meta, hreflang, title, size, TTFB. Keep total requests to a few dozen per check.

### 8.3 Monitoring (GSC, `sc-domain:clearcutoff.in`, filtered to `academy.`)
| Report | Watch | For |
|---|---|---|
| Performance (page filter `academy.clearcutoff.in`, query `/question/`) | impressions/day back above 1,000 | weekly, 12 weeks |
| Page indexing | Indexed ↑; "Page with redirect", "Server error (5xx)", "Excluded by noindex" ↓; run "Validate fix" on 5xx after a clean week | weekly, 12 weeks |
| Sitemaps | index status Success, discovered ≈ expected count | after each deploy |
| Crawl Stats (Settings) | host status, average response time, 5xx share, crawl requests by type | weekly, 8 weeks |
| URL Inspection (sample list) | Google-selected canonical = user canonical | 1, 3, 6 weeks after deploy |
| Sentry `clearcutoff-public` | any 5xx on `/question/*` and question-bank routes | continuous |

---

## 9. Blockers / risks
- ⚠️ Every release here touches production SEO; a second reversal within months is costly. Decide D1 once.
- ⚠️ Shared Coolify VPS: restoring ~22.6K pages adds crawl renders and Redis entries (1 GB cap); measure before/after (P0-3).
- ⚠️ Backend rate limit (60/min per IP; the blog has its own key bucket) — sitemaps and first renders fan out.
- ⚠️ Landing and ASTRO changes go live on push to main; blog needs a manual Coolify redeploy.
- Data issues outside this repo: chapters with `slug: null`; `has_questions` mismatch; 2 HTET chapters missing from navigation.
- Not checkable now: Vercel runtime errors for 21 Oct – 2 Nov (Vercel MCP keeps 7 days), so the Vercel share of the 5xx stays Inferred.

## 10. Dependencies / packages added
None planned. Possible env var `QUESTION_PAGES` (blog). BE: one additive field on `/blog/question-index`.

## 11. Tests and verification
- [ ] Baseline on the OLD code recorded (§4 table is the baseline: statuses, canonicals, sizes, TTFB 1.5–1.8 s, 0 question URLs in sitemaps, 36 noindexed chapters with questions)
- [ ] Break-it pass (DEVELOPMENT_RULES §8.1): backend down / 429 / malformed JSON on question and chapter routes; Googlebot UA; en + hi at 390 px; numbers vs backend (sitemap counts = question index); other callers of shared pieces (share links, `/api/question-search` `#q-` handling, listing cards)
- [ ] **Not verified:** whether the slow transfers are the server or this test network; the exact GSC 5xx breakdown by date/host; Vercel-period errors; how many questions have a chapter with `slug: null`; Redis ISR cache hit rate and memory on production; GSC numbers after 16 Nov (audit data only)

## 12. Next steps
1. User reviews this plan and answers D1–D7.
2. Read-only: count questions per chapter-slug status in the DB (null slug, no translation) and per `stage_id_b` per level (inputs for D2, D7).
3. Measure origin speed from a second network and GSC Crawl Stats (P0-3).
4. Then create the task branch and start with the BE slug field and P0-1/P0-2.

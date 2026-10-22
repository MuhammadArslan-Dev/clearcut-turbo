# Phase 16 — Question-bank rendering: 20 per page, render-once HTML, page-only fetch

**Status:** In Progress (planned 2026-10-21)
**Repos:** CM `apps/blog` (A, B, C); BE `clearcutoff-main-backend` (C only)
**Branch:** `main` (user's decision: work on the updated code)
**Runs alongside:** Phase 15 (Vercel migration, done by the user). Nothing here depends on the host.

## Why
A question-bank page (chapter / subject / year) costs 0.3–2 s of CPU to render.
- Every question runs markdown → raw-HTML parsing (`rehype-raw`) → sanitize → KaTeX inside React (`components/question-bank/rich-text.tsx`), ~2–10 times per question.
- Every page downloads its whole chapter/subject/year (4–16 MB) to show one page of it.
- On Vercel that is billed active CPU and slow regenerations.

## A. Show 20 questions per page instead of 50 (user decision 2026-10-21)
One constant: `QUESTIONS_PER_PAGE` in `src/lib/question-bank/pagination.ts`. Everything paginates from it: page routes, sitemaps, the /hi page rule, `/question/*` 301 targets, the search index's page numbers and generateStaticParams counts.

- [ ] Change 50 → 20; update comments that say "50" (`hindi-page.ts`, `question-search/route.ts`, `question/[...questionId]/route.ts`) and tests.
- [ ] ⚠️ **SEO impact — accepted by the user, recorded here:**
  - ~2.5× as many paginated URLs: about 1,533 → ~3,800 indexable, and ~5,000 → ~12,000 URLs returning 200.
  - Every existing `/page/N` URL keeps working but shows different questions (page 2 was questions 51–100, becomes 21–40). Google re-crawls and re-indexes them; expect a temporary ranking wobble on paginated pages.
  - The /hi decision is per page (≥ 50% bilingual), so some /hi pages flip in or out of the index.
  - `/question/<slug>-<id>` 301s point to the new page numbers automatically (same constant).
  - Sitemaps regenerate with the new pages automatically.
- [ ] Verify: unit tests, then one chapter/subject/year with > 20 questions — correct page count, last page, /page/1 → 308, out-of-range page → 404, numbering continues (21, 22…), and the /question redirect lands on the right page.

## B. Kadam 3 — render each question's HTML once (blog only, no backend change)
- [ ] `src/lib/markdown/render-rich-text.ts`: the same unified pipeline react-markdown runs, as a string renderer:
  - remark-parse → remark-breaks → remark-rehype → rehype-raw → rehype-sanitize(markdownSanitizeSchema) → rehype-katex-text → a small step that turns the KaTeX placeholder span into its HTML and adds `loading="lazy" decoding="async"` to images (what `rich-text.tsx`'s `components` do) → hast-util-to-html.
  - Same `escapeMathForMarkdown(normalizeImgTags(...))` input preparation.
- [ ] Module-level LRU memo keyed by the input text (bounded, e.g. 5,000 entries): one question rendered once per server instance, reused by its chapter page, subject page, year page and /hi copy, and across ISR regenerations on a warm instance.
- [ ] `rich-text.tsx` renders `<div className="markdown-content" dangerouslySetInnerHTML={{ __html }} />`. The string is the sanitized pipeline output, so the trust model is unchanged: user content is sanitized first, and only KaTeX output is inserted raw, as today.
- [ ] **Parity check (must pass before shipping):**
  - Render a corpus of real questions (thousands, from the backend) through the old React path (`renderToStaticMarkup`) and the new string path.
  - Compare as parsed DOM: same elements, attributes and text. Differences allowed only in serialization (e.g. `<br/>` vs `<br>`).
  - Plus the existing `rich-text.test.tsx`.
- [ ] Measure: render time of one large chapter page before vs after (local `next start`).

## C. Kadam 2 — fetch only the page's questions (backend + blog)
**Gate:** `/blog/question-index` must list, for every chapter and year page, exactly the questions the page renders, in the same order, with the same bilingual flag. A read-only check against production (all chapters + all level × year pages) was running 2026-10-21. Results go in the log below. Any mismatch is fixed in the backend index first; no URL may change content.

- [ ] **BE:** `GET /api/blog/get-questions-by-ids?ids=1,2,…` (max 100 ids, returned in the requested order).
  - Same relations and columns the page endpoints return today: translations incl. `updated_at`, chapter/topic with `translations`, section with `description`.
  - Cached via QuestionCacheService versioned keys and the blog-server rate-limit bucket.
  - Additive: no existing endpoint changes. Feature test. Pint.
- [ ] **Blog:** `loadScope(scope, page)`:
  - Ordered ids and totals come from the cached question index.
  - Only this page's ids are fetched by id.
  - Cards are built with the correct global positions (`position` = index + 1) and each question's own chapter page (subject pages) from the chapter lists in the index.
- [ ] Subject page chapter links/filter: names from the section data the page already loads (`get-questions-by-section` returns chapter `translations`); per-chapter counts from the index.
- [ ] Year page: keep the 500-question cap identical (index slice).
- [ ] The search index route (`/api/question-search`, fetched by the browser only when the visitor searches) keeps loading the full scope — unchanged.
- [ ] Fallback: if the index or the by-ids call fails, the page renders exactly as today (full fetch) and logs it, so a backend hiccup never changes content.
- [ ] Verify:
  - Byte-compare rendered HTML of a sample of pages (every page type, en + hi), old path vs new path.
  - Response sizes and timings before vs after.
  - Tests and typecheck.

## Order of work
1. A + B (blog only) → tests and parity check → commit on `main`. Not deployed until the user says so.
2. C after the index check passes (or the backend index is fixed) → BE endpoint deployed first, then blog.
3. Every deploy goes through the user. Vercel (Phase 15) picks up `main` once it's live there.

## Decisions / questions
- [x] **D1:** 20 per page — decided by the user 2026-10-21 (SEO impact above accepted).
- [ ] 🛑 **D2:** ship A on its own as soon as it's verified, or together with B?
- [ ] 📞 **C1:** none yet.

## Log
| Date | Item | Result |
|---|---|---|
| 2026-10-21 | Plan | Written; A + B started on `main` |
| 2026-10-21 | C gate: index vs rendered pages (production, read-only) | **283 scopes checked (every chapter in /blog/question-index for ctet+htet, every level × year page): 0 mismatches.** Same question ids, same order, same bilingual flag. Subject pages are their chapters concatenated, so they follow. Script: session scratchpad `verify-index/`. |
| 2026-10-21 | A: 20 per page | `QUESTIONS_PER_PAGE = 20`; tests rewritten in terms of the constant (+ one asserting 20); blog tests 205/205 |
| 2026-10-21 | D: URL decides language (user chose option b) | `courseLangFor(locale)` URL-only; the language modal's exam-language switches the URL; CourseLangScope keeps the store in step; `localeDetection: false` (a NEXT_LOCALE=hi cookie / Hindi Accept-Language 307'd English URLs to /hi). Pushed to main (2725014, 2ac0076). Verified on Vercel: /hi → 0 English blocks visible, 40 Hindi. |
| 2026-10-21 | Vercel: missing CSS rules | The build log showed "Restored build cache from previous deployment". After the user redeployed with `VERCEL_FORCE_NO_BUILD_CACHE=1`, the course-lang rule is present in the production CSS. |
| 2026-10-21 | Exam index in one call | BE `/blog/exam-index` (13938a5) + blog loader (3022e12): identical tree (ctet+htet); cold page renders 5-11 s -> ~2.5-3 s |
| 2026-10-21 | C: page-only fetch | BE `/blog/get-questions-by-ids` (1822447; field parity on 358 questions). Blog `scope-page.ts`: ids/order/totals from the question index, 20 questions by id, full-scope fallback. Live parity (local backend, every chapter/subject/year, pages 1-3): 617 pages, 615 identical; the 2 others differed only in raw translation text served from a stale backend cache entry and were identical on re-check. |
| 2026-10-21 | Warm-up | `apps/blog/scripts/warm-cache.mjs` + `.github/workflows/warm-blog-cache.yml` (after each production deployment; manual run with any base URL) |
| 2026-10-22 | B: render-once HTML | `lib/markdown/render-rich-text.ts` (react-markdown's pipeline + post() as a string renderer, 5,000-entry memo); `rich-text.tsx` uses it. Parity (`rich-text.parity.test.tsx`, production API, every CTET+HTET question): 11,792 questions, 35,572 texts, 0 DOM mismatches. |
| 2026-10-21 | Vercel speed (compressed, as a browser) | Cache HIT 0.4–0.5 s. MISS (first visit of a page) 3–9 s; earlier ~90 s on a cold, never-rendered page. Functions still run in **iad1 (US)** while the backend is in India. |

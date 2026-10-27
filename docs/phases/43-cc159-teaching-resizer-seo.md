# Phase 43 — Teaching-exam resizer pages: indexing, template, structure

**Tickets:** CC-159 (High, target live in 7 days ~ 2026-11-03). Companion: CC-160 (Ganesh, content)
**Repos:** CM tools, tools backend (`C:\laragon\www\clearcut-tools-backend`)
**Status:** Built + Playwright-tested (not committed). Waiting on: team sheet edits (`43-sheet-edits.md`), user Search Console steps, tools-backend + tools deploy
**Created:** 2026-10-27 (wave 2, Arslan's list)

## Goal
Teaching-exam resizer pages (CTET, UGC NET, HTET, HPTET, UPTET, REET) indexed, with the new title/H1/meta template, verified-source block, exam FAQ, upload-problems section, related links and fixed breadcrumbs.

## Already in place (do not redo)
- Resizer pages, hub, age calculators, sitemap in `apps/tools`; exam specs come from the tools backend at build time. Tools deploy is manual (TOOLS_DEPLOY.md, clear fetch cache first).

## Findings (2026-10-27, live site + production tools API, read-only)
- Live sitemap `/tools/sitemap/resizer-exams.xml` (118 URLs) already lists `ctet`, `ugc-net`, `htet`, `hptet`, `reet`; `sitemap-tools.xml` is an index of the per-locale sitemaps. Task 1 sitemap part = already done; hub link + Search Console indexing request remain.
- Live breadcrumb JSON-LD on `/tools/resizer/ctet` is valid (4 named items). "Unnamed item" in Search Console likely refers to an older crawl — re-validate in GSC after deploy (user).
- Titles/meta are built in code (`app/resizer/[slug]/page.tsx` + hi/mr copies); the API's `seo_title`/`seo_description` are not used.
- Spec data (production tools API `/tools/resizer/exams/<slug>`):
  - CTET: photo 350×450, 10–100 KB; signature 350×150, 3–30 KB — matches the ticket.
  - HTET: photo 200×230, 20–50 KB; **signature 10–20 KB (ticket, portal-verified: 10–50 KB)**; **no left-thumb (10–50 KB) or certificate PDF (50–200 KB)**; `is_placeholder: true`.
  - HPTET and REET: exact copies of the HTET placeholder numbers (`is_placeholder: true`) — not verified.
  - UGC NET: `category: null` (so it is missing from the hub's Teaching section and from sibling links), photo 10–200 KB, signature 4–30 KB, `documents: []`, `is_placeholder: true`.
  - UPTET slug is `up-tet`.
- The ticket's new per-exam fields (`official_url`, `last_verified`, `session_tag`, `extra_docs`) can live in the existing `data` JSON — no tools-backend migration needed.
- Hub (`ResizeHubPage.tsx`, dictionary `lead`) names CTET/HTET/UPTET only.
- FAQs (`getExamFaqs`, `lib/resizerExams.ts`) include the three off-intent items the ticket wants replaced (notes, minimum marks, best app).

- **Data pipeline:** Google Sheet / BigQuery `content.tools_exam_mapping`, `tools_exam_documents`, `tools_exam_content` (data_json) → tools DB via `BigQueryController` sync routes → tools static build. Edit BigQuery, not the DB.
- **Security note (out of scope, flagged):** `routes/api_v1.php` `bigquery/sync*` are public GET routes with no auth — anyone can trigger a sync.
- Frontend hardcoded specs: only the generic hub defaults in `ResizeImageTool.tsx` (photo 200×230 20–50 KB, signature 140×60 10–20 KB). HTET/HPTET/REET backend rows carry exactly these numbers → they were seeded from the defaults.

## Steps
1. [ ] Sitemap: add `/tools/resizer/ugc-net`, confirm `/ctet`; hub links UGC NET, HPTET, REET.
2. [ ] Title/H1/meta template with year variable; teaching exams only; hold UP PGT, UP TGT, Canara, TNPSC.
3. [ ] Tools BE: per-exam fields `official_url`, `last_verified`, `session_tag`, `extra_docs` (migration) + "Verified against [link] on [date]" block.
4. [ ] Exam-specific FAQ component replacing the 3 off-intent FAQs; how-to (H3 steps), photo rules.
5. [ ] Fix breadcrumb JSON-LD ("Unnamed item").
6. [ ] Related-links module (sibling resizers, `/teaching/<exam>`, age calculator).
7. [ ] Upload-problems section (spec box, 6-8 rows, `<details>` anchors, FAQPage JSON-LD only for visible rows); verbatim error list only when captured.
8. [ ] `/hi/` titles + section.
9. [ ] Audit task 8 (crop, brightness/contrast, signature clean-up, before/after) — report only.

## Build log (2026-10-27, not committed)
- Tools backend `ToolExamResource`: documents now return `sourceUrl` + `verifiedOn` (existing columns `source_url`, `verified_on`).
- `apps/tools`:
  - `lib/teachingTemplate.ts` holds the rollout set (ctet, ugc-net, htet, hptet, up-tet, reet; en + hi), title/H1/meta, FAQ, upload-problem rows and verified sources. All numbers come from the exam's documents.
  - `components/UploadProblems.tsx`, `TeachingLinks.tsx` and `OpenDetailsOnHash.tsx` are new.
  - `ResizerSpokePage` wraps the tool in `#resizer`. The section sits below the tool, and the spec table moves into it when the section shows.
  - en + hi `[slug]` pages use the template metadata, one FAQPage (FAQ + visible rows), and the age-calculator link.
  - Dictionary has a new `teaching` section (en/hi/mr), and the hub lead names HPTET, UPTET, REET and UGC NET.
  - Data fields read from `data_json`: `sessionTag`, `teachingPageSlug`, `portalErrors`.
- Section shows only when every uploaded document is `official_verified` with source + date. A first test used `verified`, which is not a backend value, and that bug was fixed.
- Checks:
  - `tsc` tools 0 errors, `check:colors` OK.
  - Tools has no eslint config (pre-existing, ESLint 9 flat config missing).
- Playwright (Sonnet, local tools backend, DB restored afterwards):
  - Unverified + verified states pass in en + hi at 390 and 1440, with no horizontal scroll.
  - mr and up-pgt are unchanged.
  - One FAQPage (5 → 11 entries when the section shows).
  - Anchors scroll. Opening the row on a hash was added afterwards and is being re-tested.
- Task 8 audit:
  - Crop, brightness/contrast and signature clean-up already exist.
  - Missing: a side-by-side before/after on the result screen (the original shows only in the adjust step) → separate ticket.
- Follow-ups 2026-10-27 (Playwright via a read-only proxy, all pass):
  - `official_verified` gating: shows only when ALL uploads are official; `partly_verified` hides the section.
  - Hash opens the row in en + hi.
  - HPTET `noMinimumDocs`: "up to 19/14 KB" in title, meta, FAQ, rows and spec table, and no "too small" rows (4 rows).
  - UPTET back on the old title/FAQ.
  - The tool's own "Image Requirements" box still shows the min–max working range (5–19 KB for HPTET) — tool UI, left as is.
- Not done: hub meta description still says "CTET, HTET, UPTET" (only the visible lead changed).

- Spec verification: `43-specs-verified.md` (official sources, 2026-10-27). Sheet change list: `43-sheet-edits.md`.
- Incident (test): the first Playwright agent wrote temporary CTET values into the tools backend DB via tinker, which turned out to be a REMOTE Postgres (65.108.49.3, possibly production), then restored them. The production API was re-checked: CTET documents/data_json are back to the originals. Later tests use a read-only response-rewriting proxy instead.

## Decisions needed (🛑 stop here until the user answers)
- **D1 📞 specs:** CTET, UGC NET, HPTET, UPTET, REET numbers must be verified on the official notice. Who verifies (Ganesh via CC-160, or I check official PDFs and you approve)? HTET is marked verified in the ticket.
- **D2 Hindi wording test:** "signature" written in Hindi script vs "hastakshar" on two exams — which two exams, and how is it measured?
- **D3 new editor features (task 8):** any missing crop/brightness/clean-up tool is a new feature + design; build now or separate ticket?
- **D4 ⚠️ tools backend migration + manual tools deploy** (user runs).
- **D5 📞 Search Console:** request indexing + save baseline (Sep 26 - Oct 23) is a user action.

## Decision log
| Date | Decision | By |
|---|---|---|
| 2026-10-27 | D1 specs: first verify every exam spec is fetched from the tools backend; if yes make the backend data accurate and correctly mapped, if not wire the frontend to the API and remove hardcoded/duplicated specs | User |
| 2026-10-27 | ~~Seeder~~ superseded: the source of truth is BigQuery (`clear-cutoff-435016.content.tools_*`, synced into the tools DB by `GET /api/v1/bigquery/sync*`), so a DB seeder would be overwritten. New decision: Claude verifies specs from official notices and writes exact BigQuery UPDATE statements + a source table; user runs them in BigQuery and triggers the sync | User |
| 2026-10-27 | BigQuery `content.tools_*` are EXTERNAL tables over Google Sheet `1v37K1Ohbgla8n_Ee7SBAxd3urjhkPd0rNBUHtHx-9Qs` (not readable from Claude's Drive) → SQL impossible. Final: Claude delivers a cell-edit list (tab, exam_slug, column, old → new, source link, date); the team edits the sheet, then sync + tools build/deploy | User |
| 2026-10-27 | Start data-independent code now: title/H1/meta template, hub links, related links, exam FAQ, upload-problems + verified block (render only with verified data), breadcrumb check, tools-API `source_url`/`verified_on`. No commit/deploy; Playwright test via Sonnet | User |
| 2026-10-27 | HPTET: max 19 / 14 KB (official "less than 20/15 kb"), min 5 KB, hide the "too small" row → `noMinimumDocs` in data_json, page says "up to X KB" | User |
| 2026-10-27 | UPTET: leave as is (old title) — team verifies specs and sets them later; removed from the template rollout set | User |
| 2026-10-27 | Extra documents (HTET left thumb, REET Aadhaar/marksheet, PwD PDFs): not now | User |
| 2026-10-27 | Title year: per-exam `session_tag`, default 2026 | User |
| 2026-10-27 | Task 8 (editor features) + task 9 Hindi word test: audit/report only now, build later in a separate ticket | User |

## Verification
tsc/eslint/check:colors, static export build, screenshots desktop + 390px en + hi, Rich Results test on one page, sitemap XML check.

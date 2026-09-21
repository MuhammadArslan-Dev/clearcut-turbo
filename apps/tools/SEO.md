# SEO — apps/tools

Everything SEO-related for the tools app (`clearcutoff.in/tools/*`,
`/hi/tools/*`, `/mr/tools/*`), what was implemented, why, and how to keep it
correct. Written 2026-09-21 against the current official docs (linked at the
end).

## How the site is served (why URLs look the way they do)

- Static export (`output: "export"`, `basePath: "/tools"`) on Cloudflare Pages,
  fronted by a Worker at `clearcutoff.in` (`apps/tools/worker`).
- **Public URLs** are `/tools/...` (English), `/hi/tools/...` (Hindi),
  `/mr/tools/...` (Marathi). Next's internal paths (`/tools/hi/...`) never
  appear in a canonical, hreflang or sitemap.
- `/tools` (the index) is **not** a Next page — the Worker renders it itself
  (`TOOLS_INDEX_HTML` in `worker/src/index.ts`). Its SEO head lives there.
- `robots.txt` for the whole origin is served by **apps/landing**
  (`apps/landing/src/app/robots.ts`). A robots.txt inside `/tools` would be
  ignored by crawlers (must sit at the host root).

## Single source of truth

| What | Where |
|---|---|
| Public URL of any page, hreflang sets, OG/Twitter, `buildMetadata()` | `src/lib/seo.ts` |
| JSON-LD builders (BreadcrumbList, WebApplication, FAQPage, CollectionPage) | `src/lib/seo.ts` |
| Renders a page's JSON-LD | `src/components/PageJsonLd.tsx` |
| Sitemap entries per locale | `src/lib/sitemap.ts` → `src/app/sitemap.ts`, `src/app/hi/sitemap.ts`, `src/app/mr/sitemap.ts` |
| Site-wide defaults (robots meta, icons, `metadataBase`) | `src/app/layout.tsx` |
| Default social image | `public/og/clear-cutoff-tools.png` (1200×630) |

**Never hand-write a canonical, hreflang or `og:url` in a page.** Call
`buildMetadata({ locale, path, title, description })` where `path` is the
route below `/tools` (e.g. `"/resizer/htet"`). Canonical, the complete
hreflang set, Open Graph and Twitter all derive from that one value, and the
sitemap uses the same helper, so they cannot disagree.

## What is implemented

### Metadata (every page)
- Unique `<title>` and `<meta name="description">` per page (checked: 0
  duplicates across the build). Hindi/Marathi age-calculator descriptions are
  now localized sentences (they used to be short, identical English strings).
- **Canonical**: absolute, self-referencing, in the page's own language.
- **hreflang**: every page lists `en`, `hi`, `mr` **and `x-default`** (English),
  identical on all three language versions (reciprocal), as Google requires.
  Before this, English pages listed only `en`+`hi`, Marathi pages listed all
  three, and two English pages had none — so most annotations were
  non-reciprocal and ignorable.
- **Open Graph** (`og:title/description/url/type/site_name/locale/
  alternate locale/image`) and **Twitter** (`summary_large_image` + image) on
  every page, including the age hub/directory pages that had none.
- `robots` meta: explicit `index, follow` plus Google's preview limits
  (`max-snippet:-1`, `max-image-preview:large`) in the root layout.
  `buildMetadata({ noindex: true })` opts a page out.
- `public/tools-index-preview.html` (a design copy of the `/tools` index that
  was publicly reachable) is `noindex`.

### Structured data (JSON-LD)
Only types/properties Schema.org defines and Google documents:

| Page | Types |
|---|---|
| Resizer hub, standalone tool pages, exam pages | `BreadcrumbList`, `WebApplication` (+ `FAQPage` on exam pages) |
| Resizer category pages, age directory (`/all`) | `BreadcrumbList`, `CollectionPage` with `ItemList` of the linked pages |
| Age calculator hub / exam pages | `BreadcrumbList`, `WebApplication`, `FAQPage` |
| Syllabus tracker | `BreadcrumbList`, `WebApplication` (`EducationalApplication`) |
| `/tools` index (Worker) | `CollectionPage` + `ItemList`, `BreadcrumbList` |

Rules that were enforced (and fixed):
- `applicationCategory` must be one of Google's listed values — the code used
  `UtilityApplication`, which is **not** on the list; it is now
  `UtilitiesApplication` (`EducationalApplication` for the syllabus tracker).
- **No `aggregateRating`/`review`.** Google's software-app rich result needs
  one of them, but there are no real ratings, and inventing them violates the
  structured-data guidelines. So `WebApplication` is descriptive markup and
  will not produce a rich result — that is expected and honest.
- **FAQPage**: Google's docs state FAQ rich results stopped appearing in
  Google Search (7 May 2026). The markup is still valid Schema.org and other
  consumers (Bing, AI answer engines) read it, so it stays, but only for Q&A
  that is **visible on the page** (the validator checks every question text
  appears in the page text). Don't expect an FAQ dropdown in Google results.
- `BreadcrumbList` has ≥ 2 items, sequential positions, absolute URLs, and its
  last item equals the page's canonical.
- `WebSite` markup is intentionally **not** added here: Google uses it for the
  site name on the home page, which belongs to apps/landing.

### Sitemaps
Three files, because a sitemap only covers URLs at or below its own path:

| File (public URL) | Contents |
|---|---|
| `https://clearcutoff.in/tools/sitemap.xml` | `/tools` + all English pages |
| `https://clearcutoff.in/hi/tools/sitemap.xml` | all Hindi pages |
| `https://clearcutoff.in/mr/tools/sitemap.xml` | all Marathi pages |

- Each URL carries the full hreflang set (`xhtml:link`, incl. `x-default`).
- No `<priority>`/`<changefreq>` (Google ignores them) and no `<lastmod>`
  (a build-time date on every URL is not "consistently and verifiably
  accurate", so Google would discard it). Add `lastModified` only if you later
  track a real per-page content date.
- Resizer **category** pages in Hindi/Marathi were missing from the old
  sitemap; all pages now come from the same route list.
- All three are referenced from `robots.txt` (`apps/landing/src/app/robots.ts`).
  Also submit them in Google Search Console (Domain property).

### Crawlability / internal linking
- The age-calculator directory (`/age-eligibility-calculator/all`) was a
  client-only subtree (`useSearchParams` in a Suspense boundary), so its 85
  exam links were **not in the static HTML** — 241 pages had no inbound link
  crawlers could see. It is now fully server-rendered; the `?group=` filter is
  applied after mount.
- The Syllabus Tracker is a client-only app; its static HTML had no text at
  all. `SyllabusAbout` adds a server-rendered "About / How it works" section
  below the tool (en/hi/mr); its title is the page's `<h1>` in the static HTML
  (the tracker's own step headings only exist after hydration).
- Clean URLs: canonical always without trailing slash and without query
  strings. Syllabus deep links (`/syllabus-tracker/<exam>/...`, rewritten to
  the single built page by `public/_redirects`) all canonicalize to
  `/tools/syllabus-tracker`.

### AI / LLM discoverability (what Google officially says)
- Google: *"There are no additional requirements to appear in AI Overviews or
  AI Mode"* and you *"don't need to create new machine readable files, AI text
  files, or markup"*. So no `llms.txt` is added — it is not a Google standard,
  and it would have to live at the origin root (owned by apps/landing) anyway.
- What does help is what is done here: crawlable server-rendered HTML,
  accurate titles/descriptions, valid structured data, sitemaps.
- `apps/landing/src/app/robots.ts` already blocks AI *training* crawlers
  (GPTBot, ClaudeBot, CCBot, Google-Extended, …) site-wide but explicitly
  **allows `/tools/`, `/hi/tools/`, `/mr/tools/`**, so these free tool pages can
  be cited by answer engines. Change that policy there, not here.

## Known limitations (deliberately not changed)
- `<html lang>` is `en` on the Hindi/Marathi pages. The static export has one
  root layout; fixing it needs route groups with a root layout per language
  (a large file move). Google relies on content language + hreflang, and the
  Hindi tree wraps content in `<div lang="hi">`, so the practical impact is
  small. Do it if accessibility auditing requires it.
- `/hi/tools` and `/mr/tools` (index pages) don't exist; the tools index is
  English-only, so breadcrumbs in every language point at `/tools`.
- The Hindi/Marathi hub pages are not linked from other pages' static HTML
  (the language switcher is a client-side menu). Discovery relies on hreflang
  and the sitemaps.
- Titles over ~65 characters exist on age-calculator pages
  (`… Age Calculator (2026) - Eligibility & Cutoff Date | Clear Cutoff`).
  Google truncates by width and may rewrite titles; they are unique and
  descriptive, so they were left as-is.

## Maintaining it

**Add a page / route**
1. In its `page.tsx`, `export const metadata = buildMetadata({ locale, path, title, description })`
   (or `generateMetadata` returning it) — for **all three locales**.
2. Render `<PageJsonLd locale path trail app? faqs? collection? />`.
3. Add its path to `src/lib/sitemap.ts` (data-driven pages — exams, categories —
   are picked up automatically from the backend).
4. Build and run the validation below.

**Add a language**: add it to `SEO_LOCALES`, `LOCALE_PREFIX`, `OG_LOCALE` in
`lib/seo.ts`, create its sitemap file, add the sitemap line to
`apps/landing/src/app/robots.ts`, and make sure every route exists in it
(hreflang must stay reciprocal — a missing language version breaks the set).

**Change the /tools index**: edit `TOOLS_INDEX_HTML` in `worker/src/index.ts`
(its head has canonical, OG/Twitter and JSON-LD) and redeploy the Worker
(`npm run deploy` in `apps/tools/worker`).

**Deploy**: SEO changes reach production only through the normal Pages deploy
(see `TOOLS_DEPLOY.md`); Worker and `apps/landing/robots.ts` changes need
their own deploys.

**Validate after every build** (checks metadata, hreflang reciprocity, JSON-LD
rules, sitemap scope/consistency, orphan pages):
```sh
pnpm --filter tools build      # with the production env vars from TOOLS_DEPLOY.md
# then inspect apps/tools/out: */sitemap.xml, a few pages' <head>, and paste
# representative pages into Google's Rich Results Test / Search Console
```
Things to re-check whenever content changes: unique titles/descriptions, every
exam page canonical == og:url == its sitemap URL, FAQ text visible on the page,
no invented ratings in structured data.

## Official documentation used
- Google Search Central: structured data intro, software app, FAQPage,
  breadcrumb, sitemaps (build), robots.txt (create), canonicalization
  (consolidate duplicate URLs), localized versions (hreflang), snippets and
  title links, AI features and your website.
- Schema.org (`WebApplication`, `CollectionPage`, `ItemList`, `BreadcrumbList`,
  `FAQPage`); Open Graph protocol; Next.js 16 Metadata API and the
  `sitemap.ts` file convention.

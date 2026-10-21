# Phase 14 — Blog Worker CPU limit (academy.clearcutoff.in returning 503 / error 1102)

**Status:** Blocked – Decision (no code yet, by user's instruction 2026-10-21)
**Repos:** CM `apps/blog` (+ `.github/workflows/deploy-blog-cloudflare.yml`), Cloudflare account
**Constraint from the user:** stay on the **Workers Free plan** (no paid plan).

## What happened (verified 2026-10-21)
- The blog deploy workflow ran at **2026-10-21 08:40 UTC** and created Worker version `d8292f52-cddc-48b9-8e6e-4e7360bba3aa`.
  - The previous version, `c08099d9-14ce-45fd-aefd-143dc24c5c98` (2026-10-13), was serving fine until then.
- Since then, the **first** request to a page often returns **503 "error code: 1102"**, and the next request to the same page returns 200.
- `wrangler tail` shows the cause: `outcome: exceededCpu` / `Worker exceeded CPU time limit`, cut at **cpu: 10** (ms).
  - Cached pages cost ~7 ms CPU, so they pass.
  - Pages that need a render cost ~300–370 ms CPU, so they sometimes pass and sometimes get killed.
- `/sitemap.xml` returns **500** on every try.
- Effect: any page that isn't cached yet (most question pages, and anything Google crawls) is likely to fail.

## Why the new version trips the limit
- **Workers Free gives 10 ms of CPU per request.** Paid gives 30 s by default, up to 5 min. Free has "built-in flexibility to allow for cases where your Worker infrequently runs over the configured limit", but a Worker that goes over consistently gets terminated. [CF limits]
- The old version used OpenNext's **dummy** cache, so every request rendered fresh. That cost a lot of CPU too, but it apparently stayed within the "infrequent overrun" tolerance.
- The new version adds an R2 incremental cache, a D1 tag cache and a Durable Object queue (`open-next.config.ts`). On a cache miss each request now also does an R2 read and write, a D1 lookup, and queues ISR work. On top of that, every page was a miss right after the deploy.
- ISR (`revalidate = 600/3600`) also keeps triggering background re-renders through the DO queue, so CPU-heavy renders keep happening even after the cache is warm.
- Other Free limits to watch:
  - 100,000 Worker requests per day.
  - 50 subrequests per request.
  - Worker startup time 1 s.
  - Static assets: 20,000 files per version (Free), 25 MiB per file.
  - Requests that hit static assets are "free and unlimited", and don't run the Worker unless `run_worker_first` matches. [CF limits, CF static-assets billing]
  - The OpenNext troubleshooting page also states a 3 MiB (gzipped) Worker size limit on Free and 10 MiB on Paid. The current Cloudflare limits page says only the uncompressed size counts (64 MiB). **Conflicting docs; check at build time.**

## Options (no paid plan)

| # | Option | What it means | Fixes 1102? | Cost / effort | Trade-offs |
|---|---|---|---|---|---|
| **0** | **Rollback now** to `c08099d9` | `npx wrangler rollback c08099d9-14ce-45fd-aefd-143dc24c5c98 --name clearcut-blog` | Restores the pre-today behaviour | 1–2 min, no code | Loses today's blog changes (cache/revalidate, SEO updates) until a real fix ships. The old version was itself near the limit (heavy renders each request). |
| **A** | **Full SSG on Workers** (official OpenNext path for static sites) | Pre-render every page at build time. Use the **static-assets incremental cache** + `enableCacheInterception: true`, with no queue and no tag cache. *"If your site is static, you do not need a Queue nor a Tag Cache."* [OpenNext caching] | Yes, if every URL is pre-rendered (hits cost ~ms of CPU) | Medium code + build changes | **No ISR / no on-demand revalidation** ("Revalidation is not supported with this cache"). Content updates need a rebuild + deploy; the backend question sync could trigger the GitHub workflow. Page count must fit **20,000 static files** on Free. Build time and backend load grow with page count. Pages not pre-rendered would still render on request and risk 1102. |
| **B** | **Static export to static assets** (like `apps/tools`) | `output: "export"`. The whole site becomes HTML files served as static assets, so the Worker never runs. | Yes, fully (zero Worker CPU, unlimited free asset requests) | High: needs a rewrite of the server-only parts | Lose `/api/revalidate`, middleware (i18n redirects must become static or `_redirects`), dynamic fallbacks, request-time sitemaps. Same 20,000-file cap and rebuild-on-content-change as A. |
| **C** | **Tune the current setup** | Add `withRegionalCache(long-lived)`, `enableCacheInterception`, `bypassTagCacheOnCacheHit`. Drop time-based ISR in favour of on-demand only. Pre-render the hot pages. | Partially: cuts CPU on cache **hits**; **misses still cost ~300 ms**, so cold pages can still 503 | Low–medium | Doesn't remove the root problem (a render costs 30× the Free budget). Fragile. |
| **D** | **Host the blog on the existing VPS** (Coolify, like landing/dashboard), with Cloudflare proxy in front | `next start` with normal Next.js ISR on the server, no Worker CPU limit | Yes | Low code; DevOps setup (Coolify app, DNS for academy → VPS) | Uses VPS CPU/RAM (shared with landing and dashboard). Need a Cloudflare cache rule for HTML if we want edge caching (see the landing stale-HTML lesson, Phase 10). No extra money if the VPS has headroom. |
| **E** | Reduce per-render CPU | Lighter pages: smaller markdown/KaTeX work, smaller payloads (some chapter fetches are 2–6 MB) | Helps all options | Medium | Getting a full page render under 10 ms CPU on Workers is unrealistic for these pages. Only useful together with A/C/D. |

## Recommendation (to discuss)
1. **Now:** Option 0 (rollback), so the blog stops returning 503 while we decide. ⚠️ Prod action; the user runs it or approves it.
2. **Best long-term without paying:** **D (VPS)** if the server has headroom. It keeps ISR, revalidation and the existing code as-is, with no 10 ms limit. If the blog must stay on Cloudflare, use **A (full SSG + static-assets cache)**, but only after measuring the page count against the 20,000-file cap and accepting rebuild-on-change.
3. Do **not** rely on C alone.

## Decisions / questions
- [!] 🛑 **D1:** roll back now? Yes/no.
- [!] 🛑 **D2:** long-term host: VPS (D), full SSG on Workers (A), or static export (B)?
- [!] 🛑 **D3:** for A/B, is "content updates appear after a rebuild (minutes)" acceptable instead of instant revalidation?
- [ ] 📞 **C1:** owner/DevOps: VPS CPU/RAM headroom for one more Next.js app?
- [ ] **Measure before choosing A/B:** total URL count (all exams × levels × subjects × chapters × pages × years × hi/en, plus blog posts and question pages). `/sitemap.xml` currently returns 500 (it also needs a fix).
- [!] ⚠️ **System impact:**
  - Changing the blog host changes DNS for academy.clearcutoff.in, the backend's revalidate URL (`config/services.php` `blog.revalidate_url`) and the deploy workflow.
  - The R2 bucket, D1 database and DO namespace would become unused.

## Measurements 2026-10-21 (wrangler tail on prod + URL inventory)
- **Per-request CPU:**
  - Cache hit: 1–16 ms (it loads the Next server).
  - Question/chapter render: 17–440 ms.
  - Subject/chapter page render: 1000–2010 ms. The cost is markdown → rehype-raw → sanitize → KaTeX for every question, server-side in `src/components/question-bank/rich-text.tsx`.
  - Logs also show `waitUntil() tasks … cancelled`: time-based ISR re-renders never finish.
- **Old `/question/<slug>-<id>` URLs:**
  - They are a route handler (`app/[locale]/(blog)/question/[...questionId]/route.ts`) that 301s to the chapter page.
  - Each hit fetches the question, the exam index and the whole chapter (up to 4.4 MB) just to compute the page number. That costs 17–440 ms CPU.
  - About 11.3k questions × 2 locales ≈ 22.6k redirect URLs.
- **Year pages:**
  - Every year page fails on prod with `TypeError: components.ComponentMod.handler is not a function` (2–7 ms CPU, not a CPU issue).
  - They work under `next start`, so the bug is OpenNext/Cloudflare-specific. The requirePage mapping in the deployed bundle looks correct, so the cause is still open.
  - It needs a Linux OpenNext build to reproduce. This Windows machine can't build OpenNext: symlink EPERM, and there is no WSL or Docker.
- **URL inventory (scripts and data in the session scratchpad `inv/`):**
  - **1,533 indexable URLs** (929 en + 604 hi).
  - **≈5,042 URLs return 200.** This includes non-canonical chapter/subject copies (HTET has 756 chapter copies against 130 canonical) and /hi copies that canonicalize to en.
  - 16 blog posts from Payload CMS (60 s revalidate, no webhook).
  - Questions per page: max 50. The biggest subject has 1,747 questions over 35 pages.
  - Backend responses go up to 7.8 MB (year) and 4.4 MB (chapter).
- **Fit:** ~5k pages fit both R2 (no file cap) and the static-assets cap (20,000 on Free). Build time and backend load at build time are the open risks.

## Sources
- Cloudflare Workers limits: https://developers.cloudflare.com/workers/platform/limits/
- Cloudflare static assets billing: https://developers.cloudflare.com/workers/static-assets/billing-and-limitations/
- OpenNext Cloudflare caching: https://opennext.js.org/cloudflare/caching
- OpenNext Cloudflare troubleshooting (Worker size): https://opennext.js.org/cloudflare/troubleshooting

## Decision log
| Date | Item | Decision | By |
|---|---|---|---|
| 2026-10-21 | Paid plan | No. Stay on Workers Free | User |
| 2026-10-21 | Code now | No. Document options first | User |

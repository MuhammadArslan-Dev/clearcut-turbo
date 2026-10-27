# Phase 51 — Public pages delivery: cache, compression, redirects, handoff

**Tickets:** CC-151 (Medium)
**Repos:** CM landing, blog, tools; ASTRO; Cloudflare/Vercel/Coolify config
**Status:** Header audit done (2026-10-27); Lighthouse runs + blog listing ISR waiting on decision
**Created:** 2026-10-27 (wave 2, Arslan's list)

## Header audit (curl, 2026-10-27; repeat request in brackets)
| URL | Cache | Compression | Redirects | TTFB |
|---|---|---|---|---|
| clearcutoff.in/ | `s-maxage=3600, swr`, CF **HIT**, Next HIT | br | 0 | 0.32 s (0.07) |
| clearcutoff.in/start | `s-maxage=31536000`, CF REVALIDATED → HIT | br | 0 | 0.35 s (0.08) |
| clearcutoff.in/tools/resizer/htet | `max-age=60, s-maxage=300`; Worker `cacheEverything` with per-status TTL (deliberate, see worker/src/index.ts) | br | 0 | 0.35 s (0.12) |
| clearcutoff.in/tools/age-eligibility-calculator/htet | same | br | 0 | 0.31 s (0.08) |
| academy …/pedagogy-history (ISR) | Vercel STALE → HIT on the next request (background regeneration works; the stale copy is from on-demand revalidation after a question sync) | br | 0 | 0.4–1.8 s |
| academy /ctet (ISR 1 h) | STALE → HIT | br | 0 | 0.36–0.42 s |
| **academy /ctet/blog** | `private, no-store`, Vercel **MISS every time** — the blog listing and post pages have no `revalidate`, so they render on every request | br | 0 | **0.65–1.75 s** |
| app.clearcutoff.in/hi/onboarding | `private, no-store` but **CF HIT** on repeat (a Cloudflare rule caches it) | br | 0 | 2.4 s (0.10) |

Notes:
- The old `/question/*` 301 hop could not be checked with a real id here (a made-up id 404s, which is correct). Check with one id from search/old links.
- Onboarding HTML cached at Cloudflare despite `no-store`: fine only while that page's HTML is identical for every visitor (it is client-rendered). Worth confirming the CF rule is intentional.
- The biggest real public-page problem is **LCP on long academy chapters**: `pedagogy-history` LCP p75 7.1 s, `pedagogy-hindi/page/*` 9.7 s (Phase 48 audit) while TTFB is < 0.5 s → it is page weight / render work, not delivery. Needs Lighthouse on those pages (Phase 50/51 overlap).

## Goal
8 representative URLs: CDN HIT on repeat, brotli, h2/h3, <= 1 redirect; LCP < 2.5s on landing, tools, Academy.

## Already in place (do not redo)
- Blog question pages ISR (weekly, Vercel Hobby budget). Tools static on Pages. Landing on Coolify.

## Steps
1. [ ] Audit the 8 URLs (headers via curl, Lighthouse) — read-only, report.
2. [ ] Redirect-chain crawl for old Academy URLs.
3. [ ] preconnect to app + font hosts on landing.
4. [ ] Handoff latency (overlaps phase 42).

## Decisions needed (🛑 stop here until the user answers)
- **D1 📞 infra:** CDN/cache rules on Cloudflare or Coolify proxy and Vercel plan limits are infra/cost decisions — you decide/apply.
- **D2:** landing static/ISR TTLs (how long a CMS change takes to show).

## Built (2026-10-27, not committed)
- `apps/blog` `[examName]/blog/page.tsx` (listing) + `[examName]/blog/[slug]/page.tsx` (post): `export const revalidate = 86400` + empty `generateStaticParams` → ISR, rendered on first visit, regenerated at most daily.
- tsc 33 = baseline.
- First test (Sonnet, prod build): the pages were ISR (●, and `dynamic="error"` builds clean, so they read no request data), but `s-maxage=60`. The CMS fetch clients set `defaultRevalidate` 60 (`lib/api/posts.ts`) / 300 (`lib/api/exams.ts`), and a page lives only as long as its shortest fetch.
- **Fixed:** both clients `defaultRevalidate: 86400`. Their only users are these two pages and the exam sitemaps.
- Re-test:
  - `/ctet/blog`, `/hi/ctet/blog` and a post → 200, MISS then HIT, `s-maxage=86400, stale-while-revalidate=…`.
  - A bogus slug → 404, cached as a 404.
  - `/ctet` is unchanged at `s-maxage=3600`.
  - Playwright 390 px: listing and post render with 0 console errors.
- Note: every distinct bogus slug becomes its own cached 404 (a few write units each). Watch Vercel ISR usage after deploy; if bots spray random slugs, consider `dynamicParams = false` with the real slugs in `generateStaticParams`.

## Decision log
| Date | Decision | By |
|---|---|---|
| 2026-10-27 | Blog listing + posts → ISR. First 1 h, then corrected to **24 h** after the write-cost estimate: ~20 Vercel ISR units per regeneration (post HTML 111 KB + RSC 52 KB); 1 h ≈ 300K units/month vs the Hobby 200K; 24 h worst case ≈ 60K | User |

## Verification
Header table before/after; Lighthouse before/after.

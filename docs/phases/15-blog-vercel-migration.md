# Phase 15 — Move the blog (academy.clearcutoff.in) to Vercel

**Status:** Not Started — plan written 2026-10-21, waiting on D1–D4
**Why:** Cloudflare Workers Free plan (10 ms CPU/request) can't render the question-bank pages (Phase 14). The user chose Vercel.
**Repos:** CM `apps/blog`, `.github/workflows/`, Cloudflare DNS (clearcutoff.in zone), Vercel account. Backend unchanged.
**Supersedes:** Phase 14 (Cloudflare prerender work stays parked on branch `blog-worker-cpu`, commit `729df82`).

## What already works on Vercel (verified in code)
- `apps/blog` is plain Next.js 16. Its build script is `next build --turbopack`; the `cf:*` scripts are only for Cloudflare.
- No app code uses Cloudflare APIs (no `getCloudflareContext`). The Cloudflare-only parts are:
  - `open-next.config.ts` and `wrangler.jsonc`: ignored by Vercel.
  - `next.config.ts` → `initOpenNextCloudflareForDev()`: a no-op outside `next dev`.
- ISR, `revalidateTag`/`revalidatePath` (backend `POST /api/revalidate` after a question sync), `src/middleware.ts` (next-intl) and route handlers (sitemaps, `/question/*` 301s) all run natively on Vercel.
- The year-page 500 (`ComponentMod.handler is not a function`) only appears in the OpenNext/Cloudflare build (it works under `next start`), so it is expected to disappear. Verify on the preview.

## Risks / numbers to keep in mind
- **Plan:**
  - Hobby is "personal, non-commercial use" only. ClearCutoff is a business, so **Pro ($20/member/month)** is the compliant choice.
  - Hobby caps: 4 h active CPU/month, 1M invocations, 200k ISR writes, and no paid overage (the site stops at the cap).
- **CPU from ISR:**
  - A question page costs ~0.3–2 s CPU to render. Today they regenerate every 10 min (`revalidate = 600`) whenever visited.
  - If Google recrawls ~5k pages daily, that is ~1–1.5 h CPU/day, about 30–45 h/month. That alone exceeds Hobby; on Pro it is ~$4–6 overage.
  - Fix (step 3): no time window; refresh only when the backend says content changed.
- **Large backend responses (4–16 MB):** Vercel's data cache also skips items over 2 MB, so a regeneration re-downloads them. Acceptable with on-demand refresh. Phase "question handling" (page-sized API, render-once HTML) makes it cheaper later.
- **Backend rate limit:**
  - Vercel's egress IPs are shared and change, so the per-IP 60/min limit would hit.
  - The blog already sends `X-Blog-Server-Key` (own 1200/min bucket; backend deployed 2026-10-21). Confirm the backend prod deploy has it.
- **Function timeout:** some subject/year renders fetch 6–8 MB (6–7 s). Set `maxDuration` (≥ 60 s) on those routes, or rely on the plan default.
- **Region:** pick the one closest to the backend (apptest.clearcutoff.in). Mumbai `bom1` is likely, given the IST data. Confirm the backend server's location (C2).

## Plan

### Step 1 — Code (branch `blog-vercel` from `main`, this repo)
- [ ] `next.config.ts`: drop the `@opennextjs/cloudflare` import / `initOpenNextCloudflareForDev()` (the Cloudflare dev shim).
- [ ] Add `apps/blog/vercel.json`: `regions` (D3) and function `maxDuration` for the question-bank routes.
- [ ] **ISR policy (D2):** question-bank pages `revalidate = false` (or a long window, e.g. 86400). Freshness comes from the existing `/api/revalidate` (tags + paths), which works natively on Vercel. Fetch-level windows are aligned so they don't pull the page back to 10 min. Update `route-cache.ts` + its test.
- [ ] `/api/revalidate` comment: the D1/DO notes are Cloudflare-only.
- [ ] Keep `open-next.config.ts` / `wrangler.jsonc` / `cf:*` until DNS is switched and stable, so we can roll back. Remove them in step 6.
- [ ] Run tests (blog 205+), typecheck (baseline blog 33), lint and check:colors. `next build` locally (works on Windows).

### Step 2 — Vercel project (user, or me via the Vercel connector with approval)
- [ ] New project from the GitHub repo `clearcut-turbo`. Root Directory `apps/blog`, framework Next.js, install/build auto-detected (pnpm workspace + Turborepo).
- [ ] Env vars (Production + Preview):
  - `BACKEND_URL` and `NEXT_PUBLIC_API_URL` = `https://apptest.clearcutoff.in/api`
  - `NEXT_PUBLIC_PAYLOAD_URL`
  - `NEXT_PUBLIC_SITE_URL` = `https://academy.clearcutoff.in`
  - `NEXT_PUBLIC_GTM_ID`, `NEXT_PUBLIC_CLARITY_ID` (prod only)
  - Sentry vars if wanted: `NEXT_PUBLIC_SENTRY_DSN`, `SENTRY_ORG`, `SENTRY_PROJECT`, `SENTRY_AUTH_TOKEN`
  - `REVALIDATE_SECRET` / `BLOG_SERVER_KEY` are in code (`blog-server-key.ts`); env overrides are optional.
- [ ] Production branch: `main`, or a dedicated branch (D4).

### Step 3 — Test on the Vercel preview URL (before any DNS change)
Preview deployments are noindex by default on Vercel; confirm the `X-Robots-Tag` header.
- [ ] Every page type returns 200 in en and /hi: home, exam, level, subject list, subject page + /page/N, chapter + /page/N, **year list, year page + /page/N**, blog list/post.
- [ ] `/question/<slug>-<id>` returns a 301 to the right chapter page.
- [ ] `/sitemap.xml`, `/sitemaps/index.xml`, `/sitemaps/<exam>.xml` and `-questions.xml` all valid. `robots.txt` correct.
- [ ] SEO output identical to the current site: title, description, canonical, hreflang, JSON-LD (diff a sample of pages against Cloudflare's).
- [ ] Googlebot user agent: same HTML.
- [ ] Cold and warm timings. Function logs show no errors and no backend 429s.
- [ ] `POST /api/revalidate` with the secret, then the page updates (on preview, against a test exam).

### Step 4 — Switch the domain (low downtime, reversible)
- [ ] Vercel → Domains → add `academy.clearcutoff.in` and complete the TXT verification first.
- [ ] Cloudflare: remove the Custom Domain `academy.clearcutoff.in` from Worker `clearcut-blog`, then add DNS `CNAME academy → cname.vercel-dns.com`. Use DNS-only (grey cloud), as Vercel recommends; proxied needs SSL "Full (strict)" and can break Vercel's certificate renewal (D5).
- [ ] Verify HTTPS, a 200 on the key pages, and that the backend's revalidate calls land.
- **Rollback:** delete the CNAME and re-add the Custom Domain on the Worker. The Worker (version `94190658`) stays deployed and untouched.

### Step 5 — After go-live (24–72 h)
- [ ] Search Console: coverage and crawl errors; resubmit `sitemaps/index.xml`.
- [ ] Vercel usage: active CPU, invocations, ISR writes/reads against the plan.
- [ ] Sentry/Clarity: no new errors. Analytics hostname allowlist (Phase 02) still includes academy.

### Step 6 — Cleanup (after a stable week)
- [ ] Remove `open-next.config.ts`, `wrangler.jsonc`, the `cf:*` scripts, the `@opennextjs/cloudflare`, `wrangler` and `@cloudflare/workers-types` devDeps, `.github/workflows/deploy-blog-cloudflare.yml`, and `docs/BLOG_CACHE_DEPLOY.md` (or mark it historical).
- [ ] Cloudflare: delete the `clearcut-blog` Worker, its R2 bucket `clearcut-blog-incremental-cache`, D1 `clearcut-blog-tag-cache`, and the staging R2 and D1 from Phase 14 (user approval for each delete).
- [ ] Update root `CLAUDE.md` (blog hosting) and `docs/DEVELOPMENT_RULES.md`.

## Decisions / questions
- [ ] 🛑 **D1:** Vercel **Pro** (compliant, pay-as-you-go) or Hobby (free, non-commercial ToS, hard caps)?
- [ ] 🛑 **D2:** freshness: on-demand only after each question sync (recommended, least CPU) or a time window (how long)?
- [ ] 🛑 **D3:** region (`bom1` Mumbai, or wherever the backend runs).
- [ ] 🛑 **D4:** deploy from `main` on every push (auto) or a dedicated production branch?
- [ ] 🛑 **D5:** Cloudflare DNS record DNS-only (recommended) or proxied?
- [ ] ⚠️ **System impact:**
  - DNS change for academy.clearcutoff.in.
  - Backend unchanged: same revalidate URL and secret.
  - The Cloudflare Worker is kept for rollback until step 6.
  - Landing, dashboard and tools are unaffected.
- [ ] 📞 **C1:** who owns the Vercel account/team (needed to create the project and add the domain)?
- [ ] 📞 **C2:** where the backend server is hosted (region choice).

## Decision log
| Date | Item | Decision | By |
|---|---|---|---|
| 2026-10-21 | Blog host | Move to Vercel | User |

# Project Overview

`clearcut-master` is ClearCutOff's web front-end monorepo (Turborepo + pnpm workspace, `packageManager: pnpm@10.33.0`, Node 22 in CI). It holds four apps and twelve shared packages. It contains **no backend and no database** — data comes from a Laravel API and a Payload CMS that live in separate repositories.

> Scope of these docs: derived from this repository's source only. Anything that lives in another repo (Laravel schema, CMS collections) is described only as far as this repo's code reveals it.

## Apps

| App | Stack | Purpose | Deployed as |
|---|---|---|---|
| `apps/blog` | Next.js 16 App Router, Tailwind v4, next-intl | Learner-facing content: exam question banks by exam/year/section, CMS blog posts. Also has an `(admin)/admin` route group | Cloudflare Worker `clearcut-blog` via OpenNext (`apps/blog/wrangler.jsonc`, `.github/workflows/deploy-blog-cloudflare.yml`, manual trigger). Domain: `academy.clearcutoff.in` |
| `apps/dashboard` | Next.js 16, Tailwind v4, next-intl, Amplitude, Sentry | Logged-in product: onboarding, preparation, test series/exams, payments, profile, downloadable content | `nixpacks.toml` at repo root (build: `pnpm turbo run build --filter=dashboard`) |
| `apps/landing` | Next.js 16, Tailwind v4, Radix UI + CVA, next-intl | Public marketing site: home, `exam/[slug]`, `compare`, `alternatives`, `faq`, `start`, `teaching`, `resize-image`, legal pages | No deploy config in this repo |
| `apps/tools` | Next.js 16, `output: "export"`, `basePath: "/tools/resizer"` | Static browser tools: photo/signature resizer (`resizer/*`), `age-eligibility-calculator`, `syllabus-tracker`; own `en`/`hi`/`mr` route folders | Cloudflare Pages project `clearcut-tools`, fronted by Worker `clearcut-tools-router` (`apps/tools/worker`) on `clearcutoff.in/tools/*` |

## Shared packages (`packages/*`, consumed as TypeScript source, no build)

`analytics`, `api`, `assets`, `auth`, `design-tokens`, `hooks`, `i18n`, `react-query`, `state`, `ui`, `utils`, `validation`. Each exposes `"./subpath": "./src/file.ts"` exports (no barrel files). See `architecture.md` for who consumes what.

## Related repositories (not in this repo)

| Repo | Role | Evidence in this repo |
|---|---|---|
| Laravel main backend | Auth, exams, payments, profile, syllabus endpoints | `NEXT_PUBLIC_LARAVEL_MAIN_BACKEND` and the endpoint paths in `api.md` |
| Payload CMS | Blog posts, comparisons, alternatives, FAQ, global sections | `CMS_URL` (landing), `NEXT_PUBLIC_PAYLOAD_URL` (blog), `/api/...` paths |
| Laravel tools backend | Resizer exam specs | `TOOLS_API_URL` in `apps/tools/src/lib/api/toolsApi.ts` |
| Astro marketing repo, React Native app | Other clients | Mentioned in `CLAUDE.md` only |

## Common commands (repo root)

```sh
pnpm install
pnpm dev                      # all apps; or pnpm --filter <blog|dashboard|landing|tools> dev
pnpm build | lint | typecheck | test
pnpm check:colors             # hardcoded-colour guard vs scripts/hardcoded-colors-baseline.json
```

`.env.example` in each app documents required variables. `apps/landing` build needs a reachable `CMS_URL`.

## CI / deploy workflows (`.github/workflows`)

- `ci.yml` — on push/PR to `main`: lint → `check:colors` → typecheck → test → build.
- `deploy-blog-cloudflare.yml` — `workflow_dispatch` only.
- `deploy-tools-worker-cloudflare.yml` — `workflow_dispatch` only; deploys the tools router Worker with npm (it is outside the pnpm workspace).

## Other files worth knowing

`CLAUDE.md` / `AGENTS.md` (agent guidance), `ROLES.md`, `TEST-ISSUE-REPORT.md` (exam-flow audit), `TOOLS_DEPLOY.md` (tools deploy runbook), `SYLLABUS_TRACKER_PLAN.md`, `apps/landing/project-style-guide.md`, `lhout/` (Lighthouse output, appears to be stray artifacts).

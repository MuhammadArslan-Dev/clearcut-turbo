# apps/tools — Production Deploy

How `apps/tools` (photo/signature resizer, age eligibility calculator,
Syllabus Tracker) actually gets to `clearcutoff.in/tools/*` in production.
Written after tracing the real Cloudflare setup by hand (2026-09-19) — the
comments in this repo's own source (`next.config.ts`, `syllabusTrackerUrl.ts`)
describe a "Cloudflare Pages Git integration auto-deploys on push" model that
**turned out to be wrong**. This file documents what's actually there.

## The real picture

Three separate Cloudflare pieces are involved, and only one of them needs a
manual step:

1. **Pages project `clearcut-tools`** (`clearcut-tools.pages.dev`) — hosts
   the actual built site (static HTML/JS/CSS from `apps/tools`).
   **Has no Git connection.** Pushing to GitHub — any branch, `main`
   included — does **nothing** here. It only updates when someone runs
   `wrangler pages deploy` by hand and uploads a build.
2. **Worker `clearcut-tools-router`** (`apps/tools/worker`) — a thin proxy
   in front of `clearcutoff.in` that forwards `/tools/*`, `/hi/tools/*`,
   `/mr/tools/*` requests to the Pages project above (see its
   `wrangler.toml` and Cloudflare dashboard → clearcutoff.in → Workers
   Routes). **Deploys separately, and only needs to when
   `apps/tools/worker/src/index.ts` itself changes** — not when the site's
   own pages/components change. See `.github/workflows/deploy-tools-worker-cloudflare.yml`
   (manual-trigger only, no push automation).
3. **GitHub** — used for source control and PR review, but has **no CI
   step that deploys the site**. `.github/workflows/ci.yml` only lints/
   typechecks/tests/builds; it doesn't upload anything to Cloudflare.

So: editing code, committing, and pushing to `main` accomplishes nothing on
its own. The site only updates when someone explicitly runs a Pages deploy.

## How to deploy the site

Run from the repo root:

```sh
cd apps/tools
NODE_ENV=production NEXT_PUBLIC_LARAVEL_MAIN_BACKEND=https://apptest.clearcutoff.in/api pnpm build
npx wrangler pages deploy out --project-name=clearcut-tools --branch=main --commit-message="<what changed>"
```

`wrangler` needs to be authenticated against the Cloudflare account that
owns `clearcut-tools` — `npx wrangler whoami` confirms this; if it's not
logged in, `npx wrangler login` first. `--branch=main` is what makes the
deployment register as **Production** in the Pages dashboard (matching
every prior deploy's history) rather than a preview.

Verify in the Cloudflare dashboard afterward: **Workers & Pages → clearcut-tools →
Deployments** — the new deploy should appear at the top of the
**Production** section, tagged `main`, with the commit message you passed.

## The gotcha that will break production silently: env vars baked at build time

`apps/tools` is a static export (`output: "export"` in `next.config.ts`).
Two env vars get **compiled directly into the shipped JS** at build time —
whatever value is active in *your local shell* when you run `pnpm build` is
what every real visitor's browser will call, forever, until the next
deploy:

- `NEXT_PUBLIC_LARAVEL_MAIN_BACKEND` — the Syllabus Tracker's only runtime
  backend call (`apps/tools/src/lib/api/syllabusApi.ts`). Must be
  `https://apptest.clearcutoff.in/api` (or whatever the current production
  Laravel backend URL is) — **never** the local Laragon host
  (`http://clearcutoff-main-backend.test/api`) that a normal dev `.env`
  file points at.
- `TOOLS_API_URL` — read at build time only (not shipped to the browser),
  but still must resolve to the real `clearcut-tools-backend` production
  URL, not `http://clearcut-tools-backend.test/api/v1`.

**This has already broken production twice** (both within the same week):
once fixed in commit `6044aff` by changing `syllabusApi.ts`'s fallback
default, and once again when a deploy was built using a local `.env` file
that explicitly *set* the var — an explicit `.env` value always overrides a
code-level fallback, so the safe default in the source doesn't save you if
your shell's `.env` disagrees with it.

**Before deploying, verify the correct host actually landed in the build:**

```sh
cd apps/tools
grep -rl "apptest.clearcutoff.in" out/_next/static/chunks/*.js   # should find it
grep -rl "clearcutoff-main-backend.test" out/_next/static/chunks/*.js  # should find NOTHING
```

If the second grep finds anything, the build baked in the local dev host —
do not deploy it. Either unset/override `NEXT_PUBLIC_LARAVEL_MAIN_BACKEND`
in your shell for the build command (as in the deploy command above), or
temporarily rename your local `.env` before building.

## When the Worker needs redeploying too

Only when `apps/tools/worker/src/index.ts` (the routing/proxy logic
itself) changes — not for ordinary site changes. From `apps/tools/worker`:

```sh
npm run deploy
```

or trigger the `deploy-tools-worker-cloudflare.yml` GitHub Action manually
(Actions tab → this workflow → Run workflow). It deploys to the same
Cloudflare account via `CLOUDFLARE_API_TOKEN`/`CLOUDFLARE_ACCOUNT_ID`
Environment secrets.

## Quick reference

| What changed | What to redeploy |
|---|---|
| Any `apps/tools/src/**` page/component | Pages site (`wrangler pages deploy`) |
| `apps/tools/next.config.ts`, `public/_headers`, `public/_redirects` | Pages site |
| `apps/tools/worker/src/index.ts`, `wrangler.toml` routes | Worker (`npm run deploy` in `apps/tools/worker`) |
| Nothing in `apps/tools/**` | Nothing — this deploy path is scoped to this app only |

# blog

ClearCutOff's learner-facing content app — exam question banks, practice tests, and blog content for competitive teaching exams (CTET, HTET, UPTET, and others). Next.js 16 (App Router), Tailwind CSS v4 with shared `@clearcut/ui` primitives, i18n via `next-intl`.

Part of the `clearcut-master` monorepo — see the [root README](../../README.md) for the overall layout and shared packages this app depends on.

## Getting started

From the **repo root** (this app is a pnpm workspace member, not standalone):

```bash
pnpm install
cp apps/blog/.env.example apps/blog/.env   # fill in real values
pnpm --filter blog dev
```

Or from inside `apps/blog`:

```bash
npm run dev
```

No port is pinned, so Next takes the first free one starting at 3000 — check the dev server's own output for the URL, especially when running several apps in parallel.

## Scripts

| Command | Does |
|---|---|
| `npm run dev` | Start the dev server (Turbopack) |
| `npm run build` | Production build |
| `npm run start` | Serve a production build |
| `npm run lint` | ESLint |
| `npm run typecheck` | `tsc --noEmit` |

## Environment

See `.env.example` for the full list of variables this app reads (backend API URL, Payload CMS URL, Sentry DSN). Copy it to `.env` and fill in real values — `.env` is gitignored and never committed.

## Architecture

See the root [`CLAUDE.md`](../../CLAUDE.md) for the full monorepo architecture writeup, including the shared `@clearcut/*` packages this app consumes for auth, API clients, state, design tokens, and shared UI.

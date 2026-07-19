# landing

ClearCutOff's public marketing site — exam landing pages, pricing, onboarding flow, alternatives/comparison pages. Next.js 16 (App Router), Tailwind CSS v4 + Radix UI, content sourced from a Payload CMS, i18n via `next-intl`.

Part of the `clearcut-master` monorepo — see the [root README](../../README.md) for the overall layout and shared packages this app depends on.

## Getting started

From the **repo root** (this app is a pnpm workspace member, not standalone):

```bash
pnpm install
cp apps/landing/.env.example apps/landing/.env   # fill in real values, especially CMS_URL
pnpm --filter landing dev
```

Or from inside `apps/landing`:

```bash
npm run dev
```

Opens on [http://localhost:3002](http://localhost:3002) (falls back to the next free port if 3000/3001 are taken).

**`CMS_URL` must point to a running Payload CMS instance** — several pages fetch content from it at build time, and `next build` will fail with `ECONNREFUSED` if it's unreachable.

## Scripts

| Command | Does |
|---|---|
| `npm run dev` | Start the dev server (Turbopack) |
| `npm run build` | Production build (needs a reachable `CMS_URL`) |
| `npm run start` | Serve a production build |
| `npm run lint` | ESLint |
| `npm run typecheck` | `tsc --noEmit` |

## Environment

See `.env.example` for the full list of variables this app reads (backend API URL, CMS URL, analytics keys, Sentry DSN). Copy it to `.env` and fill in real values — `.env` is gitignored and never committed.

## Architecture

See the root [`CLAUDE.md`](../../CLAUDE.md) for the full monorepo architecture writeup, including the shared `@clearcut/*` packages this app consumes for auth, API clients, state, design tokens, and shared UI.

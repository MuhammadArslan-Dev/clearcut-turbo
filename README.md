# clearcut-master

Monorepo for ClearCutOff's web apps — a Turborepo + pnpm workspace, migrated over several phases onto a shared-package architecture so `apps/blog`, `apps/landing`, and any future app reuse the same auth, API clients, state, design tokens, and UI primitives instead of maintaining parallel copies.

## Quickstart

```bash
pnpm install
cp apps/blog/.env.example apps/blog/.env       # fill in real values
cp apps/landing/.env.example apps/landing/.env # fill in real values, especially CMS_URL
pnpm dev
```

`pnpm dev` runs every app's dev server in parallel via Turborepo. To run just one: `pnpm --filter blog dev` or `pnpm --filter landing dev`.

## Layout

### Apps

| App | Purpose | README |
|---|---|---|
| `apps/blog` | Learner-facing content app — exam question banks, practice tests, blog content | [apps/blog/README.md](apps/blog/README.md) |
| `apps/landing` | Public marketing site — exam landing pages, pricing, onboarding | [apps/landing/README.md](apps/landing/README.md) |

### Shared packages (`@clearcut/*`)

| Package | What it provides |
|---|---|
| `packages/api` | Axios-based (`createApiClient`) and native-fetch-based (`createFetchClient`) API client factories |
| `packages/auth` | Full auth feature — `createAuthFeature()` wires up `AuthProvider`, `AuthModal`, login/OTP screens, and the auth store from one app-specific config |
| `packages/design-tokens` | Shared CSS custom properties — colors, typography scale, spacing, radius, shadows, z-index, breakpoints |
| `packages/hooks` | Generic React hooks — `useIsMobile`, `useLockBodyScroll`, `useBackHandler`, `useScrollShadow` |
| `packages/i18n` | Shared `next-intl` routing config and locale-aware navigation (`Link`, `useRouter`, etc.) |
| `packages/react-query` | TanStack Query client factory and provider, tuned for Next.js SSR |
| `packages/state` | Zustand store factories — `createStore` (devtools), `createPersistedStore` (+ localStorage, SSR-safe), `useHydrateStore` |
| `packages/ui` | Shared UI primitives — `Button`, `Card`, `Input`, `Overlay`, `JsonLd`, `LinksList`, `Text`, `Separator` |
| `packages/utils` | Pure, framework-agnostic utility functions — text formatting/limiting, `buildMetadata()` |
| `packages/validation` | Shared Zod schemas — phone, OTP, pagination, auth forms |

## Common commands

Run from the repo root; Turborepo fans these out to every app/package that defines the matching script:

```bash
pnpm dev         # start all dev servers
pnpm build       # production build, all apps
pnpm lint        # ESLint, all apps
pnpm typecheck   # tsc --noEmit, all apps and packages
pnpm test        # Vitest, all packages with tests
```

## Architecture

For the full architecture writeup — layered structure, routing conventions, per-app stack details, and migration history — see [`CLAUDE.md`](CLAUDE.md).

## CI

Every push and PR to `main` runs lint, typecheck, test, and build via GitHub Actions (`.github/workflows/ci.yml`). `apps/landing`'s build step needs a `CMS_URL` secret pointing at a reachable Payload CMS instance to pass.

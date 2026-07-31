# clearcut-master

Monorepo for ClearCutOff's web apps — a Turborepo + pnpm workspace, migrated over several phases onto a shared-package architecture so `apps/blog`, `apps/dashboard`, `apps/landing`, and any future app reuse the same auth, API clients, state, design tokens, analytics, and UI primitives instead of maintaining parallel copies.

## Quickstart

```bash
pnpm install
cp apps/blog/.env.example      apps/blog/.env       # fill in real values
cp apps/dashboard/.env.example apps/dashboard/.env  # fill in real values
cp apps/landing/.env.example   apps/landing/.env    # fill in real values, especially CMS_URL
pnpm dev
```

`pnpm dev` runs every app's dev server in parallel via Turborepo. To run just one: `pnpm --filter blog dev`, `pnpm --filter dashboard dev`, or `pnpm --filter landing dev`.

No app pins a dev port, so each one takes the first free port starting at 3000 — when running several in parallel, the assignment depends on start order. Check Turborepo's output for the actual URLs rather than assuming.

Each `.env.example` is annotated with what breaks when a variable is missing; read it rather than guessing defaults.

## Layout

### Apps

| App | Purpose | README |
|---|---|---|
| `apps/blog` | Learner-facing content app — exam question banks, practice tests, blog content | [apps/blog/README.md](apps/blog/README.md) |
| `apps/dashboard` | Logged-in product — preparation, test series, exams, payments, onboarding, profile | [apps/dashboard/README.md](apps/dashboard/README.md) |
| `apps/landing` | Public marketing site — exam landing pages, pricing, onboarding | [apps/landing/README.md](apps/landing/README.md) |

All three are Next.js 16 (App Router) + React 19 + Tailwind CSS v4, with i18n via `next-intl` (`en` unprefixed, `hi` under `/hi`).

`apps/dashboard` is deliberately the least integrated of the three — it consumes only `@clearcut/ui`, `@clearcut/utils`, `@clearcut/i18n`, `@clearcut/react-query`, and `@clearcut/design-tokens`, and keeps its own auth, HTTP client, state, and analytics. See [`CLAUDE.md`](CLAUDE.md#dashboard-is-a-partial-consumer) before assuming a shared package applies to it.

### Shared packages (`@clearcut/*`)

Consumed as TypeScript source — no build step. Each has an `exports` map with no barrel file, so import the specific module: `import { Overlay } from "@clearcut/ui/overlay"`.

| Package | What it provides |
|---|---|
| `packages/analytics` | `AnalyticsProvider` — the one analytics entry point an app mounts (currently GTM, loaded on first interaction). Trackers self-gate; apps don't add their own production guards. |
| `packages/api` | Axios-based (`createApiClient`) and native-fetch-based (`createFetchClient`) API client factories, plus shared error types |
| `packages/assets` | Shared image path / asset registry |
| `packages/auth` | Full auth feature — `createAuthFeature()` wires up `AuthProvider`, `AuthModal`, login/OTP screens, and the auth store from one app-specific config |
| `packages/design-tokens` | Shared CSS custom properties — colors, typography scale, spacing, radius, shadows, z-index, breakpoints |
| `packages/hooks` | Generic React hooks — `useIsMobile`, `useLockBodyScroll`, `useBackHandler`, `useScrollShadow` |
| `packages/i18n` | Shared `next-intl` routing config and locale-aware navigation (`Link`, `useRouter`, etc.) |
| `packages/react-query` | TanStack Query client factory and provider, tuned for Next.js SSR |
| `packages/state` | Zustand store factories — `createStore` (devtools), `createPersistedStore` (+ localStorage, SSR-safe), `useHydrateStore` |
| `packages/ui` | Shared UI primitives — `Button`, `Card`, `Chip`, `Input`, `Select`, `Skeleton`, `Breadcrumbs`, `Link`, `Overlay`, `JsonLd`, `LinksList`, `Text`, `Separator`, `PageNotFound`, icons |
| `packages/utils` | Pure, framework-agnostic utility functions — text formatting/limiting, `buildMetadata()`, highlight-text |
| `packages/validation` | Shared Zod schemas — phone, OTP, pagination, auth forms |

## Common commands

Run from the repo root; Turborepo fans these out to every app/package that defines the matching script:

```bash
pnpm dev         # start all dev servers
pnpm build       # production build, all apps
pnpm lint        # ESLint, all apps
pnpm typecheck   # tsc --noEmit, all apps and packages
pnpm test        # Vitest, all packages with tests

pnpm check:colors          # design-token guard — fail on new hardcoded colours
pnpm check:colors:report   # human-readable audit
pnpm check:colors:update   # re-baseline (review the diff before committing)
```

Only `packages/utils` and `packages/state` currently have tests; `pnpm test` skips everything else by design. To run one package: `pnpm --filter @clearcut/utils test`.

**`pnpm build` does not verify types.** `apps/blog` and `apps/dashboard` set `typescript.ignoreBuildErrors: true`, so a green build says nothing about type correctness — run `pnpm typecheck` for that.

## Design-token guard

`pnpm check:colors` (`scripts/check-hardcoded-colors.mjs`) fails when a change introduces a **new** hardcoded colour instead of a token from `@clearcut/design-tokens`. It scans for hex/rgb/hsl/oklch literals and Tailwind arbitrary colour classes.

Because ~900 literals already existed when it was added, it gates against a per-package baseline (`scripts/hardcoded-colors-baseline.json`) rather than zero — the count can only go down, so paying existing ones off is rewarded and nobody is blocked by the backlog. Icon assets, logos, chart palettes, and third-party SDK colours are treated as intentional exceptions.

## Architecture

For the full architecture writeup — shared-package contracts, the dashboard's deliberate divergence, the Tailwind v4 `@source` requirement, SSR-safe store hydration, and known open issues — see [`CLAUDE.md`](CLAUDE.md).

## CI

Every push and PR to `main` runs **lint → check:colors → typecheck → test → build** via GitHub Actions (`.github/workflows/ci.yml`). `apps/landing`'s build step needs a `CMS_URL` secret pointing at a reachable Payload CMS instance to pass.

`apps/blog` and `apps/landing` carry a pre-existing lint/typecheck backlog from before CI existed — a red check on an unrelated PR is more often that than a regression. Confirm by checking whether the failing file was actually touched.

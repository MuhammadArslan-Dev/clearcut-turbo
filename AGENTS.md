# AGENTS.md

This file provides guidance to Codex (Codex.ai/code) when working with code in this repository.

## Repository Overview

`clearcut-master` is a **Turborepo + pnpm workspace** for ClearCutOff's web apps. It consolidates what used to be separate projects into one monorepo with a shared-package architecture — `apps/*` consume `@clearcut/*` packages instead of maintaining parallel copies of auth, API clients, state, design tokens, analytics, and UI primitives.

| Directory | Stack | Purpose |
|---|---|---|
| `apps/blog` | Next.js 16 (App Router), Tailwind v4, next-intl | Learner-facing content app — exam question banks, practice tests, blog content |
| `apps/dashboard` | Next.js 16 (App Router), Tailwind v4, next-intl, Amplitude, Sentry | Logged-in product — preparation, test series, exams, payments, onboarding, profile |
| `apps/landing` | Next.js 16 (App Router), Tailwind v4 + Radix UI + CVA, next-intl | Public marketing site — exam landing pages, pricing, onboarding, comparison pages |
| `packages/*` | TypeScript, no build step (consumed as source via `exports` maps) | Shared code — see table below |

All three apps are Next.js 16 App Router with i18n via `next-intl` (`en` default unprefixed, `hi` under `/hi`, config in `packages/i18n`) and Tailwind v4.

**`apps/dashboard` is deliberately less integrated than the other two** — see "Dashboard is a partial consumer" below before assuming a shared package applies to it.

## Development Commands

```sh
pnpm install                    # install everything, from repo root
pnpm dev                        # start every app's dev server in parallel
pnpm --filter blog dev          # start just one app's dev server
pnpm --filter dashboard dev
pnpm --filter landing dev

pnpm build                      # production build, all apps (turbo run build)
pnpm lint                       # ESLint, all apps
pnpm typecheck                  # tsc --noEmit, all apps and packages
pnpm test                       # Vitest, all packages that define a test script

pnpm check:colors               # design-token guard (see below) — gate against baseline
pnpm check:colors:report        # human-readable audit of hardcoded colours
pnpm check:colors:update        # re-baseline (review the diff before committing)
```

Run a single package's tests directly: `pnpm --filter @clearcut/utils test`, or a single file with `pnpm --filter @clearcut/utils exec vitest run src/text-limit.test.ts`.

Copy `.env.example` → `.env` in each app before running anything; `.env` is gitignored. Each `.env.example` is heavily annotated with what breaks when a variable is missing — read it rather than guessing defaults.

`apps/landing`'s build fetches content from a live Payload CMS at build time (`apps/landing/src/lib/api/cms.ts`) — `CMS_URL` must point to a reachable instance or the build fails with `ECONNREFUSED`, regardless of code correctness.

**`next build` does not gate on TypeScript.** `apps/blog` and `apps/dashboard` both set `typescript.ignoreBuildErrors: true` in `next.config.ts`, so a green build says nothing about type correctness — only `pnpm typecheck` does. Don't treat a successful build as verification of a type-level change.

## Architecture — Shared Packages (`@clearcut/*`)

Every package uses a `"./subpath": "./src/file.ts"` `exports` map (no barrel files/`index.ts`) — import the specific module you need, e.g. `import { Overlay } from "@clearcut/ui/overlay"`, never a package-level default export. Packages have no build step; apps consume the TypeScript source directly.

| Package | Provides |
|---|---|
| `packages/analytics` | `AnalyticsProvider` — the single analytics entry point blog/landing mount once in their root layout. Currently wraps `LazyGTM` (GTM, loaded on first interaction per `constants.ts`). Adding GA4/Meta Pixel/Clarity means adding a component here and a var to `./env` — apps don't change. Every tracker self-gates via `isAnalyticsEnabled`; **don't wrap the provider in an app-level `{isProduction && …}` guard** — that's the drift this package exists to prevent. |
| `packages/api` | `createApiClient` (axios, client-side authenticated calls), `createFetchClient` (native `fetch`, for Server Components — Next's `fetch` cache/`revalidate` integration only works with real `fetch`, not axios), `errors` |
| `packages/assets` | `image-registry` — shared image path/asset constants |
| `packages/auth` | `createAuthFeature(config)` — a factory each app calls once (in its own `src/lib/auth.ts`) with app-specific `apiClient`/`apiBaseUrl`/`redirectBaseUrl`/`onEvent`, returning `AuthProvider`, `AuthModal`, `useAuthStore`, `useAuthModal`, `InlineAuthFlow`, `authApi`. Never import `@clearcut/auth` directly from app code — always through that app's `lib/auth.ts`. Used by blog + landing only. |
| `packages/design-tokens` | `tokens.css` — the single source for colors, typography scale, spacing, radius, shadows, z-index, breakpoints. All three apps `@import` it into their own `globals.css`. |
| `packages/hooks` | Generic React hooks: `useIsMobile`, `useLockBodyScroll`, `useBackHandler`, `useScrollShadow` |
| `packages/i18n` | `routing.ts` (canonical `next-intl` locale config — `en`/`hi`, `localePrefix: "as-needed"`) and `navigation.ts` (locale-aware `Link`, `useRouter`, etc.) |
| `packages/react-query` | `createQueryClient()` (SSR-tuned staleTime/gcTime/retry) and `ReactQueryProvider` (one client per component lifetime via `useState`) |
| `packages/state` | `createStore` (Zustand + devtools naming), `createPersistedStore` (+ localStorage, always `skipHydration: true`), `useHydrateStore` |
| `packages/ui` | Shared primitives (Radix + Tailwind + CVA): `button`, `card`, `chip`, `input`, `main-input`, `select`, `separator`, `skeleton`, `text`, `link`, `breadcrumbs`, `overlay`, `json-ld`, `links-list`, `page-not-found`, `utils`, plus `icons/*`. `chip`/`breadcrumbs`/`select`/`skeleton`/`link` exist specifically as the replacements for the MUI Joy components that were removed. |
| `packages/utils` | Pure functions: `text-format`, `text-limit`, `build-metadata` (shared Next.js `Metadata` builder), `highlight-text` |
| `packages/validation` | Shared Zod schemas: `common/phone`, `common/otp`, `common/pagination`, `features/auth/login`, `features/auth/otp-verify`. Used by landing only. |

### Dashboard is a partial consumer

`apps/dashboard` depends on only five shared packages — `@clearcut/ui`, `@clearcut/utils`, `@clearcut/i18n`, `@clearcut/react-query`, `@clearcut/design-tokens`. It does **not** use `@clearcut/auth`, `@clearcut/api`, `@clearcut/state`, `@clearcut/analytics`, `@clearcut/validation`, or `@clearcut/hooks`. It has its own parallel implementations:

| Concern | Blog / Landing | Dashboard |
|---|---|---|
| Auth | `@clearcut/auth` via each app's `src/lib/auth.ts` | `src/providers/AuthProvider.tsx` + `src/lib/auth-token-client.ts` — token in **both** localStorage and an `auth_token` cookie (middleware/server components need the cookie), cross-host handoff via a `?token=` query param |
| HTTP | `@clearcut/api` (`createApiClient` / `createFetchClient`) | `src/lib/api/client.ts` — `apiFetch` over native fetch with `fetchWithRetry`, a typed `ApiError`, and Sentry breadcrumbs per request |
| State | `@clearcut/state` factories | plain Zustand stores under `src/store/{course,dashboard,modal,onboarding}` |
| Analytics | `@clearcut/analytics` (GTM) | `src/lib/analytics/*` — Amplitude (`browser.ts` client, `server.ts` node), typed event names in `types.ts`, per-domain event helpers in `events/` |

When changing something cross-cutting, check whether dashboard needs the same change made separately. **Do not "fix" this by pointing dashboard at the shared packages without checking behavior** — the auth flows in particular are not equivalent (dashboard's is a token-handoff from another host, not an in-app modal login).

Two dashboard details worth knowing before you touch them:

- `src/lib/analytics/ANALYTICS_EVENT_CATALOG.ts` is **not imported anywhere**. It's a flat catalog of example `trackEvent(...)` calls documenting every event name and payload shape. Read it as the event reference; importing it would fire every event.
- `src/middleware/auth.ts` and `src/middleware/i18n.ts` are **dead code** — nothing imports them. The live edge logic is `src/proxy.ts`, and it does i18n routing only; the cookie-based auth redirect in `middleware/auth.ts` is not wired up.

### Next 16 renamed `middleware.ts` → `proxy.ts` (inconsistently applied here)

`apps/landing` and `apps/dashboard` use `src/proxy.ts`; `apps/blog` still uses `src/middleware.ts`. Both work in Next 16. When editing edge logic, check which file the app actually has rather than assuming.

### `apps/dashboard` i18n message loading

Unlike the other apps' single message file, dashboard's `src/i18n/request.ts` merges a base `messages/{locale}.json` with per-namespace files from `messages/{locale}/` (`testListContent`, `relatedContent`, `examType`, `onboarding` → namespace `Onboarding`, `modals`, `payment`). **Adding a new namespace file requires adding it to the `load()` list in `request.ts`** — dropping a JSON file into `messages/en/` does nothing on its own. Note the namespace key does not always match the filename.

### The `createPersistedStore` SSR-hydration pattern

Zustand's `persist` middleware reads `localStorage` synchronously during store initialization. On the server that's a no-op (no `window`), so SSR always renders default state — but the same module evaluation on the client *does* have `window` and runs before React's hydration pass, so the first client render can already diverge from what the server sent, which React reports as a hydration mismatch and tears down the tree to recover.

`createPersistedStore` always forces `skipHydration: true` to prevent that automatic read. The actual localStorage read then happens explicitly, once, via `useHydrateStore(useYourStore)` called from inside a mounted client component (typically the app's root theme/providers component) — by the time that `useEffect` runs, hydration has already completed, so there's no mismatch window. **Don't bypass this** by passing your own `skipHydration: false` or reading storage another way in the initializer — that reintroduces the exact bug this factory exists to prevent.

### MUI Joy has been fully removed

Historically `apps/blog` was built on `@mui/joy` + Emotion while landing was Radix + Tailwind, which blocked component sharing. **That split no longer exists** — `@mui/joy` is absent from every `package.json` and from `pnpm-lock.yaml`, and no source file imports it. All three apps are Tailwind v4. Remaining `@mui/joy` mentions are historical comments (`packages/ui/src/breadcrumbs.tsx`, `chip.tsx`, `apps/blog/src/components/badge/free-badge.tsx`) plus one stale entry in `apps/blog/next.config.ts`'s `experimental.optimizePackageImports` list, which is a no-op for an uninstalled package.

`@emotion/react` and `@emotion/styled` are still direct dependencies of `apps/blog` and `apps/dashboard` — MUI's removal did not remove Emotion.

### Design-token guard (`scripts/check-hardcoded-colors.mjs`)

CI fails when a change introduces a **new** hardcoded colour instead of a token from `@clearcut/design-tokens`. It scans `apps/` and `packages/` for hex/rgb/hsl/oklch literals and Tailwind arbitrary colour classes (`bg-[…]`, `text-[…]`, …).

Because the audit found ~900 pre-existing literals, this gates against a **per-package baseline** in `scripts/hardcoded-colors-baseline.json` (currently blog 230, dashboard 577, landing 115) rather than zero-tolerance — the count can only go down. Files matching `EXCEPTIONS` (icon assets, logos, chart palettes, third-party SDK colours) are reported separately and not counted. `packages/design-tokens/tokens.css` is the source of truth and is exempt by definition.

If your change legitimately raises a count, `pnpm check:colors:update` re-baselines — but that should be rare and deliberate; prefer adding a token.

### Tailwind v4 `@source` requirement

Any shared package whose components emit Tailwind utility classes (especially arbitrary-value classes like `text-[var(--color-brand)]`) must be added to **every** app's `globals.css` via `@source "../../../../packages/X/src/**/*.{ts,tsx}";` — Tailwind v4 only scans each app's own tree by default, and a missing `@source` line means those classes silently fail to generate (no build error, just missing styles).

Current state, which is **not uniform**: blog and landing list `packages/ui`, `packages/auth`, and `packages/utils`; dashboard lists only `packages/ui` (it doesn't consume auth). The files are `apps/blog/src/app/globals.css`, `apps/landing/src/styles/globals.css`, `apps/dashboard/src/styles/globals.css`.

### Design tokens: z-index, shadows, and app-level overrides

`packages/design-tokens/tokens.css` documents the *existing* stacking system rather than inventing a new one — every `--z-*` value is the exact number that was already in use at its call site when the token was introduced. Where two apps genuinely used different numbers for a similar-sounding role (e.g. `--z-sticky-header` vs. `--z-header-elevated`), they were kept as **separate tokens** — collapsing them would silently change one app's real stacking behavior. Don't merge z-index/shadow tokens across apps without direct evidence both sides are meant to be identical.

Each app imports the shared tokens **first** so its own later definitions win the cascade; `apps/dashboard` additionally has its own `src/styles/tokens.css`. This means the same token name can resolve differently per app — check the app's own CSS before assuming a token's value.

## Shared `tsconfig`

`tsconfig.base.json` at the repo root holds the options identical across every app/package (`target`, `module`, `moduleResolution`, `strict`, `esModuleInterop`, `skipLibCheck`, `isolatedModules`, `noEmit`). Every `apps/*/tsconfig.json` and `packages/*/tsconfig.json` does `"extends": "../../tsconfig.base.json"` and only overrides genuine per-file differences (`lib`, `allowJs`, `jsx`, `paths`, the `next` plugin, `types`). When adding a new package, extend the base rather than copying the full option list. All apps alias `@/*` → `./src/*`.

## Testing

Vitest, per-package (`vitest.config.ts` + `"test": "vitest run"` script) — not a single root test runner. Currently only `packages/utils` and `packages/state` have tests; every other package and all three apps have none. `pnpm test` (via `turbo run test`) runs whichever packages define the script and skips the rest — this is expected, not a misconfiguration.

## CI

`.github/workflows/ci.yml` runs, on every push/PR to `main`: **lint → check:colors → typecheck → test → build**. The colour guard runs before typecheck because it's fast and gives the clearest failure message. The build step needs a `CMS_URL` repository secret pointing at a reachable Payload CMS instance for `apps/landing`.

**Pre-existing lint/typecheck backlog:** both `apps/blog` and `apps/landing` carry lint/type errors that predate CI (no `typecheck` script existed anywhere until CI was added). A red lint/typecheck check on an unrelated PR is more likely this backlog than a regression — confirm by checking whether the failing file was actually touched by that PR.

## Error tracking

**`apps/dashboard` has a real Sentry integration.** `src/lib/sentry/sentry-shared.ts` holds everything the three runtimes (browser via `src/instrumentation-client.ts`, node via `sentry.server.config.ts`, edge via `sentry.edge.config.ts`) must agree on: environment naming, `TRACES_SAMPLE_RATE` (10% prod / 100% local), and the ignore-list of non-actionable noise. Init is `enabled: Boolean(DSN)`, so an empty `NEXT_PUBLIC_SENTRY_DSN` is a clean no-op. `src/lib/sentry/sentry-api-client.ts` and `sentry-logger.ts` add per-request breadcrumbs and user context. **Change shared behavior in `sentry-shared.ts`, not in the three init files** — keeping them from drifting is the entire point of that module.

`SENTRY_AUTH_TOKEN` is only needed for production/CI builds; without it, production stack traces stay minified.

`apps/blog` and `apps/landing` have Sentry scaffolded but inert (empty DSN in their `.env.example`).

Note: `@sentry/nextjs` declares peer support for Next 13–15, not Next 16 (which all three apps run). It builds and typechecks clean regardless — re-verify after any Sentry version bump.

## Key Backend / External Paths (not in this repo)

- **Laravel backend** (exam content, auth, payments): `NEXT_PUBLIC_API_URL`/`BACKEND_URL`/`API_URL` in blog/landing; `NEXT_PUBLIC_LARAVEL_MAIN_BACKEND` (client) and `LARAVEL_API_URL`/`LARAVEL_MAIN_BACKEND` (server route handlers) in dashboard. **These base URLs must include the trailing `/api`** — dashboard's clients concatenate paths directly (`${BASE}/v1/auth-user`), and `app/api/auth/login/route.ts` reads the server vars with a non-null assertion and no fallback, so an unset value silently fetches `undefined/auth/login`.
- **Payload CMS** (landing's marketing content): `CMS_URL` in `apps/landing`.
- **Amplitude** (dashboard product analytics): gated on `NEXT_PUBLIC_AMPLITUDE_ENABLED === "true"`, so local runs don't pollute product analytics.

## Known open issues (flagged, not fixed)

- `--color-brand-dark` conflict: `#0053a2` in `packages/design-tokens/tokens.css` (canonical; landing + dashboard resolve to this) vs. `#006bd1`, which `apps/blog` shadows the same token name with. Preserved as `--color-brand-dark-legacy`. The same token name therefore renders two different blues depending on the app — unifying needs a design decision, not a patch. Don't confuse either with `--color-brand-hover` (`#006fdb`), a third distinct blue.
- `apps/blog/src/components/feature/language-modal.tsx`: the "Select App Language" section's selected-state styling checks `locale` (the route locale) instead of `appLanguage` (the store value) — a pre-existing bug, still present.
- `apps/blog` and `apps/dashboard` ship `typescript.ignoreBuildErrors: true`; removing it requires clearing the typecheck backlog first.
- Stray work-in-progress files exist under `apps/dashboard/src/app/[locale]` (e.g. `page copy.tsx`, `test/`, `sentry-example-page/`) — not part of the product surface.

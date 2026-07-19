# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository Overview

`clearcut-master` is a **Turborepo + pnpm workspace** for ClearCutOff's web apps. It consolidates what used to be separate projects (`clearcutoff-blog`, `landing-new`) into one monorepo with a shared-package architecture — `apps/*` consume `@clearcut/*` packages instead of maintaining parallel copies of auth, API clients, state, design tokens, and UI primitives. This consolidation was done phase-by-phase (see "Migration History" below); every shared package's docstring/comments note which phase introduced it and why.

| Directory | Stack | Purpose |
|---|---|---|
| `apps/blog` | Next.js 16 (App Router), MUI Joy + Emotion, next-intl | Learner-facing content app — exam question banks, practice tests, blog content |
| `apps/landing` | Next.js 16 (App Router), Tailwind v4 + Radix UI + CVA, next-intl | Public marketing site — exam landing pages, pricing, onboarding, alternatives/comparison pages |
| `packages/*` | TypeScript, no build step (consumed as source via `exports` maps) | Shared code — see table below |

**Both apps are Next.js 16 App Router with i18n via `next-intl`** (`en` default unprefixed, `hi` under `/hi`, config in `packages/i18n`). Beyond that, **they intentionally do not share a UI foundation** — see "The MUI-vs-Tailwind split" below before assuming any component can be shared.

## Development Commands

All packages use `npm` at the leaf level; the workspace itself uses `pnpm` + Turborepo.

```sh
pnpm install                    # install everything, from repo root
pnpm dev                        # start every app's dev server in parallel
pnpm --filter blog dev          # start just blog's dev server
pnpm --filter landing dev       # start just landing's dev server

pnpm build                      # production build, all apps (turbo run build)
pnpm lint                       # ESLint, all apps
pnpm typecheck                  # tsc --noEmit, all apps and packages
pnpm test                       # Vitest, all packages that define a test script
```

`apps/landing`'s build fetches content from a live Payload CMS at build time (`apps/landing/src/lib/api/cms.ts`) — `CMS_URL` must point to a reachable instance or the build fails with `ECONNREFUSED`, regardless of code correctness.

Copy `.env.example` → `.env` in each app before running anything; `.env` is gitignored.

## Architecture — Shared Packages (`@clearcut/*`)

Every package uses a `"./subpath": "./src/file.ts"` `exports` map (no barrel files/`index.ts`) — import the specific module you need, e.g. `import { Overlay } from "@clearcut/ui/overlay"`, never a package-level default export.

| Package | Provides |
|---|---|
| `packages/api` | `createApiClient` (axios, for client-side authenticated calls) and `createFetchClient` (native `fetch`, for Server Components — Next's `fetch` cache/`revalidate` integration only works with real `fetch`, not axios) |
| `packages/auth` | `createAuthFeature(config)` — a factory each app calls once (in its own `src/lib/auth.ts`) with app-specific `apiClient`/`apiBaseUrl`/`redirectBaseUrl`/`onEvent`, returning `AuthProvider`, `AuthModal`, `useAuthStore`, `useAuthModal`, `InlineAuthFlow`, `authApi`. Never import `@clearcut/auth` directly from app code — always through that app's `lib/auth.ts`. |
| `packages/design-tokens` | `tokens.css` — the single source for colors, typography scale, spacing, radius, shadows, z-index, breakpoints. Both apps `@import` it into their own `globals.css`. |
| `packages/hooks` | Generic React hooks: `useIsMobile`, `useLockBodyScroll`, `useBackHandler`, `useScrollShadow` |
| `packages/i18n` | `routing.ts` (canonical `next-intl` locale config — `en`/`hi`, `localePrefix: "as-needed"`) and `navigation.ts` (locale-aware `Link`, `useRouter`, etc., via `next-intl`'s `createNavigation`) |
| `packages/react-query` | `createQueryClient()` (SSR-tuned staleTime/gcTime/retry) and `ReactQueryProvider` (mounts one client per component lifetime via `useState`) |
| `packages/state` | `createStore` (Zustand + devtools naming), `createPersistedStore` (+ localStorage persistence, always `skipHydration: true`), `useHydrateStore` (call once from a mounted client component to trigger the deferred rehydration) |
| `packages/ui` | Shared UI primitives: `Button`, `Card`, `Input`, `MainInput`, `Separator`, `Text` (Radix + Tailwind + CVA), plus framework-agnostic pieces usable by either app: `Overlay` (modal/drawer backdrop, `variants: "normal" \| "modal" \| "tinted"`), `JsonLd` (structured-data `<script>` tag), `LinksList` (footer link item, `LinkComponent` + `variant: "separate" \| "combined"` props) |
| `packages/utils` | Pure, framework-agnostic functions: `text-format` (`capitalizeFirst`, `capitalizeWords`, `toUpper`, `toLower`), `text-limit` (`limitChars`, `limitWords`), `build-metadata` (shared Next.js `Metadata` object builder), `highlight-text` |
| `packages/validation` | Shared Zod schemas: `common/phone`, `common/otp`, `common/pagination`, `features/auth/login`, `features/auth/otp-verify` |

### The `createPersistedStore` SSR-hydration pattern

Zustand's `persist` middleware reads `localStorage` synchronously during store initialization. On the server that's a no-op (no `window`), so SSR always renders default state — but the same module evaluation on the client *does* have `window` and runs before React's hydration pass, so the first client render can already diverge from what the server sent, which React reports as a hydration mismatch and tears down the tree to recover.

`createPersistedStore` always forces `skipHydration: true` to prevent that automatic read. The actual localStorage read then happens explicitly, once, via `useHydrateStore(useYourStore)` called from inside a mounted client component (typically the app's root theme/providers component) — by the time that `useEffect` runs, hydration has already completed, so there's no mismatch window. **Don't bypass this** by passing your own `skipHydration: false` or reading storage another way in the initializer — that reintroduces the exact bug this factory exists to prevent.

### The MUI-vs-Tailwind split

`apps/blog`'s own components (buttons, cards, badges, modals with MUI-specific styling) are built on **`@mui/joy` + `@emotion`**. `apps/landing` and `packages/ui`/`packages/auth` are built on **Radix + Tailwind v4 + CVA** — landing has zero MUI dependency (`apps/landing/src/components/global/ThemeProvider.tsx` is literally `// MUI Joy removed — passthrough`).

**A "Button" or "Card" in blog and one in landing share a name and a role, not implementation.** Before proposing to extract or merge any UI component between the two apps, check which foundation blog's version is built on — if it imports from `@mui/joy`, it is not portable to `@clearcut/ui` without a full rewrite of that component (a large, separate initiative requiring a product decision, not a quick refactor). Components that genuinely have no MUI dependency on either side (`Overlay`, `JsonLd`, `LinksList`) are the ones actually worth sharing, and are already in `packages/ui`.

### Tailwind v4 `@source` requirement

Any shared package whose components emit Tailwind utility classes (especially arbitrary-value classes like `text-[var(--color-brand)]` or `z-[var(--z-modal)]`) must be added to **both** apps' `globals.css` via `@source "../../../../packages/X/src/**/*.{ts,tsx}";` — Tailwind v4 only scans each app's own tree by default, and a missing `@source` line means those classes silently fail to generate (no build error, just missing styles). `packages/ui`, `packages/auth`, and `packages/utils` are already wired in; add any new Tailwind-emitting package to the same list in both `apps/blog/src/app/globals.css` and `apps/landing/src/styles/globals.css`.

### Design tokens: z-index and shadows

`packages/design-tokens/tokens.css` documents the *existing* stacking system rather than inventing a new one — every `--z-*` value is the exact number that was already in use at its call site when the token was introduced. Where the two apps genuinely used different numbers for a similar-sounding role (e.g. `--z-sticky-header` for blog's header vs. `--z-header-elevated` for landing's), they were kept as **separate tokens**, not merged — collapsing them would silently change one app's real stacking behavior. Don't merge z-index/shadow tokens across apps without direct evidence both sides are meant to be identical.

## Shared `tsconfig`

`tsconfig.base.json` at the repo root holds the options identical across every app/package (`target`, `module`, `moduleResolution`, `strict`, `esModuleInterop`, `skipLibCheck`, `isolatedModules`, `noEmit`). Every `apps/*/tsconfig.json` and `packages/*/tsconfig.json` does `"extends": "../../tsconfig.base.json"` and only overrides genuine per-file differences (`lib`, `allowJs`, `jsx`, `paths`, the `next` plugin, `types`). When adding a new package, extend the base rather than copying the full option list.

## Testing

Vitest, per-package (`vitest.config.ts` + `"test": "vitest run"` script) — not a single root test runner. Currently only `packages/utils` and `packages/state` have real tests; most packages and both apps have none yet. `pnpm test` (via `turbo run test`) runs whichever packages define the script and skips the rest — this is expected, not a misconfiguration.

## CI

`.github/workflows/ci.yml` runs lint → typecheck → test → build on every push/PR to `main`. `apps/landing`'s build step needs a `CMS_URL` repository secret pointing at a reachable Payload CMS instance.

**Known pre-existing gaps CI will surface, not cause:** `apps/blog` has ~39 pre-existing TypeScript errors and `apps/landing` has ~30 pre-existing ESLint errors (plus warnings) that were never checked before CI existed (no `typecheck` script existed anywhere in the repo until it was added alongside CI). A red lint/typecheck check on an unrelated PR is very likely this backlog, not a regression — confirm by checking whether the failing file was touched by that PR before assuming it's new.

## Error tracking

`@sentry/nextjs` is scaffolded in both apps (`instrumentation.ts`, `instrumentation-client.ts`, `next.config.ts` wrapped in `withSentryConfig`) but **inert** — `NEXT_PUBLIC_SENTRY_DSN` is empty in both `.env.example` files, and the SDK safely no-ops with no DSN configured. To activate: set a real DSN (and `SENTRY_ORG`/`SENTRY_PROJECT`/`SENTRY_AUTH_TOKEN` for CI source-map upload) in each app's `.env`. Note: `@sentry/nextjs`'s installed version declares peer support for Next 13–15, not Next 16 (which both apps run) — it builds and typechecks clean regardless, but re-verify after any Sentry version bump.

## Key Backend / External Paths (not in this repo)

- **Laravel backend** (exam content, auth): reachable via `NEXT_PUBLIC_API_URL`/`BACKEND_URL`/`API_URL` env vars in each app.
- **Payload CMS** (landing's marketing content): reachable via `CMS_URL` in `apps/landing`.

## Known open issues (flagged, not fixed — need a product/design decision, not a quick patch)

- `--color-brand-dark` conflict: `#0053a2` in `packages/design-tokens/tokens.css` vs. `#006bd1` in blog's local override and a hardcoded value inside the shared auth modal. Needs a decision on which is correct before unifying.
- `apps/blog/src/components/feature/language-modal.tsx`: the "Select App Language" section's selected-state styling checks `locale` (the route locale) instead of `appLanguage` (the store value) — a pre-existing bug, unrelated to any migration work, not yet fixed.
- The MUI-vs-Tailwind split (above) blocks further Button/Card/Badge/Input consolidation between the two apps until there's a product decision on whether blog ever migrates off MUI Joy.

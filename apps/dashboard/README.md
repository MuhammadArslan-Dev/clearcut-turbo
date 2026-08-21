# dashboard

ClearCutOff's logged-in product — preparation flows, test series, exams and exam reports, downloadable content, payments, referrals, onboarding, and profile. Next.js 16 (App Router), Tailwind CSS v4, i18n via `next-intl`, Amplitude for product analytics, Sentry for error tracking.

Part of the `clearcut-master` monorepo — see the [root README](../../README.md) for the overall layout and shared packages.

## Getting started

From the **repo root** (this app is a pnpm workspace member, not standalone):

```bash
pnpm install
cp apps/dashboard/.env.example apps/dashboard/.env   # fill in real values
pnpm --filter dashboard dev
```

Or from inside `apps/dashboard`:

```bash
npm run dev
```

No port is pinned, so Next takes the first free one starting at 3000 — check the dev server's own output for the URL, especially when running several apps in parallel.

## Scripts

| Command | Does |
|---|---|
| `npm run dev` | Start the dev server (note: unlike blog/landing, this app's `dev` does not pass `--turbopack`, though its `build` does) |
| `npm run build` | Production build (Turbopack) |
| `npm run start` | Serve a production build |
| `npm run lint` | ESLint |
| `npm run typecheck` | `tsc --noEmit` |

`next.config.ts` sets `typescript.ignoreBuildErrors: true`, so **`npm run build` succeeds even with type errors** — run `npm run typecheck` to actually verify types.

## Environment

See `.env.example` for the annotated list. The ones most likely to bite:

- **Backend base URLs must include the trailing `/api`** — the API clients concatenate paths directly (`${BASE}/v1/auth-user`).
- `NEXT_PUBLIC_LARAVEL_MAIN_BACKEND` is the single canonical backend base URL, used by both client code (`lib/api/client.ts`, `lib/api/apiClient.ts`) and server code (route handlers, `lib/server-fetch.ts`) — Next.js exposes `NEXT_PUBLIC_` vars in both contexts, so one var covers both. It used to be split across five differently-named vars; consolidated in August 2026. Several server-side reads use a non-null assertion and no fallback, so leaving it unset means `app/api/auth/login/route.ts` silently fetches `undefined/auth/login`.
- `NEXT_PUBLIC_AMPLITUDE_ENABLED` must be exactly `"true"` to emit events, so local runs don't pollute product analytics.
- `NEXT_PUBLIC_SENTRY_DSN` empty is a clean no-op (init is `enabled: Boolean(DSN)`).

## How this app differs from blog and landing

This app is a **partial consumer** of the shared packages. It uses `@clearcut/ui`, `@clearcut/utils`, `@clearcut/i18n`, `@clearcut/react-query`, and `@clearcut/design-tokens` — and deliberately keeps its own implementation of everything else:

| Concern | Where it lives here | Shared equivalent it does *not* use |
|---|---|---|
| Auth | `src/providers/AuthProvider.tsx`, `src/lib/auth-token-client.ts` — token in both localStorage and an `auth_token` cookie (so `proxy.ts` and server components can read it), plus a 5-minute user cache | `@clearcut/auth` |
| HTTP | `src/lib/api/client.ts` — `apiFetch` over native fetch with retry, a typed `ApiError`, and Sentry breadcrumbs per request | `@clearcut/api` |
| State | plain Zustand stores in `src/store/` and per-feature `store/` folders | `@clearcut/state` |
| Analytics | `src/lib/analytics/` — Amplitude, browser (`browser.ts`) + server (`server.ts`) | `@clearcut/analytics` (GTM) |

The auth flows are **not** equivalent — this app receives a token handed off from the marketing site via a `?token=` query param rather than running an in-app login modal — so don't repoint it at `@clearcut/auth` as a cleanup.

## Structure

`src/components/features/<feature>/` is the primary unit of organization — each is self-contained with its own `components/`, `hooks/`, `store/`, `pages/`, and `types/` (`exam`, `preparation`, `onboarding`, `payment`, `test-series`, `downloadable-content`, and others). Shared presentational pieces live in `src/components/ui/`.

Routes under `src/app/[locale]/` use route groups as access tiers: `(auth)`, `(marketing)`, `(public-pages)`, and `(protected)` — the last containing `(dashboard)`, `(exam)`, `(preparation)`, `(onboarding)`, `(payment)`, `(downloadable-content)`. `src/app/api/*` are thin server proxies to Laravel (login, logout, profile, payment-init).

## Things that look wired up but aren't

- `src/middleware/auth.ts` and `src/middleware/i18n.ts` are **dead code** — nothing imports them. The live edge logic is `src/proxy.ts` (Next 16's renamed `middleware.ts`), and it runs the `next-intl` middleware only. The cookie-based auth redirect in `middleware/auth.ts` does not run.
- `src/lib/analytics/ANALYTICS_EVENT_CATALOG.ts` is **not imported anywhere**. It's a flat reference of every event name and payload shape, written as top-level `trackEvent(...)` calls — importing it would fire all of them.
- Several stores have stale duplicate files (`* copy.ts`, `useExamStore copy 2.ts`). The canonical file is the one **without** "copy" in the name. The same applies to stray `page copy.tsx` files under `src/app/[locale]/`.

## i18n

`src/i18n/request.ts` merges a base `messages/{locale}.json` with per-namespace files from `messages/{locale}/`. Adding a namespace file requires adding it to the `load()` list there — dropping a JSON file into `messages/en/` does nothing on its own, and the namespace key doesn't always match the filename (`onboarding.json` → `Onboarding`).

## Other things worth knowing before you edit

- **MathJax** config is an inline `beforeInteractive` script in `src/app/[locale]/layout.tsx` and must stay there.
- Both **React Query** and **SWR** are present in this app; check which one a feature already uses before adding a hook.
- Provider nesting in the locale layout: `AuthProvider` → `SoundProvider` → `NextIntlClientProvider` → `ReactQueryProvider` → `ThemeProvider` → `AnalyticsProvider`.

## Error tracking

All three Sentry runtimes (browser via `src/instrumentation-client.ts`, node via `sentry.server.config.ts`, edge via `sentry.edge.config.ts`) share `src/lib/sentry/sentry-shared.ts` for environment naming, sampling, and the ignore-list of non-actionable noise. **Change shared behavior there, not in the three init files** — keeping them from drifting is the point of that module. `SENTRY_AUTH_TOKEN` is needed only for production/CI builds; without it, production stack traces stay minified.

## Architecture

See the root [`CLAUDE.md`](../../CLAUDE.md) for the full monorepo architecture writeup, and this app's own [`CLAUDE.md`](CLAUDE.md) for deeper per-file detail.

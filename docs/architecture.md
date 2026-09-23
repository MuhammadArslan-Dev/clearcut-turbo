# Architecture

## System context

```
Browser ──► apps/blog       (Cloudflare Worker, OpenNext) ──► Laravel API  (/blog/*, /v1, /v2)
        │                                                └─► Payload CMS (/api/posts, /api/globals/*)
        ├─► apps/dashboard  (Nixpacks/VPS)   ──► Next route handlers (/api/*) ──► Laravel API
        │                                    └─► Laravel API directly (apiFetch)
        ├─► apps/landing                      ──► Laravel API (auth) + Payload CMS (build-time content)
        └─► clearcutoff.in/tools/* ──► Worker clearcut-tools-router ──► Pages project clearcut-tools (static export)
                                                     build time: tools backend (exam specs)
                                                     runtime: Laravel /tools/syllabus/*
```

## Monorepo layout

`pnpm-workspace.yaml` globs `apps/*` and `packages/*`. `turbo.json` defines `build`, `dev`, `lint`, `typecheck`, `test` tasks and lists the env vars that affect build/dev caching. `tsconfig.base.json` is extended by every app/package.

## Shared package consumption

| Package | blog | dashboard | landing | tools |
|---|:-:|:-:|:-:|:-:|
| ui, design-tokens | ✔ | ✔ | ✔ | ✔ |
| i18n, react-query, utils | ✔ | ✔ | ✔ | – |
| analytics, api, assets, auth, hooks, state | ✔ | – | ✔ | – |
| validation | – | – | ✔ | – |

(from each app's `package.json` dependencies). Packages have no build step; apps compile the source directly, so Tailwind v4 needs an `@source` line per package in each app's `globals.css`.

### Key packages
- `auth` — `createAuthFeature(config)` factory; each app calls it once in `src/lib/auth.ts`.
- `api` — `createApiClient` (axios) and `createFetchClient` (native fetch, for Server Components/ISR).
- `state` — `createStore`, `createPersistedStore` (always `skipHydration: true`, hydrate via `useHydrateStore`).
- `i18n` — `routing.ts` (`en`, `hi`, `localePrefix: "as-needed"`) and `navigation.ts`.

## Dashboard is a partial consumer

Dashboard has its own implementations instead of the shared ones:

| Concern | Dashboard implementation |
|---|---|
| Auth | `src/providers/AuthProvider.tsx`, `src/lib/auth-token-client.ts` — token stored in localStorage **and** an `auth_token` cookie; `?token=` query-param handoff from another host |
| HTTP | `src/lib/api/client.ts` (`apiFetch`, `fetchWithRetry`, `ApiError`, Sentry breadcrumbs); `apiClient.ts` for profile calls |
| State | Zustand stores in `src/store/{course,dashboard,modal,onboarding}` and `components/features/exam/store/useExamStore.ts` |
| Analytics | `src/lib/analytics/*` (Amplitude browser + node) |
| Data | TanStack Query (`@clearcut/react-query`) plus `swr` in dependencies |

Dashboard routes: `[locale]/(auth)/sign-in`, `(protected)/{(dashboard),(downloadable-content),(exam),(onboarding),(payment),(preparation),icons}`, `(marketing)`, `(public-pages)/weekly-test`. Edge logic is `src/proxy.ts` (next-intl middleware only, matcher excludes `api`, `_next`, files with dots). `src/middleware/{auth,i18n}.ts` are not imported anywhere.

## Rendering & data-fetching patterns

- **Blog / landing:** Server Components fetch through `createFetchClient` (Next fetch cache + `revalidate`); client interactions use the axios client from `createApiClient`.
- **Landing:** CMS content fetched server-side from Payload (`apps/landing/src/lib/api/cms.ts`, default `http://localhost:3011`); build fails if unreachable.
- **Tools:** static export; resizer exam specs fetched during `generateStaticParams`/metadata (`toolsApi.ts`, retry once, no fallback data); Syllabus Tracker fetches from the browser.

## Authentication

- Blog/landing: shared `AuthModal` (login/OTP/Truecaller) through `@clearcut/auth`.
- Dashboard: bearer token from Laravel; `POST /api/auth/login` route handler sets an HttpOnly `auth_token` cookie (7 days); client code also writes a JS-readable `auth_token` cookie and localStorage (`setAuthToken`). On 401 the client clears local auth and redirects to login (`redirectToLogin`).

## Internationalisation

next-intl in blog, dashboard, landing. Dashboard `src/i18n/request.ts` merges `messages/{locale}.json` with namespace files under `messages/{locale}/`; new namespaces must be added to its `load()` list.

## Styling

Tailwind v4 everywhere. `packages/design-tokens/tokens.css` is the token source, imported first in each app's `globals.css`; dashboard also has `src/styles/tokens.css`. Known conflict: `--color-brand-dark` differs between blog and the other apps.

## Deployment topology

- **Blog:** OpenNext → Cloudflare Worker `clearcut-blog` (`apps/blog/wrangler.jsonc`, `open-next.config.ts`, default in-memory incremental cache). `BACKEND_URL` is read at request time; `NEXT_PUBLIC_*` vars are inlined at build. Workflow is manual (`workflow_dispatch`).
- **Dashboard:** `nixpacks.toml` at repo root, build context must be the repo root.
- **Tools site:** `next build` → `out/` → `wrangler pages deploy out --project-name=clearcut-tools --branch=main` (per `TOOLS_DEPLOY.md`). `NEXT_PUBLIC_LARAVEL_MAIN_BACKEND` and `TOOLS_API_URL` are baked in at build.
- **Tools router Worker:** `apps/tools/worker` (own npm project) proxies `/tools/*`, `/hi/tools/*`, `/mr/tools/*` to Pages; deployed manually or via the manual workflow.
- **Landing:** no deploy config in this repo.

## Known open issues (from `CLAUDE.md`, still visible in code)

`typescript.ignoreBuildErrors: true` in blog and dashboard; stray files under `apps/dashboard/src/app/[locale]` (`page copy.tsx`, `test/`, `sentry-example-page/`) and duplicate store/component files named `... copy N` in dashboard's exam and onboarding features.

# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Overview

Clear Cutoff is an e-learning platform (Next.js frontend) for Indian teaching-exam
preparation (CTET, HTET, UPTET). It is a client-heavy App Router app that talks to a
separate **Laravel backend** for all data, auth, and payments. `package.json` name is
`elearning`.

## Commands

```bash
npm run dev      # Next.js dev server (http://localhost:3000)
npm run build    # Production build (uses --turbopack)
npm run start    # Serve the production build
npm run lint     # ESLint (next/core-web-vitals + next/typescript)
```

There is **no test runner configured** — no test framework, no `test` script.

## Key configuration facts

- **Next.js 16 + React 19.** Note Next 16 renames middleware: the active middleware is
  `src/proxy.ts` (not `middleware.ts`). It only runs the `next-intl` middleware.
  `src/middleware/auth.ts` and `src/middleware/i18n.ts` are standalone helpers, **not**
  wired into `proxy.ts`.
- **`typescript.ignoreBuildErrors: true`** in `next.config.ts` — the build succeeds
  despite type errors, so `npm run build` does **not** catch TS errors. Type problems
  surface only through the editor / `tsc`. (See `tsc-output.txt` for a past dump.)
- Path alias: `@/*` → `src/*`.
- Sentry (`@sentry/nextjs`) wraps the config; org `clear-cutoff`, project
  `clearcutoff-nextjs-app`. Configs in `sentry.*.config.ts` + `src/instrumentation*.ts`.
- Remote images allowlisted in `next.config.ts` (gstatic + the S3 content bucket).
  MathJax `.woff2` assets are handled via a custom webpack rule.

## Backend URL env vars (inconsistent — verify before using)

Multiple env names point at the same Laravel backend across different files; there is no
single canonical accessor. When adding a call, match the existing var in that layer:

- `NEXT_PUBLIC_LARAVEL_MAIN_BACKEND` — client `apiFetch` in `src/lib/api/client.ts` and
  `apiClient.ts` (the main client-side API layer).
- `LARAVEL_API_URL` / `LARAVEL_MAIN_BACKEND` — server-side route handlers under
  `src/app/api/*` and `src/lib/server-fetch.ts`.
- `NEXT_PUBLIC_API_BASE_URL`, `NEXT_PUBLIC_API_URL` — older/other spots.

Only `LARAVEL_API_URL` and `NEXT_PUBLIC_API_BASE_URL` are validated (zod) in
`src/config/env.ts`; the rest are read raw.

## Architecture

### Routing (App Router, i18n)
- Everything user-facing lives under `src/app/[locale]/`. Locales are `en` and `hi`
  (`src/i18n/routing.ts`), with `localePrefix: 'as-needed'` and detection off. Messages
  in `messages/{en,hi}.json`; typed via `messages/en.d.json.ts`.
- Route groups organize access tiers: `(auth)`, `(marketing)`, `(public-pages)`, and
  `(protected)` — under which are `(dashboard)`, `(exam)`, `(preparation)`,
  `(onboarding)`, `(payment)`, `(downloadable-content)`.
- `src/app/api/*` are Next route handlers used as a thin server proxy to Laravel
  (login, logout, profile, payment-init).

### Auth (token-based, Laravel Sanctum style)
- `src/providers/AuthProvider.tsx` is the bootstrap. Flow: a `?token=` query param
  (from the marketing site handoff) is saved via `setAuthToken`, then stripped from the
  URL. It renders instantly from a localStorage user cache, then revalidates via
  `getMeApi`.
- `src/lib/auth-token-client.ts` owns the token: stored in **both** localStorage
  (`auth_token`) and a cookie (so `proxy`/server components can read it), plus a 5-min
  user cache. `src/lib/api/client.ts#apiFetch` auto-attaches `Authorization: Bearer`.
- Consume auth via `useAuth()` from `AuthProvider`.

### Data fetching
- Both **React Query** (`@tanstack/react-query`, provider in `ReactQueryProvider`) and
  **SWR** are present. API call definitions live in `src/lib/api/*` and per-feature
  `hooks/` folders wrap them in query hooks.

### State (Zustand)
- Global stores in `src/store/{course,dashboard,modal,onboarding}/`; feature-local
  stores live inside each feature (e.g. `components/features/exam/store/`).
- Note: several stores have stale duplicate files (`* copy.ts`, `useExamStore copy 2.ts`,
  etc.). The canonical file is the one **without** "copy" in the name — ignore the copies.

### Feature modules
`src/components/features/<feature>/` is the primary unit of organization, each
self-contained with its own `components/`, `hooks/`, `store/`, `pages/`, and `types/`
(e.g. `exam`, `preparation`, `onboarding`, `payment`, `dashboard`,
`downloadable-content`). Shared/presentational pieces live in `src/components/ui/`.

### Analytics
- `src/lib/analytics/` is a typed event system. `ANALYTICS_EVENT_CATALOG.ts` +
  `events/*.ts` define the allowed event names/payloads; `browser.ts` (Amplitude client)
  and `server.ts` (`@amplitude/analytics-node`) are the emitters, wired via
  `AnalyticsProvider`. Amplitude is gated on `NEXT_PUBLIC_AMPLITUDE_ENABLED === 'true'`.
- GTM (`LazyGTM`) and Facebook Pixel are also loaded in the locale layout.

### UI stack
- Tailwind CSS **v4** (`@tailwindcss/postcss`, config in `postcss.config.mjs`, styles in
  `src/styles/`), MUI Joy (`@mui/joy`) + Emotion, `framer-motion` / GSAP for animation,
  `recharts`, `swiper`. Math rendering uses **MathJax** — its config is an inline
  `beforeInteractive` script in `src/app/[locale]/layout.tsx` and must stay there.
- Provider nesting (locale layout): `AuthProvider` → `SoundProvider` →
  `NextIntlClientProvider` → `ReactQueryProvider` → `ThemeProvider` → `AnalyticsProvider`.

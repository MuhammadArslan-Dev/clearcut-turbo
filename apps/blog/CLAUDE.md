# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

"Clear Cutoff" — a public marketing/blog site for teaching-exam prep (CTET, HTET, UPTET). Next.js 16 App Router, React 19, TypeScript. Data comes from an external Laravel backend and a Payload CMS (neither in this repo).

## Commands

```sh
npm run dev      # Dev server (Turbopack) on localhost:3000
npm run build    # Production build (Turbopack)
npm start        # Serve production build
npm run lint     # ESLint (flat config, eslint.config.mjs)
```

There is no test runner configured.

**Important:** `next.config.ts` sets `typescript.ignoreBuildErrors` and `eslint.ignoreDuringBuilds`, so `npm run build` will **not** fail on type or lint errors. Type errors are silently shipped — verify types by running `npx tsc --noEmit` and lint with `npm run lint` explicitly.

## Internationalization (next-intl)

i18n is central to routing. Locales are `en` and `hi` (`defaultLocale: en`, `localePrefix: 'as-needed'` — so `en` URLs have no prefix, `hi` URLs are `/hi/...`).

- Config: `src/i18n/routing.ts` (locales/pathnames), `src/i18n/request.ts` (loads `messages/{locale}.json`), `src/i18n/navigation.ts` (locale-aware `Link`, `redirect`, `useRouter` — use these, not `next/navigation`, for internal links).
- Messages: `messages/en.json`, `messages/hi.json`. `messages/en.d.json.ts` is a generated type declaration (`createMessagesDeclaration` in next.config).
- All pages live under `src/app/[locale]/`. Layouts call `setRequestLocale(locale)` for static rendering; keep that when adding routes.

## Middleware — read carefully

There are **two** middleware files, and only one is active:

- `src/middleware.ts` — **active**. Wraps `createMiddleware(routing)` from next-intl (handles locale routing). Matcher excludes `/api`, `/_next`, `/_vercel`, and files with dots.
- `src/middleware/middleware.ts` — **not wired up / dead code**. A cookie-`role`-based route guard for `/admin`, `/teacher`, `/student`. Next.js only runs a single middleware at `src/middleware.ts`, so this file has no effect. Don't assume admin routes are protected by it.

## Routing structure (route groups)

Under `src/app/[locale]/`:
- `(blog)/` — public site. Its `layout.tsx` renders `CountdownBanner` + `Header` + `BlogFooter`. Dynamic content routes: `[examName]/`, `[examName]/[level_id]/`, `.../subject/[subject_id]/[chapter_name]/`, `.../year/[year_id]/`, `question/[questionId]/`.
- `(admin)/admin/` — admin area.
- SEO routes at `src/app/` root: `sitemap.ts`, `sitemaps/[examName]/route.ts`, `robots.ts`. The sitemap currently restricts to `ALLOWED_EXAMS = ["ctet"]` and fetches exams/levels/years from `BACKEND_URL`.

## Data / API layers

Multiple, overlapping HTTP clients exist — pick the right one:

- `src/lib/api/api.ts` — axios instance with a `localStorage` token → `Authorization: Bearer` request interceptor and a global error response interceptor. Base URL from `BACKEND_URL`. Use for authenticated client-side calls.
- `src/lib/api/api2.ts` — `apiFetch<T>()`, a native `fetch` wrapper with `AbortController` timeout, using `BACKEND_URL`. Use for server-side fetches.
- `src/lib/api/globals.ts` — fetches Payload CMS globals from `NEXT_PUBLIC_PAYLOAD_URL`.
- `src/app/api/axios.ts` — a separate axios instance with a **hardcoded** local Laragon base URL (`http://clearcutoff-main-backend.test/api`). Legacy/local-dev only; prefer the `src/lib/api` clients.

Env vars (see `.env`): `BACKEND_URL` (Laravel API), `NEXT_PUBLIC_PAYLOAD_URL` (Payload CMS), `NEXT_PUBLIC_API_URL`, `NEXT_PUBLIC_SITE_URL` (used by sitemap/SEO base URL).

## Styling — dual system

- **MUI Joy** (`@mui/joy`) is the component library. `MainThemeProvider` (`src/components/providers/main-theme-provider.tsx`) wraps the app in `CssVarsProvider` with `src/themes/joytheme.ts` and also hosts the TanStack `QueryClientProvider`. Emotion is the styling engine (`src/lib/emotion-cache.ts`, `emotion-provider.tsx`).
- **Tailwind CSS v4** (via `@tailwindcss/postcss`, config-less) is used alongside Joy for layout utilities directly in JSX.
- `next-themes` handles light/dark; see the theme providers in `src/components/providers/`.

## State (Zustand)

Stores in `src/store/`:
- `useGlobalDataStore.ts` — holds CMS "global sections" (hero, features, reviews, faqs) hydrated once and read across the marketing pages.
- `useLanguageStore.ts` — **persisted** to `localStorage` (key `language-settings`); tracks `appLanguage` and `courseLanguage` **separately** (content language can differ from UI locale).
- `authModalStore.ts`, `useOfferStore.ts`, `blog/useSelectedDataStore.ts`.

Server state uses TanStack Query (client created in `MainThemeProvider`).

## Analytics

`src/services/analytics.js` — Amplitude wrapper (`initAmplitude`, `setUserId`, event helpers). The API key is currently hardcoded in the file.

## Conventions

- Path alias: `@/*` → `./src/*`.
- Static/mock content lives in `src/data/` (`courseData`, `footerData`, `pagesData`, etc.); types in `src/types/`.
- Backend responses are exam → level → subject → chapter / year hierarchies; route params (`examName`, `level_id`, `subject_id`, `chapter_name`, `year_id`) mirror that shape.

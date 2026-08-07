# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev       # Dev server with Turbopack on http://localhost:3000
npm run build     # Production build (Turbopack)
npm run start     # Serve production build
npm run lint      # ESLint
```

No test suite is configured. This is a Next.js 16 (App Router) + React 19 marketing/landing site for Clear Cutoff (teaching-exam courses).

## Environment Variables

In `.env`:
- `NEXT_PUBLIC_API_URL` — backend API base for client-side auth calls and the axios instance (auth verifies against `${NEXT_PUBLIC_API_URL}/api/v1/me`)
- `API_URL` — server-side API base (used by SSR fetches that are currently commented out, e.g. `/api/blog/exam`)
- `NEXT_PUBLIC_FRONTEND_URL` — post-login redirect target (default `https://app.clearcutoff.in`)
- `NEXT_PUBLIC_AMPLITUDE_API_KEY` — Amplitude analytics key
- `ENVIRONMENT` — set to `"production"` to enable GTM and Facebook Pixel

## Architecture

### i18n: English default, Hindi under `/hi` (no library, fully static)

Locale support is **hand-rolled — no translation library**. English is the default and served WITHOUT a prefix; Hindi is served under `/hi`. The URL is the single source of truth (no cookie/localStorage override), so removing `/hi` and reloading always falls back to English.

- **Routing mechanism** (`src/proxy.ts`, Next 16's renamed `middleware`): rewrites any non-`/hi` path to the internal `/en/...` tree so the browser URL stays clean; passes `/hi/...` through; redirects visible `/en/...` back to the clean path. Matcher excludes `_next`, `api`, and files with extensions.
- **Route tree**: all routes live under `src/app/[locale]/`. `[locale]/layout.tsx` is the root layout (`<html lang={locale}>`, `dynamicParams = false`, `generateStaticParams` → `en` + `hi`). Both locales are pre-rendered (SSG).
- **Dictionaries** (`src/lib/i18n/`): `config.ts` (locales, `isLocale`, `toLocale`), `dictionaries/en.ts` + `hi.ts` (en defines the `Dictionary` type; hi must satisfy it), `index.ts` `getDictionary(locale)`, `navigation.ts` `localizedHref()`.
- **Client access**: `LocaleProvider` (in the root layout) exposes `useLocale()` / `useDictionary()`. `LocaleLink` (`src/components/ui/LocaleLink.tsx`) is a drop-in `next/link` that auto-prefixes `/hi` on Hindi pages — use it for all internal navigation.
- **Two content patterns**: simple shared chrome strings live in the central dictionary (consumed via `useDictionary()` in client components); rich page-section content (headings with `<span>` highlights) is co-located in the section as `CONTENT: Record<Locale, …>` and selected by a `locale` prop. Server sections receive `locale` threaded from the page → `LandingPage` → `SectionRenderer` (which passes `locale` to every section) → nested components.

Content migration is in progress: the landing page sections + global chrome (header/nav/footer/CTAs) are bilingual; course/exam/settings pages still contain hardcoded Hindi to migrate.

### Routes (`src/app/[locale]/`)

| Route | Description |
|---|---|
| `/` (and `/hi`) | Landing page (`LandingPage`) |
| `/teaching/[slug]` | Dynamic course page (`CoursePage`) |
| `/teaching/[slug]/questions` | Questions page for a course |
| `/exam/[slug]` | Static exam marketing pages; `generateStaticParams` pre-renders `htet-2026`, `reet-2026`, `uptet-2026`, `hptet-2026` |
| `/(settingpages)/...` | contact-us, privacy-policy, terms-and-conditions, refund-policy, account-delete |

### Section-driven page rendering

Pages are composed declaratively. Page components (`src/components/pages/`) define an array of `Section` objects (`{ type, ...props }`) and pass them to `SectionRenderer` (`src/components/global/SectionRenderer.tsx`), which resolves each `type` through `sectionRegistry` (`src/lib/sections/registry.ts`) and renders the matching component.

To add a section type: register the component in `sectionRegistry`, then reference its `type` in a page's sections array.

Section types: `homeHero`, `courseHero`, `features`, `testimonials`, `examList`, `howItWorks`, `comparison`, `faqs`, `pricing`, `singlePricing`, `courseLogoCarousal`.

### Course & exam data (currently static)

The backend fetch is commented out — pages run on static snapshots:
- `src/lib/data/courses.ts` — per-course config (slug, navLink, sections layout). Looked up via `getCourse(slug)`.
- `src/lib/data/staticExams.ts` — `STATIC_EXAMS` array (snapshot of `GET /api/blog/exam?status=active`). Looked up via `getExamBySlug(slug)`.

`src/app/teaching/[slug]/page.tsx` builds the page from both. When re-enabling live data, the commented `getLandingData` fetch in that file (and `API_URL`) is the integration point.

### Auth

`AuthContext` (`src/context/AuthContext.tsx`, provided in the root layout) reads `CSRF_TOKEN` from localStorage on mount, verifies it against `${NEXT_PUBLIC_API_URL}/api/v1/me` (8s timeout), and on success redirects to `${NEXT_PUBLIC_FRONTEND_URL}/dashboard?token=...`. Auth modals (`AuthModals`) are rendered globally in the root layout. Auth API calls go through `src/api/fetch-data/authApi.ts` and the axios instance in `src/api/fetch-data/axios.ts`.

### State & forms

- **Zustand** — auth modal open/close state (`src/components/features/auth/store/authModalStore.ts`)
- **TanStack Query** — server state in client components
- **React Hook Form + Zod** — form validation

### SEO

Metadata is generated via `generateSeoMetadata` (`src/lib/seo/metadata.ts`); structured data via the `JsonLd` component. Each route exports `generateMetadata`. Root metadata, OpenGraph, robots (`src/app/robots.ts`), and sitemap (`src/app/sitemap.ts`) are defined at the app root.

### Styling & animation

Tailwind CSS v4 via PostCSS (`@tailwindcss/postcss`); global styles in `src/styles/globals.css`. Font is Noto Sans (`next/font`). Framer Motion handles animation; reusable variants live in `src/lib/animations.ts` and `src/lib/animations-premium.ts`.

### Analytics & third parties

- **Amplitude** — `AnalyticsLoader` in the root layout
- **GTM** — `LazyGTM`, only when `ENVIRONMENT === "production"`
- **Facebook Pixel** — `FacebookPixel` in the root layout inside a `Suspense` boundary, gated on production

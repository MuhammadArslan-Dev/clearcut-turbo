# Requirements

No product-requirements document exists in this repo. This file records the requirements **as implemented**, inferred from routes, API modules and configuration. Treat it as a description of current behaviour, not an agreed spec.

## Functional (by app)

### Blog (`apps/blog`)
- Browse exam question banks by exam, year and section (backend `/blog/exam`, `/blog/get-years`, `/blog/get-sections`, `/blog/get-questions`, `/blog/get-questions-by-section`).
- Render CMS blog posts and exam-related posts from Payload (`/api/posts`), plus CMS globals (`global-sections`).
- Log in / register via OTP and Truecaller (`/v1/auth/*`, `/v2/auth/varify-otp`) and enrol by exam name (`/v2/enrollment/create-by-name`).
- Language switching (`useLanguageStore`), sitemap and robots generation (`sitemap.ts`, `sitemaps/`, `robots.ts`).
- An admin route group exists (`(admin)/admin`); its behaviour was not analysed.

### Dashboard (`apps/dashboard`)
- Sign-in (`(auth)/sign-in`), onboarding (exam/level/language selection, `(onboarding)`), course selection and switching.
- Preparation content: sections, chapters, PYQs, instances, notes, mini tests (`/v2/preparation/*`, `/v2/content/get-notes`, `/v2/mini-test/get`).
- Exam attempts: create, answer, clear answer, mark for review, heartbeat, autosave, proctor, submit/end, attempts list (`/v2/exam/*`, and `/exam/{id}/submit|proctor|autosave`). Single-tab enforcement hook (`useSingleTab`).
- Practice tests and sectional/full-length test lists (`/v2/practice-test`, `/v2/test/*`).
- Progress: interactions, resume state, learning progress, streak (`/v2/interactions/*`, `/v2/streak*`).
- Payments and subscriptions: pricing, create, verify, checkout-initiated, subscription create/pause/resume/cancel (`/v2/payment/*`, `/v2/subscription*`); Facebook Pixel events fired alongside internal records.
- Profile view/update and account deletion (`/v2/profile`, `/v1/delete-account`).
- Product analytics via Amplitude; errors via Sentry.

### Landing (`apps/landing`)
- Public exam pages (`exam/[slug]`), comparison and alternatives pages driven by Payload CMS, FAQ, start/onboarding flow with the shared auth modal, legal pages, image-resize page.

### Tools (`apps/tools`)
- Photo/signature resizer and compressors per exam, with exam specs fetched **at build time** from the tools backend (`toolsApi.ts`); a failed fetch fails the build by design.
- Age eligibility calculator.
- Syllabus Tracker: exam → level → subjects → chapter check-offs; syllabus data fetched at runtime from public Laravel endpoints, tracking state kept in the browser (`SYLLABUS_TRACKER_PLAN.md`).

## Non-functional (evidenced in code/config)

- **i18n:** locales `en` (default, unprefixed) and `hi` (`/hi`); `localeDetection: false` (`packages/i18n/routing.ts`). `apps/tools` has separate `hi`/`mr` route folders instead of next-intl.
- **SEO:** sitemaps/robots in blog, landing, tools; `buildMetadata` and `JsonLd` shared helpers. Tools Pages deployment sets `X-Robots-Tag: noindex` on the raw `pages.dev` URL and the Worker strips it on proxied responses.
- **Performance:** ISR/`revalidate` via `createFetchClient` (blog posts 60 s); analytics loaded lazily on first interaction.
- **Design consistency:** hardcoded colours are gated against a per-package baseline in CI.
- **Observability:** Sentry in dashboard (active when DSN set; scaffolded but inert in blog/landing), Amplitude, GTM, Facebook Pixel, Clarity env vars.
- **Resilience:** dashboard `apiFetch` retries via `fetchWithRetry` and attaches Sentry breadcrumbs.
- **Runtime:** Node 22, pnpm 10.33, React 19, Next 16.

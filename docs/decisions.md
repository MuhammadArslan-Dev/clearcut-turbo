# Decisions

Architectural decisions that are visible in the code, config, or existing docs (`CLAUDE.md`, `TOOLS_DEPLOY.md`, code comments). Dates are given only where a source states them. No decision log existed before this file.

## D1. Monorepo with shared source packages
Turborepo + pnpm workspace; packages are consumed as TypeScript source through `exports` maps, with no build step and no barrel files. *Why (per README/CLAUDE.md):* stop maintaining parallel copies of auth, API clients, state, tokens, analytics, UI.

## D2. Tailwind v4 everywhere; MUI Joy removed
`@mui/joy` no longer appears in any `package.json`; `chip`, `breadcrumbs`, `select`, `skeleton`, `link` in `packages/ui` replaced it. Emotion is still a dependency of blog and dashboard. Consequence: every app must `@source` each shared package it uses.

## D3. Central design tokens with a colour guard
`packages/design-tokens/tokens.css` is canonical; CI blocks *new* hardcoded colours against `scripts/hardcoded-colors-baseline.json` rather than demanding zero. z-index/shadow tokens were deliberately **not** merged across apps where the apps used different values.

## D4. Dashboard stays a partial consumer
Dashboard keeps its own auth, HTTP client, stores and analytics. *Why:* its auth is a token handoff from another host (with the token in both localStorage and a cookie), not an in-app modal login, so the shared `@clearcut/auth` is not equivalent.

## D5. Two HTTP clients (axios and fetch)
`createFetchClient` exists because Next's fetch cache and `revalidate` only work with native `fetch`; `createApiClient` (axios) is for authenticated client-side calls.

## D6. `createPersistedStore` forces `skipHydration: true`
Avoids client/server hydration mismatches from Zustand reading localStorage during module evaluation. Hydrate explicitly with `useHydrateStore` from a mounted component.

## D7. i18n: `en` unprefixed, `hi` prefixed, no auto-detection
`localePrefix: "as-needed"`, `localeDetection: false` in `packages/i18n/routing.ts`. Dashboard merges per-namespace message files in `src/i18n/request.ts`. `apps/tools` deliberately has no next-intl.

## D8. Analytics through one provider
`AnalyticsProvider` in `packages/analytics` gates each tracker itself via `isAnalyticsEnabled`, so apps must not add their own production guards. Dashboard uses Amplitude instead, gated on `NEXT_PUBLIC_AMPLITUDE_ENABLED === "true"`.

## D9. Sentry config centralised in dashboard
`src/lib/sentry/sentry-shared.ts` holds environment naming, sample rate and the ignore list for the browser, node and edge runtimes. `enabled: Boolean(DSN)` makes an empty DSN a no-op.

## D10. Tools is a static export outside the shared stack
`apps/tools` uses `output: "export"`, no next-intl, no auth, no CMS. Exam specs are fetched at build time with **no stale-data fallback**, so an unreachable backend fails the build rather than shipping wrong photo/signature specs (comment in `toolsApi.ts`). The Syllabus Tracker is the one runtime backend call, and its state stays in the browser.
*Correction to older docs:* `CLAUDE.md` says tools makes "no backend calls"; the code makes both build-time and runtime calls, as described above.

## D11. Tools fronted by a Cloudflare Worker at `/tools/*`
The Worker proxies to the Pages project, strips the path prefix (because `basePath` only prefixes emitted links, not the export layout), and deletes `X-Robots-Tag: noindex`, which Pages sets so the raw `pages.dev` URL is not indexed.

## D12. Blog deploys as a Cloudflare Worker via OpenNext
Evidence: `apps/blog/wrangler.jsonc`, `open-next.config.ts`, `deploy-blog-cloudflare.yml`. Comments record that `academy.clearcutoff.in` was cut over from Vercel, that Cloudflare Git integration wasn't usable (requires Administrator role), so a manual `workflow_dispatch` with a scoped API token is used, and that the in-memory ISR cache is a known trade-off (R2 cache is a possible upgrade).
*Correction:* `CLAUDE.md` still says only dashboard has deploy config and blog stays on the VPS.

## D13. Dashboard deploy with Nixpacks
Build context is the repo root; builds `--filter=dashboard` so landing's CMS dependency doesn't break it; Node 22 and `corepack enable` follow the `packageManager` pin.

## D14. Deploy workflows are manual
Both Cloudflare workflows are `workflow_dispatch` only, with a comment about adding push triggers later.

## Open questions / inconsistencies found while writing these docs

1. **Tools Pages deploy:** `TOOLS_DEPLOY.md` says the Pages project has *no Git connection* and only updates via `wrangler pages deploy`. The comment in `deploy-tools-worker-cloudflare.yml` says the site *auto-deploys via Pages Git integration*. These conflict; verify in the Cloudflare dashboard.
2. **`/api/payment-init`** posts to an n8n URL containing `webhook-test`.
3. **Hardcoded hosts:** `https://apptest.clearcutoff.in/api/...` in dashboard `onboarding.ts` and as the tools syllabus fallback.
4. **Dead/leftover code:** `/api/auth/logout` is fully commented out; `src/middleware/{auth,i18n}.ts` in dashboard are unused; `... copy N` files exist under dashboard exam/onboarding features.
5. `typescript.ignoreBuildErrors: true` in blog and dashboard hides type errors from `next build`; only `pnpm typecheck` checks types.
6. `AGENTS.md` is an outdated copy of `CLAUDE.md`.

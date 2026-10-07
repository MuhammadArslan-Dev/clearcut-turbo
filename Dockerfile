# Production image for apps/landing, built for the GHCR → Coolify migration
# (clearcut-turbo, Coolify app uuid l84c8cwc8og4gkswkgksoo80 — see
# docs/DEVELOPMENT_RULES.md and the GHCR migration audit for the full plan).
#
# Build context MUST be the repository root (same requirement as the existing
# nixpacks.toml): `turbo prune` needs pnpm-workspace.yaml, turbo.json and the
# root package.json, none of which are inside apps/landing.
#
#   docker build -f Dockerfile -t clearcut-turbo .
#
# This Dockerfile builds ONLY apps/landing. It does not touch, build, or run
# apps/blog, apps/dashboard or apps/tools, and it has no effect on the
# existing Nixpacks-based Coolify deployment — that deployment reads this
# repo's git history directly and never looks at this file.

FROM node:22-alpine AS base
RUN apk add --no-cache libc6-compat

# ---------------------------------------------------------------------------
# prepare: prune the monorepo down to what apps/landing actually depends on
# (its own files plus the @clearcut/* workspace packages it imports, per
# their package.json — turbo resolves this graph itself, nothing hardcoded
# here). turbo must be installed globally in this stage because pruning is
# what produces the installable subset in the first place — there is no
# pnpm install to run turbo "properly" yet.
# ---------------------------------------------------------------------------
FROM base AS prepare
WORKDIR /app
# Pinned to the exact version pnpm-lock.yaml resolves turbo to (see the root
# package.json's "^2.5.0" devDependency) — an unpinned `turbo prune` here
# could use a newer major than the one the lockfile/turbo.json were written
# against.
RUN npm install -g turbo@2.10.5
COPY . .
RUN turbo prune landing --docker
# turbo prune only copies files that belong to an included workspace's own
# file set (per its package.json); tsconfig.base.json lives at the repo root
# and isn't part of any workspace, but every app's tsconfig.json —
# apps/landing's included — does `"extends": "../../tsconfig.base.json"`.
# Confirmed by an actual local build: Turbopack fails with "extends:
# '../../tsconfig.base.json' doesn't resolve correctly" without this.
RUN cp tsconfig.base.json out/full/tsconfig.base.json

# ---------------------------------------------------------------------------
# installer: install dependencies from the pruned, minimal lockfile+manifests
# only (out/json) — a separate layer from the full source copy below so that
# `pnpm install` is only re-run when a dependency actually changes, not on
# every source edit.
# ---------------------------------------------------------------------------
FROM base AS installer
WORKDIR /app
# Same reasoning as nixpacks.toml: `corepack enable` alone installs exactly
# the pnpm version pinned by "packageManager" in the root package.json
# (pnpm@10.33.0) — do not replace with an explicit version here.
RUN corepack enable
COPY --from=prepare /app/out/json/ .
RUN pnpm install --frozen-lockfile

# ---------------------------------------------------------------------------
# builder: full pruned source + installed deps, then the actual Next.js build
# ---------------------------------------------------------------------------
FROM base AS builder
WORKDIR /app
RUN corepack enable
COPY --from=installer /app/node_modules ./node_modules
COPY --from=prepare /app/out/full/ .
COPY --from=installer /app/pnpm-lock.yaml ./

# Build-time NEXT_PUBLIC_* values: Next.js inlines these into the client
# bundle at build time, so they must be present here, not only at runtime.
# They are not secrets — all four are already shipped to every browser today
# (pixel/GTM/Amplitude ids, the public frontend URL) — see the GHCR audit's
# "required secrets" table.
ARG NEXT_PUBLIC_API_URL
ARG NEXT_PUBLIC_FRONTEND_URL
ARG NEXT_PUBLIC_FACEBOOK_PIXEL_ID
ARG NEXT_PUBLIC_GTM_ID
ARG NEXT_PUBLIC_AMPLITUDE_API_KEY
ARG CMS_URL
ARG ENVIRONMENT
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL \
    NEXT_PUBLIC_FRONTEND_URL=$NEXT_PUBLIC_FRONTEND_URL \
    NEXT_PUBLIC_FACEBOOK_PIXEL_ID=$NEXT_PUBLIC_FACEBOOK_PIXEL_ID \
    NEXT_PUBLIC_GTM_ID=$NEXT_PUBLIC_GTM_ID \
    NEXT_PUBLIC_AMPLITUDE_API_KEY=$NEXT_PUBLIC_AMPLITUDE_API_KEY \
    CMS_URL=$CMS_URL \
    ENVIRONMENT=$ENVIRONMENT \
    NEXT_TELEMETRY_DISABLED=1

# SENTRY_AUTH_TOKEN is a real secret (it can upload/modify source maps on the
# Sentry org) and must NEVER be an ARG or ENV — both land permanently in
# `docker history`/image layers even if unset afterwards. BuildKit's secret
# mount makes it available to this RUN only, as a file, never written to a
# layer. next.config.ts reads it from process.env, so it's exported into the
# shell right before the build command and nowhere else.
# If the secret isn't provided (e.g. a local test build), withSentryConfig's
# authToken is undefined and the Sentry webpack plugin skips the sourcemap
# upload with a warning instead of failing the build — verified in Phase 2.
RUN --mount=type=secret,id=sentry_auth_token \
    sh -c '\
      if [ -f /run/secrets/sentry_auth_token ]; then \
        export SENTRY_AUTH_TOKEN="$(cat /run/secrets/sentry_auth_token)"; \
      fi; \
      pnpm exec turbo run build --filter=landing \
    '

# ---------------------------------------------------------------------------
# runner: non-root, standalone output only — no source, no full node_modules
# ---------------------------------------------------------------------------
FROM base AS runner
WORKDIR /app

RUN addgroup --system --gid 1001 nodejs \
 && adduser --system --uid 1001 nextjs
USER nextjs

COPY --from=builder --chown=nextjs:nodejs /app/apps/landing/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/apps/landing/.next/static ./apps/landing/.next/static
COPY --from=builder --chown=nextjs:nodejs /app/apps/landing/public ./apps/landing/public

ENV NODE_ENV=production \
    PORT=3000 \
    NEXT_TELEMETRY_DISABLED=1
EXPOSE 3000

# `next start` is NOT used here — standalone output ships its own minimal
# server.js (no next.config.ts re-parse, no full next CLI needed at runtime).
CMD ["node", "apps/landing/server.js"]

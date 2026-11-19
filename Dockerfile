# Dockerfile build for apps/landing (Coolify "Dockerfile" build pack).
#
# Why this exists: the Nixpacks build runs `sudo apt-get update && apt-get install curl wget` on the
# Ubuntu mirrors, and the Coolify server cannot reach them reliably (the build times out, 2026-11-19).
# This file uses the official node image (Docker Hub) and never calls apt.
#
# Build context = repo root (the @clearcut/* workspace packages and pnpm-lock.yaml live outside apps/landing).
# NEXT_PUBLIC_* values are inlined by `next build`, so they must be build args here (Coolify passes the
# application's build-time variables as --build-arg). Runtime variables are given to the container by Coolify.
FROM node:22-bookworm-slim

ENV COREPACK_ENABLE_DOWNLOAD_PROMPT=0 \
    COREPACK_INTEGRITY_KEYS=0 \
    NEXT_TELEMETRY_DISABLED=1

WORKDIR /app

# Installs exactly the pnpm version pinned by `packageManager` in the root package.json.
RUN corepack enable

COPY . .
RUN pnpm install --frozen-lockfile

ARG API_URL
ARG CMS_URL
ARG ENVIRONMENT
ARG GROWTHBOOK_WEBHOOK_SECRET
ARG NEXT_PUBLIC_AMPLITUDE_API_KEY
ARG NEXT_PUBLIC_API_URL
ARG NEXT_PUBLIC_ENABLE_GROWTHBOOK_TEST
ARG NEXT_PUBLIC_FACEBOOK_PIXEL_ID
ARG NEXT_PUBLIC_FRONTEND_URL
ARG NEXT_PUBLIC_GROWTHBOOK_API_HOST
ARG NEXT_PUBLIC_GROWTHBOOK_CLIENT_KEY
ARG NEXT_PUBLIC_GTM_ID
ARG REVALIDATE_SECRET

# The GrowthBook CLIENT key and host are public (the key is part of the public CDN URL, the dashboard bundle already ships it).
# next build only inlines NEXT_PUBLIC_* values that exist at build time; the landing app's Coolify value did not reach the build
# (a missing/empty variable is not passed as a build arg), so experiments stayed off. `:-` also covers an EMPTY value.
# Coolify can still override both by setting a real value.
# Same build command as the Coolify app settings. landing fetches the CMS at build time (CMS_URL).
RUN export NEXT_PUBLIC_GROWTHBOOK_CLIENT_KEY="${NEXT_PUBLIC_GROWTHBOOK_CLIENT_KEY:-sdk-dIndvZ1qzJJOPrh0}" \
    NEXT_PUBLIC_GROWTHBOOK_API_HOST="${NEXT_PUBLIC_GROWTHBOOK_API_HOST:-https://cdn.growthbook.io}" \
 && pnpm exec turbo run build --filter=landing

EXPOSE 3000
ENV PORT=3000
CMD ["pnpm", "--filter", "landing", "start"]

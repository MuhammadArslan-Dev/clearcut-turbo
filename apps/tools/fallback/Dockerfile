# Fallback origin for clearcutoff.in/tools/* (+ /hi/tools, /mr/tools), used if the
# Cloudflare Worker's free request limit is hit. Same pages and URL shapes as
# Cloudflare Pages + clearcut-tools-router, served by nginx. See TOOLS_DEPLOY.md.
#
# Coolify: build pack Dockerfile, base directory "/", Dockerfile location
# "/apps/tools/fallback/Dockerfile", exposed port 80.
FROM node:22-bookworm-slim AS build
ENV COREPACK_ENABLE_DOWNLOAD_PROMPT=0 NEXT_TELEMETRY_DISABLED=1
RUN corepack enable
WORKDIR /src
COPY . .
RUN pnpm install --frozen-lockfile --filter tools...

WORKDIR /src/apps/tools
# Baked into the static export (same values as the Pages deploy). Assets stay on
# the same origin (/tools/_next/static) so this image has no Pages dependency.
ENV NODE_ENV=production \
    NODE_OPTIONS=--max-old-space-size=4096 \
    TOOLS_API_URL=https://tools-api.clearcutoff.in/api/v1 \
    NEXT_PUBLIC_LARAVEL_MAIN_BACKEND=https://apptest.clearcutoff.in/api \
    TOOLS_ASSET_PREFIX=
RUN pnpm build
# Fail the build rather than ship a wrong host (TOOLS_DEPLOY.md checks).
RUN test -f out/resizer.html \
 && grep -rq "apptest.clearcutoff.in" out/_next/static/chunks \
 && ! grep -rq "clearcutoff-main-backend.test" out/_next/static/chunks \
 && ! grep -q "clearcut-tools.pages.dev" out/resizer.html
RUN node fallback/extract-index.mjs worker/src/index.ts /tmp/tools-index.html

FROM nginx:1.27-alpine
RUN rm -f /etc/nginx/conf.d/default.conf
COPY --from=build /src/apps/tools/out /srv/out
COPY --from=build /tmp/tools-index.html /srv/tools-index.html
RUN mkdir -p /site/hi /site/mr \
 && ln -s /srv/out /site/tools \
 && ln -s /srv/out/hi /site/hi/tools \
 && ln -s /srv/out/mr /site/mr/tools
COPY --from=build /src/apps/tools/fallback/nginx.conf /etc/nginx/conf.d/tools.conf
RUN nginx -t
EXPOSE 80

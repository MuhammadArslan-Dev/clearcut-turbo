import path from "node:path";
import { NextConfig } from "next";
import withBundleAnalyzer from "@next/bundle-analyzer";
import createNextIntlPlugin from "next-intl/plugin";
import { withSentryConfig } from "@sentry/nextjs";

const bundleAnalyzer = withBundleAnalyzer({
  enabled: process.env.ANALYZE === "true",
});

const withNextIntl = createNextIntlPlugin({
  experimental: {
    createMessagesDeclaration: "./messages/en.json",
  },
});

const config: NextConfig = {
  compress: true,
  reactStrictMode: true,

  // Only this app opts into standalone output — it's what the GHCR Docker
  // image (repo-root Dockerfile) copies into the runtime stage. Nixpacks
  // ignores this field entirely (it runs `next start` against the full
  // build), so the existing Coolify deployment is unaffected by this change.
  // See Dockerfile / docs/DEVELOPMENT_RULES.md for the migration this is part of.
  output: "standalone",

  // Pins the monorepo root explicitly instead of Next's own lockfile-sniffing
  // heuristic. Confirmed necessary by an actual build: run from inside a
  // nested copy (e.g. a `turbo prune` output sitting under the real repo,
  // which is how this was validated locally without Docker), Next picks the
  // OUTER repo as the root — "Next.js inferred your workspace root, but it
  // may not be correct... detected multiple lockfiles" — which puts the
  // standalone server at the wrong relative path
  // (.next/standalone/<nested-path>/apps/landing/server.js instead of
  // .next/standalone/apps/landing/server.js), breaking the Dockerfile's
  // fixed COPY paths. Docker's isolated /app filesystem doesn't nest like
  // that, but pinning this removes the ambiguity (and the build warning)
  // unconditionally rather than relying on there being no sibling lockfile.
  turbopack: {
    root: path.join(__dirname, "../.."),
  },

  experimental: {
    optimizeCss: true,
    inlineCss: true, // inline critical CSS — trades stylesheet caching for faster first paint, worth it on a marketing page
    optimizePackageImports: ["lucide-react", "framer-motion"],
  },

  images: {
    formats: ["image/avif", "image/webp"],
    minimumCacheTTL: 2678400,
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
      {
        protocol: "https",
        hostname:
          "cc-teaching-content-ind.s3.dualstack.ap-south-1.amazonaws.com",
      },
      {
        protocol: "https",
        hostname: "payloadcms.clearcutoff.in",
      },
      {
        protocol: "http",
        hostname: "localhost",
        port: "3011",
        pathname: "/**",
      },
    ],
  },

  async headers() {
    return [
      {
        // /public assets are served with no explicit Cache-Control, so browsers
        // revalidate them constantly — Lighthouse flagged ~201 KiB under
        // "efficient cache lifetimes". `_next/static` is already immutable
        // (hashed filenames); these are not hashed, so `immutable` would trap a
        // stale logo forever. A week plus stale-while-revalidate gets nearly all
        // the benefit while still letting an updated asset propagate.
        source: "/:path*.(webp|png|jpg|jpeg|svg|gif|ico|avif)",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=604800, stale-while-revalidate=86400",
          },
        ],
      },
      {
        source: "/(.*)",
        headers: [
          {
            key: "Link",
            // Exactly ONE preconnect. Chrome holds a DNS+TCP+TLS connection open
            // per preconnect, so the hint is only worth its cost for an origin
            // needed EARLY. Lighthouse flagged this app for too many origins.
            //
            // Kept: the S3 bucket serves the above-the-fold exam logos, so the
            // connection is genuinely on the critical path.
            //
            // Dropped (were preconnect, now cheap dns-prefetch only):
            //   connect.facebook.net, www.googletagmanager.com,
            //   www.google-analytics.com
            // All three are still cheap dns-prefetch only: LazyGTM is
            // interaction-gated, google-analytics is loaded by GTM so it is
            // doubly deferred, and FacebookPixel now loads on page load but
            // is not on the LCP path. dns-prefetch keeps the DNS win at ~no cost.
            value: [
              "<https://cc-teaching-content-ind.s3.dualstack.ap-south-1.amazonaws.com>; rel=preconnect",
              "<https://connect.facebook.net>; rel=dns-prefetch",
              "<https://www.googletagmanager.com>; rel=dns-prefetch",
              "<https://www.google-analytics.com>; rel=dns-prefetch",
            ].join(", "),
          },
        ],
      },
    ];
  },

  webpack(config) {
    config.plugins?.push(
      new (require("webpack").IgnorePlugin)({
        resourceRegExp: /^\.\/locale$/,
        contextRegExp: /moment$/,
      }),
    );

    return config;
  },
};

// pnpm resolves two different `next` versions across this workspace (landing
// depends on ^16.1.6, blog on ^16.3.4), so the plugin chain below composes
// NextConfig types from two structurally-incompatible module instances —
// a types-only conflict (Next.js consumes this as plain JS at runtime, so
// there is no behavior difference), worked around with an explicit `any`.
// eslint-disable-next-line @typescript-eslint/no-explicit-any -- see comment above
const composedConfig: any = bundleAnalyzer(withNextIntl(config) as any);

export default withSentryConfig(composedConfig, {
  // Official Sentry tree-shaking flags (docs: configuration/tree-shaking).
  // These strip Sentry features this app does not use from ANY Sentry code
  // that does get bundled — notably the server/edge runtime, which stays fully
  // enabled. They were unset before this milestone.
  bundleSizeOptimizations: {
    excludeDebugStatements: true,
    excludeReplayShadowDom: true,
    excludeReplayIframe: true,
    excludeReplayWorker: true,
  },
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,
  authToken: process.env.SENTRY_AUTH_TOKEN,
  silent: true,
  widenClientFileUpload: true,
  disableLogger: true,
});

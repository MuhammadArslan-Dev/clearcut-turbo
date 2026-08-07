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

  experimental: {
    optimizeCss: true,
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
            // All three are INTERACTION-GATED in this codebase — LazyGTM and
            // FacebookPixel render nothing until the first click/scroll/keydown,
            // and google-analytics is loaded by GTM, so it is doubly deferred.
            // Preconnecting for scripts that may never load on a bouncing visit
            // is pure waste. dns-prefetch keeps the DNS win at ~no cost.
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

export default withSentryConfig(bundleAnalyzer(withNextIntl(config)), {
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

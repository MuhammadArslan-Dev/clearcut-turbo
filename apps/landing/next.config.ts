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
    // optimizeCss (critters) already inlines the above-the-fold CSS and loads
    // the rest asynchronously. `inlineCss` used to be on as well: it copied
    // the WHOLE stylesheet (~115 KB) into every page 4× in the HTML and 3× in
    // the RSC payload (home: 698 KB HTML, 459 KB RSC that every <Link>
    // prefetch re-downloads), with no stylesheet caching between pages.
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

  // Old URLs Search Console reports as 404 whose content moved: the tools now
  // live under /tools/* (Cloudflare Worker, see TOOLS_DEPLOY.md) and the exam
  // pages became /exam/<code>-preparation. Each target was checked to return
  // 200 in production. A true 301 (not Next's default 308 for `permanent`);
  // query strings (e.g. ?group=banking) are carried over by Next.
  async redirects() {
    const locale = ":locale(hi|mr)";
    const resizerTools = "image-compressor|signature-compressor|add-name-date|75-face-coverage";
    const exams = "ctet|htet|reet|uptet|hptet";
    // Every /exam/<code>-preparation page (STATIC_EXAMS short names).
    const examPages = "htet|ctet|reet|uptet|hptet|uppgt|uptgt|ugcnet|ugc";
    return [
      { source: "/resizer/:path*", destination: "/tools/resizer/:path*", statusCode: 301 },
      { source: `/${locale}/resizer/:path*`, destination: "/:locale/tools/resizer/:path*", statusCode: 301 },
      { source: "/age-eligibility-calculator/:path*", destination: "/tools/age-eligibility-calculator/:path*", statusCode: 301 },
      { source: `/${locale}/age-eligibility-calculator/:path*`, destination: "/:locale/tools/age-eligibility-calculator/:path*", statusCode: 301 },
      { source: `/:tool(${resizerTools})`, destination: "/tools/resizer/:tool", statusCode: 301 },
      { source: `/${locale}/:tool(${resizerTools})`, destination: "/:locale/tools/resizer/:tool", statusCode: 301 },
      { source: `/exam/:code(${exams})-:year(\\d{4})`, destination: "/exam/:code-preparation", statusCode: 301 },
      { source: `/${locale}/exam/:code(${exams})-:year(\\d{4})`, destination: "/:locale/exam/:code-preparation", statusCode: 301 },
      // Bare exam codes (the go-marketing HTET page links to /exam/htet) used
      // to render a second copy of the course page with its own canonical.
      { source: `/exam/:code(${examPages})`, destination: "/exam/:code-preparation", statusCode: 301 },
      { source: `/${locale}/exam/:code(${examPages})`, destination: "/:locale/exam/:code-preparation", statusCode: 301 },
      // /resize-image was an older copy of the same photo/signature resizer
      // (same title, description and tool) as the Tools app's /tools/resizer,
      // which is the page that ranks — one URL for one tool.
      { source: "/resize-image", destination: "/tools/resizer", statusCode: 301 },
      { source: `/${locale}/resize-image`, destination: "/:locale/tools/resizer", statusCode: 301 },
    ];
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
  // Source maps go to the public sites' project (needs SENTRY_AUTH_TOKEN).
  org: process.env.SENTRY_ORG || "clear-cutoff",
  project: process.env.SENTRY_PROJECT || "clearcutoff-public",
  authToken: process.env.SENTRY_AUTH_TOKEN,
  silent: true,
  widenClientFileUpload: true,
  disableLogger: true,
});

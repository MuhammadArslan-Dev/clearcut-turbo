import { withSentryConfig } from "@sentry/nextjs";
import { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin({
  experimental: {
    createMessagesDeclaration: "./messages/en.json",
  },
});

const config: NextConfig = {
  typescript: {
    ignoreBuildErrors: true, // allows build even with type errors
  },
  // eslint: {
  //   ignoreDuringBuilds: true, // allows build even with lint errors
  // },
  experimental: {
    // The deploy host is a single 4-vCPU box that also runs ~18 other
    // services (including the production MySQL/Postgres databases) — it is
    // NOT dedicated build hardware. Next's default worker pool for build
    // tasks (page-data collection, static generation) auto-sizes off the
    // container's *visible* CPU count and had been spawning 7 workers here,
    // oversubscribing the 4 real cores. That drove host CPU past 300% during
    // every deploy (confirmed via the host's own CPU graph), starving the
    // co-located databases and leaving the whole box unresponsive enough to
    // need a manual restart. Capping at 2 trades a slower build for never
    // starving the rest of the host again.
    cpus: 2,
    // optimizeCss (critters) was here before and did nothing — confirmed
    // empirically (built + served + inspected raw HTML): critters is a
    // Pages Router mechanism (no streaming support) and is a documented
    // no-op under the App Router, which this app uses exclusively. Every
    // page still shipped two blocking <link rel="stylesheet"> requests
    // regardless of this flag. Removed rather than left in as dead config.
    //
    // The App Router's actual equivalent, experimental.inlineCss, DOES
    // work — verified it fully inlines CSS and drops both stylesheet
    // requests. Deliberately NOT enabling it though: on /sign-in it inlined
    // ~147KB of CSS (this app's real bundle size) directly into the HTML,
    // taking that page from 36KB to 612KB. The debugbear article's own
    // guidance is that inlining only pays off under ~10KB — past that,
    // you're trading two requests the browser parallelizes with everything
    // else on the page for one much heavier blocking HTML response, which
    // measured worse here, not better. Not worth it for this bundle size.
    optimizePackageImports: [
      "lucide-react",
      "@heroicons/react",
      "recharts",
      "framer-motion",
    ],
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "encrypted-tbn0.gstatic.com",
      },
      {
        protocol: "https",
        hostname:
          "cc-teaching-content-ind.s3.dualstack.ap-south-1.amazonaws.com",
        pathname: "/**",
      },
    ],
  },
  webpack: (config) => {
    // Same reasoning as experimental.cpus above: cap webpack's own internal
    // compilation parallelism so a production build never tries to use every
    // core on this shared host.
    config.parallelism = 2;

    // Handle MathJax static assets
    config.module.rules.push({
      test: /\.woff2$/,
      type: "asset/resource",
    });
    return config;
  },
};

export default withSentryConfig(withNextIntl(config), {
  // For all available options, see:
  // https://www.npmjs.com/package/@sentry/webpack-plugin#options

  org: "clear-cutoff",

  project: "clearcutoff-nextjs-app",

  // Only print logs for uploading source maps in CI
  silent: !process.env.CI,

  // For all available options, see:
  // https://docs.sentry.io/platforms/javascript/guides/nextjs/manual-setup/

  // Upload a larger set of source maps for prettier stack traces (increases build time)
  widenClientFileUpload: true,

  // Route browser requests to Sentry through a Next.js rewrite to circumvent ad-blockers.
  // This can increase your server load as well as your hosting bill.
  // Note: Check that the configured route will not match with your Next.js middleware, otherwise reporting of client-
  // side errors will fail.
  // tunnelRoute: "/monitoring",

  webpack: {
    // Enables automatic instrumentation of Vercel Cron Monitors. (Does not yet work with App Router route handlers.)
    // See the following for more information:
    // https://docs.sentry.io/product/crons/
    // https://vercel.com/docs/cron-jobs
    automaticVercelMonitors: true,

    // Tree-shaking options for reducing bundle size
    treeshake: {
      // Automatically tree-shake Sentry logger statements to reduce bundle size
      removeDebugLogging: true,
    },
  },
});

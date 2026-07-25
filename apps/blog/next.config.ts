import { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";
import { withSentryConfig } from "@sentry/nextjs";

const withNextIntl = createNextIntlPlugin({
  experimental: {
    createMessagesDeclaration: "./messages/en.json",
  },
});

const config: NextConfig = {
  // NOTE: `siteUrl`, `swcMinify`, `eslint` and `fonts` used to be set here.
  // Next 16 logged "Unrecognized key(s) in object: 'siteUrl', 'swcMinify',
  // 'eslint', 'fonts'" and ignored all four, so they were doing nothing —
  // SWC minification is on by default, and NEXT_PUBLIC_SITE_URL is read from
  // the environment directly by the SEO helpers.
  reactStrictMode: true,
  compress: true,
  experimental: {
    optimizeCss: true, // remove unused CSS automatically
    inlineCss: true, // inline critical CSS
    // Measured: 241 KiB of unused JavaScript on every page, concentrated in the
    // barrel-imported icon/animation packages. `optimizePackageImports` rewrites
    // those to per-module imports so only what's used is bundled.
    optimizePackageImports: [
      "lucide-react",
      "@heroicons/react",
      "framer-motion",
      "@mui/joy",
    ],
  },
  typescript: {
    ignoreBuildErrors: true, // allows build even with type errors
  },
  images: {
    // `images.domains` is deprecated in Next 16 (it warned on every boot); the
    // three hosts it listed are expressed as remotePatterns below instead.
    remotePatterns: [
      { protocol: "https", hostname: "img.icons8.com" },
      { protocol: "https", hostname: "i.pravatar.cc" },
      {
        protocol: "http",
        hostname: "localhost",
        port: "3001",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname:
          "cc-teaching-content-ind.s3.dualstack.ap-south-1.amazonaws.com",
      },
    ],
  },
};

export default withSentryConfig(withNextIntl(config), {
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,
  authToken: process.env.SENTRY_AUTH_TOKEN,
  silent: true,
  widenClientFileUpload: true,
  disableLogger: true,
});

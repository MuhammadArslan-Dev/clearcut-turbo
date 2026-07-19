import { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";
import { withSentryConfig } from "@sentry/nextjs";

const withNextIntl = createNextIntlPlugin({
  experimental: {
    createMessagesDeclaration: "./messages/en.json",
  },
});

const config: NextConfig = {
  siteUrl: process.env.NEXT_PUBLIC_SITE_URL,
  reactStrictMode: true,
  swcMinify: true, // minify JS using SWC
  experimental: {
    optimizeCss: true, // remove unused CSS automatically
    inlineCss: true, // inline critical CSS
  },
  typescript: {
    ignoreBuildErrors: true, // allows build even with type errors
  },
  eslint: {
    ignoreDuringBuilds: true, // allows build even with lint errors
  },
  fonts: {
    disableFontOptimization: true, // ✅ prevents next/font from fetching at build
  },
  images: {
    domains: [
      "img.icons8.com",
      "i.pravatar.cc",
      "cc-teaching-content-ind.s3.dualstack.ap-south-1.amazonaws.com",
    ],
    remotePatterns: [
      {
        protocol: "https",
        hostname: "http://zo4csosgwoockgko0cggc4gc.65.108.49.3.sslip.io",
        pathname: "/api/**",
      },
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

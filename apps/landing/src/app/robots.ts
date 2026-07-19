import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/teaching/*/questions",  // onboarding flow — not indexable content
          "/account-delete",        // utility page
          "/api/",                  // API routes
          "/_next/",                // Next.js internals
        ],
      },
      {
        // Block AI training crawlers that don't respect content usage terms
        userAgent: [],
        disallow: "/",
      },
    ],
    sitemap: "https://clearcutoff.in/sitemap.xml",
    host: "https://clearcutoff.in",
  };
}

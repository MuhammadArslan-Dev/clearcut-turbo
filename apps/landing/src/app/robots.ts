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
        // Block AI training crawlers that don't respect content usage terms.
        // NOTE: userAgent was previously an empty array, which emitted a bare
        // `Disallow: /` group with no User-Agent — parsers/Googlebot could read
        // that as disallowing the entire site (de-indexing everything). It is
        // now scoped to named AI crawlers so the site stays fully indexable.
        userAgent: [
          "GPTBot",
          "OAI-SearchBot",
          "ChatGPT-User",
          "CCBot",
          "Google-Extended",
          "anthropic-ai",
          "ClaudeBot",
          "PerplexityBot",
          "Bytespider",
        ],
        disallow: "/",
      },
    ],
    sitemap: "https://clearcutoff.in/sitemap.xml",
    host: "https://clearcutoff.in",
  };
}

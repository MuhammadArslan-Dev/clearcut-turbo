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
        // from the paid exam-prep content, but explicitly carve out
        // /tools/* — the free, no-login calculator/resizer tools deployed
        // separately under apps/tools — since those pages exist specifically
        // to be found and cited by AI answer engines (ChatGPT, Perplexity,
        // Google AI Overviews). robots.txt is one file for the whole
        // clearcutoff.in origin, so this app's rules govern /tools/* too
        // even though it's a different deployment.
        // NOTE: userAgent was previously an empty array, which emitted a bare
        // `Disallow: /` group with no User-Agent — parsers/Googlebot could read
        // that as disallowing the entire site (de-indexing everything). It is
        // now scoped to named AI crawlers so the rest of the site stays fully
        // indexable by everyone else.
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
        allow: ["/tools/", "/hi/tools/"],
        disallow: "/",
      },
    ],
    sitemap: [
      "https://clearcutoff.in/sitemap.xml",
      "https://clearcutoff.in/go/sitemap.xml", // Astro marketing pages, served via the Cloudflare Worker at /go/*
      "https://clearcutoff.in/tools/sitemap.xml", // apps/tools pages, served via the Cloudflare Worker at /tools/*
    ],
    host: "https://clearcutoff.in",
  };
}

import { MetadataRoute } from "next";

const BASE_URL = (process.env.NEXT_PUBLIC_SITE_URL || "").replace(/\/$/, "");

// AI *training* crawlers read every question page but send no visitors; on
// 2026-10-22 they were ~10% of the blog's function invocations (Vercel AI
// Traffic: ClaudeBot 1.3K requests in 12 h, plus Meta, Amazon). Blocked here.
// AI *search/assistant* bots (PerplexityBot, OAI-SearchBot, ChatGPT-User) are
// left allowed: they cite and link the pages. Google-Extended / Applebot-
// Extended only opt out of model training; Googlebot and Applebot (search)
// are unaffected.
export const AI_TRAINING_BOTS = [
  "ClaudeBot",
  "anthropic-ai",
  "GPTBot",
  "CCBot",
  "meta-externalagent",
  "FacebookBot",
  "Amazonbot",
  "Bytespider",
  "Google-Extended",
  "Applebot-Extended",
  "cohere-ai",
  "Diffbot",
];

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/admin/", "/hi/admin/", "/api/"],
      },
      { userAgent: AI_TRAINING_BOTS, disallow: "/" },
    ],
    // Only the index: it lists sitemap.xml and every per-exam sitemap (built
    // from ALLOWED_EXAMS), so a new exam needs no change here. Listing a child
    // here as well made Search Console track it twice (phase 125).
    sitemap: `${BASE_URL}/sitemaps/index.xml`,
  };
}

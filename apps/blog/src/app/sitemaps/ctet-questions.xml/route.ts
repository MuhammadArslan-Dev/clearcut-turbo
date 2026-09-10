import { NextResponse } from "next/server";
import { buildQuestionsSitemapXml } from "@/lib/sitemap/build-questions-sitemap-xml";

const BASE_URL = (process.env.NEXT_PUBLIC_SITE_URL || "").replace(/\/$/, "");

// Isolated from sitemap.ts / sitemaps/[examName] on purpose: CTET's question
// bank runs into the thousands (a single chapter can hold 400+ questions),
// so this walks exam -> paper -> subject -> chapter -> question, meaning
// dozens of backend round trips. Keeping it in its own route means a slow or
// failed run here can never take down the main sitemap.xml, which every
// other already-indexed page depends on.
export const revalidate = 86400;
// Extends the Vercel function timeout for this route specifically (only
// takes effect on plans that allow it — ignored elsewhere).
export const maxDuration = 300;

export async function GET() {
  const xml = await buildQuestionsSitemapXml("ctet", BASE_URL);
  return new NextResponse(xml, {
    headers: { "Content-Type": "application/xml" },
  });
}

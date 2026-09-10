import { NextResponse } from "next/server";
import { ALLOWED_EXAMS } from "@/lib/exams";

const BASE_URL = (process.env.NEXT_PUBLIC_SITE_URL || "").replace(/\/$/, "");

// The single sitemap Search Console needs to know about, ever. Every
// per-exam sitemap (sitemaps/[exam].xml, sitemaps/[exam]-questions.xml) is
// generated here from ALLOWED_EXAMS — adding a new exam there is enough for
// it to appear in this index on the next request, and Google re-crawls an
// already-submitted index periodically and discovers new children in it on
// its own. No new sitemap URL ever needs a separate manual submission again;
// only this file (plus the top-level sitemap.xml, listed here too) needs to
// be submitted once.
export async function GET() {
  const now = new Date().toISOString();

  const sitemaps = [
    `${BASE_URL}/sitemap.xml`,
    ...ALLOWED_EXAMS.flatMap((exam) => [
      `${BASE_URL}/sitemaps/${exam}.xml`,
      `${BASE_URL}/sitemaps/${exam}-questions.xml`,
    ]),
  ];

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${sitemaps
  .map(
    (loc) => `  <sitemap>
    <loc>${loc}</loc>
    <lastmod>${now}</lastmod>
  </sitemap>`,
  )
  .join("\n")}
</sitemapindex>`;

  return new NextResponse(xml, {
    headers: { "Content-Type": "application/xml" },
  });
}

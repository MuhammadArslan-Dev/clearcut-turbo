import { ALLOWED_EXAMS } from "@/lib/exams";
import { siteOrigin, sitemapIndexXml, xmlResponse } from "@/lib/sitemap/xml";

// The single sitemap Search Console needs: every per-exam sitemap is derived
// from ALLOWED_EXAMS, so a new exam only needs adding there. No <lastmod>:
// the old value was the request time, which tells crawlers nothing true.
export async function GET() {
  const origin = siteOrigin();
  return xmlResponse(
    sitemapIndexXml([
      `${origin}/sitemap.xml`,
      ...ALLOWED_EXAMS.flatMap((exam) => [
        `${origin}/sitemaps/${exam}.xml`,
        `${origin}/sitemaps/${exam}-questions.xml`,
      ]),
    ]),
  );
}

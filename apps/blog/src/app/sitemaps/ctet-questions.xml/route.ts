import { NextResponse } from "next/server";
import { formatToSlug } from "@/utils/slugify";
import { limitWords } from "@clearcut/utils/text-limit";

const BASE_URL = (process.env.NEXT_PUBLIC_SITE_URL || "").replace(/\/$/, "");
const API = (process.env.BACKEND_URL || "").replace(/\/$/, "");

const EXAM_SLUG = "ctet";

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

// Sitemap protocol hard cap (50,000 URLs per file). CTET's question count is
// nowhere near this today, but if it ever grows past it, this must become a
// generateSitemaps()-style paginated index instead of silently truncating.
const MAX_SITEMAP_URLS = 50000;

async function fetchJson(url: string): Promise<any> {
  try {
    const res = await fetch(url, { next: { revalidate: 86400 } });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

export async function GET() {
  const urls: string[] = [];
  const seenIds = new Set<number>();

  try {
    const levelsJson = await fetchJson(`${API}/blog/get-enavigation?parent_id=true`);
    // get-enavigation returns levels for every exam — must filter to CTET
    // (see the same fix in sitemap.ts / sitemaps/[examName]/route.ts).
    const levels: any[] = (levelsJson?.data || []).filter(
      (l: any) => (l?.exam_id_b || "").toLowerCase() === `teaching_${EXAM_SLUG}`,
    );

    for (const level of levels) {
      const levelSlug: string = level?.slug;
      if (!levelSlug) continue;

      const subjectsJson = await fetchJson(
        `${API}/blog/get-subject?exam_id=${EXAM_SLUG}&slug=${levelSlug}`,
      );
      const subjects: any[] = subjectsJson?.data || [];

      for (const subject of subjects) {
        // section_id (e.g. "CTET_CDP") is exam-scoped — the section's own
        // `slug` (e.g. "child-development-pedagogy") is NOT unique across
        // exams (HTET/UPTET/REET reuse the same subject slugs), so filtering
        // get-questions-by-section by slug silently returns another exam's
        // chapters. section_id is the only safe key here.
        const sectionIdB: string = subject?.section_id;
        if (!sectionIdB) continue;

        const sectionJson = await fetchJson(
          `${API}/blog/get-questions-by-section?section_id=${sectionIdB}`,
        );
        const chapterEntries: any[] = sectionJson?.data?.data || [];

        for (const entry of chapterEntries) {
          const chapterSlug: string = entry?.chapter?.slug;
          if (!chapterSlug) continue;

          // get-questions-by-section caps each chapter's questions at 3
          // (a preview), so the full list needs a dedicated per-chapter call.
          const chapterJson = await fetchJson(
            `${API}/blog/get-questions-by-chapter?slug=${chapterSlug}&exam_name=${EXAM_SLUG}`,
          );
          const questions: any[] = chapterJson?.data?.questions_new || [];

          for (const q of questions) {
            if (!q?.id || seenIds.has(q.id)) continue;
            seenIds.add(q.id);

            // Matches the question detail page's own canonical-slug logic
            // (translations[0], not locale-matched) exactly — using a
            // different rule here would mean the sitemap URL immediately
            // 308-redirects to a different canonical, wasting crawl budget.
            const translation = q.translations?.[0];
            if (!translation) continue;

            const plain = (translation.question || "").replace(/<[^>]*>/g, "");
            const slug = translation.ai_slug
              ? translation.ai_slug
              : formatToSlug(limitWords(plain, 4));
            const param = `${slug}-${q.id}`;

            urls.push(`${BASE_URL}/question/${param}`, `${BASE_URL}/hi/question/${param}`);
          }
        }
      }
    }
  } catch (err) {
    console.error("CTET question sitemap generation error:", err);
  }

  if (urls.length > MAX_SITEMAP_URLS) {
    console.error(
      `CTET question sitemap has ${urls.length} URLs, over the ${MAX_SITEMAP_URLS} sitemap limit — truncating. This needs a paginated sitemap index instead.`,
    );
  }

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls
  .slice(0, MAX_SITEMAP_URLS)
  .map((url) => `  <url>\n    <loc>${url}</loc>\n  </url>`)
  .join("\n")}
</urlset>`;

  return new NextResponse(xml, {
    headers: { "Content-Type": "application/xml" },
  });
}

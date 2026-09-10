import { formatToSlug, sanitizeAiSlug } from "@/utils/slugify";
import { limitWords } from "@clearcut/utils/text-limit";

const API = (process.env.BACKEND_URL || "").replace(/\/$/, "");

// Sitemap protocol hard cap (50,000 URLs per file). No exam is nowhere near
// this today, but if one ever grows past it, this must become a
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

// Walks exam -> level -> subject -> chapter -> question and returns the full
// <urlset> XML for every question page (en + hi) under that exam. Shared by
// sitemaps/ctet-questions.xml/route.ts and the "-questions" branch of
// sitemaps/[examName]/route.ts so the walk, canonical-slug rule, and cap
// logic can never drift between exams.
export async function buildQuestionsSitemapXml(
  examSlug: string,
  baseUrl: string,
): Promise<string> {
  const urls: string[] = [];
  const seenIds = new Set<number>();

  try {
    const levelsJson = await fetchJson(`${API}/blog/get-enavigation?parent_id=true`);
    // get-enavigation returns levels for every exam — must filter to this one
    // (see the same fix in sitemap.ts / sitemaps/[examName]/route.ts).
    const levels: any[] = (levelsJson?.data || []).filter(
      (l: any) => (l?.exam_id_b || "").toLowerCase() === `teaching_${examSlug}`,
    );

    for (const level of levels) {
      const levelSlug: string = level?.slug;
      if (!levelSlug) continue;

      const subjectsJson = await fetchJson(
        `${API}/blog/get-subject?exam_id=${examSlug}&slug=${levelSlug}`,
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
            `${API}/blog/get-questions-by-chapter?slug=${chapterSlug}&exam_name=${examSlug}`,
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
            const slug =
              (translation.ai_slug && sanitizeAiSlug(translation.ai_slug)) ||
              formatToSlug(limitWords(plain, 4));
            const param = `${slug}-${q.id}`;

            urls.push(`${baseUrl}/question/${param}`, `${baseUrl}/hi/question/${param}`);
          }
        }
      }
    }
  } catch (err) {
    console.error(`${examSlug} question sitemap generation error:`, err);
  }

  if (urls.length > MAX_SITEMAP_URLS) {
    console.error(
      `${examSlug} question sitemap has ${urls.length} URLs, over the ${MAX_SITEMAP_URLS} sitemap limit — truncating. This needs a paginated sitemap index instead.`,
    );
  }

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls
  .slice(0, MAX_SITEMAP_URLS)
  .map((url) => `  <url>\n    <loc>${url}</loc>\n  </url>`)
  .join("\n")}
</urlset>`;
}

import { NextResponse } from "next/server";
import { formatToSlug } from "@/utils/slugify";
import { resolveExamId } from "@/lib/api/exams";
import { getPostsByExam } from "@/lib/api/posts";

const BASE_URL = (process.env.NEXT_PUBLIC_SITE_URL || "").replace(/\/$/, "");
const PAYLOAD_API = (process.env.BACKEND_URL || "").replace(/\/$/, "");

const ALLOWED_EXAMS = ["ctet"];

/**
 * GET /sitemaps/[examName].xml
 * Generates a per-exam sitemap covering all levels, subjects, years, and locale variants.
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ examName: string }> },
) {
  const { examName } = await params;
  const examSlug = examName.replace(/\.xml$/i, "").toLowerCase();

  if (!ALLOWED_EXAMS.includes(examSlug)) {
    return new NextResponse(`Exam "${examSlug}" not found`, { status: 404 });
  }

  try {
    const urls: { url: string; lastModified?: string }[] = [];

    // Fetch exam info
    const examRes = await fetch(`${PAYLOAD_API}/blog/exam?short_name=${examSlug}`);
    const examData = await examRes.json();
    const exam = examData.data?.[0];

    if (!exam) {
      return new NextResponse(`Exam "${examSlug}" not found`, { status: 404 });
    }

    const examMod: string = exam.updatedAt || new Date().toISOString();

    // Exam listing page (en + hi)
    urls.push(
      { url: `${BASE_URL}/${examSlug}`, lastModified: examMod },
      { url: `${BASE_URL}/hi/${examSlug}`, lastModified: examMod },
    );

    // Blog listing + posts (posts live in the Payload CMS, keyed by exam_id).
    urls.push(
      { url: `${BASE_URL}/${examSlug}/blog`, lastModified: examMod },
      { url: `${BASE_URL}/hi/${examSlug}/blog`, lastModified: examMod },
    );
    const blogExamId = await resolveExamId(examSlug);
    if (blogExamId) {
      const posts = await getPostsByExam(blogExamId, { limit: 1000 });
      for (const post of posts) {
        const pMod = post.updatedAt || post.publishedDate;
        urls.push(
          { url: `${BASE_URL}/${examSlug}/blog/${post.slug}`, lastModified: pMod },
          { url: `${BASE_URL}/hi/${examSlug}/blog/${post.slug}`, lastModified: pMod },
        );
      }
    }

    // Fetch levels and years in parallel
    const [levelsRes, yearsRes] = await Promise.all([
      fetch(`${PAYLOAD_API}/blog/get-enavigation?parent_id=true`),
      fetch(`${PAYLOAD_API}/blog/get-years?exam_id=${examSlug}`),
    ]);

    // Same fix as apps/blog/src/app/sitemap.ts: get-enavigation returns
    // levels for every exam, so this must be filtered to the current one.
    const levels: any[] = ((await levelsRes.json()).data || []).filter(
      (l: any) => (l?.exam_id_b || "").toLowerCase() === `teaching_${examSlug}`,
    );
    const years: any[] = (await yearsRes.json()).data || [];

    for (const level of levels) {
      const ls: string = level?.slug;
      if (!ls) continue;
      const lMod: string = level.updatedAt || new Date().toISOString();

      // Level pages (en + hi) + listing pages
      urls.push(
        { url: `${BASE_URL}/${examSlug}/${ls}`, lastModified: lMod },
        { url: `${BASE_URL}/hi/${examSlug}/${ls}`, lastModified: lMod },
        { url: `${BASE_URL}/${examSlug}/${ls}/subject`, lastModified: lMod },
        { url: `${BASE_URL}/${examSlug}/${ls}/year`, lastModified: lMod },
      );

      // Subjects for this level
      const subjectsRes = await fetch(
        `${PAYLOAD_API}/blog/get-subject?exam_id=${examSlug}&slug=${ls}`,
      );
      const subjects: any[] = (await subjectsRes.json()).data || [];

      for (const subject of subjects) {
        const ss: string = subject?.section?.slug;
        if (!ss) continue;
        urls.push({
          url: `${BASE_URL}/${examSlug}/${ls}/subject/${ss}`,
          lastModified: subject.updatedAt,
        });
      }

      // Year pages per level
      for (const year of years) {
        const ys = formatToSlug((year?.instance_id || "").replace("_", " "));
        if (!ys) continue;
        urls.push({
          url: `${BASE_URL}/${examSlug}/${ls}/year/${ys}`,
          lastModified: year.updatedAt,
        });
      }
    }

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls
  .map(
    (u) => `  <url>
    <loc>${u.url}</loc>
    <lastmod>${u.lastModified || new Date().toISOString()}</lastmod>
  </url>`,
  )
  .join("\n")}
</urlset>`;

    return new NextResponse(xml, {
      headers: { "Content-Type": "application/xml" },
    });
  } catch (error) {
    console.error("Exam sitemap error:", error);
    return new NextResponse("Error generating sitemap", { status: 500 });
  }
}

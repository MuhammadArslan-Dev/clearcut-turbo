import { ALLOWED_EXAMS } from "@/lib/exams";
import { buildExamChaptersSitemapXml, buildExamSitemapXml } from "@/lib/sitemap/exam-sitemaps";
import { sitemapUnavailable, xmlResponse } from "@/lib/sitemap/xml";
import { IS_PRERENDER_BUILD } from "@/lib/build/prerender";

const QUESTIONS_SUFFIX = "-questions";

// Prerendered at build time for every exam (Workers Free plan: building a
// sitemap on request ran over the 10 ms CPU limit and answered 503). A backend
// failure during the build fails the build instead of being stored.
export const dynamic = "force-static";

export async function generateStaticParams() {
  return ALLOWED_EXAMS.flatMap((exam) => [`${exam}.xml`, `${exam}${QUESTIONS_SUFFIX}.xml`])
    // ctet-questions.xml has its own literal route (see below).
    .filter((name) => name !== "ctet-questions.xml")
    .map((examName) => ({ examName }));
}

/**
 * GET /sitemaps/<exam>.xml            -> exam, blog, level, listing, subject and year pages
 * GET /sitemaps/<exam>-questions.xml  -> chapter pages (where the questions now live)
 *
 * sitemaps/ctet-questions.xml has its own literal route, which wins over this
 * dynamic one for that exact path; both use the same builder.
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ examName: string }> },
) {
  const { examName } = await params;
  const slug = examName.replace(/\.xml$/i, "").toLowerCase();
  const isQuestions = slug.endsWith(QUESTIONS_SUFFIX);
  const exam = isQuestions ? slug.slice(0, -QUESTIONS_SUFFIX.length) : slug;

  if (!ALLOWED_EXAMS.includes(exam)) {
    return new Response(`Exam "${exam}" not found`, { status: 404 });
  }

  try {
    return xmlResponse(isQuestions ? await buildExamChaptersSitemapXml(exam) : await buildExamSitemapXml(exam));
  } catch (error) {
    if (IS_PRERENDER_BUILD) throw error;
    console.error(`sitemap ${slug} generation failed:`, error);
    return sitemapUnavailable();
  }
}

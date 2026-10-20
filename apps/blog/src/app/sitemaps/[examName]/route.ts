import { ALLOWED_EXAMS } from "@/lib/exams";
import { buildExamChaptersSitemapXml, buildExamSitemapXml } from "@/lib/sitemap/exam-sitemaps";
import { sitemapUnavailable, xmlResponse } from "@/lib/sitemap/xml";

const QUESTIONS_SUFFIX = "-questions";

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
    console.error(`sitemap ${slug} generation failed:`, error);
    return sitemapUnavailable();
  }
}

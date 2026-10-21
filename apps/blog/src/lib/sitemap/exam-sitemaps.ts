import { backendServerHeaders } from "@/lib/api/backend-headers";
import { resolveExamId } from "@/lib/api/exams";
import { questionTags } from "@/lib/question-bank/cache-tags";
import { getHindiPostSlugs, getPostsByExam } from "@/lib/api/posts";
import { loadExamIndex } from "@/lib/seo/load-exam-index";
import { examStructureEntries, type SitemapPost } from "./exam-sitemap-entries";
import { fetchQuestionIndex, fetchSubjectChapters } from "./question-index";
import { chapterPageEntries, subjectPageEntries, yearPageEntries } from "./question-pages";
import { siteOrigin, urlsetXml } from "./xml";

function isoOrUndefined(value?: string | null): string | undefined {
  if (!value) return undefined;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? undefined : date.toISOString();
}

async function fetchYearInstanceIds(exam: string): Promise<string[]> {
  const base = (process.env.BACKEND_URL || "").replace(/\/$/, "");
  const res = await fetch(`${base}/blog/get-years?exam_id=${encodeURIComponent(exam)}`, {
    headers: backendServerHeaders(),
    next: { revalidate: 3600, tags: questionTags(exam) },
  });
  if (!res.ok) throw new Error(`get-years ${exam} -> HTTP ${res.status}`);
  const data = (await res.json())?.data;
  if (!Array.isArray(data)) throw new Error(`get-years ${exam} -> unexpected response shape`);
  return data.map((y: { instance_id?: string }) => y?.instance_id).filter((id): id is string => Boolean(id));
}

async function fetchPosts(exam: string): Promise<SitemapPost[]> {
  const examId = await resolveExamId(exam);
  if (!examId) return [];
  const [posts, hindiSlugs] = await Promise.all([getPostsByExam(examId, { limit: 1000 }), getHindiPostSlugs(examId)]);
  return posts
    .filter((p) => p.slug)
    .map((p) => ({
      slug: p.slug as string,
      lastmod: isoOrUndefined(p.updatedAt || p.publishedDate),
      hindi: hindiSlugs.has(p.slug as string),
    }));
}

/** Throws on any backend failure — callers answer 503, never a partial file. */
export async function buildExamSitemapXml(exam: string): Promise<string> {
  const [index, years, posts, questionIndex] = await Promise.all([
    loadExamIndex(exam),
    fetchYearInstanceIds(exam),
    fetchPosts(exam),
    fetchQuestionIndex(exam),
  ]);
  const subjectChapters = await fetchSubjectChapters(index);
  const origin = siteOrigin();
  return urlsetXml(
    examStructureEntries(origin, index, posts, {
      subjects: subjectPageEntries(origin, index, questionIndex, subjectChapters),
      years: yearPageEntries(origin, index, questionIndex, years),
    }),
  );
}

/** Chapter pages — where every question lives — with all their pages. */
export async function buildExamChaptersSitemapXml(exam: string): Promise<string> {
  const [index, questionIndex] = await Promise.all([loadExamIndex(exam), fetchQuestionIndex(exam)]);
  return urlsetXml(chapterPageEntries(siteOrigin(), index, questionIndex));
}

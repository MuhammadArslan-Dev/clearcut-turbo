// Every URL the question-bank routes serve, for generateStaticParams.
//
// The blog runs on the Workers Free plan (10 ms CPU per request) and one of
// these pages costs 0.3–2 s of CPU to render, so `next build` renders all of
// them in CI and the Worker only serves the stored result
// (docs/phases/14-blog-worker-limit.md). That only holds if this list covers
// every URL that answers 200 — a URL missing here is rendered on its first
// request, which can exceed the limit.
//
// Covered, per exam, in both locales (en + /hi; a /hi page whose content is
// English still answers 200 and canonicalizes to English):
//  - every level × subject × chapter listed in navigation — including the
//    non-canonical copies of a chapter/subject listed under several levels
//    (they render with a canonical to the first copy) and empty chapters
//    (page 1, noindex);
//  - every level × subject page;
//  - every level × year page from /blog/get-years;
//  - for each, every /page/N its questions fill (QUESTIONS_PER_PAGE).
// Page counts come from /blog/question-index — the same per-page question
// lists the sitemaps use (lib/sitemap/question-pages.ts) — so a page listed
// here is exactly a page the route renders. Any backend failure throws: the
// build must stop rather than ship a partial site.

import { routing } from "@/i18n/routing";
import { resolveExamId } from "@/lib/api/exams";
import { getPostsByExam } from "@/lib/api/posts";
import { ALLOWED_EXAMS } from "@/lib/exams";
import { mapLimit } from "@/lib/async/map-limit";
import { loadExamIndex } from "@/lib/seo/load-exam-index";
import type { ExamIndex } from "@/lib/seo/exam-index";
import { fetchQuestionIndex } from "@/lib/sitemap/question-index";
import { yearQuestions, yearSlug, type QuestionIndex } from "@/lib/sitemap/question-pages";
import { loadSubjectChapterSlugs, loadYears } from "./load";
import { pageCount } from "./pagination";

type ExamData = { index: ExamIndex; questions: QuestionIndex; years: string[] };

const examDataMemo = new Map<string, Promise<ExamData>>();

function examData(exam: string): Promise<ExamData> {
  let hit = examDataMemo.get(exam);
  if (!hit) {
    hit = (async () => {
      const [index, questions, years] = await Promise.all([
        loadExamIndex(exam),
        fetchQuestionIndex(exam),
        loadYears(exam),
      ]);
      if (!years) throw new Error(`get-years unavailable for "${exam}"`);
      const ids = years.map((y) => y?.instance_id).filter((id): id is string => Boolean(id));
      return { index, questions, years: ids };
    })();
    examDataMemo.set(exam, hit);
  }
  return hit;
}

type Page = { base: Record<string, string>; pages: number };

/** Expands base params into page-1 params (`firstPage`) or /page/N params. */
function expand(entries: Page[], firstPage: boolean): Record<string, string>[] {
  const out: Record<string, string>[] = [];
  for (const locale of routing.locales) {
    for (const { base, pages } of entries) {
      if (firstPage) {
        out.push({ locale, ...base });
      } else {
        for (let page = 2; page <= pages; page++) out.push({ locale, ...base, page: String(page) });
      }
    }
  }
  return out;
}

async function chapterPages(): Promise<Page[]> {
  const out: Page[] = [];
  for (const exam of ALLOWED_EXAMS) {
    const { index, questions } = await examData(exam);
    const seen = new Set<string>();
    for (const level of index.levels) {
      for (const subject of level.subjects) {
        for (const chapter of subject.chapters) {
          const key = `${level.slug}/${subject.slug}/${chapter}`;
          if (seen.has(key)) continue;
          seen.add(key);
          out.push({
            base: { examName: exam, level_id: level.slug, subject_id: subject.slug, chapter_name: chapter },
            pages: pageCount(questions.chapters[chapter]?.length ?? 0),
          });
        }
      }
    }
  }
  return out;
}

async function subjectPages(): Promise<Page[]> {
  const out: Page[] = [];
  for (const exam of ALLOWED_EXAMS) {
    const { index, questions } = await examData(exam);
    const seen = new Set<string>();
    const subjects = index.levels.flatMap((level) =>
      level.subjects
        .filter((s) => {
          const key = `${level.slug}/${s.slug}`;
          if (seen.has(key)) return false;
          seen.add(key);
          return true;
        })
        .map((s) => ({ level: level.slug, subject: s })),
    );
    // Same exact-section call the subject page makes, so its chapter list
    // (and therefore its page count) is the page's own.
    const chapterLists = await mapLimit(subjects, 3, async ({ subject }) => {
      const slugs = await loadSubjectChapterSlugs(exam, subject.slug, subject.sectionId);
      if (!slugs) throw new Error(`subject chapters unavailable: ${exam}/${subject.slug}/${subject.sectionId}`);
      return slugs;
    });
    subjects.forEach(({ level, subject }, i) => {
      const total = chapterLists[i].reduce((sum, chapter) => sum + (questions.chapters[chapter]?.length ?? 0), 0);
      out.push({ base: { examName: exam, level_id: level, subject_id: subject.slug }, pages: pageCount(total) });
    });
  }
  return out;
}

async function yearPages(): Promise<Page[]> {
  const out: Page[] = [];
  for (const exam of ALLOWED_EXAMS) {
    const { index, questions, years } = await examData(exam);
    for (const level of index.levels) {
      for (const instanceId of years) {
        const slug = yearSlug(instanceId);
        if (!slug) continue;
        const total = yearQuestions(questions, instanceId.toUpperCase(), level.slug).length;
        out.push({ base: { examName: exam, level_id: level.slug, year_id: slug }, pages: pageCount(total) });
      }
    }
  }
  return out;
}

/** Home and other locale-only routes. */
export function localeStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

/** Exam-level routes (exam blog listing): every allowed exam in both locales. */
export function examStaticParams() {
  return routing.locales.flatMap((locale) => ALLOWED_EXAMS.map((examName) => ({ locale, examName })));
}

/** Level routes (level page, its subject and year listings): every level in
 * navigation, both locales. */
export async function levelStaticParams() {
  const out: Record<string, string>[] = [];
  for (const exam of ALLOWED_EXAMS) {
    const { index } = await examData(exam);
    for (const locale of routing.locales) {
      for (const level of index.levels) out.push({ locale, examName: exam, level_id: level.slug });
    }
  }
  return out;
}

/** Blog posts (Payload CMS): every post of every exam, both locales — a
 * post without a Hindi copy still answers 200 on /hi (English content,
 * canonical to English). */
export async function blogPostStaticParams() {
  const out: Record<string, string>[] = [];
  for (const exam of ALLOWED_EXAMS) {
    const examId = await resolveExamId(exam);
    if (!examId) continue;
    const posts = await getPostsByExam(examId, { limit: 1000 });
    for (const locale of routing.locales) {
      for (const post of posts) if (post.slug) out.push({ locale, examName: exam, slug: post.slug });
    }
  }
  return out;
}

export async function chapterStaticParams(firstPage: boolean) {
  return expand(await chapterPages(), firstPage);
}

export async function subjectStaticParams(firstPage: boolean) {
  return expand(await subjectPages(), firstPage);
}

export async function yearStaticParams(firstPage: boolean) {
  return expand(await yearPages(), firstPage);
}

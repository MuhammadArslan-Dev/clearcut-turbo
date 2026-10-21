// Build-time map for the old /question/<slug>-<id> URLs (en and /hi).
//
// app/[locale]/(blog)/question/[...questionId]/route.ts answers each of those
// with a 301 to the chapter page (and /page/N) that shows the question. To get
// there it loads the question, the exam index and the whole chapter (up to
// 4.4 MB) — 17–440 ms of CPU per hit, far over the Workers Free plan's 10 ms.
// This map holds the same answer for every question, prerendered at build
// time (app/api/question-redirects/[shard]); the CI workflow copies it into
// the static assets, and worker.ts answers from it before Next.js loads. A
// question missing from the map (added after the last build) still falls
// through to the route handler.
//
// Same data and order the chapter page and the route handler use:
// /blog/question-index lists each chapter's questions exactly as the chapter
// page renders them (lib/sitemap/question-pages.ts), so position -> page and
// the per-page Hindi rule match isHindiPage(loaded.cards, page).

import { ALLOWED_EXAMS } from "@/lib/exams";
import { isHindiPageByFlags } from "@/lib/question-bank/hindi-page";
import { QUESTIONS_PER_PAGE, pageOfIndex } from "@/lib/question-bank/pagination";
import { fetchQuestionIndex } from "@/lib/sitemap/question-index";
import { canonicalChapterPath } from "./exam-index";
import { loadExamIndex } from "./load-exam-index";

/** Number of shard files; a question lives in shard `id % SHARDS`. */
export const QUESTION_REDIRECT_SHARDS = 64;

/**
 * question id -> [chapter path without locale (page 1 URL), page, 1 when
 * that page has its own /hi canonical]. worker.ts builds the Location from it
 * exactly like chapterPageUrl() (lib/seo/question-redirect.ts).
 */
export type QuestionRedirectShard = Record<string, [string, number, 0 | 1]>;

let all: Promise<QuestionRedirectShard[]> | null = null;

async function buildAll(): Promise<QuestionRedirectShard[]> {
  const shards: QuestionRedirectShard[] = Array.from({ length: QUESTION_REDIRECT_SHARDS }, () => ({}));
  for (const exam of ALLOWED_EXAMS) {
    const [index, questions] = await Promise.all([loadExamIndex(exam), fetchQuestionIndex(exam)]);
    for (const [chapter, entries] of Object.entries(questions.chapters)) {
      // Same lookup as the route handler; chapters outside navigation 404 there.
      const path = canonicalChapterPath(index, chapter);
      if (!path) continue;
      const base = `/${exam}/${path.level}/subject/${path.subject}/${chapter}`;
      entries.forEach(([id], i) => {
        const page = pageOfIndex(i);
        const start = (page - 1) * QUESTIONS_PER_PAGE;
        const hindi = isHindiPageByFlags(entries.slice(start, start + QUESTIONS_PER_PAGE).map((e) => e[2] === 1));
        shards[id % QUESTION_REDIRECT_SHARDS][String(id)] = [base, page, hindi ? 1 : 0];
      });
    }
  }
  return shards;
}

/** One shard of the map. Throws on any backend failure (build must stop). */
export async function questionRedirectShard(shard: number): Promise<QuestionRedirectShard> {
  all ??= buildAll();
  return (await all)[shard] ?? {};
}

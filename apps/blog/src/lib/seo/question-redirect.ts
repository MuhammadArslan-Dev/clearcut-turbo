import type { ChapterPath } from "./exam-index";

/** "<slug>-<id>" or a bare "<id>" -> the numeric id, else null. */
export function parseQuestionId(param: string): string | null {
  const match = /(?:^|-)(\d+)$/.exec(param ?? "");
  return match ? match[1] : null;
}

/** "CTET_P1" / "CTET_2024" -> "ctet". */
export function examSlugFromQuestion(q: { stage_id_b?: string | null; exam_instance_id_b?: string | null }): string | null {
  const source = q.stage_id_b || q.exam_instance_id_b || "";
  const exam = source.split("_")[0]?.toLowerCase();
  return exam || null;
}

export function chapterPageUrl(opts: {
  siteUrl: string;
  locale: string;
  exam: string;
  path: ChapterPath;
  chapter: string;
  search?: string;
  questionId?: string;
  /** Chapter page holding the question (question-bank pagination); 1 or
   * omitted is the chapter URL itself. */
  page?: number;
}): string {
  const base = opts.siteUrl.replace(/\/+$/, "");
  const localePrefix = opts.locale === "hi" ? "/hi" : "";
  const search = opts.search && opts.search !== "?" ? opts.search : "";
  const hash = opts.questionId ? `#q-${opts.questionId}` : "";
  const pageSuffix = opts.page && opts.page > 1 ? `/page/${opts.page}` : "";
  return `${base}${localePrefix}/${opts.exam}/${opts.path.level}/subject/${opts.path.subject}/${opts.chapter}${pageSuffix}${search}${hash}`;
}

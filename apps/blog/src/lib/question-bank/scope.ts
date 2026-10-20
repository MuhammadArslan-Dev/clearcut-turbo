import type { Question } from "@/components/blog/assessment-question/questions-list";
import { buildCards, renderIndexById, type CardQuestion, type GroupBy } from "./card-model";
import { loadChapterQuestions, loadSubjectQuestions, loadYearQuestions } from "./load";

// A question-bank page's scope: one chapter, one subject, or one year paper
// of a level. The page and the search index route both load a scope through
// here, so they always agree on order, numbering and page boundaries.

export type QuestionScope =
  | { kind: "chapter"; exam: string; chapter: string }
  /** `section`: the level's own section code (exam index); omitted only when
   * the index is unavailable — the backend then matches by exam prefix. */
  | { kind: "subject"; exam: string; subject: string; section?: string }
  | { kind: "year"; exam: string; level: string; year: string };

export const GROUP_BY: Record<QuestionScope["kind"], GroupBy> = {
  // One chapter's questions group by topic; a subject's by chapter; a whole
  // year paper by subject ("section" in the backend).
  chapter: "topic",
  subject: "chapter",
  year: "section",
};

/** "ctet-2024" -> "CTET_2024", the backend's exam instance id. */
export const toExamYear = (yearSlug: string) => yearSlug.replace(/-/g, "_").toUpperCase();

export type LoadedScope = {
  /** False when the backend failed — the page shows an error, not "empty". */
  ok: boolean;
  raw: Question[];
  cards: CardQuestion[];
};

export async function loadScope(scope: QuestionScope): Promise<LoadedScope> {
  let raw: Question[] | null;
  let chapterIndexById: ReadonlyMap<number, number> | undefined;
  if (scope.kind === "chapter") {
    raw = await loadChapterQuestions(scope.exam, scope.chapter);
    if (raw) chapterIndexById = renderIndexById(raw);
  } else if (scope.kind === "subject") {
    const subject = await loadSubjectQuestions(scope.exam, scope.subject, scope.section);
    raw = subject?.questions ?? null;
    chapterIndexById = subject?.chapterIndexById;
  } else {
    raw = await loadYearQuestions(toExamYear(scope.year), scope.level);
  }
  if (!raw) return { ok: false, raw: [], cards: [] };
  return { ok: true, raw, cards: buildCards(raw, GROUP_BY[scope.kind], chapterIndexById) };
}

/** URL of the scope's search index (app/api/question-search/route.ts). */
export function searchIndexPath(scope: QuestionScope): string {
  const params = new URLSearchParams({ scope: scope.kind, exam: scope.exam });
  if (scope.kind === "chapter") params.set("chapter", scope.chapter);
  if (scope.kind === "subject") {
    params.set("subject", scope.subject);
    if (scope.section) params.set("section", scope.section);
  }
  if (scope.kind === "year") {
    params.set("level", scope.level);
    params.set("year", scope.year);
  }
  return `/api/question-search?${params}`;
}

const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
// Backend section codes: "CTET_L1_ENG", "HTET_COM_MATH".
const SECTION_RE = /^[A-Z0-9]+(?:_[A-Z0-9]+)*$/;

/** Parses the search route's query; null for anything malformed. Existence
 * of the slugs is checked by the route against the exam index. */
export function parseScopeQuery(params: URLSearchParams): QuestionScope | null {
  const exam = params.get("exam") ?? "";
  const slug = (key: string) => {
    const v = params.get(key) ?? "";
    return v.length <= 120 && SLUG_RE.test(v) ? v : null;
  };
  if (!SLUG_RE.test(exam)) return null;
  switch (params.get("scope")) {
    case "chapter": {
      const chapter = slug("chapter");
      return chapter ? { kind: "chapter", exam, chapter } : null;
    }
    case "subject": {
      const subject = slug("subject");
      const section = params.get("section");
      if (!subject) return null;
      if (section === null) return { kind: "subject", exam, subject };
      return section.length <= 40 && SECTION_RE.test(section) ? { kind: "subject", exam, subject, section } : null;
    }
    case "year": {
      const level = slug("level");
      const year = slug("year");
      return level && year && /^[a-z]+-\d{4}$/.test(year) ? { kind: "year", exam, level, year } : null;
    }
    default:
      return null;
  }
}

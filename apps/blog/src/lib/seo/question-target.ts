// Where an old /question/<slug>-<id> URL goes (phase 125). Pure: the route
// handler (app/[locale]/(blog)/question/[...questionId]/route.ts) loads the
// cached indexes and the backend row, this file only decides.
//
// Questions live on chapter pages; an old question URL 301s, in one hop, to
// the canonical chapter page (incl. /page/N) that renders it. A question that
// no chapter page renders (its chapter has no slug, or the chapter is not in
// navigation) goes to the nearest page that exists: its subject page, else
// its level, else the exam.

import { QUESTIONS_PER_PAGE, pageOfIndex } from "@/lib/question-bank/pagination";
import { isHindiPageByFlags } from "@/lib/question-bank/hindi-page";
import type { IndexEntry, QuestionIndex } from "@/lib/sitemap/question-pages";
import {
  canonicalChapterPath,
  resolveSubjectRoute,
  subjectPageHasChapters,
  type ChapterPath,
  type ExamIndex,
} from "./exam-index";

/** The chapter page that renders a question. */
export type ChapterTarget = {
  exam: string;
  chapter: string;
  path: ChapterPath;
  /** 1-based page of the chapter that shows the question. */
  page: number;
  /** That page has its own Hindi version (hindi-page.ts). */
  hindi: boolean;
};

type Located = { chapter: string; at: number; entries: IndexEntry[] };

// question id -> its place in the index, built once per loaded index object.
const positions = new WeakMap<QuestionIndex, Map<number, Located>>();

function positionsOf(index: QuestionIndex): Map<number, Located> {
  let map = positions.get(index);
  if (!map) {
    map = new Map();
    for (const [chapter, entries] of Object.entries(index.chapters)) {
      entries.forEach(([id], at) => {
        if (!map!.has(id)) map!.set(id, { chapter, at, entries });
      });
    }
    positions.set(index, map);
  }
  return map;
}

/** The chapter page holding question `id`, from the cached indexes alone (no
 * backend call); null when no listed chapter page renders it. */
export function locateQuestion(id: number, exam: ExamIndex, index: QuestionIndex): ChapterTarget | null {
  const hit = positionsOf(index).get(id);
  if (!hit) return null;
  const path = canonicalChapterPath(exam, hit.chapter);
  if (!path) return null;
  const page = pageOfIndex(hit.at);
  const start = (page - 1) * QUESTIONS_PER_PAGE;
  const flags = hit.entries.slice(start, start + QUESTIONS_PER_PAGE).map((e) => e[2] === 1);
  return { exam: exam.exam, chapter: hit.chapter, path, page, hindi: isHindiPageByFlags(flags) };
}

/** Level slug for a question's stage: "CTET_P1" -> "paper-1", "HTET_L3" ->
 * "level-3-pgt" (whatever the navigation calls that level). */
export function levelForStage(exam: ExamIndex, stage: string | null | undefined): string | null {
  const m = /_([PL])(\d+)$/.exec(stage ?? "");
  if (!m) return null;
  const want = new RegExp(`^${m[1] === "P" ? "paper" : "level"}-${m[2]}(?:-|$)`);
  return exam.levels.find((l) => want.test(l.slug))?.slug ?? null;
}

/** The nearest existing listing for a question no chapter page renders,
 * as a site-relative English path. */
export function parentPathFor(
  exam: ExamIndex,
  q: { stage_id_b?: string | null; section_id_b?: string | null },
): { path: string; hub: boolean } {
  const level = levelForStage(exam, q.stage_id_b);
  if (!level) return { path: `/${exam.exam}`, hub: true };
  const subject = exam.levels
    .find((l) => l.slug === level)
    ?.subjects.find((s) => s.sectionId === q.section_id_b);
  if (subject && subjectPageHasChapters(exam, level, subject.slug)) {
    const r = resolveSubjectRoute(exam, level, subject.slug);
    const canonicalLevel = r.kind === "ok" ? r.canonical.level : level;
    return { path: `/${exam.exam}/${canonicalLevel}/subject/${subject.slug}`, hub: false };
  }
  return { path: `/${exam.exam}/${level}`, hub: true };
}

/** A chapter page for a question the backend knows but the index doesn't
 * list (e.g. no translation yet): page 1 of its canonical chapter. */
export function chapterFallback(exam: ExamIndex, chapter: string | null | undefined): ChapterPath | null {
  return chapter ? canonicalChapterPath(exam, chapter) : null;
}

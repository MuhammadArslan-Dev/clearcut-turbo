import { cache } from "react";
import type { Question } from "@/components/blog/assessment-question/questions-list";
import { fetchQuestionIndex } from "@/lib/sitemap/question-index";
import { yearQuestions, type IndexEntry } from "@/lib/sitemap/question-pages";
import { buildCards, cardLabels, type CardLabel, type CardQuestion } from "./card-model";
import { isBilingualCard, isHindiPageByFlags } from "./hindi-page";
import { loadQuestionsByIds, loadSubjectSection } from "./load";
import { QUESTIONS_PER_PAGE } from "./pagination";
import { GROUP_BY, loadScope, toExamYear, type LoadedScope, type QuestionScope } from "./scope";

// One page of a chapter/subject/year question bank, without downloading the
// whole scope. The page's question ids, in page order, come from the cached
// /blog/question-index (the same per-page lists the sitemaps use — checked on
// 2026-10-21 against every chapter and year page: identical ids, order and
// bilingual flags), and only those ~20 questions are fetched in full
// (/blog/get-questions-by-ids). A scope used to be 0.2–16 MB per render.
//
// If anything on that path is unavailable (index, by-ids endpoint, a missing
// question) the page is built from the full scope exactly as before, so the
// result never depends on which path served it. The search index route keeps
// using loadScope (it needs every question). docs/phases/16 part C.

/** A subject's chapter, for its chapter links / filter. */
export type ScopeChapter = { slug: string; labels: CardLabel[]; count: number };

export type ScopePage = {
  /** False when the backend failed — the page shows an error, not "empty". */
  ok: boolean;
  /** Questions in the whole scope (every page). */
  total: number;
  /** This page's cards; `position` counts across the whole scope. */
  cards: CardQuestion[];
  /** This page's raw questions (structured data, chapter name). */
  raw: Question[];
  /** Subject pages: their chapters with questions, in page order. */
  chapters: ScopeChapter[];
};

/** Whether this page has a genuinely Hindi /hi version (hindi-page.ts). */
export function isHindiScopePage(data: ScopePage): boolean {
  return isHindiPageByFlags(data.cards.map(isBilingualCard));
}

/** Chapters in order of first appearance, with their first card's labels. */
function chaptersOfCards(cards: CardQuestion[]): ScopeChapter[] {
  const chapters = new Map<string, ScopeChapter>();
  for (const card of cards) {
    if (!card.chapterSlug) continue;
    const hit = chapters.get(card.chapterSlug);
    if (hit) hit.count++;
    else chapters.set(card.chapterSlug, { slug: card.chapterSlug, labels: card.labels, count: 1 });
  }
  return [...chapters.values()];
}

/** The old way: the whole scope, sliced (exported for the parity test). */
export function fromFullScope(loaded: LoadedScope, page: number, scope: QuestionScope): ScopePage {
  const start = (page - 1) * QUESTIONS_PER_PAGE;
  const cards = loaded.cards.slice(start, start + QUESTIONS_PER_PAGE);
  const ids = new Set(cards.map((c) => c.id));
  return {
    ok: loaded.ok,
    total: loaded.cards.length,
    cards,
    raw: loaded.raw.filter((q) => ids.has(q.id)),
    chapters: scope.kind === "subject" ? chaptersOfCards(loaded.cards) : [],
  };
}

type Ordered = {
  entries: IndexEntry[];
  /** question id -> 0-based index on its own chapter page (chapter/subject). */
  chapterIndexById?: Map<number, number>;
  chapters: ScopeChapter[];
};

/** The scope's questions in page order, from the question index; null when
 * the index (or the subject's section) is unavailable. */
async function orderedEntries(scope: QuestionScope): Promise<Ordered | null> {
  let index;
  try {
    index = await fetchQuestionIndex(scope.exam);
  } catch {
    return null;
  }
  if (scope.kind === "chapter") {
    const entries = index.chapters[scope.chapter] ?? [];
    return { entries, chapterIndexById: new Map(entries.map(([id], i) => [id, i])), chapters: [] };
  }
  if (scope.kind === "year") {
    return { entries: yearQuestions(index, toExamYear(scope.year), scope.level), chapters: [] };
  }
  const section = await loadSubjectSection(scope.exam, scope.subject, scope.section);
  if (!section) return null;
  const entries: IndexEntry[] = [];
  const chapterIndexById = new Map<number, number>();
  const chapters: ScopeChapter[] = [];
  for (const slug of section.chapters) {
    const list = index.chapters[slug] ?? [];
    list.forEach(([id], i) => chapterIndexById.set(id, i));
    entries.push(...list);
    if (list.length > 0) {
      // A card's chapter label is cardLabels() of its question's chapter —
      // the same chapter record the section lists.
      const labels = cardLabels({ chapter: section.chapterInfo[slug] } as Question, "chapter");
      chapters.push({ slug, labels, count: list.length });
    }
  }
  return { entries, chapterIndexById, chapters };
}

export async function pagedScope(scope: QuestionScope, page: number): Promise<ScopePage | null> {
  const ordered = await orderedEntries(scope);
  if (!ordered) return null;
  const start = (page - 1) * QUESTIONS_PER_PAGE;
  const ids = ordered.entries.slice(start, start + QUESTIONS_PER_PAGE).map(([id]) => id);

  let raw: Question[] = [];
  if (ids.length > 0) {
    const fetched = await loadQuestionsByIds(scope.exam, ids.join(","));
    if (!fetched) return null;
    const byId = new Map(fetched.map((q) => [q.id, q]));
    if (ids.some((id) => !byId.has(id))) return null;
    raw = ids.map((id) => byId.get(id) as Question);
  }

  const cards = buildCards(raw, GROUP_BY[scope.kind], ordered.chapterIndexById).map((card, i) => ({
    ...card,
    position: start + i + 1,
  }));
  // Every listed question renders (the index lists only translated ones); if
  // one doesn't, positions would shift — use the full scope instead.
  if (cards.length !== raw.length) return null;

  return { ok: true, total: ordered.entries.length, cards, raw, chapters: ordered.chapters };
}

const loadScopePageCached = cache(async (scopeKey: string, page: number): Promise<ScopePage> => {
  const scope = JSON.parse(scopeKey) as QuestionScope;
  const paged = await pagedScope(scope, page).catch(() => null);
  return paged ?? fromFullScope(await loadScope(scope), page, scope);
});

/** One page of a question-bank scope. Page and metadata share one load. */
export function loadScopePage(scope: QuestionScope, page: number): Promise<ScopePage> {
  return loadScopePageCached(JSON.stringify(scope), page);
}

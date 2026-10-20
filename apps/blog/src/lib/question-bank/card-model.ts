// The trimmed per-question model the question-bank pages render from. Raw
// backend questions carry ids, timestamps, slugs, topic trees and every
// locale's translation; a card needs only what it shows. Built on the server,
// never sent whole to the browser: cards are Server Components, and only the
// small interactive bits cross into client components.
//
// Course language (`useLanguageStore().courseLanguage`, en | hi) is chosen in
// the browser, so a card renders the translation picked for each language
// with `selectTranslation` and marks it `show: "en" | "hi"` — CSS hides the
// one not selected (see `[data-course-lang]` in globals.css). Most questions
// have one translation, which shows for both.

import type { Question, Translation } from "@/components/blog/assessment-question/questions-list";
import { getLocalizedEntityName, selectTranslation } from "@/utils/question-translation";
import { getGroupOptions, stripHtml } from "@/utils/section-search";
import { pageOfIndex } from "./pagination";

/** What a page groups/filters questions by: one chapter's questions by topic,
 * a subject's by chapter, a year's by subject ("section" in the backend). */
export type GroupBy = "topic" | "chapter" | "section";
export type CourseLang = "en" | "hi";
/** Which course language a rendered block belongs to. */
export type LangScope = "both" | CourseLang;

export interface CardOption {
  n: number; // 1..4
  text: string | null;
  image: string | null;
}

export interface CardBlock {
  show: LangScope;
  locale: string;
  question: string;
  questionImage: string | null;
  options: CardOption[];
  correct: number; // 1..4, 0 when unknown
  explanation: string | null;
}

export interface CardLabel {
  show: LangScope;
  text: string;
}

export interface CardQuestion {
  id: number;
  /** 1-based position in the whole chapter/subject/year (not the page). */
  position: number;
  chapterSlug: string | null;
  /** Page of this question on its own chapter page, when known. */
  chapterPage: number | null;
  labels: CardLabel[];
  blocks: CardBlock[];
}

function groupLabel(q: Question, groupBy: GroupBy, lang: CourseLang): string | null {
  if (groupBy === "chapter") return getLocalizedEntityName(q.chapter, q.chapter?.translations, lang);
  if (groupBy === "section") return getLocalizedEntityName(q.section, q.section?.description, lang);
  return getLocalizedEntityName(q.topic, q.topic?.translations, lang);
}

function toBlock(t: Translation, show: LangScope): CardBlock {
  const options: CardOption[] = [];
  for (const n of [1, 2, 3, 4] as const) {
    const text = t[`option_${n}_text`] ?? null;
    const image = t[`option_${n}_image`] ?? null;
    if (text || image) options.push({ n, text, image });
  }
  return {
    show,
    locale: t.locale,
    question: t.question ?? "",
    questionImage: t.question_image || null,
    options,
    correct: Number(t.correct_option) || 0,
    explanation: t.explanation || null,
  };
}

/** One block per distinct translation the two course languages select. */
export function cardBlocks(translations: Translation[] | null | undefined): CardBlock[] {
  const en = selectTranslation(translations, "en");
  const hi = selectTranslation(translations, "hi");
  if (!en || !hi) return [];
  if (en === hi) return [toBlock(en, "both")];
  return [toBlock(en, "en"), toBlock(hi, "hi")];
}

export function cardLabels(q: Question, groupBy: GroupBy): CardLabel[] {
  const en = groupLabel(q, groupBy, "en");
  const hi = groupLabel(q, groupBy, "hi");
  if (en === hi) return en ? [{ show: "both", text: en }] : [];
  return [
    ...(en ? [{ show: "en" as const, text: en }] : []),
    ...(hi ? [{ show: "hi" as const, text: hi }] : []),
  ];
}

/** Each rendered question's 0-based index in `questions` (questions with no
 * translation render no card and take no slot — same rule as buildCards). */
export function renderIndexById(questions: Question[]): Map<number, number> {
  const out = new Map<number, number>();
  for (const q of questions) {
    if (cardBlocks(q.translations).length > 0) out.set(q.id, out.size);
  }
  return out;
}

/**
 * Cards for every question of a chapter/subject/year, in page order.
 * Questions with no translation at all are dropped (nothing to render — the
 * old card returned null for them too), so positions count rendered cards.
 * `chapterIndexById`: each question's 0-based index on its own chapter page,
 * when the caller knows it (chapter and subject pages do).
 */
export function buildCards(
  questions: Question[],
  groupBy: GroupBy,
  chapterIndexById?: ReadonlyMap<number, number>,
): CardQuestion[] {
  const cards: CardQuestion[] = [];
  for (const q of questions) {
    const blocks = cardBlocks(q.translations);
    if (blocks.length === 0) continue;
    const chapterIndex = chapterIndexById?.get(q.id);
    cards.push({
      id: q.id,
      position: cards.length + 1,
      chapterSlug: q.chapter?.slug ?? null,
      chapterPage: chapterIndex === undefined ? null : pageOfIndex(chapterIndex),
      labels: cardLabels(q, groupBy),
      blocks,
    });
  }
  return cards;
}

export function labelFor(card: CardQuestion, lang: CourseLang): string | null {
  return card.labels.find((l) => l.show === "both" || l.show === lang)?.text ?? null;
}

/** Filter groups present on a page, per course language, first-seen order. */
export function groupsByLang(cards: CardQuestion[]): Record<CourseLang, string[]> {
  return {
    en: getGroupOptions(cards.map((c) => labelFor(c, "en"))),
    hi: getGroupOptions(cards.map((c) => labelFor(c, "hi"))),
  };
}

/** Plain text a visitor sees for one block: [question, options joined]. */
export function blockSearchText(block: CardBlock): [string, string] {
  return [
    stripHtml(block.question).trim(),
    block.options.map((o) => stripHtml(o.text)).filter(Boolean).join(" ").trim(),
  ];
}

/** One entry of the lazily-loaded, all-pages search index. */
export interface SearchIndexItem {
  id: number;
  /** 1-based position in the whole scope ("Question N"). */
  n: number;
  /** Page the question is on. */
  p: number;
  /** Group label per course language (hi omitted when equal to en). */
  g: string | null;
  gh?: string | null;
  /** [question, options] text for English; `h` for Hindi when different. */
  t: [string, string];
  h?: [string, string];
}

export function searchIndexItems(cards: CardQuestion[]): SearchIndexItem[] {
  return cards.map((c, i) => {
    const en = c.blocks.find((b) => b.show !== "hi") as CardBlock;
    const hi = c.blocks.find((b) => b.show === "hi");
    const gEn = labelFor(c, "en");
    const gHi = labelFor(c, "hi");
    return {
      id: c.id,
      n: c.position,
      p: pageOfIndex(i),
      g: gEn,
      ...(gHi !== gEn ? { gh: gHi } : {}),
      t: blockSearchText(en),
      ...(hi ? { h: blockSearchText(hi) } : {}),
    };
  });
}

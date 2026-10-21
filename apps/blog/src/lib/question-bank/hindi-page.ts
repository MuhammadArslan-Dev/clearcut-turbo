// When a question-bank page's /hi URL is a genuinely Hindi page.
//
// A card has a separate Hindi block only when its question has both an
// English and a Hindi translation (card-model's `show: "hi"`). Sections are
// either fully bilingual (CDP, Maths, EVS, ...), English-only (English
// language), Hindi-only (Hindi language) or Sanskrit-only; for the
// monolingual ones /hi would show exactly the English URL's content, so only
// pages whose questions are mostly bilingual get their own /hi canonical,
// hreflang and sitemap entry. Year pages mix sections, so this is decided
// per page (QUESTIONS_PER_PAGE), not per scope.

import type { CardQuestion, CourseLang } from "./card-model";
import { pageSlice } from "./pagination";

export type { CourseLang };

/** Share of a page's questions that must be bilingual for /hi to be its own page. */
export const HINDI_PAGE_MIN_SHARE = 0.5;

export function isBilingualCard(card: CardQuestion): boolean {
  return card.blocks.some((b) => b.show === "hi");
}

/** One flag per question on the page: does it have its own Hindi version? */
export function isHindiPageByFlags(flags: readonly boolean[]): boolean {
  if (flags.length === 0) return false;
  const bilingual = flags.filter(Boolean).length;
  return bilingual > 0 && bilingual / flags.length >= HINDI_PAGE_MIN_SHARE;
}

/** Whether page `page` of `cards` has a genuinely Hindi /hi version. */
export function isHindiPage(cards: readonly CardQuestion[], page: number): boolean {
  return isHindiPageByFlags(pageSlice(cards, page).map(isBilingualCard));
}

/**
 * Course language the cards show: the URL decides (product decision
 * 2026-10-21, docs/phases/16 part D). /hi pages always show Hindi, English
 * URLs always show English, whatever the browser has saved; the language
 * modal changes the URL instead of a stored preference.
 */
export function courseLangFor(locale: string): CourseLang {
  return locale === "hi" ? "hi" : "en";
}

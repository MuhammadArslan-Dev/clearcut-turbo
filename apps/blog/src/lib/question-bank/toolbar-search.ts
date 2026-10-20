// Pure search logic behind the question-bank toolbar: matching this page's
// cards and the all-pages search index the same way the old in-memory search
// did (question + option text, or the group label; explanation excluded).

import { limitWords } from "@clearcut/utils/text-limit";
import type { CourseLang, SearchIndexItem } from "./card-model";

export const MIN_SUGGESTION_QUERY_LENGTH = 2;
export const MAX_SUGGESTIONS = 8;

export interface SearchRow {
  id: number;
  n: number;
  page: number;
  /** Lowercased question + options text. */
  text: string;
  /** Question text as shown, for the suggestion snippet. */
  question: string;
  group: string | null;
}

export interface Suggestion {
  id: number;
  n: number;
  page: number;
  snippet: string;
  groupLabel: string | null;
}

export function matchesRow(row: { text: string; group: string | null }, query: string): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  return row.text.includes(q) || (row.group ?? "").toLowerCase().includes(q);
}

/** Index rows for one course language. */
export function indexRows(items: SearchIndexItem[], lang: CourseLang): SearchRow[] {
  return items.map((item) => {
    const [question, options] = lang === "hi" && item.h ? item.h : item.t;
    const group = lang === "hi" && item.gh !== undefined ? item.gh : item.g;
    return { id: item.id, n: item.n, page: item.p, text: `${question} ${options}`.toLowerCase(), question, group };
  });
}

export function suggestionsFor(rows: SearchRow[], query: string, fallbackSnippet: string): Suggestion[] {
  const q = query.trim();
  if (q.length < MIN_SUGGESTION_QUERY_LENGTH) return [];
  const out: Suggestion[] = [];
  for (const row of rows) {
    if (!matchesRow(row, q)) continue;
    out.push({
      id: row.id,
      n: row.n,
      page: row.page,
      snippet: limitWords(row.question, 14) || fallbackSnippet,
      groupLabel: row.group,
    });
    if (out.length >= MAX_SUGGESTIONS) break;
  }
  return out;
}

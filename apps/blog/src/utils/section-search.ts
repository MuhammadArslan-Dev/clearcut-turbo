// Pure helpers behind the section/year/subject pages' in-page search and
// group filter (by topic, chapter, or subject — see `groupBy` on
// components/question-bank/). Kept framework-free and side-effect-free
// so the matching/derivation logic is unit-testable without a DOM — the React
// layer only wires these to className toggles, it doesn't own any matching
// logic itself.

export function stripHtml(html: string | null | undefined): string {
  return (html ?? "").replace(/<[^>]*>/g, "");
}

// Plain-text haystack for one question: question text + all four option
// texts, stripped of markup. Explanation is deliberately excluded — search
// is meant to help a visitor find a question, not surface unrelated
// questions whose explanation happens to mention the typed term.
export function buildSearchText(fields: {
  question?: string | null;
  option_1_text?: string | null;
  option_2_text?: string | null;
  option_3_text?: string | null;
  option_4_text?: string | null;
}): string {
  return [
    fields.question,
    fields.option_1_text,
    fields.option_2_text,
    fields.option_3_text,
    fields.option_4_text,
  ]
    .map(stripHtml)
    .join(" ")
    .toLowerCase();
}

export function matchesSearch(searchText: string, query: string): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  return searchText.includes(q);
}

// Unique group labels across a page's questions, in first-seen order — real
// data already present on each question (topic/chapter/section relation,
// depending on `groupBy`), nothing fabricated. Questions with no label for
// the active grouping are excluded from the chip list (there's nothing to
// filter by) but still always match "All".
export function getGroupOptions(labels: (string | null | undefined)[]): string[] {
  const seen = new Set<string>();
  const result: string[] = [];
  for (const raw of labels) {
    const name = raw?.trim();
    if (name && !seen.has(name)) {
      seen.add(name);
      result.push(name);
    }
  }
  return result;
}

export function matchesGroup(
  groupLabel: string | null | undefined,
  activeGroup: string | null,
): boolean {
  if (!activeGroup) return true;
  return groupLabel === activeGroup;
}

// Combined search match: question/option text (via buildSearchText) OR the
// question's own active-grouping label (topic/chapter/subject name). Used
// for BOTH the main hide/show filtering and the live suggestions dropdown,
// so the two stay consistent — a question the dropdown finds because its
// group label matched is guaranteed to already be visible (not `hidden`) by
// the same test, rather than two independently drifting matchers.
export function matchesQuestionText(
  row: { searchText: string; groupLabel?: string | null },
  query: string,
): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  if (row.searchText.includes(q)) return true;
  return (row.groupLabel ?? "").toLowerCase().includes(q);
}

// Pagination for the question-bank pages (chapter, subject, year). Page 1 is
// the existing URL; page N >= 2 lives at "<base>/page/N". Pure, so the page
// routes, the search index route and the tests all agree on page boundaries.

export const QUESTIONS_PER_PAGE = 50;

export function pageCount(total: number, perPage = QUESTIONS_PER_PAGE): number {
  return Math.max(1, Math.ceil(Math.max(0, total) / perPage));
}

/** 1-based page that holds the item at 0-based `index`. */
export function pageOfIndex(index: number, perPage = QUESTIONS_PER_PAGE): number {
  return Math.floor(Math.max(0, index) / perPage) + 1;
}

export function pageSlice<T>(items: readonly T[], page: number, perPage = QUESTIONS_PER_PAGE): T[] {
  const start = (page - 1) * perPage;
  return items.slice(start, start + perPage);
}

export type PageParam =
  | { kind: "ok"; page: number }
  /** "/page/1" — the first page's only URL is the base path. */
  | { kind: "redirectToBase" }
  | { kind: "notFound" };

/** Validates the `[page]` segment. Only a plain decimal integer >= 1 without
 * leading zeros is a page ("02", "2.0", "abc" are not), so every page has
 * exactly one URL. Whether the page exists is checked against the total
 * separately (see `pageExists`). */
export function parsePageParam(raw: string | undefined): PageParam {
  if (!raw || !/^[1-9]\d{0,5}$/.test(raw)) return { kind: "notFound" };
  const page = Number(raw);
  if (page === 1) return { kind: "redirectToBase" };
  return { kind: "ok", page };
}

export function pageExists(page: number, total: number, perPage = QUESTIONS_PER_PAGE): boolean {
  return page >= 1 && page <= pageCount(total, perPage);
}

/** Path of page `page` under `basePath` (no trailing slash, may include a
 * locale prefix). Page 1 is the base path itself. */
export function pagePath(basePath: string, page: number): string {
  const base = basePath.replace(/\/+$/, "");
  return page <= 1 ? base || "/" : `${base}/page/${page}`;
}

/** Title/description/canonical-path suffixes for page N >= 2 (page 1 has
 * none, so its canonical stays the base URL). */
export function pageSeo(page: number | undefined) {
  if (!page || page <= 1) return { titleSuffix: "", descriptionSuffix: "", pathSuffix: "" };
  return { titleSuffix: ` - Page ${page}`, descriptionSuffix: ` Page ${page}.`, pathSuffix: `/page/${page}` };
}

/** Metadata-side page number: same parsing as the page, but never
 * redirects/404s (the page itself does that). */
export function metadataPage(raw: string | undefined): number {
  const parsed = raw === undefined ? null : parsePageParam(raw);
  return parsed?.kind === "ok" ? parsed.page : 1;
}

/** Page numbers to show in the pagination bar: always the first and last,
 * plus a window around the current page; `null` marks a gap. */
export function pageWindow(current: number, total: number, radius = 1): (number | null)[] {
  const pages = new Set<number>([1, total]);
  for (let p = current - radius; p <= current + radius; p++) {
    if (p >= 1 && p <= total) pages.add(p);
  }
  const sorted = [...pages].sort((a, b) => a - b);
  const out: (number | null)[] = [];
  for (let i = 0; i < sorted.length; i++) {
    if (i > 0 && sorted[i] - sorted[i - 1] > 1) out.push(null);
    out.push(sorted[i]);
  }
  return out;
}

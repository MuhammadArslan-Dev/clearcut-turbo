import { notFound } from "next/navigation";
import { permanentRedirect } from "@/i18n/navigation";
import type { AppLocale } from "@/types/components/language";
import { pageExists, parsePageParam } from "@/lib/question-bank/pagination";

// Re-exported for the page modules; the pure helpers live (and are tested) in
// lib/question-bank/pagination.ts.

/** Page number from the optional `[page]` segment: undefined is page 1,
 * "/page/1" permanently redirects to the base URL, anything malformed 404s. */
export function resolvePageParam(raw: string | undefined, basePath: string, locale: string): number {
  if (raw === undefined) return 1;
  const parsed = parsePageParam(raw);
  if (parsed.kind === "notFound") notFound();
  if (parsed.kind === "redirectToBase") permanentRedirect({ href: basePath, locale: locale as AppLocale });
  // permanentRedirect throws; this is only reached for "ok".
  return parsed.kind === "ok" ? parsed.page : 1;
}

/** 404 a page number past the last page (page 1 always exists) — but only
 * once the questions really loaded: a backend failure must surface as a
 * server error (crawlers retry 5xx), never as a 404 or an empty 200 page
 * that could get a real page dropped from the index. */
export function assertPageExists(page: number, total: number, loaded: boolean) {
  if (!loaded) throw new Error("Question-bank data unavailable");
  if (!pageExists(page, total)) notFound();
}

export { metadataPage, pageSeo } from "@/lib/question-bank/pagination";

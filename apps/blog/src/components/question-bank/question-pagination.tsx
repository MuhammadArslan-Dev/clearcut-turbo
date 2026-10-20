import { getTranslations } from "next-intl/server";
import { cn } from "@clearcut/ui/utils";
import { QUESTIONS_PER_PAGE, pagePath, pageWindow } from "@/lib/question-bank/pagination";

const linkClass =
  "inline-flex min-w-10 items-center justify-center rounded-lg border px-3 py-1.5 body-medium !font-semibold focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50";
const idleClass =
  "border-[var(--color-border-gray-subtle)] bg-white surface-text-gray-normal hover:bg-[var(--color-background-gray-subtle)]";
const currentClass = "border-[var(--color-brand)] bg-[var(--color-brand)] text-white";

/**
 * Crawlable pagination: plain `<a href>` to each page's own URL (Google
 * follows links, not buttons, and ignores rel=prev/next). A plain anchor,
 * not next/link: no background prefetch of other pages' (large) payloads,
 * and leaving a page frees it instead of keeping it in the client router
 * cache.
 */
export default async function QuestionPagination({
  locale,
  basePath,
  page,
  totalPages,
  total,
}: {
  locale: string;
  /** Locale-prefixed path of page 1. */
  basePath: string;
  page: number;
  totalPages: number;
  /** Questions in the whole chapter/subject/year. */
  total: number;
}) {
  if (totalPages <= 1) return null;
  const t = await getTranslations({ locale, namespace: "QuestionPagination" });
  const from = (page - 1) * QUESTIONS_PER_PAGE + 1;
  const to = Math.min(page * QUESTIONS_PER_PAGE, total);

  return (
    <nav aria-label={t("label")} className="bg-white rounded-none md:rounded-lg border border-[var(--color-border-gray-subtle)] p-3 space-y-3">
      <p className="body-small !font-normal surface-text-gray-muted text-center">
        {t("range", { from, to, total, page, pages: totalPages })}
      </p>
      <ul className="flex flex-wrap items-center justify-center gap-2">
        {page > 1 && (
          <li>
            <a href={pagePath(basePath, page - 1)} rel="prev" className={cn(linkClass, idleClass)}>
              {t("previous")}
            </a>
          </li>
        )}
        {pageWindow(page, totalPages).map((p, i) =>
          p === null ? (
            <li key={`gap-${i}`} aria-hidden="true" className="px-1 surface-text-gray-muted">
              …
            </li>
          ) : (
            <li key={p}>
              <a
                href={pagePath(basePath, p)}
                aria-current={p === page ? "page" : undefined}
                aria-label={t("pageN", { page: p })}
                className={cn(linkClass, p === page ? currentClass : idleClass)}
              >
                {p}
              </a>
            </li>
          ),
        )}
        {page < totalPages && (
          <li>
            <a href={pagePath(basePath, page + 1)} rel="next" className={cn(linkClass, idleClass)}>
              {t("next")}
            </a>
          </li>
        )}
      </ul>
    </nav>
  );
}

import { getTranslations } from "next-intl/server";
import { cn } from "@clearcut/ui/utils";
import { Link } from "@/i18n/navigation";
import { unprefixedPath } from "./question-bank-view";
import { QUESTIONS_PER_PAGE, pagePath, pageWindow } from "@/lib/question-bank/pagination";

const linkClass =
  "inline-flex min-w-10 items-center justify-center rounded-lg border px-3 py-1.5 body-medium !font-semibold focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50";
const idleClass =
  "border-[var(--color-border-gray-subtle)] bg-white surface-text-gray-normal hover:bg-[var(--color-background-gray-subtle)]";
const currentClass = "border-[var(--color-brand)] bg-[var(--color-brand)] text-white";

/**
 * Crawlable pagination: a locale-aware `Link` (an `<a href>` in the HTML) to
 * each page's own URL — Google follows links, not buttons, and ignores
 * rel=prev/next. `prefetch={false}`: no background prefetch of other pages'
 * (large) payloads.
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
  const href = (p: number) => unprefixedPath(locale, pagePath(basePath, p));
  const to = Math.min(page * QUESTIONS_PER_PAGE, total);

  return (
    <nav aria-label={t("label")} className="bg-white rounded-none md:rounded-lg border border-[var(--color-border-gray-subtle)] p-3 space-y-3">
      <p className="body-small !font-normal surface-text-gray-muted text-center">
        {t("range", { from, to, total, page, pages: totalPages })}
      </p>
      <ul className="flex flex-wrap items-center justify-center gap-2">
        {page > 1 && (
          <li>
            <Link href={href(page - 1)} prefetch={false} rel="prev" className={cn(linkClass, idleClass)}>
              {t("previous")}
            </Link>
          </li>
        )}
        {pageWindow(page, totalPages).map((p, i) =>
          p === null ? (
            <li key={`gap-${i}`} aria-hidden="true" className="px-1 surface-text-gray-muted">
              …
            </li>
          ) : (
            <li key={p}>
              <Link
                href={href(p)}
                prefetch={false}
                aria-current={p === page ? "page" : undefined}
                aria-label={t("pageN", { page: p })}
                className={cn(linkClass, p === page ? currentClass : idleClass)}
              >
                {p}
              </Link>
            </li>
          ),
        )}
        {page < totalPages && (
          <li>
            <Link href={href(page + 1)} prefetch={false} rel="next" className={cn(linkClass, idleClass)}>
              {t("next")}
            </Link>
          </li>
        )}
      </ul>
    </nav>
  );
}

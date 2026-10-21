import { getTranslations } from "next-intl/server";
import type { CardQuestion } from "@/lib/question-bank/card-model";
import { groupsByLang } from "@/lib/question-bank/card-model";
import { pageCount } from "@/lib/question-bank/pagination";
import type { ScopeChapter } from "@/lib/question-bank/scope-page";
import { GROUP_BY, searchIndexPath, type QuestionScope } from "@/lib/question-bank/scope";
import CourseLangScope from "./course-lang-scope";
import QuestionBankToolbar from "./question-bank-toolbar";
import QuestionCard from "./question-card";
import QuestionPagination from "./question-pagination";

/** "/hi" + path on the Hindi site, path alone in English (as-needed prefix). */
export function localePath(locale: string, path: string): string {
  return `${locale === "hi" ? "/hi" : ""}${path}`;
}

export type ChapterNavItem = { slug: string; href: string; labels: CardQuestion["labels"]; count: number };

/** A subject's chapters in order (scope-page.ts), with their canonical
 * chapter-page links; chapters without a canonical path are left out. */
export function chapterNav(
  locale: string,
  exam: string,
  chapters: ScopeChapter[],
  chapterPaths: Record<string, string>,
): ChapterNavItem[] {
  return chapters.flatMap(({ slug, labels, count }) => {
    const path = chapterPaths[slug];
    return path ? [{ slug, href: localePath(locale, `/${exam}/${path}`), labels, count }] : [];
  });
}

/**
 * One page of a chapter/subject/year question bank: toolbar (search,
 * filter, count), this page's server-rendered cards, and pagination links.
 * Only the toolbar, the course-language wrapper and each card's
 * interaction are client components; no question array is passed to any of
 * them.
 */
export default async function QuestionBankView({
  locale,
  scope,
  ok,
  cards,
  total,
  chapters,
  page,
  basePath,
  chapterPaths,
  children,
}: {
  locale: string;
  scope: QuestionScope;
  /** False when the backend failed. */
  ok: boolean;
  /** This page's cards (lib/question-bank/scope-page.ts). */
  cards: CardQuestion[];
  /** Questions in the whole scope. */
  total: number;
  /** Subject pages: their chapters, for the Filter's chapter links. */
  chapters?: ScopeChapter[];
  page: number;
  /** Locale-prefixed path of page 1. */
  basePath: string;
  /** chapter slug -> canonical "<level>/subject/<subject>/<chapter>". */
  chapterPaths?: Record<string, string>;
  /** Rendered between the toolbar and the cards (e.g. chapter links). */
  children?: React.ReactNode;
}) {
  const [tFilter, tBank] = await Promise.all([
    getTranslations({ locale, namespace: "QuestionFilter" }),
    getTranslations({ locale, namespace: "QuestionBank" }),
  ]);
  const listId = "question-bank-list";
  // On a subject page the Filter lists every chapter of the subject and opens
  // its chapter page (all of that chapter's questions); elsewhere it filters
  // this page's cards in place.
  const groupLinks =
    scope.kind === "subject" && chapterPaths && chapters
      ? chapterNav(locale, scope.exam, chapters, chapterPaths).map((c) => ({
          href: c.href,
          en: c.labels.find((l) => l.show !== "hi")?.text ?? c.slug,
          hi: c.labels.find((l) => l.show !== "en")?.text ?? c.slug,
        }))
      : undefined;

  return (
    <CourseLangScope className="space-y-4">
      <QuestionBankToolbar
        listId={listId}
        groupBy={GROUP_BY[scope.kind]}
        groups={groupsByLang(cards)}
        groupLinks={groupLinks}
        pageTotal={cards.length}
        page={page}
        basePath={basePath}
        searchIndexUrl={searchIndexPath(scope)}
      />

      {children}

      <div id={listId} className="grid grid-cols-1 gap-4">
        {cards.map((card, i) => (
          <QuestionCard
            key={card.id}
            locale={locale}
            card={card}
            eagerImages={i === 0}
            exam={scope.exam}
            chapterPaths={chapterPaths}
          />
        ))}

        {cards.length === 0 && (
          // Genuinely empty (or the backend failed) — distinct from "search
          // matched nothing", which the toolbar shows.
          <div className="bg-white rounded-lg border border-[var(--color-border-gray-subtle)] p-6 text-center">
            <p className="body-medium !font-normal surface-text-gray-muted">
              {ok ? tFilter("empty") : tBank("loadError")}
            </p>
          </div>
        )}
      </div>

      <QuestionPagination
        locale={locale}
        basePath={basePath}
        page={page}
        totalPages={pageCount(total)}
        total={total}
      />
    </CourseLangScope>
  );
}

/** Links from a subject page to each of its chapter pages (canonical URLs),
 * with that chapter's question count. Names follow the course language. */
export async function ChapterLinks({
  locale,
  exam,
  chapters: scopeChapters,
  chapterPaths,
}: {
  locale: string;
  exam: string;
  chapters: ScopeChapter[];
  chapterPaths: Record<string, string>;
}) {
  const chapters = chapterNav(locale, exam, scopeChapters, chapterPaths);
  if (chapters.length === 0) return null;
  const t = await getTranslations({ locale, namespace: "QuestionBank" });

  return (
    <nav aria-label={t("chaptersHeading")} className="bg-white rounded-none md:rounded-lg border border-[var(--color-border-gray-subtle)] p-3 space-y-2">
      <h2 className="heading-small !font-semibold surface-text-gray-normal">{t("chaptersHeading")}</h2>
      <ul className="flex flex-wrap gap-2">
        {chapters.map(({ slug, href, labels, count }) => (
          <li key={slug}>
            {/* A plain <a>, not Link: see question-pagination.tsx. */}
            <a
              href={href}
              className="inline-flex items-center gap-2 rounded-md border border-[var(--color-border-gray-subtle)] px-3 py-1.5 body-medium !font-normal surface-text-gray-normal hover:bg-[var(--color-background-gray-subtle)] focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
            >
              {labels.map((l) => (
                <span key={l.show} data-tr={l.show}>
                  {l.text}
                </span>
              ))}
              <span className="body-small surface-text-gray-muted">{t("chapterCount", { count })}</span>
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}

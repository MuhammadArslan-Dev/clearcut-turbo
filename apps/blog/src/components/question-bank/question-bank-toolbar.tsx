"use client";
import React from "react";
import { Filter, Search, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { cn } from "@clearcut/ui/utils";
import { Button } from "@clearcut/ui/button";
import { useIsMobile } from "@clearcut/hooks/use-is-mobile";
import { CustomBottomSheet } from "@/components/modals-bottom-sheet";
import { useCourseLang } from "@/lib/question-bank/use-course-lang";
import { matchesGroup } from "@/utils/section-search";
import type { CourseLang, GroupBy, SearchIndexItem } from "@/lib/question-bank/card-model";
import { pagePath } from "@/lib/question-bank/pagination";
import {
  MIN_SUGGESTION_QUERY_LENGTH,
  indexRows,
  matchesRow,
  suggestionsFor,
  type SearchRow,
  type Suggestion,
} from "@/lib/question-bank/toolbar-search";
import GroupFilterList, { useGroupCopy } from "./group-filter-list";

// How long the "jumped here" ring stays on a question after a jump.
const NAVIGATION_HIGHLIGHT_MS = 2000;
const HIGHLIGHT_CLASSES = ["ring-2", "ring-[var(--color-brand)]", "ring-offset-2"];

type SearchIndex = { items: SearchIndexItem[] };

// One fetch per index URL per page view, shared by every caller.
const indexCache = new Map<string, Promise<SearchIndex | null>>();
function fetchSearchIndex(url: string): Promise<SearchIndex | null> {
  let hit = indexCache.get(url);
  if (!hit) {
    hit = fetch(url)
      .then((res) => (res.ok ? (res.json() as Promise<SearchIndex>) : null))
      .catch(() => null);
    hit.then((v) => {
      if (!v) indexCache.delete(url); // let a later attempt retry
    });
    indexCache.set(url, hit);
  }
  return hit;
}

/** Visible text of a card's question/options for one course language,
 * skipping KaTeX's hidden MathML copy. Cached per card. */
const textCache = new WeakMap<HTMLElement, Partial<Record<CourseLang, string>>>();
function cardSearchText(card: HTMLElement, lang: CourseLang): string {
  const cached = textCache.get(card) ?? {};
  if (cached[lang] !== undefined) return cached[lang] as string;
  const parts: string[] = [];
  for (const block of card.querySelectorAll<HTMLElement>("div[data-tr]")) {
    const tr = block.dataset.tr;
    if (tr !== "both" && tr !== lang) continue;
    for (const el of block.querySelectorAll<HTMLElement>("[data-qs]")) {
      const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT, {
        acceptNode: (n) =>
          n.parentElement?.closest(".katex-mathml") ? NodeFilter.FILTER_REJECT : NodeFilter.FILTER_ACCEPT,
      });
      let n: Node | null;
      while ((n = walker.nextNode())) parts.push(n.nodeValue ?? "");
      parts.push(" ");
    }
  }
  const text = parts.join("").replace(/\s+/g, " ").trim();
  textCache.set(card, { ...cached, [lang]: text });
  return text;
}

function cardGroup(card: HTMLElement, lang: CourseLang): string | null {
  return (lang === "hi" ? card.dataset.gHi : card.dataset.gEn) || null;
}

/**
 * Search box, Filter (topic/chapter/subject) and count for one question-bank
 * page. The cards are server-rendered; this filters them in place by toggling
 * their `hidden` attribute, so typing never re-renders a card.
 *
 * - Filtering (search + group) applies to this page's cards.
 * - Suggestions cover every page of the chapter/subject/year: the first
 *   meaningful query loads a compact index (app/api/question-search), and a
 *   pick on another page navigates there with `#q-<id>`.
 * - A `#q-<id>` that isn't on this page (old share links, the /question/*
 *   301s) is looked up in the index and moved to the right page.
 * - Also mirrors the course language onto `[data-course-lang]` (see
 *   CourseLangScope) — not here, to keep this component's re-renders local.
 */
export default function QuestionBankToolbar({
  listId,
  groupBy,
  groups,
  groupLinks,
  pageTotal,
  page,
  basePath,
  searchIndexUrl,
}: {
  /** id of the element holding this page's cards. */
  listId: string;
  groupBy: GroupBy;
  /** Filter options present on this page, per course language. */
  groups: Record<CourseLang, string[]>;
  /** When set, the Filter lists these instead and picking one opens its
   * page (a subject page's chapters -> each chapter's own page). */
  groupLinks?: { href: string; en: string; hi: string }[];
  /** Questions on this page. */
  pageTotal: number;
  page: number;
  /** Locale-prefixed path of page 1, for links to other pages. */
  basePath: string;
  searchIndexUrl: string;
}) {
  // Same rule as CourseLangScope, so search/filter use the visible language.
  const courseLang = useCourseLang();
  const copy = useGroupCopy(groupBy);
  const tFilter = useTranslations("QuestionFilter");
  const isMobile = useIsMobile();

  const [query, setQuery] = React.useState("");
  const [activeGroup, setActiveGroup] = React.useState<string | null>(null);
  const [visibleCount, setVisibleCount] = React.useState(pageTotal);
  const [isSuggestionsOpen, setIsSuggestionsOpen] = React.useState(false);
  const [activeSuggestionIndex, setActiveSuggestionIndex] = React.useState(-1);
  const [isFilterOpen, setIsFilterOpen] = React.useState(false);
  const [index, setIndex] = React.useState<SearchIndex | null>(null);

  const searchBoxRef = React.useRef<HTMLDivElement>(null);
  const filterBoxRef = React.useRef<HTMLDivElement>(null);
  const filterButtonRef = React.useRef<HTMLButtonElement>(null);
  const filterSearchRef = React.useRef<HTMLInputElement>(null);
  const highlightTimeoutRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  const groupOptions = groupLinks ? groupLinks.map((g) => g[courseLang]) : groups[courseLang];
  const hasFilters = query.trim().length > 0 || activeGroup !== null;

  function selectGroup(group: string | null) {
    setIsFilterOpen(false);
    if (!groupLinks) {
      setActiveGroup(group);
      return;
    }
    const link = group ? groupLinks.find((g) => g[courseLang] === group) : undefined;
    if (link) window.location.assign(link.href);
  }

  const cards = React.useCallback(
    () => Array.from(document.getElementById(listId)?.querySelectorAll<HTMLElement>("[data-qcard]") ?? []),
    [listId],
  );

  const loadIndex = React.useCallback(() => {
    fetchSearchIndex(searchIndexUrl).then((v) => v && setIndex(v));
  }, [searchIndexUrl]);

  // Group labels differ per language, so a group picked in one language
  // doesn't exist in the other.
  React.useEffect(() => setActiveGroup(null), [courseLang]);

  // Apply search + group filter to this page's cards.
  React.useEffect(() => {
    const q = query.trim();
    let visible = 0;
    for (const card of cards()) {
      const group = cardGroup(card, courseLang);
      // Text is only read (and cached) once there is something to match.
      const show =
        matchesGroup(group, activeGroup) &&
        (!q || matchesRow({ text: cardSearchText(card, courseLang).toLowerCase(), group }, q));
      card.hidden = !show;
      if (show) visible++;
    }
    setVisibleCount(visible);
  }, [cards, query, activeGroup, courseLang]);

  // Suggestions: every page once the index is loaded, this page until then.
  const suggestions = React.useMemo<Suggestion[]>(() => {
    if (query.trim().length < MIN_SUGGESTION_QUERY_LENGTH) return [];
    const unavailable = tFilter("textUnavailable");
    if (index) return suggestionsFor(indexRows(index.items, courseLang), query, unavailable);
    const rows: SearchRow[] = cards().map((card) => ({
      id: Number(card.id.slice(2)),
      n: Number(card.dataset.n),
      page,
      text: cardSearchText(card, courseLang).toLowerCase(),
      question: card.querySelector<HTMLElement>(`div[data-tr="both"] [data-qs], div[data-tr="${courseLang}"] [data-qs]`)?.textContent ?? "",
      group: cardGroup(card, courseLang),
    }));
    return suggestionsFor(rows, query, unavailable);
  }, [index, query, courseLang, cards, page, tFilter]);

  function resetFilters() {
    setQuery("");
    setActiveGroup(null);
    setIsSuggestionsOpen(false);
    setActiveSuggestionIndex(-1);
  }

  // Dismiss the dropdown/popover on an outside click. `mousedown` (not the
  // input's onBlur) so a click on a suggestion lands before the dropdown
  // closes. The mobile sheet closes through its own overlay.
  React.useEffect(() => {
    function handlePointerDown(e: MouseEvent) {
      const target = e.target as Node;
      if (searchBoxRef.current && !searchBoxRef.current.contains(target)) setIsSuggestionsOpen(false);
      if (filterBoxRef.current && !filterBoxRef.current.contains(target)) setIsFilterOpen(false);
    }
    document.addEventListener("mousedown", handlePointerDown);
    return () => document.removeEventListener("mousedown", handlePointerDown);
  }, []);

  React.useEffect(() => {
    if (isFilterOpen && !isMobile) filterSearchRef.current?.focus();
  }, [isFilterOpen, isMobile]);

  const highlight = React.useCallback((el: HTMLElement) => {
    el.classList.add(...HIGHLIGHT_CLASSES);
    if (highlightTimeoutRef.current) clearTimeout(highlightTimeoutRef.current);
    highlightTimeoutRef.current = setTimeout(() => el.classList.remove(...HIGHLIGHT_CLASSES), NAVIGATION_HIGHLIGHT_MS);
  }, []);

  React.useEffect(() => {
    return () => {
      if (highlightTimeoutRef.current) clearTimeout(highlightTimeoutRef.current);
    };
  }, []);

  // Restore position for a `#q-<id>` URL. The browser's own hash scroll
  // undershoots on a cold load (it runs before web fonts reflow the cards),
  // so scroll again once fonts are ready. If the question is on another page
  // of this chapter/subject/year — old shares and /question/* redirects all
  // point at page 1 — find its page in the search index and go there.
  React.useEffect(() => {
    const match = window.location.hash.match(/^#q-(\d+)$/);
    if (!match) return;
    const id = Number(match[1]);
    const anchorId = `q-${id}`;
    let cancelled = false;

    const el = document.getElementById(anchorId);
    if (!el) {
      fetchSearchIndex(searchIndexUrl).then((v) => {
        const item = v?.items.find((i) => i.id === id);
        if (!cancelled && item && item.p !== page) {
          window.location.replace(`${pagePath(basePath, item.p)}#${anchorId}`);
        }
      });
      return () => {
        cancelled = true;
      };
    }

    function restore() {
      if (cancelled) return;
      const target = document.getElementById(anchorId);
      if (!target) return;
      // Instant: restoring where the visitor already was, not navigating.
      target.scrollIntoView({ behavior: "instant", block: "start" });
      target.focus({ preventScroll: true });
    }
    requestAnimationFrame(restore);
    if (typeof document.fonts?.ready?.then === "function" && document.fonts.status !== "loaded") {
      document.fonts.ready.then(() => {
        if (!cancelled) requestAnimationFrame(restore);
      });
    }
    highlight(el);
    return () => {
      cancelled = true;
    };
  }, [searchIndexUrl, page, basePath, highlight]);

  function selectSuggestion(s: Suggestion) {
    setIsSuggestionsOpen(false);
    setActiveSuggestionIndex(-1);
    const anchorId = `q-${s.id}`;

    if (s.page !== page) {
      window.location.assign(`${pagePath(basePath, s.page)}#${anchorId}`);
      return;
    }

    // A suggestion can match on a group name while another group filter is
    // active — clear it so the target is visible before scrolling to it.
    setActiveGroup(null);
    // replaceState, not location.hash: no default jump on top of the smooth
    // scroll below, and no back-button entry per pick.
    history.replaceState(null, "", `#${anchorId}`);
    requestAnimationFrame(() => {
      const el = document.getElementById(anchorId);
      if (!el) return;
      el.hidden = false;
      el.scrollIntoView({ behavior: "smooth", block: "start" });
      el.focus({ preventScroll: true });
      highlight(el);
    });
  }

  function handleSearchKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (!isSuggestionsOpen) {
      if (e.key === "ArrowDown" && suggestions.length > 0) {
        e.preventDefault();
        setIsSuggestionsOpen(true);
        setActiveSuggestionIndex(0);
      }
      return;
    }
    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setActiveSuggestionIndex((i) => Math.min(i + 1, suggestions.length - 1));
        break;
      case "ArrowUp":
        e.preventDefault();
        setActiveSuggestionIndex((i) => Math.max(i - 1, 0));
        break;
      case "Enter":
        if (activeSuggestionIndex >= 0 && suggestions[activeSuggestionIndex]) {
          e.preventDefault();
          selectSuggestion(suggestions[activeSuggestionIndex]);
        }
        break;
      case "Escape":
        // Closes the dropdown only; the query keeps filtering the cards.
        e.preventDefault();
        setIsSuggestionsOpen(false);
        setActiveSuggestionIndex(-1);
        break;
    }
  }

  const activeDescendantId =
    activeSuggestionIndex >= 0 && suggestions[activeSuggestionIndex]
      ? `section-search-option-${suggestions[activeSuggestionIndex].id}`
      : undefined;

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-none md:rounded-lg border border-[var(--color-border-gray-subtle)] p-3 space-y-3">
        <label htmlFor="section-question-search" className="sr-only">
          {tFilter("searchLabel")}
        </label>
        <div className="flex gap-2">
          <div ref={searchBoxRef} className="relative flex-1">
            <Search
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              size={16}
              aria-hidden="true"
            />
            <input
              id="section-question-search"
              type="search"
              role="combobox"
              aria-expanded={isSuggestionsOpen}
              aria-controls="section-search-listbox"
              aria-autocomplete="list"
              aria-activedescendant={activeDescendantId}
              autoComplete="off"
              value={query}
              onChange={(e) => {
                const value = e.target.value;
                setQuery(value);
                setActiveSuggestionIndex(-1);
                const meaningful = value.trim().length >= MIN_SUGGESTION_QUERY_LENGTH;
                setIsSuggestionsOpen(meaningful);
                if (meaningful && !index) loadIndex();
              }}
              onFocus={() => {
                if (query.trim().length >= MIN_SUGGESTION_QUERY_LENGTH) setIsSuggestionsOpen(true);
              }}
              onKeyDown={handleSearchKeyDown}
              placeholder={tFilter("searchPlaceholder")}
              // Hides the native type="search" clear icon next to our own X.
              className="w-full rounded-md border border-[var(--color-border-gray-subtle)] pl-9 pr-9 py-2 body-medium focus-visible:outline-none focus:border-[var(--color-brand)] focus-visible:ring-3 focus-visible:ring-ring/50 [&::-webkit-search-cancel-button]:appearance-none"
            />
            {query.length > 0 && (
              <button
                type="button"
                aria-label={tFilter("clearSearch")}
                onClick={() => {
                  setQuery("");
                  setActiveSuggestionIndex(-1);
                  setIsSuggestionsOpen(false);
                }}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50 rounded"
              >
                <X size={16} />
              </button>
            )}

            {isSuggestionsOpen && (
              <ul
                id="section-search-listbox"
                role="listbox"
                aria-label={tFilter("suggestionsLabel")}
                className="absolute left-0 right-0 z-20 mt-1 max-h-64 overflow-y-auto rounded-md border border-[var(--color-border-gray-subtle)] bg-white shadow-lg"
              >
                {suggestions.length === 0 ? (
                  <li role="presentation" className="px-3 py-2 body-small !font-normal surface-text-gray-muted">
                    {tFilter("noSuggestions", { query: query.trim() })}
                  </li>
                ) : (
                  suggestions.map((s, i) => (
                    <li key={s.id} role="presentation">
                      <button
                        type="button"
                        id={`section-search-option-${s.id}`}
                        role="option"
                        aria-selected={i === activeSuggestionIndex}
                        onMouseEnter={() => setActiveSuggestionIndex(i)}
                        onClick={() => selectSuggestion(s)}
                        className={cn(
                          "w-full text-left px-3 py-2 body-small !font-normal flex items-center justify-between gap-2",
                          i === activeSuggestionIndex ? "bg-[var(--color-background-gray-subtle)]" : "bg-white",
                        )}
                      >
                        <span className="truncate">
                          {tFilter("suggestionNumber", { index: s.n })} {s.snippet}
                        </span>
                        <span className="shrink-0 surface-text-gray-muted text-xs">
                          {s.page !== page ? tFilter("onPage", { page: s.page }) : s.groupLabel}
                        </span>
                      </button>
                    </li>
                  ))
                )}
              </ul>
            )}
          </div>

          {/* Filter by topic/chapter/subject (the page's `groupBy`). Phones
              get a bottom sheet, wider screens a popover under the button. */}
          {groupOptions.length > 1 && (
            <div ref={filterBoxRef} className="relative shrink-0">
              <Button
                ref={filterButtonRef}
                type="button"
                variant={activeGroup ? "solid" : "outlined"}
                color="primary"
                size="md"
                leftIcon={<Filter size={16} aria-hidden="true" />}
                aria-haspopup="dialog"
                aria-expanded={isFilterOpen}
                aria-label={activeGroup ? `${copy.filterAriaLabel}: ${activeGroup}` : copy.filterAriaLabel}
                onClick={() => setIsFilterOpen((open) => !open)}
                className="h-full"
              >
                {tFilter("filter")}
              </Button>

              {isMobile ? (
                <CustomBottomSheet isOpen={isFilterOpen} onClose={() => setIsFilterOpen(false)} isHeader accessible title={copy.title}>
                  <div className="px-4 pt-4 pb-6">
                    <GroupFilterList
                      copy={copy}
                      options={groupOptions}
                      activeGroup={activeGroup}
                      onSelect={selectGroup}
                    />
                  </div>
                </CustomBottomSheet>
              ) : (
                isFilterOpen && (
                  <div
                    role="dialog"
                    aria-label={copy.title}
                    onKeyDown={(e) => {
                      if (e.key === "Escape") {
                        e.preventDefault();
                        setIsFilterOpen(false);
                        filterButtonRef.current?.focus();
                      }
                    }}
                    className="absolute right-0 top-full z-20 mt-2 w-96 rounded-lg border border-[var(--color-border-gray-subtle)] bg-white p-4 shadow-lg"
                  >
                    <div className="mb-3 flex items-center justify-between gap-2">
                      <h2 className="heading-small !font-semibold surface-text-gray-normal">{copy.title}</h2>
                      <button
                        type="button"
                        aria-label={tFilter("close")}
                        onClick={() => {
                          setIsFilterOpen(false);
                          filterButtonRef.current?.focus();
                        }}
                        className="rounded text-gray-600 hover:text-gray-800 cursor-pointer focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
                      >
                        <X size={20} />
                      </button>
                    </div>
                    {/* -m-1 p-1 keeps the items' focus rings inside the scroll clip */}
                    <div className="-m-1 max-h-[60vh] overflow-y-auto p-1">
                      <GroupFilterList
                        copy={copy}
                        options={groupOptions}
                        activeGroup={activeGroup}
                        onSelect={selectGroup}
                        searchInputRef={filterSearchRef}
                      />
                    </div>
                  </div>
                )
              )}
            </div>
          )}

          {hasFilters && (
            <Button type="button" variant="outlined" color="primary" size="sm" onClick={resetFilters} className="shrink-0">
              {tFilter("showAll")}
            </Button>
          )}
        </div>

        <p aria-live="polite" className="body-small !font-normal surface-text-gray-muted">
          {tFilter("showing", { visible: visibleCount, total: pageTotal })}
        </p>
      </div>

      {pageTotal > 0 && visibleCount === 0 && (
        <div className="bg-white rounded-lg border border-[var(--color-border-gray-subtle)] p-6 text-center space-y-2">
          <p className="body-medium !font-normal surface-text-gray-muted">{tFilter("noResults")}</p>
          <Button type="button" variant="plain" color="primary" size="sm" onClick={resetFilters}>
            {tFilter("showAllQuestions")}
          </Button>
        </div>
      )}
    </div>
  );
}

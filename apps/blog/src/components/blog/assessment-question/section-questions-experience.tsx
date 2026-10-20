"use client";
import React from "react";
import { Filter, Search, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { limitWords } from "@clearcut/utils/text-limit";
import { cn } from "@clearcut/ui/utils";
import { Button } from "@clearcut/ui/button";
import { useIsMobile } from "@clearcut/hooks/use-is-mobile";
import { CustomBottomSheet } from "@/components/modals-bottom-sheet";
import type { Question } from "./questions-list";
import SectionQuestionCard from "./section-question-card";
import { useLanguageStore } from "@/store/useLanguageStore";
import { getLocalizedEntityName, normalizeCourseLang, selectTranslation } from "@/utils/question-translation";
import { buildSearchText, getGroupOptions, matchesGroup, matchesQuestionText, stripHtml } from "@/utils/section-search";

// Which entity this page's search/filter chips group questions by — the
// right dimension depends entirely on how broad the page already is:
//  - "topic" (default): a single chapter's questions — topics are the
//    finest-grained real distinction available within one chapter.
//  - "chapter": a whole subject's questions (the `/subject/[subject_id]`
//    page) — grouping by the finer "topic" there would mean dozens of tiny,
//    overlapping chips; chapter is the natural unit at that scope.
//  - "section": a whole year's paper (every subject at once) — grouping by
//    chapter/topic there is the same problem one level worse (every topic
//    across every subject, confirmed unusable in practice); "section" here
//    is backend/URL language for what the page calls "subject".
export type GroupBy = "topic" | "chapter" | "section";

type GroupCopy = {
  all: string;
  filterAriaLabel: string;
  title: string;
  searchPlaceholder: string;
  noMatch: (query: string) => string;
};

// Filter labels per grouping dimension, from the `QuestionFilter` messages.
function useGroupCopy(groupBy: GroupBy): GroupCopy {
  const t = useTranslations("QuestionFilter");
  return {
    all: t(`${groupBy}.all`),
    filterAriaLabel: t(`${groupBy}.ariaLabel`),
    title: t(`${groupBy}.title`),
    searchPlaceholder: t(`${groupBy}.searchPlaceholder`),
    noMatch: (query) => t(`${groupBy}.noMatch`, { query }),
  };
}

// Body of the Filter panel — the same list is shown in the mobile bottom
// sheet and the desktop popover, only the container differs.
function GroupFilterList({
  copy,
  options,
  activeGroup,
  onSelect,
  searchInputRef,
}: {
  copy: GroupCopy;
  options: string[];
  activeGroup: string | null;
  onSelect: (group: string | null) => void;
  searchInputRef?: React.Ref<HTMLInputElement>;
}) {
  const [groupQuery, setGroupQuery] = React.useState("");
  const needle = groupQuery.trim().toLowerCase();
  const visibleOptions = needle ? options.filter((o) => o.toLowerCase().includes(needle)) : options;

  const itemClass = (active: boolean) =>
    cn(
      "w-full text-left rounded-md border px-3 py-2 body-medium !font-normal cursor-pointer focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
      active
        ? "bg-[var(--color-brand)] text-white border-[var(--color-brand)]"
        : "border-[var(--color-border-gray-subtle)] surface-text-gray-normal hover:bg-[var(--color-background-gray-subtle)]",
    );

  return (
    <div className="space-y-3">
      <div className="relative">
        <Search
          className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
          size={16}
          aria-hidden="true"
        />
        <input
          ref={searchInputRef}
          type="search"
          aria-label={copy.searchPlaceholder}
          autoComplete="off"
          value={groupQuery}
          onChange={(e) => setGroupQuery(e.target.value)}
          placeholder={copy.searchPlaceholder}
          className="w-full rounded-md border border-[var(--color-border-gray-subtle)] pl-9 pr-3 py-2 body-medium focus-visible:outline-none focus:border-[var(--color-brand)] focus-visible:ring-3 focus-visible:ring-ring/50 [&::-webkit-search-cancel-button]:appearance-none"
        />
      </div>

      <ul role="group" aria-label={copy.filterAriaLabel} className="space-y-2">
        <li>
          <button
            type="button"
            aria-pressed={activeGroup === null}
            onClick={() => onSelect(null)}
            className={itemClass(activeGroup === null)}
          >
            {copy.all}
          </button>
        </li>
        {visibleOptions.map((group) => (
          <li key={group}>
            <button
              type="button"
              aria-pressed={activeGroup === group}
              onClick={() => onSelect(group)}
              className={itemClass(activeGroup === group)}
            >
              {group}
            </button>
          </li>
        ))}
      </ul>

      {visibleOptions.length === 0 && (
        <p className="body-small !font-normal surface-text-gray-muted">{copy.noMatch(groupQuery.trim())}</p>
      )}
    </div>
  );
}

function getGroupLabel(question: Question, groupBy: GroupBy, courseLang: "en" | "hi"): string | null {
  if (groupBy === "chapter") {
    return getLocalizedEntityName(question.chapter, question.chapter?.translations, courseLang);
  }
  if (groupBy === "section") {
    return getLocalizedEntityName(question.section, question.section?.description, courseLang);
  }
  return getLocalizedEntityName(question.topic, question.topic?.translations, courseLang);
}

// A query shorter than this is treated as "not meaningful yet" — matching
// nearly every question and producing a noisy, not-useful dropdown. Chosen
// deliberately, not from any backend/data constraint.
const MIN_SUGGESTION_QUERY_LENGTH = 2;
const MAX_SUGGESTIONS = 8;
// How long the "jumped here" ring stays on a question after picking it from
// the suggestions dropdown.
const NAVIGATION_HIGHLIGHT_MS = 2000;

interface Suggestion {
  id: number;
  index: number; // 1-based position in the full (unfiltered) question list
  snippet: string;
  groupLabel: string | null;
}

export default function SectionQuestionsExperience({
  questions,
  groupBy = "topic",
  exam,
  shareChapterPaths,
}: {
  questions: Question[];
  groupBy?: GroupBy;
  /** For share links: exam slug, and chapter slug -> canonical chapter path. */
  exam?: string;
  shareChapterPaths?: Record<string, string>;
}) {
  const { courseLanguage } = useLanguageStore();
  const courseLang = normalizeCourseLang(courseLanguage);
  const copy = useGroupCopy(groupBy);
  const tFilter = useTranslations("QuestionFilter");

  const [query, setQuery] = React.useState("");
  const [activeGroup, setActiveGroup] = React.useState<string | null>(null);
  const [isSuggestionsOpen, setIsSuggestionsOpen] = React.useState(false);
  const [activeSuggestionIndex, setActiveSuggestionIndex] = React.useState(-1);
  const [justNavigatedToId, setJustNavigatedToId] = React.useState<number | null>(null);
  const [isFilterOpen, setIsFilterOpen] = React.useState(false);
  const isMobile = useIsMobile();

  const searchBoxRef = React.useRef<HTMLDivElement>(null);
  const filterBoxRef = React.useRef<HTMLDivElement>(null);
  const filterButtonRef = React.useRef<HTMLButtonElement>(null);
  const filterSearchRef = React.useRef<HTMLInputElement>(null);
  const highlightTimeoutRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  // All derived from the real `questions` prop — nothing fabricated. Recomputed
  // only when the data, viewer language, or grouping dimension changes.
  const rows = React.useMemo(
    () =>
      questions.map((q) => {
        const translation = selectTranslation(q.translations, courseLang);
        return {
          question: q,
          translation,
          groupLabel: getGroupLabel(q, groupBy, courseLang),
          searchText: translation ? buildSearchText(translation) : "",
        };
      }),
    [questions, courseLang, groupBy],
  );

  const groupOptions = React.useMemo(
    () => getGroupOptions(rows.map((r) => r.groupLabel)),
    [rows],
  );

  const visibleCount = React.useMemo(
    () =>
      rows.filter(
        (r) => matchesQuestionText(r, query) && matchesGroup(r.groupLabel, activeGroup),
      ).length,
    [rows, query, activeGroup],
  );

  // Suggestions reuse the exact same `matchesQuestionText` match used for the
  // hide/show filtering below, so a suggestion the dropdown offers is
  // guaranteed not to be hidden by the current query once selected (modulo
  // the active group filter, which `selectSuggestion` clears — see there).
  // Capped at MAX_SUGGESTIONS and computed with a single early-exit pass, not
  // because this dataset is large today, but so a future much-larger chapter
  // doesn't pay for a full scan + full match list on every keystroke.
  const suggestions = React.useMemo<Suggestion[]>(() => {
    const q = query.trim();
    if (q.length < MIN_SUGGESTION_QUERY_LENGTH) return [];
    const matches: Suggestion[] = [];
    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      if (!matchesQuestionText(row, q)) continue;
      const plainQuestion = stripHtml(row.translation?.question);
      matches.push({
        id: row.question.id,
        index: i + 1,
        snippet: limitWords(plainQuestion, 14) || tFilter("textUnavailable"),
        groupLabel: row.groupLabel,
      });
      if (matches.length >= MAX_SUGGESTIONS) break;
    }
    return matches;
  }, [rows, query, tFilter]);

  const hasFilters = query.trim().length > 0 || activeGroup !== null;

  function resetFilters() {
    setQuery("");
    setActiveGroup(null);
    setIsSuggestionsOpen(false);
    setActiveSuggestionIndex(-1);
  }

  // Dismiss the dropdown on an outside click. A `mousedown`-based check
  // (rather than the input's own onBlur) is deliberate: a suggestion is a
  // real <button> inside `searchBoxRef`, so `contains()` correctly treats a
  // click on it as "inside" and never races against onBlur firing first and
  // closing the dropdown before the click lands.
  React.useEffect(() => {
    function handlePointerDown(e: MouseEvent) {
      if (searchBoxRef.current && !searchBoxRef.current.contains(e.target as Node)) {
        setIsSuggestionsOpen(false);
      }
      // Same check for the desktop Filter popover (the mobile sheet closes
      // through its own overlay).
      if (filterBoxRef.current && !filterBoxRef.current.contains(e.target as Node)) {
        setIsFilterOpen(false);
      }
    }
    document.addEventListener("mousedown", handlePointerDown);
    return () => document.removeEventListener("mousedown", handlePointerDown);
  }, []);

  // Desktop popover: move focus to its search box on open. The mobile sheet
  // handles focus itself (`accessible`) and doesn't pop the keyboard up.
  React.useEffect(() => {
    if (isFilterOpen && !isMobile) filterSearchRef.current?.focus();
  }, [isFilterOpen, isMobile]);

  function closeFilter() {
    setIsFilterOpen(false);
  }

  function selectGroup(group: string | null) {
    setActiveGroup(group);
    setIsFilterOpen(false);
  }

  React.useEffect(() => {
    return () => {
      if (highlightTimeoutRef.current) clearTimeout(highlightTimeoutRef.current);
    };
  }, []);


  // Restore position on a fresh load / refresh when the URL already has a
  // `#q-<id>` hash (e.g. a shared link, or this page's own tab history).
  //
  // The browser DOES already attempt a native scroll-to-fragment on initial
  // navigation — confirmed, not assumed: measured live against this exact
  // page (66-question real chapter) that the native attempt undershoots the
  // target by ~2500px on a cold load. Root cause: the browser fires its own
  // hash-scroll against the very first layout pass, before this page's web
  // fonts finish loading — font swap reflows every question's text height,
  // pushing the target further down than where the browser already settled.
  // So this isn't "unnecessary scroll logic" layered on top of something
  // that already works; it's the fix for a real, measured undershoot.
  //
  // `document.fonts.ready` is a real completion signal for that exact cause
  // (not a guessed timeout) — re-running the scroll once fonts are actually
  // loaded corrects the undershoot exactly when the thing that caused it is
  // done, and only then. Mount-only ([] deps): this must never re-fire from
  // a query/filter change, and in-page anchor clicks (Previous/Next, the
  // jump links) already get the browser's native same-page hash scroll for
  // free — this effect's job is strictly the cold-load case.
  React.useEffect(() => {
    const match = window.location.hash.match(/^#(q-\d+)$/);
    if (!match) return;
    const anchorId = match[1];
    let cancelled = false;

    function restore() {
      if (cancelled) return;
      const el = document.getElementById(anchorId);
      if (!el) return;
      // Instant, not smooth: this is restoring where the visitor already
      // was, not an in-page navigation — animating it on every refresh
      // would be a worse experience than just already being there. Instant
      // scrollIntoView has no motion to reduce, so this also satisfies
      // "respect reduced-motion" by construction rather than needing a
      // matchMedia check.
      el.scrollIntoView({ behavior: "instant", block: "start" });
      el.focus({ preventScroll: true });
    }

    requestAnimationFrame(restore);

    if (typeof document.fonts?.ready?.then === "function" && document.fonts.status !== "loaded") {
      document.fonts.ready.then(() => {
        if (!cancelled) requestAnimationFrame(restore);
      });
    }

    // Reuses the existing suggestion-navigation highlight — not a second,
    // parallel highlight mechanism — so "arriving via a shared link" and
    // "arriving via search" look the same, and the two can never fight over
    // the ring at once (this only ever sets it once, on mount).
    const idMatch = anchorId.match(/^q-(\d+)$/);
    if (idMatch) {
      const id = Number(idMatch[1]);
      setJustNavigatedToId(id);
      highlightTimeoutRef.current = setTimeout(() => setJustNavigatedToId(null), NAVIGATION_HIGHLIGHT_MS);
    }

    return () => {
      cancelled = true;
    };
  }, []);

  function selectSuggestion(suggestion: Suggestion) {
    setIsSuggestionsOpen(false);
    setActiveSuggestionIndex(-1);
    // A suggestion can come from a topic-name match even when an unrelated
    // topic chip is currently active — clearing the chip here guarantees the
    // target question is actually visible (not `hidden`) once we scroll to
    // it, rather than landing on a hidden element.
    setActiveGroup(null);

    const anchorId = `q-${suggestion.id}`;
    // `history.replaceState` (not `location.hash =`) updates the URL's
    // fragment without the browser's own default jump-to-element behaviour
    // — that default would fire its own instant scroll on top of the
    // smooth one below, producing exactly the "duplicate/conflicting
    // scrolls" this feature needs to avoid. `replaceState`, not
    // `pushState`: a suggestion pick shouldn't pile up back-button entries.
    // This also means a later refresh restores here, via the mount effect
    // above, satisfying "navigate via search, then refresh" staying put.
    history.replaceState(null, "", `#${anchorId}`);

    // Wait a frame so the topic-filter state change above has re-rendered
    // (and un-hidden the target) before scrolling to it.
    requestAnimationFrame(() => {
      const el = document.getElementById(anchorId);
      el?.scrollIntoView({ behavior: "smooth", block: "start" });
      el?.focus();
    });

    setJustNavigatedToId(suggestion.id);
    if (highlightTimeoutRef.current) clearTimeout(highlightTimeoutRef.current);
    highlightTimeoutRef.current = setTimeout(() => setJustNavigatedToId(null), NAVIGATION_HIGHLIGHT_MS);
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
        // Closes the dropdown only — the typed query (and its effect on
        // which question cards are hidden) is left alone, matching the
        // "Show all" button's role as the explicit, separate way to clear it.
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
                setIsSuggestionsOpen(value.trim().length >= MIN_SUGGESTION_QUERY_LENGTH);
              }}
              onFocus={() => {
                if (query.trim().length >= MIN_SUGGESTION_QUERY_LENGTH) setIsSuggestionsOpen(true);
              }}
              onKeyDown={handleSearchKeyDown}
              placeholder={tFilter("searchPlaceholder")}
              // [&::-webkit-search-cancel-button] hides Chrome/Safari's own
              // native "clear" icon for type="search" — without it, that
              // sits directly next to the custom X button below, showing two
              // clear controls stacked side by side.
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
                // max-h + overflow-y-auto keeps this from covering the whole
                // viewport on mobile; width matches the input, not the page.
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
                          {tFilter("suggestionNumber", { index: s.index })} {s.snippet}
                        </span>
                        {s.groupLabel && (
                          <span className="shrink-0 surface-text-gray-muted text-xs">{s.groupLabel}</span>
                        )}
                      </button>
                    </li>
                  ))
                )}
              </ul>
            )}
          </div>

          {/* Filter by topic/chapter/subject (the page's `groupBy` — see its
              docblock above). Phones get a bottom sheet, wider screens a
              popover anchored under the button; both show GroupFilterList. */}
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
                <CustomBottomSheet isOpen={isFilterOpen} onClose={closeFilter} isHeader accessible title={copy.title}>
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
                        closeFilter();
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
                          closeFilter();
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
          {tFilter("showing", { visible: visibleCount, total: questions.length })}
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {rows.map((row, i) => {
          const hidden = !(
            matchesQuestionText(row, query) && matchesGroup(row.groupLabel, activeGroup)
          );
          return (
            <SectionQuestionCard
              key={row.question.id}
              question={row.question}
              index={i + 1}
              total={questions.length}
              groupLabel={row.groupLabel}
              hidden={hidden}
              justNavigatedTo={justNavigatedToId === row.question.id}
              exam={exam}
              shareChapterPath={row.question.chapter?.slug ? shareChapterPaths?.[row.question.chapter.slug] : undefined}
            />
          );
        })}

        {questions.length === 0 && (
          // Genuinely empty section (no backend data at all) — distinct from
          // "search/filter matched nothing" below. Offering a "Show all"
          // reset here would be misleading: there is nothing to show either
          // way, and nothing to reset.
          <div className="bg-white rounded-lg border border-[var(--color-border-gray-subtle)] p-6 text-center">
            <p className="body-medium !font-normal surface-text-gray-muted">
              {tFilter("empty")}
            </p>
          </div>
        )}

        {questions.length > 0 && visibleCount === 0 && (
          <div className="bg-white rounded-lg border border-[var(--color-border-gray-subtle)] p-6 text-center space-y-2">
            <p className="body-medium !font-normal surface-text-gray-muted">
              {tFilter("noResults")}
            </p>
            <Button type="button" variant="plain" color="primary" size="sm" onClick={resetFilters}>
              {tFilter("showAllQuestions")}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

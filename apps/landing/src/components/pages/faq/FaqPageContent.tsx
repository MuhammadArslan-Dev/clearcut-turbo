"use client";

import React from "react";
import clsx from "clsx";
import { motion, AnimatePresence } from "framer-motion";
import Text from "@clearcut/ui/text";
import FAQAccordion, { AccordionItem } from "@/components/shared/FAQAccordion";
import type { FaqCategory } from "@/types/cms";

const STRINGS = {
  en: {
    searchPlaceholder: "Search questions…",
    clearSearch: "Clear search",
    tryDifferent: "Try a different keyword, or browse a category below.",
    comingSoon: "FAQs are coming soon.",
    answersAcross: (answers: number, topics: number) => `${answers} answers across ${topics} topics`,
    resultsFor: (count: number, query: string) =>
      count === 0
        ? `No results for “${query}”`
        : `${count} result${count === 1 ? "" : "s"} for “${query}”`,
  },
  hi: {
    searchPlaceholder: "प्रश्न खोजें…",
    clearSearch: "खोज साफ़ करें",
    tryDifferent: "कोई और शब्द आज़माएं, या नीचे किसी श्रेणी को ब्राउज़ करें।",
    comingSoon: "जल्द ही प्रश्न जोड़े जाएंगे।",
    answersAcross: (answers: number, topics: number) => `${topics} विषयों में ${answers} जवाब`,
    resultsFor: (count: number, query: string) =>
      count === 0 ? `“${query}” के लिए कोई परिणाम नहीं मिला` : `“${query}” के लिए ${count} परिणाम`,
  },
};

function resolveStrings(locale?: string) {
  return locale === "hi" ? STRINGS.hi : STRINGS.en;
}

// Deterministic, human-readable per-question anchor. Not stored in the CMS —
// derived from the question text — so it's stable as long as the question's
// wording doesn't change, which is good enough for shareable/bookmarkable
// deep links (#category-key-question-words) without adding a CMS field.
function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .slice(0, 60)
    .replace(/-+$/, "");
}

export default function FaqPageContent({ categories, locale }: { categories: FaqCategory[]; locale?: string }) {
  const t = resolveStrings(locale);
  const [activeKey, setActiveKey] = React.useState<string>(categories[0]?.key ?? "");
  const [query, setQuery] = React.useState("");
  // Set once from the URL hash on mount (deep link) so the matching
  // question's accordion opens instead of always defaulting to the first
  // question of the category.
  const [hashOpenId, setHashOpenId] = React.useState<string | null>(null);

  const normalizedQuery = query.trim().toLowerCase();
  const isSearching = normalizedQuery.length > 0;

  const totalQuestions = categories.reduce((sum, c) => sum + c.questions.length, 0);

  const activeCategory = categories.find((c) => c.key === activeKey) ?? categories[0];

  // Deep-link on load: #<categoryKey>-<question-slug> selects that category
  // and opens + scrolls to that question.
  React.useEffect(() => {
    const hash = window.location.hash.replace(/^#/, "");
    if (!hash) return;

    for (const category of categories) {
      const match = category.questions.find((faq) => `${category.key}-${slugify(faq.question)}` === hash);
      if (match) {
        setActiveKey(category.key);
        setHashOpenId(hash);
        // Wait for the category's accordion to mount/animate in before scrolling.
        requestAnimationFrame(() => {
          setTimeout(() => {
            document.getElementById(hash)?.scrollIntoView({ behavior: "smooth", block: "center" });
          }, 250);
        });
        break;
      }
    }
    // Only ever runs once, against the hash present at first load.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const searchResults: AccordionItem[] = isSearching
    ? categories.flatMap((category) =>
        category.questions
          .filter(
            (faq) =>
              faq.question.toLowerCase().includes(normalizedQuery) ||
              faq.answer.toLowerCase().includes(normalizedQuery),
          )
          .map((faq, index) => ({
            id: `search-${category.key}-${index}`,
            title: (
              <span className="flex flex-col gap-1.5">
                <span className="body-xsmall !font-semibold uppercase tracking-wide text-brand w-fit">
                  {category.label}
                </span>
                <span>{faq.question}</span>
              </span>
            ),
            content: faq.answer,
          })),
      )
    : [];

  const categoryItems: AccordionItem[] = (activeCategory?.questions ?? []).map((faq) => ({
    id: `${activeCategory?.key}-${slugify(faq.question)}`,
    title: faq.question,
    content: faq.answer,
  }));

  const categoryItemIds = new Set(categoryItems.map((item) => item.id));
  const initialOpenId = hashOpenId && categoryItemIds.has(hashOpenId) ? hashOpenId : categoryItems[0]?.id;

  const updateHash = (id: string | null) => {
    if (!id) return;
    window.history.replaceState(null, "", `#${id}`);
  };

  if (categories.length === 0) {
    return (
      <div className="max-w-lg mx-auto text-center py-12">
        <Text as="p" variant="body-large" color="gray-muted">
          {t.comingSoon}
        </Text>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8">
      {/* Search */}
      <div className="max-w-xl mx-auto w-full">
        <div className="relative">
          <svg
            className="absolute left-4 top-1/2 -translate-y-1/2 text-text-gray-muted"
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="11" cy="11" r="8" />
            <path d="m21 21-4.35-4.35" />
          </svg>
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t.searchPlaceholder}
            className="w-full rounded-full border border-border-gray-subtle bg-white pl-11 pr-11 py-3 body-medium text-text-gray-normal placeholder:text-text-gray-muted outline-none transition-all focus:border-brand focus:ring-4 focus:ring-brand/10 shadow-sm"
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery("")}
              aria-label={t.clearSearch}
              className="absolute right-3 top-1/2 -translate-y-1/2 w-6 h-6 grid place-items-center rounded-full text-text-gray-muted hover:bg-[var(--color-gray-bg-soft)] hover:text-text-gray-normal cursor-pointer"
            >
              ✕
            </button>
          )}
        </div>
        {!isSearching && (
          <Text as="p" variant="body-small" color="gray-muted" className="text-center mt-3">
            {t.answersAcross(totalQuestions, categories.length)}
          </Text>
        )}
      </div>

      <AnimatePresence mode="wait">
        {isSearching ? (
          <motion.div
            key="search"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.18 }}
            className="max-w-[900px] mx-auto w-full"
          >
            <Text as="p" variant="body-small" color="gray-muted" className="mb-4">
              {t.resultsFor(searchResults.length, query)}
            </Text>

            {searchResults.length > 0 ? (
              <FAQAccordion items={searchResults} defaultOpenId={searchResults[0]?.id} />
            ) : (
              <div className="text-center py-12 border border-dashed border-border-gray-subtle rounded-2xl">
                <Text as="p" variant="body-medium" color="gray-muted">
                  {t.tryDifferent}
                </Text>
                <button
                  type="button"
                  onClick={() => setQuery("")}
                  className="mt-3 body-medium !font-semibold text-brand hover:underline cursor-pointer"
                >
                  {t.clearSearch}
                </button>
              </div>
            )}
          </motion.div>
        ) : (
          <motion.div
            key="browse"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="grid grid-cols-1 lg:grid-cols-[260px_1fr] gap-6 lg:gap-10 items-start"
          >
            {/* Mobile: sliding pill chips */}
            <div className="lg:hidden -mx-3 px-3 flex gap-2 overflow-x-auto pb-1">
              {categories.map((category) => {
                const isActive = category.key === activeCategory?.key;
                return (
                  <button
                    key={category.key}
                    onClick={() => setActiveKey(category.key)}
                    className={clsx(
                      "relative shrink-0 rounded-full px-4 py-2 body-small !font-semibold whitespace-nowrap border cursor-pointer transition-colors",
                      isActive ? "border-brand text-white" : "bg-white text-text-gray-muted border-border-gray-subtle hover:border-brand hover:text-brand",
                    )}
                  >
                    {isActive && (
                      <motion.span
                        layoutId="faq-mobile-active-pill"
                        className="absolute inset-0 rounded-full bg-brand"
                        transition={{ type: "spring", stiffness: 500, damping: 35 }}
                      />
                    )}
                    <span className="relative">{category.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Desktop: sticky sidebar */}
            <nav className="hidden lg:flex lg:flex-col lg:gap-1 lg:sticky lg:top-24">
              {categories.map((category) => {
                const isActive = category.key === activeCategory?.key;
                return (
                  <button
                    key={category.key}
                    onClick={() => setActiveKey(category.key)}
                    className={clsx(
                      "flex items-center gap-3 rounded-xl px-3 py-3 text-left cursor-pointer transition-colors",
                      isActive
                        ? "bg-[var(--color-primary-bg-soft)]"
                        : "hover:bg-[var(--color-gray-bg-soft)]",
                    )}
                  >
                    <span
                      className={clsx(
                        "shrink-0 w-8 h-8 rounded-full grid place-items-center body-small !font-semibold",
                        isActive ? "bg-brand text-white" : "bg-[var(--color-gray-bg-soft)] text-text-gray-muted",
                      )}
                    >
                      {category.label.charAt(0).toUpperCase()}
                    </span>
                    <Text
                      as="span"
                      variant="body-medium"
                      weight={isActive ? "semibold" : "normal"}
                      className={clsx("flex-1", isActive ? "!text-brand" : "text-text-gray-muted")}
                    >
                      {category.label}
                    </Text>
                    <Text
                      as="span"
                      variant="body-xsmall"
                      weight="semibold"
                      className={clsx(
                        "shrink-0 rounded-full min-w-6 h-6 px-1.5 grid place-items-center",
                        isActive ? "bg-brand text-white" : "bg-[var(--color-gray-bg-soft)] text-text-gray-muted",
                      )}
                    >
                      {category.questions.length}
                    </Text>
                  </button>
                );
              })}
            </nav>

            <div className="min-w-0">
              {activeCategory && (
                <Text as="h2" variant="heading-medium" weight="semibold" color="gray-normal" className="mb-4">
                  {activeCategory.label}
                </Text>
              )}
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeCategory?.key}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  transition={{ duration: 0.15 }}
                >
                  <FAQAccordion items={categoryItems} defaultOpenId={initialOpenId} onOpenChange={updateHash} />
                </motion.div>
              </AnimatePresence>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

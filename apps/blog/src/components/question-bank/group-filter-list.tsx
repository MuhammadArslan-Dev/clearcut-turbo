"use client";
import React from "react";
import { Search } from "lucide-react";
import { useTranslations } from "next-intl";
import { cn } from "@clearcut/ui/utils";
import type { GroupBy } from "@/lib/question-bank/card-model";

export type GroupCopy = {
  all: string;
  filterAriaLabel: string;
  title: string;
  searchPlaceholder: string;
  noMatch: (query: string) => string;
};

// Filter labels per grouping dimension, from the `QuestionFilter` messages.
export function useGroupCopy(groupBy: GroupBy): GroupCopy {
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
export default function GroupFilterList({
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

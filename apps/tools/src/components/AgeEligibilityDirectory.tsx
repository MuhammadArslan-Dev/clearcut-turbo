"use client";

import React from "react";
import clsx from "clsx";
import { useSearchParams } from "next/navigation";
import Text from "@clearcut/ui/text";
import type { AgeEligibilityExam, ExamGroup } from "@/lib/ageEligibility";
import type { Locale } from "@/lib/dictionary";
import { getAgeCalcStrings } from "@/lib/ageCalculatorStrings";
import AgeExamCard, { ageLimitLabel } from "./AgeExamCard";

const VALID_GROUPS = new Set<ExamGroup>([
  "Civil Services",
  "SSC Exams",
  "Banking",
  "Railways",
  "Defence",
  "Engineering",
  "Medical",
  "State PSC",
  "Teaching",
  "Insurance",
  "Police",
]);

const GROUP_ORDER: ExamGroup[] = [
  "Civil Services",
  "SSC Exams",
  "Banking",
  "Railways",
  "Defence",
  "Engineering",
  "Medical",
  "State PSC",
  "Teaching",
  "Insurance",
  "Police",
];

export default function AgeEligibilityDirectory({
  exams,
  locale = "en",
  initialGroup = "all",
  basePath = "/age-eligibility-calculator",
}: {
  exams: AgeEligibilityExam[];
  locale?: Locale;
  initialGroup?: ExamGroup | "all";
  basePath?: string;
}) {
  const t = getAgeCalcStrings(locale);
  const searchParams = useSearchParams();
  const groupFromUrl = searchParams.get("group");
  const resolvedInitialGroup: ExamGroup | "all" =
    initialGroup !== "all" ? initialGroup : groupFromUrl && VALID_GROUPS.has(groupFromUrl as ExamGroup) ? (groupFromUrl as ExamGroup) : "all";

  const [query, setQuery] = React.useState("");
  const [activeGroup, setActiveGroup] = React.useState<ExamGroup | "all">(resolvedInitialGroup);

  const chipsContainerRef = React.useRef<HTMLDivElement>(null);
  const chipRefs = React.useRef<(HTMLButtonElement | null)[]>([]);

  // Clicking a chip that's partly (or fully) offscreen in the horizontally
  // scrollable row brings it to the horizontal center of the row, same as
  // the pill tabs elsewhere in the app (e.g. FAQsSection on the landing
  // site) — clicking shouldn't leave the user's own selection scrolled out
  // of view.
  const selectGroup = (group: ExamGroup | "all", index: number) => {
    setActiveGroup(group);
    const container = chipsContainerRef.current;
    const chip = chipRefs.current[index];
    if (!container || !chip) return;

    const containerRect = container.getBoundingClientRect();
    const chipRect = chip.getBoundingClientRect();
    const offset = chipRect.left - containerRect.left - container.clientWidth / 2 + chip.clientWidth / 2;

    container.scrollTo({ left: container.scrollLeft + offset, behavior: "smooth" });
  };

  const groupCounts = React.useMemo(() => {
    const counts = new Map<ExamGroup, number>();
    for (const exam of exams) counts.set(exam.group, (counts.get(exam.group) ?? 0) + 1);
    return counts;
  }, [exams]);

  const normalizedQuery = query.trim().toLowerCase();

  const filtered = exams.filter((exam) => {
    if (activeGroup !== "all" && exam.group !== activeGroup) return false;
    if (!normalizedQuery) return true;
    return (
      exam.shortName.toLowerCase().includes(normalizedQuery) ||
      exam.fullName.toLowerCase().includes(normalizedQuery) ||
      exam.conductingBody.toLowerCase().includes(normalizedQuery)
    );
  });

  return (
    <div className="flex flex-col gap-6">
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
            className="w-full rounded-full border border-[var(--color-border-gray-subtle)] bg-white pl-11 pr-4 py-3 body-medium text-text-gray-normal placeholder:text-text-gray-muted outline-none transition-all focus:border-brand focus:ring-4 focus:ring-brand/10 shadow-sm"
          />
        </div>
      </div>

      {/* Group filter chips */}
      <div ref={chipsContainerRef} className="hide-scrollbar flex gap-2 overflow-x-auto pb-1 -mx-4 px-4 md:mx-0 md:px-0">
        <button
          ref={(el) => {
            chipRefs.current[0] = el;
          }}
          type="button"
          onClick={() => selectGroup("all", 0)}
          className={clsx(
            "shrink-0 flex items-center gap-1.5 rounded-full px-4 py-2 body-small !font-semibold whitespace-nowrap border transition-colors cursor-pointer",
            activeGroup === "all"
              ? "bg-brand text-white border-brand"
              : "bg-white text-text-gray-muted border-[var(--color-border-gray-subtle)] hover:border-brand hover:text-brand",
          )}
        >
          {t.allExams}
          <span
            className={clsx(
              "rounded-full px-1.5 body-xsmall !font-bold",
              activeGroup === "all" ? "bg-white/20 text-white" : "bg-[var(--color-gray-bg-soft)] text-text-gray-muted",
            )}
          >
            {exams.length}
          </span>
        </button>
        {GROUP_ORDER.filter((g) => groupCounts.has(g)).map((group, i) => {
          const isActive = activeGroup === group;
          return (
            <button
              key={group}
              ref={(el) => {
                chipRefs.current[i + 1] = el;
              }}
              type="button"
              onClick={() => selectGroup(group, i + 1)}
              className={clsx(
                "shrink-0 flex items-center gap-1.5 rounded-full px-4 py-2 body-small !font-semibold whitespace-nowrap border transition-colors cursor-pointer",
                isActive
                  ? "bg-brand text-white border-brand"
                  : "bg-white text-text-gray-muted border-[var(--color-border-gray-subtle)] hover:border-brand hover:text-brand",
              )}
            >
              {group}
              <span
                className={clsx(
                  "rounded-full px-1.5 body-xsmall !font-bold",
                  isActive ? "bg-white/20 text-white" : "bg-[var(--color-gray-bg-soft)] text-text-gray-muted",
                )}
              >
                {groupCounts.get(group)}
              </span>
            </button>
          );
        })}
      </div>

      <Text as="p" variant="body-small" color="gray-muted">
        {t.showingOf(filtered.length, exams.length)}
      </Text>

      {/* Cards */}
      {filtered.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((exam) => (
            <AgeExamCard
              key={exam.slug}
              exam={exam}
              href={`${basePath}/${exam.slug}`}
              ageLimitText={ageLimitLabel(exam, t.noLimit, t.minLabel)}
              ageLimitLabelText={t.ageLimit}
              popularLabel={t.popular}
              locale={locale}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-16 border border-dashed border-[var(--color-border-gray-subtle)] rounded-2xl">
          <Text as="p" variant="body-medium" color="gray-muted">
            {t.noResults(query)}
          </Text>
        </div>
      )}
    </div>
  );
}

"use client";

import Text from "@clearcut/ui/text";
import type { Locale } from "@/lib/dictionary";
import { getSyllabusStrings } from "@/lib/syllabusTrackerStrings";
import SubjectIcon from "./SubjectIcon";

const ChevronRightIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
    <path d="M9 6l6 6-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

export default function SubjectSidebar({
  subjects,
  active,
  onSelect,
  locale = "en",
}: {
  subjects: { name: string; completed: number; total: number }[];
  active: string;
  onSelect: (subject: string) => void;
  locale?: Locale;
}) {
  const t = getSyllabusStrings(locale);
  return (
    <div className="rounded-2xl border border-[var(--color-border-gray-subtle)] bg-white p-3">
      <div className="px-1.5 pb-3 pt-1">
        <Text as="h2" variant="body-large" weight="semibold" color="gray-normal">
          {t.sectionsTitle}
        </Text>
        <Text as="p" variant="body-small" color="gray-muted">
          {t.sectionsSubtitle}
        </Text>
      </div>

      <div className="flex flex-col gap-1">
        {subjects.map((s, i) => {
          const isActive = s.name === active;
          return (
            <button
              key={s.name}
              type="button"
              onClick={() => onSelect(s.name)}
              className={`flex items-center gap-3 rounded-lg border-l-4 px-2.5 py-2 text-left transition-colors ${
                isActive
                  ? "border-brand bg-[var(--color-primary-subtle)]"
                  : "border-transparent hover:bg-[var(--color-gray-bg-soft)]"
              }`}
            >
              <SubjectIcon name={s.name} index={i} size={32} />
              <div className="min-w-0 flex-1">
                <Text as="p" variant="body-medium" weight="semibold" color="gray-normal" className="truncate">
                  {s.name}
                </Text>
                <Text as="p" variant="body-small" color="gray-muted">
                  {t.chaptersCount(s.completed, s.total)}
                </Text>
              </div>
              <span className={isActive ? "text-brand" : "text-text-gray-muted"}>
                <ChevronRightIcon />
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

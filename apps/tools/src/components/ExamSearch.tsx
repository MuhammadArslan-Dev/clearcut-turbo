"use client";

import { useMemo, useState } from "react";
import Text from "@clearcut/ui/text";
import ExamCard from "./ExamCard";
import { StaggerGrid, StaggerItem } from "./motion";

// Slimmer than ResizerExamSpec on purpose: this is passed as a prop from a
// server component into this client component, which serializes it into the
// page's RSC payload — dropping faqs/signatureSpec/category (unused here)
// keeps that payload a fraction of the size of the full exam list.
export interface SearchableExam {
  slug: string;
  shortName: string;
  fullName: string;
  photoSpec: { widthPx: number; heightPx: number; minKB: number; maxKB: number };
}

function SearchIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" className="shrink-0">
      <circle cx="10.5" cy="10.5" r="6.5" stroke="currentColor" strokeWidth="2" />
      <path d="M20 20l-4.35-4.35" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

/**
 * Live filter over a given exam list — used two ways: the hub page passes
 * every exam (search across all 100+), a category page passes just its own
 * exams (search within that category). Matches short and full name so
 * "civil service" finds UPSC even though its card only shows "UPSC (IAS,
 * IPS)".
 */
export default function ExamSearch({ exams, placeholder }: { exams: SearchableExam[]; placeholder: string }) {
  const [query, setQuery] = useState("");
  const trimmed = query.trim().toLowerCase();

  const results = useMemo(() => {
    if (!trimmed) return [];
    return exams
      .filter(
        (exam) =>
          exam.shortName.toLowerCase().includes(trimmed) || exam.fullName.toLowerCase().includes(trimmed),
      )
      .slice(0, 24);
  }, [exams, trimmed]);

  return (
    <div>
      <div className="relative max-w-[480px] mx-auto">
        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-text-gray-muted pointer-events-none">
          <SearchIcon />
        </span>
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={placeholder}
          className="h-[48px] w-full rounded-full border border-[var(--color-border-gray-subtle)] bg-white pl-11 pr-4 body-medium outline-none transition-colors focus:border-brand"
        />
      </div>

      {trimmed &&
        (results.length > 0 ? (
          <StaggerGrid className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 mt-6">
            {results.map((exam) => (
              <StaggerItem key={exam.slug}>
                <ExamCard exam={exam} />
              </StaggerItem>
            ))}
          </StaggerGrid>
        ) : (
          <Text as="p" variant="body-small" color="gray-muted" className="text-center mt-6">
            {`No exam matched "${query}" — try a different name, or browse below.`}
          </Text>
        ))}
    </div>
  );
}

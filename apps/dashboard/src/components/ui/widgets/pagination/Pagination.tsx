"use client";

import CounterCard from "@/components/ui/cards/CounterCard";
import { ChevronIcon } from "@/components/ui/icons";

export interface PaginationProps {
  page: number;
  totalPages: number;
  onChange: (page: number) => void;
}

/**
 * No existing pagination component in this codebase (checked
 * components/ui/widgets/* and cards/*) — built following the same small,
 * prop-driven widget shape as Filters/FiltersSkeleton in the sibling
 * `filter/` folder, reusing CounterCard for the numbered buttons and
 * ChevronIcon for prev/next rather than any new icon/button primitive.
 */
export default function Pagination({ page, totalPages, onChange }: PaginationProps) {
  if (totalPages <= 1) return null;

  const goTo = (next: number) => {
    if (next < 1 || next > totalPages) return;
    onChange(next);
  };

  return (
    <div className="flex items-center gap-2">
      <button onClick={() => goTo(page - 1)} disabled={page === 1} className="disabled:opacity-40">
        <CounterCard
          value={<ChevronIcon size={16} variant="left" color="var(--color-surface-gray-muted)" />}
          bgColor="bg-white"
          border="border"
          borderColor="border-gray-200"
        />
      </button>

      {Array.from({ length: totalPages }, (_, i) => i + 1).map((n) => (
        <CounterCard
          key={n}
          value={n}
          onClick={() => goTo(n)}
          bgColor={n === page ? "bg-brand" : "bg-white"}
          border="border"
          borderColor={n === page ? "border-brand" : "border-gray-200"}
          textClass={n === page ? "!text-white !font-semibold" : ""}
        />
      ))}

      <button
        onClick={() => goTo(page + 1)}
        disabled={page === totalPages}
        className="disabled:opacity-40"
      >
        <CounterCard
          value={<ChevronIcon size={16} variant="right" color="var(--color-surface-gray-muted)" />}
          bgColor="bg-white"
          border="border"
          borderColor="border-gray-200"
        />
      </button>
    </div>
  );
}

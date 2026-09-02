import Link from "next/link";
import Text from "@clearcut/ui/text";
import { ResizerExamSpec } from "@/lib/resizerExams";

function ExamCardIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" className="shrink-0">
      <rect x="4" y="3" width="16" height="18" rx="2" stroke="currentColor" strokeWidth="1.8" />
      <path d="M8 8h8M8 12h8M8 16h5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

function ArrowIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" className="shrink-0">
      <path
        d="M5 12h14M13 6l6 6-6 6"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

// Only these three fields are ever read below — narrowing the prop to a
// Pick (instead of the full ResizerExamSpec) lets the recent-exams feature
// reuse this exact card from the small {slug, shortName, photoSpec} record
// it keeps in localStorage, without needing an exam's fullName/category/
// signatureSpec/faqs just to satisfy the type.
type ExamCardData = Pick<ResizerExamSpec, "slug" | "shortName" | "photoSpec">;

// Every exam has its own photo dimensions — surfacing them right on the card
// (not just after a click) is the point: it tells a candidate at a glance
// that this ISN'T a one-size-fits-all tool, and gives them a reason to pick
// the right card instead of using the generic hub tool. Shared by the
// category pages, the hub's search results, and the recent-exams row, so a
// design change here lands everywhere instead of drifting per call site.
export default function ExamCard({ exam }: { exam: ExamCardData }) {
  return (
    <Link
      href={`/${exam.slug}`}
      className="group relative flex flex-col gap-3 rounded-2xl border border-[var(--color-border-gray-subtle)] bg-white p-4 shadow-[0_1px_2px_rgba(0,0,0,0.03)] transition-all duration-200 hover:border-brand hover:shadow-[0_10px_28px_rgba(0,0,0,0.08)] hover:-translate-y-1"
    >
      <div className="flex items-start justify-between">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand/8 text-brand transition-colors duration-200 group-hover:bg-brand group-hover:text-white">
          <ExamCardIcon />
        </div>
        <span className="text-brand opacity-0 -translate-x-1 transition-all duration-200 group-hover:opacity-100 group-hover:translate-x-0">
          <ArrowIcon />
        </span>
      </div>

      <div className="flex flex-col gap-1.5">
        <Text
          as="p"
          variant="body-medium"
          weight="semibold"
          color="gray-normal"
          className="truncate group-hover:text-brand transition-colors"
        >
          {exam.shortName}
        </Text>
        <span className="inline-flex w-fit items-center px-2 py-0.5 rounded-full text-xs font-medium bg-[var(--color-gray-bg-soft)] text-text-gray-muted">
          {exam.photoSpec.widthPx}×{exam.photoSpec.heightPx}px · {exam.photoSpec.minKB}–{exam.photoSpec.maxKB}KB
        </span>
      </div>
    </Link>
  );
}

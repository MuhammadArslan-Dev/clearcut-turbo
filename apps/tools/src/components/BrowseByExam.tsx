import Link from "next/link";
import Text from "@clearcut/ui/text";
import { RESIZER_EXAMS, getResizerCategories } from "@/lib/resizerExams";
import ExamSearch from "./ExamSearch";
import RecentExams from "./RecentExams";
import { FadeIn, StaggerGrid, StaggerItem } from "./motion";

function FolderIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" className="shrink-0">
      <path
        d="M4 6a2 2 0 012-2h4l2 2h6a2 2 0 012 2v9a2 2 0 01-2 2H6a2 2 0 01-2-2V6z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
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

function CategoryCard({ slug, label, count }: { slug: string; label: string; count: number }) {
  return (
    <Link
      href={`/${slug}`}
      className="group relative flex flex-col gap-3 rounded-2xl border border-[var(--color-border-gray-subtle)] bg-white p-5 shadow-[0_1px_2px_rgba(0,0,0,0.03)] transition-all duration-200 hover:border-brand hover:shadow-[0_10px_28px_rgba(0,0,0,0.08)] hover:-translate-y-1"
    >
      <div className="flex items-start justify-between">
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand/8 text-brand transition-colors duration-200 group-hover:bg-brand group-hover:text-white">
          <FolderIcon />
        </div>
        <span className="text-brand opacity-0 -translate-x-1 transition-all duration-200 group-hover:opacity-100 group-hover:translate-x-0">
          <ArrowIcon />
        </span>
      </div>

      <div className="flex flex-col gap-1.5">
        <Text
          as="p"
          variant="body-large"
          weight="semibold"
          color="gray-normal"
          className="group-hover:text-brand transition-colors"
        >
          {label}
        </Text>
        <span className="inline-flex w-fit items-center px-2 py-0.5 rounded-full text-xs font-medium bg-[var(--color-gray-bg-soft)] text-text-gray-muted">
          {count} exam{count === 1 ? "" : "s"}
        </span>
      </div>
    </Link>
  );
}

/**
 * Category list — the hub page's only inbound link toward the rest of the
 * site: click a category here (real URL: /tools/resizer/{categorySlug} —
 * category and exam slugs share one flat namespace, see
 * src/app/[slug]/page.tsx) to see that category's exams, then click an exam
 * to open its own resizer page. Both levels are statically generated pages,
 * not client-side state, so each is a shareable/bookmarkable/back-button-
 * friendly URL. The search box above it bypasses both levels entirely for
 * anyone who already knows their exam's name.
 */
export default function BrowseByExam() {
  const categories = getResizerCategories();
  const searchableExams = RESIZER_EXAMS.map(({ slug, shortName, fullName, photoSpec }) => ({
    slug,
    shortName,
    fullName,
    photoSpec,
  }));

  return (
    <div className="mt-16 md:mt-20">
      <RecentExams />

      <div className="max-w-[1080px] mx-auto px-2">
        <FadeIn className="text-center mb-2">
          <h2 className="heading-large !font-bold text-text-gray-normal">Browse by exam</h2>
          <Text as="p" variant="body-medium" color="gray-muted" className="mt-2">
            Every exam has its own photo &amp; signature size — search, or pick a category, then your exam.
          </Text>
        </FadeIn>

        <FadeIn delay={0.1} className="mt-6">
          <ExamSearch exams={searchableExams} placeholder="Search your exam (e.g. UPSC, CTET, SBI PO)…" />
        </FadeIn>

        <StaggerGrid className="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-8">
          {categories.map((category) => (
            <StaggerItem key={category.slug}>
              <CategoryCard slug={category.slug} label={category.label} count={category.exams.length} />
            </StaggerItem>
          ))}
        </StaggerGrid>
      </div>
    </div>
  );
}

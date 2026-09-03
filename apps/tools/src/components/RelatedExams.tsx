import Text from "@clearcut/ui/text";
import ExamCard from "./ExamCard";
import { StaggerGrid, StaggerItem } from "./motion";
import { ResizerExamSpec } from "@/lib/resizerExams";
import { getDict, Locale } from "@/lib/dictionary";

function LinkIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" className="shrink-0">
      <path
        d="M10 13a5 5 0 007.07 0l2.83-2.83a5 5 0 00-7.07-7.07l-1.5 1.5M14 11a5 5 0 00-7.07 0L4.1 13.83a5 5 0 007.07 7.07l1.5-1.5"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

const MAX_RELATED = 8;

/**
 * "Also resize for {category} exams" — every other exam in the current
 * exam's own category, so a candidate prepping for more than one exam can
 * jump straight to the next one's resizer instead of going back through
 * the hub. Same category data ResizerSpokePage already threads through
 * (getCategoryForExam), just capped and with the current exam excluded.
 */
export default function RelatedExams({
  exam,
  categoryExams,
  categoryLabel,
  locale = "en",
}: {
  exam: ResizerExamSpec;
  categoryExams: ResizerExamSpec[];
  categoryLabel: string;
  locale?: Locale;
}) {
  const t = getDict(locale).spoke;
  const others = categoryExams.filter((e) => e.slug !== exam.slug).slice(0, MAX_RELATED);
  if (others.length === 0) return null;

  return (
    <div className="mt-16 md:mt-20 max-w-[1080px] mx-auto px-2">
      <div className="text-center flex flex-col items-center gap-2">
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-brand/8 text-brand">
          <LinkIcon /> {t.relatedToolsBadge}
        </span>
        <h2 className="heading-large !font-bold text-text-gray-normal">
          {t.relatedToolsTitlePrefix && `${t.relatedToolsTitlePrefix} `}
          <span className="text-brand">{categoryLabel}</span>
          {t.relatedToolsTitleSuffix && ` ${t.relatedToolsTitleSuffix}`}
        </h2>
        <Text as="p" variant="body-medium" color="gray-muted" className="max-w-[560px]">
          {t.relatedToolsLead(categoryLabel)}
        </Text>
      </div>

      {/* With only 1-2 sibling exams in a small category, a 4-column grid
          leaves most of the row empty and reads as left-aligned rather than
          balanced — cap the row width and center it in that case instead of
          always spanning the full 1080px container. */}
      <StaggerGrid
        className={`grid gap-3 mt-8 mx-auto ${
          others.length >= 3 ? "grid-cols-2 sm:grid-cols-3 lg:grid-cols-4" : "grid-cols-1 sm:grid-cols-2 max-w-[500px]"
        }`}
      >
        {others.map((e) => (
          <StaggerItem key={e.slug}>
            <ExamCard exam={e} locale={locale} />
          </StaggerItem>
        ))}
      </StaggerGrid>
    </div>
  );
}

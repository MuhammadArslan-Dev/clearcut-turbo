import Text from "@clearcut/ui/text";
import LocaleLink from "./LocaleLink";
import type { ResizerExamSpec } from "@/lib/resizerExams";
import { getDict, type Locale } from "@/lib/dictionary";

const LINK_CLASS =
  "flex items-center justify-between gap-3 rounded-xl border border-[var(--color-border-gray-subtle)] px-4 py-3 body-medium !font-semibold text-text-gray-normal hover:border-brand hover:text-brand transition-colors";

/**
 * "More for {Exam}" (CC-159): the exam's own clearcutoff.in/teaching page
 * and its age-limit calculator. Sibling resizers are RelatedExams' job.
 * Each link renders only when its page really exists: the teaching page
 * slug comes from the sheet (`teachingPageSlug`), the age calculator slug
 * from the age-calculator data loaded at build time.
 */
export default function TeachingLinks({
  exam,
  ageCalculatorSlug,
  locale,
}: {
  exam: ResizerExamSpec;
  ageCalculatorSlug?: string;
  locale: Locale;
}) {
  const t = getDict(locale).teaching.links;
  if (!exam.teachingPageSlug && !ageCalculatorSlug) return null;

  // Landing (clearcutoff.in) serves /teaching/<slug> in en, hi and mr.
  const teachingHref = exam.teachingPageSlug
    ? `https://clearcutoff.in${locale === "en" ? "" : `/${locale}`}/teaching/${exam.teachingPageSlug}`
    : null;

  return (
    <div className="mt-16 md:mt-20 max-w-[620px] mx-auto flex flex-col gap-3">
      <Text as="h2" variant="heading-medium" weight="bold" color="gray-normal" className="text-center">
        {t.title(exam.shortName)}
      </Text>
      {teachingHref && (
        <a href={teachingHref} className={LINK_CLASS}>
          {t.teachingPage(exam.shortName)} <span aria-hidden="true">→</span>
        </a>
      )}
      {ageCalculatorSlug && (
        <LocaleLink locale={locale} tool="age-eligibility-calculator" href={`/${ageCalculatorSlug}`} className={LINK_CLASS}>
          {t.ageCalculator(exam.shortName)} <span aria-hidden="true">→</span>
        </LocaleLink>
      )}
    </div>
  );
}

import SiteHeader from "./SiteHeader";
import SiteFooter from "./SiteFooter";
import Text from "@clearcut/ui/text";
import ExamCard from "./ExamCard";
import ExamSearch from "./ExamSearch";
import LocaleLink from "./LocaleLink";
import { FadeIn, StaggerGrid, StaggerItem } from "./motion";
import { ResizerCategory } from "@/lib/resizerExams";
import { getCategoryLabel, getDict, Locale } from "@/lib/dictionary";

/**
 * Category spoke — rendered by the same dynamic template as exam pages
 * (src/app/[slug]/page.tsx; category and exam slugs share one flat
 * namespace) for every category derived from resizerExams.ts, mirroring how
 * ResizerSpokePage does one template per exam. Lists every exam in the
 * category via the shared ExamCard (same component the hub page's category
 * list uses), so a card design change only happens in one place.
 */
export default function CategoryPage({ category, locale = "en" }: { category: ResizerCategory; locale?: Locale }) {
  const t = getDict(locale).category;
  const label = getCategoryLabel(category.label, locale);
  const searchableExams = category.exams.map(({ slug, shortName, fullName, photoSpec }) => ({
    slug,
    shortName,
    fullName,
    photoSpec,
  }));

  return (
    <div>
      <SiteHeader locale={locale} />

      <div className="px-4 md:px-6 py-10 md:py-14">
        <FadeIn className="max-w-[620px] mx-auto text-center flex flex-col items-center gap-4 mb-10">
          <h1 className="heading-xlarge !text-[32px] md:!text-[48px] md:!leading-[1.25] !font-bold text-text-gray-normal">
            {t.h1(label)}
          </h1>
          <p className="body-large !text-[17px] md:!text-[19px] text-text-gray-muted">{t.lead}</p>
        </FadeIn>

        <FadeIn delay={0.1} className="max-w-[1080px] mx-auto mb-8">
          <ExamSearch exams={searchableExams} placeholder={t.searchWithin(label)} locale={locale} />
        </FadeIn>

        <div className="max-w-[1080px] mx-auto">
          <StaggerGrid className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {category.exams.map((exam) => (
              <StaggerItem key={exam.slug}>
                <ExamCard exam={exam} locale={locale} />
              </StaggerItem>
            ))}
          </StaggerGrid>
        </div>

        <div className="mt-10 text-center">
          <Text as="p" variant="body-small" color="gray-muted">
            {t.differentCategoryPrompt}{" "}
            <LocaleLink locale={locale} href="/" className="text-brand font-semibold">
              {t.browseAllExams}
            </LocaleLink>
          </Text>
        </div>
      </div>

      <SiteFooter locale={locale} />
    </div>
  );
}

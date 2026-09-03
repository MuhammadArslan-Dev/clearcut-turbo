import SiteHeader from "./SiteHeader";
import SiteFooter from "./SiteFooter";
import Text from "@clearcut/ui/text";
import ResizeImageTool from "./ResizeImageTool";
import FAQAccordion, { AccordionItem } from "./FAQAccordion";
import RecentExamTracker from "./RecentExamTracker";
import { FadeIn } from "./motion";
import { ResizerExamSpec, getCategoryForExam, getExamFaqs } from "@/lib/resizerExams";
import { OFFICIAL_REQUIREMENTS } from "@/lib/officialRequirements";
import { getCategoryLabel, getDict, Locale } from "@/lib/dictionary";
import LocaleLink from "./LocaleLink";
import RelatedExams from "./RelatedExams";
import OfficialRequirements from "./OfficialRequirements";

function SpecTable({ exam, locale }: { exam: ResizerExamSpec; locale: Locale }) {
  const t = getDict(locale).spoke;
  const rows = [
    { label: t.specPhoto, spec: exam.photoSpec },
    { label: t.specSignature, spec: exam.signatureSpec },
  ];

  return (
    <div className="max-w-[620px] mx-auto w-full overflow-x-auto rounded-2xl border border-[var(--color-border-gray-subtle)]">
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="bg-brand/5">
            <th className="px-4 py-3 body-medium !font-semibold text-text-gray-normal">{t.specDocument}</th>
            <th className="px-4 py-3 body-medium !font-semibold text-text-gray-normal">
              {getDict(locale).tool.dimensions}
            </th>
            <th className="px-4 py-3 body-medium !font-semibold text-text-gray-normal">{t.specFileSize}</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.label} className="border-t border-[var(--color-border-gray-subtle)]">
              <td className="px-4 py-3 body-medium !font-semibold text-text-gray-normal">{row.label}</td>
              <td className="px-4 py-3 body-medium text-text-gray-muted">
                {row.spec.widthPx}×{row.spec.heightPx}px
              </td>
              <td className="px-4 py-3 body-medium text-text-gray-muted">
                {row.spec.minKB}–{row.spec.maxKB}KB
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/**
 * Spoke page — one dynamic template (src/app/[examSlug]/page.tsx) rendering
 * this same component for every exam in resizerExams.ts, not a separate
 * hardcoded page per exam. Same tool as the hub (ResizeHubPage), plus an
 * exam-specific spec table and FAQ section.
 */
export default function ResizerSpokePage({ exam, locale = "en" }: { exam: ResizerExamSpec; locale?: Locale }) {
  const t = getDict(locale).spoke;
  const faqItems: AccordionItem[] = getExamFaqs(exam.shortName, exam.photoSpec, exam.signatureSpec, locale).map(
    (faq, i) => ({
      id: `faq-${i}`,
      title: faq.q,
      content: faq.a,
    }),
  );
  const category = getCategoryForExam(exam);
  const officialRequirements = OFFICIAL_REQUIREMENTS[exam.slug];
  return (
    <div>
      <RecentExamTracker exam={exam} />
      <SiteHeader locale={locale} />

      <div className="px-4 md:px-6 py-10 md:py-14">
        <FadeIn className="max-w-[620px] mx-auto text-center flex flex-col items-center gap-4 mb-10">
          <h1 className="heading-xlarge !text-[32px] md:!text-[48px] md:!leading-[1.25] !font-bold text-text-gray-normal">
            {t.h1(exam.shortName)}
          </h1>
          <p className="body-large !text-[17px] md:!text-[19px] text-text-gray-muted">{t.lead(exam.shortName, exam.fullName)}</p>
        </FadeIn>

        {/* Only Photo + Signature — the two document types resizerExams.ts
            actually has verified per-exam specs for, and the only pair the
            Image Resizer mode ever shows (matches ResizeHubPage). */}
        <ResizeImageTool
          photoSpec={exam.photoSpec}
          signatureSpec={exam.signatureSpec}
          allowedPresets={["photo", "draw"]}
          locale={locale}
        />

        {category && (
          <RelatedExams
            exam={exam}
            categoryExams={category.exams}
            categoryLabel={getCategoryLabel(category.label, locale)}
            locale={locale}
          />
        )}

        <div className="mt-16 md:mt-20 flex flex-col items-center gap-4">
          <h2 className="heading-large !font-bold text-text-gray-normal text-center">
            {t.specsTitle(exam.shortName)}
          </h2>
          <SpecTable exam={exam} locale={locale} />
        </div>

        {officialRequirements && (
          <OfficialRequirements shortName={exam.shortName} data={officialRequirements} locale={locale} />
        )}

        <div className="mt-16 md:mt-20 max-w-[720px] mx-auto">
          <h2 className="heading-large !font-bold text-text-gray-normal text-center mb-6">
            {t.faqsTitle(exam.shortName)}
          </h2>
          <FAQAccordion items={faqItems} defaultOpenId={faqItems[0]?.id} />
        </div>

        <div className="mt-10 text-center">
          <Text as="p" variant="body-small" color="gray-muted">
            {t.differentExamPrompt}{" "}
            <LocaleLink locale={locale} href="/" className="text-brand font-semibold">
              {t.useGeneralResizer}
            </LocaleLink>
          </Text>
        </div>
      </div>

      <SiteFooter locale={locale} />
    </div>
  );
}

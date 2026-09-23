import { Metadata } from "next";
import Text from "@clearcut/ui/text";
import JsonLd from "@clearcut/ui/json-ld";
import SiteHeader from "@/components/SiteHeader";
import ToolsFooter from "@/components/SiteFooter";
import FAQAccordion, { AccordionItem } from "@/components/FAQAccordion";
import AgeExamCard, { ageLimitLabel } from "@/components/AgeExamCard";
import LocaleLink from "@/components/LocaleLink";
import { AGE_ELIGIBILITY_EXAMS, getAgeEligibilityExamBySlug, type ExamGroup } from "@/lib/ageEligibility";
import { getAgeCalcStrings } from "@/lib/ageCalculatorStrings";

// Mirrors src/app/age-eligibility-calculator/page.tsx — see that file for the
// full section-by-section design notes. Hindi UI chrome only.
export const metadata: Metadata = {
  title: `${AGE_ELIGIBILITY_EXAMS.length} सरकारी परीक्षाओं के लिए आयु कैलकुलेटर | Clear Cutoff`,
  description:
    "UPSC, SSC, बैंकिंग, रेलवे, रक्षा, State PSC, टीचिंग और अन्य परीक्षाओं के लिए अपनी सही उम्र और पात्रता जांचें — मुफ्त, निजी, पूरी तरह आपके ब्राउज़र में।",
  alternates: {
    canonical: "https://clearcutoff.in/hi/tools/age-eligibility-calculator",
    languages: {
      en: "https://clearcutoff.in/tools/age-eligibility-calculator",
      hi: "https://clearcutoff.in/hi/tools/age-eligibility-calculator",
    },
  },
};

const POPULAR_SLUGS = ["upsc-ias", "ssc-cgl", "ssc-mts", "ibps-po", "sbi-po", "rbi-grade-b"];

const CATEGORY_GROUPS: ExamGroup[] = [
  "Civil Services",
  "Banking",
  "Railways",
  "Defence",
  "SSC Exams",
  "Engineering",
  "Medical",
  "State PSC",
  "Teaching",
  "Insurance",
  "Police",
];

export default function Page() {
  const t = getAgeCalcStrings("hi");
  const groupCounts = new Map<ExamGroup, number>();
  for (const exam of AGE_ELIGIBILITY_EXAMS) groupCounts.set(exam.group, (groupCounts.get(exam.group) ?? 0) + 1);

  const popularExams = POPULAR_SLUGS.map((slug) => getAgeEligibilityExamBySlug(slug)).filter((e) => e !== undefined);

  const faqItems: AccordionItem[] = t.homeFaqs.map((faq, i) => ({ id: `home-faq-${i}`, title: faq.q, content: faq.a }));

  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: t.homeFaqs.map((faq) => ({
      "@type": "Question",
      name: faq.q,
      acceptedAnswer: { "@type": "Answer", text: faq.a },
    })),
  };

  const webAppSchema = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: "आयु पात्रता कैलकुलेटर",
    applicationCategory: "UtilityApplication",
    operatingSystem: "Any (runs in browser)",
    url: "https://clearcutoff.in/hi/tools/age-eligibility-calculator",
    description:
      "UPSC, SSC, बैंकिंग, रेलवे, रक्षा, State PSC, टीचिंग और अन्य सरकारी परीक्षाओं के लिए अपनी सही उम्र और श्रेणी-वार पात्रता जांचें — मुफ्त, निजी, पूरी तरह आपके ब्राउज़र में।",
    offers: { "@type": "Offer", price: "0", priceCurrency: "INR" },
    publisher: { "@type": "Organization", name: "Clear Cutoff", url: "https://clearcutoff.in" },
  };

  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "होम", item: "https://clearcutoff.in" },
      { "@type": "ListItem", position: 2, name: "मुफ्त टूल्स", item: "https://clearcutoff.in/tools" },
      {
        "@type": "ListItem",
        position: 3,
        name: "आयु पात्रता कैलकुलेटर",
        item: "https://clearcutoff.in/hi/tools/age-eligibility-calculator",
      },
    ],
  };

  return (
    <>
      <JsonLd id="age-calc-home-faq-schema" data={faqSchema} />
      <JsonLd id="age-calc-home-app-schema" data={webAppSchema} />
      <JsonLd id="age-calc-home-breadcrumb-schema" data={breadcrumbSchema} />
      <SiteHeader locale="hi" tool="age-eligibility-calculator" />

      <div className="relative overflow-hidden">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 top-0 h-[420px] bg-gradient-to-b from-[var(--color-primary-bg-soft)] to-transparent"
        />

        <main className="relative max-w-[1100px] mx-auto px-4 md:px-6 pb-16">
          <div className="text-center py-10 md:py-14">
            <span className="inline-block body-small !font-semibold text-brand bg-[var(--color-primary-bg-soft)] rounded-full px-4 py-1.5 mb-5">
              {t.helpBadge}
            </span>
            <Text as="h1" variant="display-medium" weight="bold" color="gray-normal">
              {t.hubHeadingPrefix}
              <span className="text-brand">{t.hubHeadingHighlight}</span>
              {t.hubHeadingSuffix}
            </Text>
            <Text as="p" variant="body-large" color="gray-muted" className="mt-3 max-w-xl mx-auto">
              {t.hubSubtitle(AGE_ELIGIBILITY_EXAMS.length - 5)}
            </Text>
            <div className="flex flex-wrap items-center justify-center gap-3 mt-6">
              <LocaleLink
                locale="hi"
                tool="age-eligibility-calculator"
                href="/all"
                className="inline-flex items-center gap-2 rounded-full bg-brand hover:bg-[var(--color-brand-hover)] text-white body-medium !font-semibold px-6 py-3 transition-colors"
              >
                {t.exploreCalculators}
              </LocaleLink>
              <LocaleLink
                locale="hi"
                tool="age-eligibility-calculator"
                href="/upsc-ias"
                className="inline-flex items-center gap-2 rounded-full border border-[var(--color-border-gray-subtle)] bg-white hover:border-brand hover:text-brand text-text-gray-normal body-medium !font-semibold px-6 py-3 transition-colors"
              >
                {t.checkExampleEligibility}
              </LocaleLink>
            </div>
          </div>
        </main>
      </div>

      <main className="max-w-[1100px] mx-auto px-4 md:px-6">
        {/* Popular Calculators */}
        <section className="pb-16">
          <div className="flex items-end justify-between gap-3 mb-5 flex-wrap">
            <div>
              <Text as="h2" variant="heading-xlarge" weight="bold" color="gray-normal">
                {t.popularTitle}
              </Text>
              <Text as="p" variant="body-medium" color="gray-muted" className="mt-1">
                {t.popularSubtitle}
              </Text>
            </div>
            <LocaleLink
              locale="hi"
              tool="age-eligibility-calculator"
              href="/all"
              className="body-medium !font-semibold text-brand hover:underline whitespace-nowrap"
            >
              {t.viewAllExams(AGE_ELIGIBILITY_EXAMS.length)}
            </LocaleLink>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {popularExams.map((exam) => (
              <AgeExamCard
                key={exam.slug}
                exam={exam}
                href={`/hi/tools/age-eligibility-calculator/${exam.slug}`}
                ageLimitText={ageLimitLabel(exam, t.noLimit, t.minLabel)}
                ageLimitLabelText={t.ageLimit}
                popularLabel={t.popular}
                locale="hi"
              />
            ))}
          </div>
        </section>

        {/* Browse By Category */}
        <section className="pb-16 text-center">
          <Text as="h2" variant="heading-xlarge" weight="bold" color="gray-normal">
            {t.browseByCategoryTitle}
          </Text>
          <Text as="p" variant="body-medium" color="gray-muted" className="mt-1 mb-6">
            {t.browseByCategorySubtitle}
          </Text>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-left">
            {CATEGORY_GROUPS.map((group) => (
              <a
                key={group}
                href={`/hi/tools/age-eligibility-calculator/all?group=${encodeURIComponent(group)}`}
                className="group flex flex-col items-center text-center gap-2 rounded-2xl border border-[var(--color-border-gray-subtle)] bg-white p-6 transition-all hover:border-brand hover:shadow-[0_4px_18px_rgba(0,0,0,0.06)] hover:-translate-y-0.5"
              >
                <Text as="p" variant="body-medium" weight="bold" color="gray-normal">
                  {group}
                </Text>
                <Text as="p" variant="body-small" color="gray-muted">
                  {t.examsCount(groupCounts.get(group) ?? 0)}
                </Text>
              </a>
            ))}
          </div>
        </section>
      </main>

      {/* Why Aspirants Trust Us */}
      <section className="bg-gradient-to-br from-brand to-brand-dark py-16 px-4">
        <div className="max-w-[1100px] mx-auto text-center">
          <Text as="h2" variant="heading-xlarge" weight="bold" color="white">
            {t.trustTitle}
          </Text>
          <Text as="p" variant="body-large" color="white" className="mt-1 mb-8 opacity-90 max-w-xl mx-auto">
            {t.trustSubtitle}
          </Text>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-left">
            {t.trustItems.map((item) => (
              <div key={item.title} className="rounded-2xl bg-white/10 p-5">
                <Text as="p" variant="body-large" weight="bold" color="white" className="mb-1.5">
                  {item.title}
                </Text>
                <Text as="p" variant="body-small" color="white" className="opacity-90">
                  {item.body}
                </Text>
              </div>
            ))}
          </div>
        </div>
      </section>

      <main className="max-w-[1100px] mx-auto px-4 md:px-6">
        {/* How It Works */}
        <section className="py-16 text-center">
          <Text as="h2" variant="heading-xlarge" weight="bold" color="gray-normal">
            {t.howItWorksTitle}
          </Text>
          <Text as="p" variant="body-medium" color="gray-muted" className="mt-1 mb-6">
            {t.howItWorksSubtitle}
          </Text>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-left">
            {t.howItWorksSteps.map((step) => (
              <div key={step.title} className="rounded-2xl border border-[var(--color-border-gray-subtle)] bg-white p-6">
                <Text as="p" variant="heading-small" weight="bold" color="gray-normal" className="mb-2">
                  {step.title}
                </Text>
                <Text as="p" variant="body-small" color="gray-muted">
                  {step.body}
                </Text>
              </div>
            ))}
          </div>
        </section>

        {/* More Free Tools */}
        <section className="pb-16 text-center">
          <Text as="h2" variant="heading-xlarge" weight="bold" color="gray-normal">
            {t.suiteTitle}
          </Text>
          <Text as="p" variant="body-medium" color="gray-muted" className="mt-1 mb-6 max-w-xl mx-auto">
            {t.suiteSubtitle}
          </Text>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-left max-w-2xl mx-auto">
            <a
              href="/hi/tools/resizer"
              className="group flex flex-col gap-2 rounded-2xl border border-[var(--color-border-gray-subtle)] bg-white p-6 transition-all hover:border-brand hover:shadow-[0_4px_18px_rgba(0,0,0,0.06)] hover:-translate-y-0.5"
            >
              <Text as="p" variant="body-large" weight="bold" color="gray-normal" className="group-hover:text-brand transition-colors">
                {t.suiteResizerTitle}
              </Text>
              <Text as="p" variant="body-small" color="gray-muted">
                {t.suiteResizerBody}
              </Text>
              <Text as="p" variant="body-small" weight="semibold" className="!text-brand mt-1">
                {t.suiteResizerCta} →
              </Text>
            </a>
            <div className="flex flex-col justify-center items-center gap-2 rounded-2xl border border-dashed border-[var(--color-border-gray-subtle)] p-6 text-center">
              <Text as="p" variant="body-medium" weight="semibold" color="gray-muted">
                {t.suiteComingSoon}
              </Text>
            </div>
          </div>
        </section>

        {/* CTA banner */}
        <section className="pb-16">
          <div className="rounded-3xl bg-[var(--color-primary-bg-soft)] px-8 py-12 text-center">
            <Text as="h2" variant="heading-xlarge" weight="bold" color="gray-normal">
              {t.ctaTitle}
            </Text>
            <Text as="p" variant="body-large" color="gray-muted" className="mt-2 mb-6 max-w-lg mx-auto">
              {t.ctaSubtitle}
            </Text>
            <LocaleLink
              locale="hi"
              tool="age-eligibility-calculator"
              href="/all"
              className="inline-flex items-center gap-2 rounded-full bg-brand hover:bg-[var(--color-brand-hover)] text-white body-medium !font-semibold px-6 py-3 transition-colors"
            >
              {t.ctaButton}
            </LocaleLink>
          </div>
        </section>

        {/* Site-level FAQ */}
        <section className="pb-16">
          <div className="text-center mb-6">
            <Text as="h2" variant="heading-xlarge" weight="bold" color="gray-normal">
              {t.homeFaqTitle}
            </Text>
            <Text as="p" variant="body-medium" color="gray-muted" className="mt-1">
              {t.homeFaqSubtitle}
            </Text>
          </div>
          <FAQAccordion items={faqItems} defaultOpenId={faqItems[0]?.id} />
        </section>
      </main>

      <ToolsFooter locale="hi" />
    </>
  );
}

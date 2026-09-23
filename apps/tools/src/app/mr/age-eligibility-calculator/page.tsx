import { Metadata } from "next";
import { buildMetadata } from "@/lib/seo";
import PageJsonLd from "@/components/PageJsonLd";
import Text from "@clearcut/ui/text";
import SiteHeader from "@/components/SiteHeader";
import ToolsFooter from "@/components/SiteFooter";
import FAQAccordion, { AccordionItem } from "@/components/FAQAccordion";
import AgeExamCard, { ageLimitLabel } from "@/components/AgeExamCard";
import LocaleLink from "@/components/LocaleLink";
import { getAgeEligibilityCategories, getAgeEligibilityExams, getPopularAgeExams } from "@/lib/ageEligibility";
import { getAgeCalcStrings } from "@/lib/ageCalculatorStrings";

// Mirrors src/app/age-eligibility-calculator/page.tsx — see that file for the
// full section-by-section design notes. Marathi UI chrome only.
export async function generateMetadata(): Promise<Metadata> {
  const exams = await getAgeEligibilityExams();
  return buildMetadata({
    locale: "mr",
    path: "/age-eligibility-calculator",
    title: `${exams.length} सरकारी परीक्षांसाठी वय कॅल्क्युलेटर | Clear Cutoff`,
    description: "UPSC, SSC, बँकिंग, रेल्वे, संरक्षण, State PSC, टीचिंग आणि इतर परीक्षांसाठी तुमचे अचूक वय आणि पात्रता तपासा — मोफत, खासगी, पूर्णपणे तुमच्या ब्राउझरमध्ये.",
  });
}

export default async function Page() {
  const t = getAgeCalcStrings("mr");
  const exams = await getAgeEligibilityExams();
  const groupCounts = new Map<string, number>();
  for (const exam of exams) groupCounts.set(exam.group, (groupCounts.get(exam.group) ?? 0) + 1);

  const categories = await getAgeEligibilityCategories("mr");
  const labelBySlug = new Map(categories.map((c) => [c.slug, c.label]));
  const popularExams = await getPopularAgeExams();

  const faqItems: AccordionItem[] = t.homeFaqs.map((faq, i) => ({ id: `home-faq-${i}`, title: faq.q, content: faq.a }));

  return (
    <>
      <PageJsonLd
        locale="mr"
        path="/age-eligibility-calculator"
        trail={[{ name: "वय पात्रता कॅल्क्युलेटर", path: "/age-eligibility-calculator" }]}
        app={{ name: "वय पात्रता कॅल्क्युलेटर", description: "UPSC, SSC, बँकिंग, रेल्वे, संरक्षण, State PSC, टीचिंग आणि इतर सरकारी परीक्षांसाठी तुमचे अचूक वय आणि श्रेणीनुसार पात्रता तपासा — मोफत, खासगी, पूर्णपणे तुमच्या ब्राउझरमध्ये." }}
        faqs={t.homeFaqs}
      />
      <SiteHeader locale="mr" tool="age-eligibility-calculator" />

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
              {t.hubSubtitle(exams.length - 5)}
            </Text>
            <div className="flex flex-wrap items-center justify-center gap-3 mt-6">
              <LocaleLink
                locale="mr"
                tool="age-eligibility-calculator"
                href="/all"
                className="inline-flex items-center gap-2 rounded-full bg-brand hover:bg-[var(--color-brand-hover)] text-white body-medium !font-semibold px-6 py-3 transition-colors"
              >
                {t.exploreCalculators}
              </LocaleLink>
              <LocaleLink
                locale="mr"
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
              locale="mr"
              tool="age-eligibility-calculator"
              href="/all"
              className="body-medium !font-semibold text-brand hover:underline whitespace-nowrap"
            >
              {t.viewAllExams(exams.length)}
            </LocaleLink>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {popularExams.map((exam) => (
              <AgeExamCard
                key={exam.slug}
                groupLabel={labelBySlug.get(exam.group)}
                exam={exam}
                href={`/mr/tools/age-eligibility-calculator/${exam.slug}`}
                ageLimitText={ageLimitLabel(exam, t.noLimit, t.minLabel)}
                ageLimitLabelText={t.ageLimit}
                popularLabel={t.popular}
                locale="mr"
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
            {categories.map((category) => (
              <a
                key={category.slug}
                href={`/mr/tools/age-eligibility-calculator/all?group=${encodeURIComponent(category.slug)}`}
                className="group flex flex-col items-center text-center gap-2 rounded-2xl border border-[var(--color-border-gray-subtle)] bg-white p-6 transition-all hover:border-brand hover:shadow-[0_4px_18px_rgba(0,0,0,0.06)] hover:-translate-y-0.5"
              >
                <Text as="p" variant="body-medium" weight="bold" color="gray-normal">
                  {category.label}
                </Text>
                <Text as="p" variant="body-small" color="gray-muted">
                  {t.examsCount(groupCounts.get(category.slug) ?? 0)}
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
              href="/mr/tools/resizer"
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
              locale="mr"
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

      <ToolsFooter locale="mr" />
    </>
  );
}

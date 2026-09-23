import { Metadata } from "next";
import Link from "next/link";
import Text from "@clearcut/ui/text";
import JsonLd from "@clearcut/ui/json-ld";
import SiteHeader from "@/components/SiteHeader";
import ToolsFooter from "@/components/SiteFooter";
import FAQAccordion, { AccordionItem } from "@/components/FAQAccordion";
import AgeExamCard, { ageLimitLabel } from "@/components/AgeExamCard";
import { AGE_ELIGIBILITY_EXAMS, getAgeEligibilityExamBySlug, type ExamGroup } from "@/lib/ageEligibility";
import { getAgeCalcStrings } from "@/lib/ageCalculatorStrings";

export const metadata: Metadata = {
  title: `Age Calculator for ${AGE_ELIGIBILITY_EXAMS.length} Govt Exams | Clear Cutoff`,
  description:
    "Check your exact age and eligibility for UPSC, SSC, Banking, Railways, Defence, State PSC, Teaching and more — free, private, calculated entirely in your browser.",
  alternates: { canonical: "https://clearcutoff.in/tools/age-eligibility-calculator" },
  openGraph: {
    title: `Age Calculator for ${AGE_ELIGIBILITY_EXAMS.length} Govt Exams | Clear Cutoff`,
    description: "Check your exact age and eligibility for UPSC, SSC, Banking, Railways, Defence, State PSC, Teaching and more.",
    url: "https://clearcutoff.in/tools/age-eligibility-calculator",
    siteName: "Clear Cutoff",
    type: "website",
  },
};

const POPULAR_SLUGS = ["upsc-ias", "ssc-cgl", "ssc-mts", "ibps-po", "sbi-po", "rbi-grade-b"];

const CATEGORY_GROUPS: { group: ExamGroup; icon: React.ReactNode }[] = [
  { group: "Civil Services", icon: <BankIcon /> },
  { group: "Banking", icon: <BriefcaseIcon /> },
  { group: "Railways", icon: <TrainIcon /> },
  { group: "Defence", icon: <ShieldIcon /> },
  { group: "SSC Exams", icon: <BuildingIcon /> },
  { group: "Engineering", icon: <CapIcon /> },
  { group: "Medical", icon: <StethoscopeIcon /> },
  { group: "State PSC", icon: <MapIcon /> },
  { group: "Teaching", icon: <BookIcon /> },
  { group: "Insurance", icon: <HeartIcon /> },
  { group: "Police", icon: <ShieldAlertIcon /> },
];

export default function Page() {
  const t = getAgeCalcStrings("en");
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
    name: "Age Eligibility Calculator",
    applicationCategory: "UtilityApplication",
    operatingSystem: "Any (runs in browser)",
    url: "https://clearcutoff.in/tools/age-eligibility-calculator",
    description:
      "Check your exact age and category-wise eligibility for UPSC, SSC, Banking, Railways, Defence, State PSC, Teaching and other government exams — free, private, calculated entirely in your browser.",
    offers: { "@type": "Offer", price: "0", priceCurrency: "INR" },
    publisher: { "@type": "Organization", name: "Clear Cutoff", url: "https://clearcutoff.in" },
  };

  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: "https://clearcutoff.in" },
      { "@type": "ListItem", position: 2, name: "Free Tools", item: "https://clearcutoff.in/tools" },
      {
        "@type": "ListItem",
        position: 3,
        name: "Age Eligibility Calculator",
        item: "https://clearcutoff.in/tools/age-eligibility-calculator",
      },
    ],
  };

  return (
    <>
      <JsonLd id="age-calc-home-faq-schema" data={faqSchema} />
      <JsonLd id="age-calc-home-app-schema" data={webAppSchema} />
      <JsonLd id="age-calc-home-breadcrumb-schema" data={breadcrumbSchema} />
      <SiteHeader tool="age-eligibility-calculator" />

      <div className="relative overflow-hidden">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 top-0 h-[420px] bg-gradient-to-b from-[var(--color-primary-bg-soft)] to-transparent"
        />

        <main className="relative max-w-[1100px] mx-auto px-4 md:px-6 pb-16">
          {/* Hero */}
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
              <Link
                href="/age-eligibility-calculator/all"
                className="inline-flex items-center gap-2 rounded-full bg-brand hover:bg-[var(--color-brand-hover)] text-white body-medium !font-semibold px-6 py-3 transition-colors"
              >
                {t.exploreCalculators}
                <ArrowRightIcon />
              </Link>
              <Link
                href="/age-eligibility-calculator/upsc-ias"
                className="inline-flex items-center gap-2 rounded-full border border-[var(--color-border-gray-subtle)] bg-white hover:border-brand hover:text-brand text-text-gray-normal body-medium !font-semibold px-6 py-3 transition-colors"
              >
                {t.checkExampleEligibility}
              </Link>
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
            <Link href="/age-eligibility-calculator/all" className="body-medium !font-semibold text-brand hover:underline whitespace-nowrap">
              {t.viewAllExams(AGE_ELIGIBILITY_EXAMS.length)}
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {popularExams.map((exam) => (
              <AgeExamCard
                key={exam.slug}
                exam={exam}
                href={`/age-eligibility-calculator/${exam.slug}`}
                ageLimitText={ageLimitLabel(exam)}
                ageLimitLabelText={t.ageLimit}
                popularLabel={t.popular}
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
            {CATEGORY_GROUPS.map(({ group, icon }) => (
              <Link
                key={group}
                href={`/age-eligibility-calculator/all?group=${encodeURIComponent(group)}`}
                className="group flex flex-col items-center text-center gap-2 rounded-2xl border border-[var(--color-border-gray-subtle)] bg-white p-6 transition-all hover:border-brand hover:shadow-[0_4px_18px_rgba(0,0,0,0.06)] hover:-translate-y-0.5"
              >
                <span className="grid place-items-center w-12 h-12 rounded-full bg-[var(--color-gray-bg-soft)] text-brand group-hover:bg-[var(--color-primary-bg-soft)] transition-colors">
                  {icon}
                </span>
                <Text as="p" variant="body-medium" weight="bold" color="gray-normal">
                  {group}
                </Text>
                <Text as="p" variant="body-small" color="gray-muted">
                  {t.examsCount(groupCounts.get(group) ?? 0)}
                </Text>
              </Link>
            ))}
          </div>
        </section>
      </main>

      {/* Why Aspirants Trust Us — full-width brand band */}
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
              href="/tools/resizer"
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
            <Link
              href="/age-eligibility-calculator/all"
              className="inline-flex items-center gap-2 rounded-full bg-brand hover:bg-[var(--color-brand-hover)] text-white body-medium !font-semibold px-6 py-3 transition-colors"
            >
              {t.ctaButton}
              <ArrowRightIcon />
            </Link>
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

      <ToolsFooter />
    </>
  );
}

function ArrowRightIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 12h14M13 6l6 6-6 6" />
    </svg>
  );
}

function BankIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 21h18M4 18h16M6 18v-7M10 18v-7M14 18v-7M18 18v-7M3 9l9-5 9 5" />
    </svg>
  );
}

function BriefcaseIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="7" width="20" height="14" rx="2" />
      <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
    </svg>
  );
}

function TrainIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="4" y="3" width="16" height="13" rx="2" />
      <path d="M4 11h16M8 19l-2 3M16 19l2 3M8 16v0M16 16v0" />
    </svg>
  );
}

function ShieldIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2 4 5v6c0 5 3.5 8.5 8 11 4.5-2.5 8-6 8-11V5l-8-3Z" />
    </svg>
  );
}

function BuildingIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="4" y="2" width="16" height="20" rx="1" />
      <path d="M9 22v-4h6v4M8 6h.01M12 6h.01M16 6h.01M8 10h.01M12 10h.01M16 10h.01M8 14h.01M12 14h.01M16 14h.01" />
    </svg>
  );
}

function CapIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 10 12 5 2 10l10 5 10-5Z" />
      <path d="M6 12v5c0 1.5 3 3 6 3s6-1.5 6-3v-5" />
    </svg>
  );
}

function StethoscopeIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4.5 3v6a4.5 4.5 0 0 0 9 0V3M9 15a4.5 4.5 0 0 0 4.5-4.5" />
      <circle cx="19" cy="14" r="2" />
      <path d="M9 15v2a5 5 0 0 0 5 5h0" />
    </svg>
  );
}

function MapIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 18 3 21V6l6-3 6 3 6-3v15l-6 3-6-3Z" />
      <path d="M9 3v15M15 6v15" />
    </svg>
  );
}

function BookIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 5c-1.5-1-4-2-8-2v15c4 0 6.5 1 8 2 1.5-1 4-2 8-2V3c-4 0-6.5 1-8 2Z" />
      <path d="M12 5v15" />
    </svg>
  );
}

function HeartIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.6l-1-1a5.5 5.5 0 0 0-7.8 7.8l1 1L12 21l7.8-7.6 1-1a5.5 5.5 0 0 0 0-7.8Z" />
    </svg>
  );
}

function ShieldAlertIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2 4 5v6c0 5 3.5 8.5 8 11 4.5-2.5 8-6 8-11V5l-8-3Z" />
      <path d="M12 8v4M12 16h.01" />
    </svg>
  );
}

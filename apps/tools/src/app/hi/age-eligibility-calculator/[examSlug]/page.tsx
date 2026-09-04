import { Metadata } from "next";
import { notFound } from "next/navigation";
import AgeEligibilityPage from "@/components/AgeEligibilityPage";
import { AGE_ELIGIBILITY_EXAMS, getAgeEligibilityExamBySlug } from "@/lib/ageEligibility";
import { getAgeCalcStrings } from "@/lib/ageCalculatorStrings";
import JsonLd from "@clearcut/ui/json-ld";

// Mirrors src/app/age-eligibility-calculator/[examSlug]/page.tsx — same exam
// data (English only, see ageCalculatorStrings.ts's header comment), Hindi
// UI chrome via AgeEligibilityPage's locale prop.
export const dynamicParams = false;

export function generateStaticParams() {
  return AGE_ELIGIBILITY_EXAMS.map((exam) => ({ examSlug: exam.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ examSlug: string }> }): Promise<Metadata> {
  const { examSlug } = await params;
  const exam = getAgeEligibilityExamBySlug(examSlug);
  if (!exam) return {};

  const t = getAgeCalcStrings("hi");
  const title = `${t.pageTitle(exam.shortName, exam.year)} | Clear Cutoff`;
  const description = `${exam.shortName} (${exam.fullName}) ${t.conductedBy} ${exam.conductingBody}.`;
  const enUrl = `https://clearcutoff.in/tools/age-eligibility-calculator/${exam.slug}`;
  const url = `https://clearcutoff.in/hi/tools/age-eligibility-calculator/${exam.slug}`;

  return {
    title,
    description,
    alternates: { canonical: url, languages: { en: enUrl, hi: url } },
    openGraph: { title, description, url, siteName: "Clear Cutoff", type: "website" },
  };
}

export default async function Page({ params }: { params: Promise<{ examSlug: string }> }) {
  const { examSlug } = await params;
  const exam = getAgeEligibilityExamBySlug(examSlug);
  if (!exam) notFound();

  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: exam.faqs.map((faq) => ({
      "@type": "Question",
      name: faq.q,
      acceptedAnswer: { "@type": "Answer", text: faq.a },
    })),
  };

  const appSchema = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: `${exam.shortName} आयु पात्रता कैलकुलेटर`,
    applicationCategory: "UtilityApplication",
    operatingSystem: "Any (runs in browser)",
    url: `https://clearcutoff.in/hi/tools/age-eligibility-calculator/${exam.slug}`,
    description: `${exam.shortName} (${exam.fullName}) की कट-ऑफ तिथि के अनुसार अपनी सही उम्र और श्रेणी-वार (General/OBC/SC/ST/PwD) पात्रता तुरंत जांचें।`,
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
      {
        "@type": "ListItem",
        position: 4,
        name: `${exam.shortName} आयु कैलकुलेटर`,
        item: `https://clearcutoff.in/hi/tools/age-eligibility-calculator/${exam.slug}`,
      },
    ],
  };

  return (
    <>
      <JsonLd id="age-calc-faq-schema" data={faqSchema} />
      <JsonLd id="age-calc-app-schema" data={appSchema} />
      <JsonLd id="age-calc-breadcrumb-schema" data={breadcrumbSchema} />
      <AgeEligibilityPage exam={exam} locale="hi" />
    </>
  );
}

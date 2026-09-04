import { Metadata } from "next";
import { notFound } from "next/navigation";
import AgeEligibilityPage from "@/components/AgeEligibilityPage";
import { AGE_ELIGIBILITY_EXAMS, getAgeEligibilityExamBySlug } from "@/lib/ageEligibility";
import JsonLd from "@clearcut/ui/json-ld";

// Static export needs the full param set up front — an unlisted slug 404s
// rather than resolving on demand.
export const dynamicParams = false;

export function generateStaticParams() {
  return AGE_ELIGIBILITY_EXAMS.map((exam) => ({ examSlug: exam.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ examSlug: string }> }): Promise<Metadata> {
  const { examSlug } = await params;
  const exam = getAgeEligibilityExamBySlug(examSlug);
  if (!exam) return {};

  const title = `${exam.shortName} Age Calculator (${exam.year}) - Eligibility & Cutoff Date | Clear Cutoff`;
  const description = `Calculate your exact age for ${exam.shortName} (${exam.fullName}) and check category-wise eligibility instantly. Free tool, nothing is uploaded.`;
  const url = `https://clearcutoff.in/tools/age-eligibility-calculator/${exam.slug}`;

  return {
    title,
    description,
    alternates: {
      canonical: url,
      languages: { en: url, hi: `https://clearcutoff.in/hi/tools/age-eligibility-calculator/${exam.slug}` },
    },
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

  // WebApplication (not SoftwareApplication — no install/OS, runs entirely
  // in-browser) gives answer/generative engines a structured "free tool,
  // does X" fact to cite directly, separate from the FAQ content above.
  const appSchema = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: `${exam.shortName} Age Eligibility Calculator`,
    applicationCategory: "UtilityApplication",
    operatingSystem: "Any (runs in browser)",
    url: `https://clearcutoff.in/tools/age-eligibility-calculator/${exam.slug}`,
    description: `Calculate your exact age as on the ${exam.shortName} cutoff date and check category-wise (General/OBC/SC/ST/PwD) age eligibility instantly.`,
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
      {
        "@type": "ListItem",
        position: 4,
        name: `${exam.shortName} Age Calculator`,
        item: `https://clearcutoff.in/tools/age-eligibility-calculator/${exam.slug}`,
      },
    ],
  };

  return (
    <>
      <JsonLd id="age-calc-faq-schema" data={faqSchema} />
      <JsonLd id="age-calc-app-schema" data={appSchema} />
      <JsonLd id="age-calc-breadcrumb-schema" data={breadcrumbSchema} />
      <AgeEligibilityPage exam={exam} />
    </>
  );
}

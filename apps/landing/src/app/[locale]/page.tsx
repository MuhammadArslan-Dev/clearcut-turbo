import { Suspense } from "react";
import Header from "@/components/layout/headers/Header";
import LandingPage from "@/components/pages/LandingPage";
import FloatingButton from "@/components/global/FloatingButton";
import FooterWrap from "@/components/layout/FooterWrap";
import { generateSeoMetadata } from "@/lib/seo/metadata";
import JsonLd from "@clearcut/ui/json-ld";

// ── Make this page fully static + cacheable ──
export const dynamic = "force-static";
export const revalidate = 3600; // rebuild at most once per hour

const organizationSchema = {
  "@context": "https://schema.org",
  "@type": "EducationalOrganization",
  name: "Clear Cutoff",
  alternateName: "ClearCutoff",
  url: "https://clearcutoff.in",
  logo: "https://www.clearcutoff.in/icons/Logo-512x512.png",
  description:
    "Clear Cutoff helps you crack teaching exams like CTET, HTET, UPTET, REET, and HPTET with focused courses, PYQs, notes, and test series.",
  // Google's own Organization example puts telephone/email directly on the
  // organization, in addition to (not instead of) a more specific
  // contactPoint below — same values, just also exposed at this level.
  telephone: "+91-7210708599",
  email: "hi@clearcutoff.in",
  foundingDate: "2025-02-13",
  // GSTIN (Indian tax ID) — taxID, not vatID, since GST is India's tax
  // regime rather than EU-style VAT.
  taxID: "06BZUPD0626B1ZQ",
  address: {
    "@type": "PostalAddress",
    streetAddress: "Merton, Omaxe North Avenue, Sector 15",
    addressLocality: "Bahadurgarh",
    addressRegion: "Haryana",
    postalCode: "124507",
    addressCountry: "IN",
  },
  contactPoint: {
    "@type": "ContactPoint",
    telephone: "+91-7210708599",
    email: "hi@clearcutoff.in",
    // schema.org's own ContactPoint examples use "customer service" — not
    // "customer support" — as the conventional value for this field.
    contactType: "customer service",
    availableLanguage: ["English", "Hindi"],
  },
  sameAs: [
    "https://www.instagram.com/clearcutoff_teaching/",
    "https://www.facebook.com/people/Clear-Cutoff-Teaching/61573525911878",
    "https://www.linkedin.com/company/clear-cutoff",
  ],
};

const webSiteSchema = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: "Clear Cutoff",
  url: "https://clearcutoff.in",
  potentialAction: {
    "@type": "SearchAction",
    target: {
      "@type": "EntryPoint",
      urlTemplate: "https://clearcutoff.in/teaching?q={search_term_string}",
    },
    "query-input": "required name=search_term_string",
  },
};

const faqSchema = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: [
    {
      "@type": "Question",
      name: "What is Clear Cutoff, and how can it help me crack Teaching Exams?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Clear Cutoff is a smart exam preparation platform designed specifically for teaching exams like CTET, HTET, UPTET, REET, and HPTET. We provide Previous Year Questions (PYQs) with solutions, detailed video lectures from multiple teachers, revision notes, Sectional and Full-Length Tests to track your progress, and a Refund Guarantee if you complete the course and still don't pass.",
      },
    },
    {
      "@type": "Question",
      name: "Why should I choose Clear Cutoff over other platforms?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Clear Cutoff focuses purely on exam-oriented learning with a structured plan, multiple teacher options, Mini Tests, Full-Length Tests including all PYQs, a realistic exam experience, and a Refund Guarantee if you follow the course and still don't pass.",
      },
    },
    {
      "@type": "Question",
      name: "Is there a free trial available?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Yes, you can access a free trial before purchasing the course to check if it meets your expectations — no payment or card required.",
      },
    },
  ],
};

const items = [
  { label: "pricing", href: "#pricing", id: "pricing-section" },
  { label: "features", href: "#features", id: "features-section" },
  { label: "faqs", href: "#faqs", id: "faqs-section" },
];

export function generateMetadata() {
  return generateSeoMetadata({
    title: "Clear Cutoff — Crack HTET, CTET, UPTET & More",
    description:
      "Clear Cutoff helps you crack teaching exams like CTET, HTET, UPTET with focused courses, PYQs, notes, and test series.",
    keywords: ["CTET", "HTET", "UPTET", "REET", "HPTET", "teaching exam preparation", "Clear Cutoff"],
    url: "/",
  });
}

export default async function Home({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const resolvedLocale = locale === "hi" ? "hi" : "en";

  return (
    <>
      <JsonLd data={organizationSchema} />
      <JsonLd data={webSiteSchema} />
      <JsonLd data={faqSchema} />
      <Header items={items} />
      <LandingPage locale={resolvedLocale} />
      <FloatingButton />
      <FooterWrap />
    </>
  );
}
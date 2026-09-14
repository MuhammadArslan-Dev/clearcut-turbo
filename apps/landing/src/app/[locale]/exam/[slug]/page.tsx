import { notFound } from "next/navigation";
import CoursrMarketingPage from "@/components/pages/marketing/coursr-marketing-page";
import { generateSeoMetadata, SITE_URL } from "@/lib/seo/metadata";
import JsonLd from "@clearcut/ui/json-ld";
import { STATIC_EXAMS } from "@/lib/data/staticExams";
import { toLocale, type Locale } from "@/lib/i18n/config";

// UI-chrome-only translation for this page's SEO metadata and structured
// data — exam short names/full names are proper nouns and stay untranslated
// on every locale, same convention as apps/tools's own dictionaries.
const META_COPY: Record<Locale, { titleSuffix: string; description: (full: string) => string }> = {
  en: {
    titleSuffix: "Course — Notes, PYQs & Test Series | Clear Cutoff",
    description: (full) =>
      `Prepare for ${full} 2026 with Clear Cutoff. Get full syllabus coverage, previous year papers, video lectures, and mock tests.`,
  },
  hi: {
    titleSuffix: "कोर्स — नोट्स, PYQs और टेस्ट सीरीज़ | Clear Cutoff",
    description: (full) =>
      `Clear Cutoff के साथ ${full} 2026 की तैयारी करें। पूरा सिलेबस कवरेज, पिछले वर्षों के पेपर, वीडियो लेक्चर, और मॉक टेस्ट पाएं।`,
  },
  mr: {
    titleSuffix: "कोर्स — नोट्स, PYQs आणि टेस्ट सीरीज | Clear Cutoff",
    description: (full) =>
      `Clear Cutoff सोबत ${full} 2026 ची तयारी करा. संपूर्ण अभ्यासक्रम कव्हरेज, मागील वर्षांचे पेपर, व्हिडिओ लेक्चर्स, आणि मॉक टेस्ट मिळवा.`,
  },
};

export const revalidate = 86400;
// Allow any `<code>-preparation` slug to render on-demand; unknown codes 404 below.
export const dynamicParams = true;

/** Normalise an exam short_name into a URL code, e.g. "UP PGT" -> "uppgt". */
const examCode = (shortName: string) => shortName.toLowerCase().replace(/\s+/g, "");

/** Resolve the exam referenced by a slug like "htet-preparation" from the course data. */
function resolveExam(slug: string) {
  const code = slug.split("-")[0].toLowerCase();
  return STATIC_EXAMS.find((e) => examCode(e.short_name) === code);
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string; locale: string }> }) {
  const { slug, locale } = await params;
  const resolvedLocale = toLocale(locale);
  const exam = resolveExam(slug);

  const name = exam?.short_name ?? slug.toUpperCase();
  const full = exam?.name ?? `${name} exam preparation`;
  const copy = META_COPY[resolvedLocale];

  return generateSeoMetadata({
    title: `${name} 2026 ${copy.titleSuffix}`,
    description: copy.description(full),
    keywords: [name, full, "teaching exam", "Clear Cutoff", `${name} preparation`, `${name} 2026`],
    url: `/exam/${slug}`,
  });
}

// Pre-render one page per active exam in the course data (e.g. "htet-preparation").
export function generateStaticParams() {
  return STATIC_EXAMS.map((e) => ({ slug: `${examCode(e.short_name)}-preparation` }));
}

export default async function page({ params }: { params: Promise<{ slug: string; locale: string }> }) {
  const { slug, locale } = await params;
  const resolvedLocale = toLocale(locale);
  const exam = resolveExam(slug);

  // Only render for a real course; anything else is a genuine 404.
  if (!exam) notFound();

  const code = examCode(exam.short_name);
  const name = exam.short_name;
  const full = exam.name;
  const copy = META_COPY[resolvedLocale];

  const courseSchema = {
    "@context": "https://schema.org",
    "@type": "Course",
    name: `${name} 2026 Course`,
    description: copy.description(full),
    url: `https://clearcutoff.in/exam/${slug}`,
    provider: {
      "@type": "Organization",
      name: "Clear Cutoff",
      url: "https://clearcutoff.in",
    },
    // Documents the actual language(s) the course's video lectures/content
    // are delivered in — NOT this page's marketing-copy locale. Stays
    // en/hi until Marathi-medium course content genuinely exists; adding
    // "mr" here would misrepresent the product, unlike the page text above.
    inLanguage: ["en", "hi"],
    offers: {
      "@type": "Offer",
      price: "99",
      priceCurrency: "INR",
      availability: "https://schema.org/InStock",
      url: `https://clearcutoff.in/exam/${slug}`,
    },
    keywords: `${name}, ${full}, teaching exam preparation, Clear Cutoff`,
  };

  // No intermediate "/exam" listing page exists (it 404s) — a 3-level trail
  // through it would link to a dead page, so this stays Home -> exam page.
  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: SITE_URL },
      { "@type": "ListItem", position: 2, name: `${name} 2026 Course`, item: `${SITE_URL}/exam/${slug}` },
    ],
  };

  return (
    <>
      <JsonLd data={courseSchema} />
      <JsonLd data={breadcrumbSchema} />
      <CoursrMarketingPage data={code} />
    </>
  );
}

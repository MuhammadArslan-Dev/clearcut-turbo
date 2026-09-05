import { notFound } from "next/navigation";
import CoursrMarketingPage from "@/components/pages/marketing/coursr-marketing-page";
import { generateSeoMetadata, SITE_URL } from "@/lib/seo/metadata";
import JsonLd from "@clearcut/ui/json-ld";
import { STATIC_EXAMS } from "@/lib/data/staticExams";

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

export async function generateMetadata({ params }: { params: { slug: string } }) {
  const { slug } = await params;
  const exam = resolveExam(slug);

  const name = exam?.short_name ?? slug.toUpperCase();
  const full = exam?.name ?? `${name} exam preparation`;

  return generateSeoMetadata({
    title: `${name} 2026 Course — Notes, PYQs & Test Series | Clear Cutoff`,
    description: `Prepare for ${full} 2026 with Clear Cutoff. Get full syllabus coverage, previous year papers, video lectures, and mock tests.`,
    keywords: [name, full, "teaching exam", "Clear Cutoff", `${name} preparation`, `${name} 2026`],
    url: `/exam/${slug}`,
  });
}

// Pre-render one page per active exam in the course data (e.g. "htet-preparation").
export function generateStaticParams() {
  return STATIC_EXAMS.map((e) => ({ slug: `${examCode(e.short_name)}-preparation` }));
}

export default async function page({ params }: { params: { slug: string } }) {
  const { slug } = await params;
  const exam = resolveExam(slug);

  // Only render for a real course; anything else is a genuine 404.
  if (!exam) notFound();

  const code = examCode(exam.short_name);
  const name = exam.short_name;
  const full = exam.name;

  const courseSchema = {
    "@context": "https://schema.org",
    "@type": "Course",
    name: `${name} 2026 Course`,
    description: `Prepare for ${full} 2026 with Clear Cutoff. Get full syllabus coverage, previous year papers, video lectures, and mock tests.`,
    url: `https://clearcutoff.in/exam/${slug}`,
    provider: {
      "@type": "Organization",
      name: "Clear Cutoff",
      url: "https://clearcutoff.in",
    },
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

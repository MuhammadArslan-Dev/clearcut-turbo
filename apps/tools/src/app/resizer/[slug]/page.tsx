import { Metadata } from "next";
import { notFound } from "next/navigation";
import ResizerSpokePage from "@/components/ResizerSpokePage";
import CategoryPage from "@/components/CategoryPage";
import { getResizerExams, getResizerExamBySlug, getResizerCategories, getResizerCategoryBySlug, getExamFaqs } from "@/lib/resizerExams";
import { getOfficialRequirements } from "@/lib/officialRequirements";
import JsonLd from "@clearcut/ui/json-ld";

// Exam pages (clearcutoff.in/tools/resizer/{examSlug}) and category pages
// (clearcutoff.in/tools/resizer/{categorySlug}) share this one flat dynamic
// segment rather than nesting categories under their own /category/ prefix
// — toolsApi.ts asserts at load that no exam slug and category slug ever
// collide, which is what makes sharing the namespace safe.
//
// Static export needs the full param set up front — an unlisted slug 404s
// rather than resolving on demand.
export const dynamicParams = false;

export async function generateStaticParams() {
  const examParams = (await getResizerExams()).map((exam) => ({ slug: exam.slug }));
  const categoryParams = (await getResizerCategories()).map((category) => ({ slug: category.slug }));
  return [...examParams, ...categoryParams];
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;

  const exam = await getResizerExamBySlug(slug);
  if (exam) {
    const title = `${exam.shortName} Photo & Signature Resizer - Free Tool | Clear Cutoff`;
    const description = `Resize and compress your photo or signature to ${exam.shortName} (${exam.fullName}) application-form specs. Free, private, processed entirely in your browser.`;
    const url = `https://clearcutoff.in/tools/resizer/${exam.slug}`;
    return {
      title,
      description,
      alternates: {
        canonical: url,
        languages: { en: url, hi: `https://clearcutoff.in/hi/tools/resizer/${exam.slug}` },
      },
      openGraph: { title, description, url, siteName: "Clear Cutoff", type: "website" },
    };
  }

  const category = await getResizerCategoryBySlug(slug);
  if (category) {
    const title = `${category.label}: Photo & Signature Resizer | Clear Cutoff`;
    const description = `Resize and compress your photo or signature for any ${category.label} exam. Free, private, processed entirely in your browser.`;
    const url = `https://clearcutoff.in/tools/resizer/${category.slug}`;
    return {
      title,
      description,
      alternates: {
        canonical: url,
        languages: { en: url, hi: `https://clearcutoff.in/hi/tools/resizer/${category.slug}` },
      },
      openGraph: { title, description, url, siteName: "Clear Cutoff", type: "website" },
    };
  }

  return {};
}

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;

  const exam = await getResizerExamBySlug(slug);
  if (exam) {
    const faqSchema = {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: getExamFaqs(exam.shortName, exam.photoSpec, exam.signatureSpec).map((faq) => ({
        "@type": "Question",
        name: faq.q,
        acceptedAnswer: { "@type": "Answer", text: faq.a },
      })),
    };

    const [categories, officialRequirements] = await Promise.all([
      getResizerCategories(),
      getOfficialRequirements(exam.slug),
    ]);
    const category = categories.find((c) => c.label === exam.category);

    return (
      <>
        <JsonLd data={faqSchema} />
        <ResizerSpokePage exam={exam} category={category} officialRequirements={officialRequirements} />
      </>
    );
  }

  const category = await getResizerCategoryBySlug(slug);
  if (category) {
    return <CategoryPage category={category} />;
  }

  notFound();
}

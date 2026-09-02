import { Metadata } from "next";
import { notFound } from "next/navigation";
import ResizerSpokePage from "@/components/ResizerSpokePage";
import CategoryPage from "@/components/CategoryPage";
import { RESIZER_EXAMS, getResizerExamBySlug, getResizerCategories, getResizerCategoryBySlug } from "@/lib/resizerExams";
import JsonLd from "@clearcut/ui/json-ld";

// Exam pages (clearcutoff.in/tools/resizer/{examSlug}) and category pages
// (clearcutoff.in/tools/resizer/{categorySlug}) share this one flat dynamic
// segment rather than nesting categories under their own /category/ prefix
// — resizerExams.ts asserts at module load that no exam slug and category
// slug ever collide, which is what makes sharing the namespace safe.
//
// Static export needs the full param set up front — an unlisted slug 404s
// rather than resolving on demand.
export const dynamicParams = false;

export function generateStaticParams() {
  const examParams = RESIZER_EXAMS.map((exam) => ({ slug: exam.slug }));
  const categoryParams = getResizerCategories().map((category) => ({ slug: category.slug }));
  return [...examParams, ...categoryParams];
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;

  const exam = getResizerExamBySlug(slug);
  if (exam) {
    const title = `${exam.shortName} Photo & Signature Resizer — Free Tool | Clear Cutoff`;
    const description = `Resize and compress your photo or signature to ${exam.shortName} (${exam.fullName}) application-form specs — free, private, processed entirely in your browser.`;
    const url = `https://clearcutoff.in/tools/resizer/${exam.slug}`;
    return {
      title,
      description,
      alternates: { canonical: url },
      openGraph: { title, description, url, siteName: "Clear Cutoff", type: "website" },
    };
  }

  const category = getResizerCategoryBySlug(slug);
  if (category) {
    const title = `${category.label} — Photo & Signature Resizer | Clear Cutoff`;
    const description = `Resize and compress your photo or signature for any ${category.label} exam — free, private, processed entirely in your browser.`;
    const url = `https://clearcutoff.in/tools/resizer/${category.slug}`;
    return {
      title,
      description,
      alternates: { canonical: url },
      openGraph: { title, description, url, siteName: "Clear Cutoff", type: "website" },
    };
  }

  return {};
}

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;

  const exam = getResizerExamBySlug(slug);
  if (exam) {
    const faqSchema = {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: exam.faqs.map((faq) => ({
        "@type": "Question",
        name: faq.q,
        acceptedAnswer: { "@type": "Answer", text: faq.a },
      })),
    };

    return (
      <>
        <JsonLd data={faqSchema} />
        <ResizerSpokePage exam={exam} />
      </>
    );
  }

  const category = getResizerCategoryBySlug(slug);
  if (category) {
    return <CategoryPage category={category} />;
  }

  notFound();
}

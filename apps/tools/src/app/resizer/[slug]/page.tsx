import { Metadata } from "next";
import { buildMetadata, toolsUrl } from "@/lib/seo";
import PageJsonLd from "@/components/PageJsonLd";
import { notFound } from "next/navigation";
import ResizerSpokePage from "@/components/ResizerSpokePage";
import CategoryPage from "@/components/CategoryPage";
import { getResizerExams, getResizerExamBySlug, getResizerCategories, getResizerCategoryBySlug, getExamFaqs, isPhotoLiveCapture } from "@/lib/resizerExams";
import { getOfficialRequirements } from "@/lib/officialRequirements";

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
    return buildMetadata({ locale: "en", path: `/resizer/${exam.slug}`, title, description });
  }

  const category = await getResizerCategoryBySlug(slug);
  if (category) {
    const title = `${category.label}: Photo & Signature Resizer | Clear Cutoff`;
    const description = `Resize and compress your photo or signature for any ${category.label} exam. Free, private, processed entirely in your browser.`;
    return buildMetadata({ locale: "en", path: `/resizer/${category.slug}`, title, description });
  }

  return {};
}

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;

  const exam = await getResizerExamBySlug(slug);
  if (exam) {
    const faqs = getExamFaqs(exam.shortName, exam.photoSpec, exam.signatureSpec, "en", { photoLive: isPhotoLiveCapture(exam) });

    const [categories, officialRequirements] = await Promise.all([
      getResizerCategories(),
      getOfficialRequirements(exam.slug),
    ]);
    const category = categories.find((c) => c.label === exam.category);

    return (
      <>
        <PageJsonLd
          locale="en"
          path={`/resizer/${exam.slug}`}
          trail={[
            { name: "Photo & Signature Resizer", path: "/resizer" },
            { name: `${exam.shortName} Photo & Signature Resizer`, path: `/resizer/${exam.slug}` },
          ]}
          app={{ name: `${exam.shortName} Photo & Signature Resizer`, description: `Resize and compress your photo or signature to ${exam.shortName} (${exam.fullName}) application-form specs. Free, private, processed entirely in your browser.` }}
          faqs={faqs}
        />
        <ResizerSpokePage exam={exam} category={category} officialRequirements={officialRequirements} />
      </>
    );
  }

  const category = await getResizerCategoryBySlug(slug);
  if (category) {
    const label = category.label;
    return (
      <>
        <PageJsonLd
          locale="en"
          path={`/resizer/${category.slug}`}
          trail={[
            { name: "Photo & Signature Resizer", path: "/resizer" },
            { name: label, path: `/resizer/${category.slug}` },
          ]}
          collection={{
            name: `${label}: Photo & Signature Resizer`,
            description: `Resize and compress your photo or signature for any ${category.label} exam. Free, private, processed entirely in your browser.`,
            items: category.exams.map((e) => ({ name: e.shortName, url: toolsUrl("en", `/resizer/${e.slug}`) })),
          }}
        />
        <CategoryPage category={category} />
      </>
    );
  }

  notFound();
}

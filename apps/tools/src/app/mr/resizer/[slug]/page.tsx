import { Metadata } from "next";
import { notFound } from "next/navigation";
import ResizerSpokePage from "@/components/ResizerSpokePage";
import CategoryPage from "@/components/CategoryPage";
import { getResizerExams, getResizerExamBySlug, getResizerCategories, getResizerCategoryBySlug, getExamFaqs, isPhotoLiveCapture } from "@/lib/resizerExams";
import { getOfficialRequirements } from "@/lib/officialRequirements";
import { getCategoryLabel } from "@/lib/dictionary";
import JsonLd from "@clearcut/ui/json-ld";

// Marathi mirror of ../../resizer/[slug]/page.tsx — same flat exam+category
// namespace, same static param set, locale="mr" passed to the shared page
// components and Marathi-language metadata/JSON-LD built here instead of
// there.
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
    const title = `${exam.shortName} फोटो आणि स्वाक्षरी रिसाइझर - मोफत टूल | Clear Cutoff`;
    const description = `${exam.shortName} (${exam.fullName}) अर्ज-फॉर्मच्या आवश्यकतांनुसार तुमचा फोटो किंवा स्वाक्षरी रिसाइझ आणि कंप्रेस करा. मोफत, खासगी, पूर्णपणे तुमच्या ब्राउझरमध्ये प्रक्रिया होते.`;
    const url = `https://clearcutoff.in/mr/tools/resizer/${exam.slug}`;
    return {
      title,
      description,
      alternates: {
        canonical: url,
        languages: {
          en: `https://clearcutoff.in/tools/resizer/${exam.slug}`,
          hi: `https://clearcutoff.in/hi/tools/resizer/${exam.slug}`,
          mr: url,
        },
      },
      openGraph: { title, description, url, siteName: "Clear Cutoff", type: "website" },
    };
  }

  const category = await getResizerCategoryBySlug(slug);
  if (category) {
    const label = getCategoryLabel(category.label, "mr");
    const title = `${label}: फोटो आणि स्वाक्षरी रिसाइझर | Clear Cutoff`;
    const description = `कोणत्याही ${label} परीक्षेसाठी तुमचा फोटो किंवा स्वाक्षरी रिसाइझ आणि कंप्रेस करा. मोफत, खासगी, पूर्णपणे तुमच्या ब्राउझरमध्ये प्रक्रिया होते.`;
    const url = `https://clearcutoff.in/mr/tools/resizer/${category.slug}`;
    return {
      title,
      description,
      alternates: {
        canonical: url,
        languages: {
          en: `https://clearcutoff.in/tools/resizer/${category.slug}`,
          hi: `https://clearcutoff.in/hi/tools/resizer/${category.slug}`,
          mr: url,
        },
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
      mainEntity: getExamFaqs(exam.shortName, exam.photoSpec, exam.signatureSpec, "mr", { photoLive: isPhotoLiveCapture(exam) }).map((faq) => ({
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
        <ResizerSpokePage exam={exam} locale="mr" category={category} officialRequirements={officialRequirements} />
      </>
    );
  }

  const category = await getResizerCategoryBySlug(slug);
  if (category) {
    return <CategoryPage category={category} locale="mr" />;
  }

  notFound();
}

import { Metadata } from "next";
import { buildMetadata, toolsUrl } from "@/lib/seo";
import PageJsonLd from "@/components/PageJsonLd";
import { notFound } from "next/navigation";
import ResizerSpokePage from "@/components/ResizerSpokePage";
import CategoryPage from "@/components/CategoryPage";
import { getResizerExams, getResizerExamBySlug, getResizerCategories, getResizerCategoryBySlug, getExamFaqs, isPhotoLiveCapture } from "@/lib/resizerExams";
import { getOfficialRequirements } from "@/lib/officialRequirements";
import { getCategoryLabel } from "@/lib/dictionary";

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
    return buildMetadata({ locale: "mr", path: `/resizer/${exam.slug}`, title, description });
  }

  const category = await getResizerCategoryBySlug(slug);
  if (category) {
    const label = getCategoryLabel(category.label, "mr");
    const title = `${label}: फोटो आणि स्वाक्षरी रिसाइझर | Clear Cutoff`;
    const description = `कोणत्याही ${label} परीक्षेसाठी तुमचा फोटो किंवा स्वाक्षरी रिसाइझ आणि कंप्रेस करा. मोफत, खासगी, पूर्णपणे तुमच्या ब्राउझरमध्ये प्रक्रिया होते.`;
    return buildMetadata({ locale: "mr", path: `/resizer/${category.slug}`, title, description });
  }

  return {};
}

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;

  const exam = await getResizerExamBySlug(slug);
  if (exam) {
    const faqs = getExamFaqs(exam.shortName, exam.photoSpec, exam.signatureSpec, "mr", { photoLive: isPhotoLiveCapture(exam) });

    const [categories, officialRequirements] = await Promise.all([
      getResizerCategories(),
      getOfficialRequirements(exam.slug),
    ]);
    const category = categories.find((c) => c.label === exam.category);

    return (
      <>
        <PageJsonLd
          locale="mr"
          path={`/resizer/${exam.slug}`}
          trail={[
            { name: "फोटो आणि स्वाक्षरी रिसाइझर", path: "/resizer" },
            { name: `${exam.shortName} फोटो आणि स्वाक्षरी रिसाइझर`, path: `/resizer/${exam.slug}` },
          ]}
          app={{ name: `${exam.shortName} फोटो आणि स्वाक्षरी रिसाइझर`, description: `${exam.shortName} (${exam.fullName}) अर्ज-फॉर्मच्या आवश्यकतांनुसार तुमचा फोटो किंवा स्वाक्षरी रिसाइझ आणि कंप्रेस करा. मोफत, खासगी, पूर्णपणे तुमच्या ब्राउझरमध्ये प्रक्रिया होते.` }}
          faqs={faqs}
        />
        <ResizerSpokePage exam={exam} locale="mr" category={category} officialRequirements={officialRequirements} />
      </>
    );
  }

  const category = await getResizerCategoryBySlug(slug);
  if (category) {
    const label = getCategoryLabel(category.label, "mr");
    return (
      <>
        <PageJsonLd
          locale="mr"
          path={`/resizer/${category.slug}`}
          trail={[
            { name: "फोटो आणि स्वाक्षरी रिसाइझर", path: "/resizer" },
            { name: label, path: `/resizer/${category.slug}` },
          ]}
          collection={{
            name: `${label}: फोटो आणि स्वाक्षरी रिसाइझर`,
            description: `कोणत्याही ${label} परीक्षेसाठी तुमचा फोटो किंवा स्वाक्षरी रिसाइझ आणि कंप्रेस करा. मोफत, खासगी, पूर्णपणे तुमच्या ब्राउझरमध्ये प्रक्रिया होते.`,
            items: category.exams.map((e) => ({ name: e.shortName, url: toolsUrl("mr", `/resizer/${e.slug}`) })),
          }}
        />
        <CategoryPage category={category} locale="mr" />
      </>
    );
  }

  notFound();
}

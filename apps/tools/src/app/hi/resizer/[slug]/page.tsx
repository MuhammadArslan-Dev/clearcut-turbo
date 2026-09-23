import { Metadata } from "next";
import { buildMetadata, toolsUrl } from "@/lib/seo";
import PageJsonLd from "@/components/PageJsonLd";
import { notFound } from "next/navigation";
import ResizerSpokePage from "@/components/ResizerSpokePage";
import CategoryPage from "@/components/CategoryPage";
import { getResizerExams, getResizerExamBySlug, getResizerCategories, getResizerCategoryBySlug, getExamFaqs, isPhotoLiveCapture } from "@/lib/resizerExams";
import { getOfficialRequirements } from "@/lib/officialRequirements";
import { getCategoryLabel } from "@/lib/dictionary";

// Hindi mirror of ../../resizer/[slug]/page.tsx — same flat exam+category
// namespace, same static param set, locale="hi" passed to the shared page
// components and Hindi-language metadata/JSON-LD built here instead of
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
    const title = `${exam.shortName} फ़ोटो और हस्ताक्षर रिसाइज़र - मुफ़्त टूल | Clear Cutoff`;
    const description = `${exam.shortName} (${exam.fullName}) आवेदन-फॉर्म की आवश्यकताओं के अनुसार अपनी फ़ोटो या हस्ताक्षर को रिसाइज़ और कंप्रेस करें। मुफ़्त, निजी, पूरी तरह आपके ब्राउज़र में प्रोसेस होता है।`;
    return buildMetadata({ locale: "hi", path: `/resizer/${exam.slug}`, title, description });
  }

  const category = await getResizerCategoryBySlug(slug);
  if (category) {
    const label = getCategoryLabel(category.label, "hi");
    const title = `${label}: फ़ोटो और हस्ताक्षर रिसाइज़र | Clear Cutoff`;
    const description = `किसी भी ${label} परीक्षा के लिए अपनी फ़ोटो या हस्ताक्षर को रिसाइज़ और कंप्रेस करें। मुफ़्त, निजी, पूरी तरह आपके ब्राउज़र में प्रोसेस होता है।`;
    return buildMetadata({ locale: "hi", path: `/resizer/${category.slug}`, title, description });
  }

  return {};
}

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;

  const exam = await getResizerExamBySlug(slug);
  if (exam) {
    const faqs = getExamFaqs(exam.shortName, exam.photoSpec, exam.signatureSpec, "hi", { photoLive: isPhotoLiveCapture(exam) });

    const [categories, officialRequirements] = await Promise.all([
      getResizerCategories(),
      getOfficialRequirements(exam.slug),
    ]);
    const category = categories.find((c) => c.label === exam.category);

    return (
      <>
        <PageJsonLd
          locale="hi"
          path={`/resizer/${exam.slug}`}
          trail={[
            { name: "फ़ोटो और हस्ताक्षर रिसाइज़र", path: "/resizer" },
            { name: `${exam.shortName} फ़ोटो और हस्ताक्षर रिसाइज़र`, path: `/resizer/${exam.slug}` },
          ]}
          app={{ name: `${exam.shortName} फ़ोटो और हस्ताक्षर रिसाइज़र`, description: `${exam.shortName} (${exam.fullName}) आवेदन-फॉर्म की आवश्यकताओं के अनुसार अपनी फ़ोटो या हस्ताक्षर को रिसाइज़ और कंप्रेस करें। मुफ़्त, निजी, पूरी तरह आपके ब्राउज़र में प्रोसेस होता है।` }}
          faqs={faqs}
        />
        <ResizerSpokePage exam={exam} locale="hi" category={category} officialRequirements={officialRequirements} />
      </>
    );
  }

  const category = await getResizerCategoryBySlug(slug);
  if (category) {
    const label = getCategoryLabel(category.label, "hi");
    return (
      <>
        <PageJsonLd
          locale="hi"
          path={`/resizer/${category.slug}`}
          trail={[
            { name: "फ़ोटो और हस्ताक्षर रिसाइज़र", path: "/resizer" },
            { name: label, path: `/resizer/${category.slug}` },
          ]}
          collection={{
            name: `${label}: फ़ोटो और हस्ताक्षर रिसाइज़र`,
            description: `किसी भी ${label} परीक्षा के लिए अपनी फ़ोटो या हस्ताक्षर को रिसाइज़ और कंप्रेस करें। मुफ़्त, निजी, पूरी तरह आपके ब्राउज़र में प्रोसेस होता है।`,
            items: category.exams.map((e) => ({ name: e.shortName, url: toolsUrl("hi", `/resizer/${e.slug}`) })),
          }}
        />
        <CategoryPage category={category} locale="hi" />
      </>
    );
  }

  notFound();
}

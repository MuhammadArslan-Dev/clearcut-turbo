import { Metadata } from "next";
import { buildMetadata } from "@/lib/seo";
import PageJsonLd from "@/components/PageJsonLd";
import { notFound } from "next/navigation";
import AgeEligibilityPage from "@/components/AgeEligibilityPage";
import { getAgeEligibilityExams, getAgeEligibilityExamBySlug } from "@/lib/ageEligibility";
import { getAgeCalcStrings } from "@/lib/ageCalculatorStrings";

// Mirrors src/app/age-eligibility-calculator/[examSlug]/page.tsx — same exam
// data (English only, see ageCalculatorStrings.ts's header comment), Hindi
// UI chrome via AgeEligibilityPage's locale prop.
export const dynamicParams = false;

export async function generateStaticParams() {
  return (await getAgeEligibilityExams()).map((exam) => ({ examSlug: exam.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ examSlug: string }> }): Promise<Metadata> {
  const { examSlug } = await params;
  const exam = await getAgeEligibilityExamBySlug(examSlug);
  if (!exam) return {};

  const t = getAgeCalcStrings("hi");
  const title = `${t.pageTitle(exam.shortName, exam.year)} | Clear Cutoff`;
  const description = t.metaDescription(exam.shortName, exam.fullName);

  return buildMetadata({ locale: "hi", path: `/age-eligibility-calculator/${exam.slug}`, title, description });
}

export default async function Page({ params }: { params: Promise<{ examSlug: string }> }) {
  const { examSlug } = await params;
  const exam = await getAgeEligibilityExamBySlug(examSlug);
  if (!exam) notFound();

  return (
    <>
      <PageJsonLd
        locale="hi"
        path={`/age-eligibility-calculator/${exam.slug}`}
        trail={[
          { name: "आयु पात्रता कैलकुलेटर", path: "/age-eligibility-calculator" },
          { name: `${exam.shortName} आयु कैलकुलेटर`, path: `/age-eligibility-calculator/${exam.slug}` },
        ]}
        app={{ name: `${exam.shortName} आयु पात्रता कैलकुलेटर`, description: `${exam.shortName} (${exam.fullName}) की कट-ऑफ तिथि के अनुसार अपनी सही उम्र और श्रेणी-वार (General/OBC/SC/ST/PwD) पात्रता तुरंत जांचें।` }}
        faqs={exam.faqs}
      />
      <AgeEligibilityPage exam={exam} locale="hi" />
    </>
  );
}

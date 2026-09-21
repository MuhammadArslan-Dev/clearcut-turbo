import { Metadata } from "next";
import { buildMetadata } from "@/lib/seo";
import PageJsonLd from "@/components/PageJsonLd";
import { notFound } from "next/navigation";
import AgeEligibilityPage from "@/components/AgeEligibilityPage";
import { getAgeEligibilityExams, getAgeEligibilityExamBySlug } from "@/lib/ageEligibility";
import { getAgeCalcStrings } from "@/lib/ageCalculatorStrings";

// Mirrors src/app/age-eligibility-calculator/[examSlug]/page.tsx — same exam
// data (English only, see ageCalculatorStrings.ts's header comment), Marathi
// UI chrome via AgeEligibilityPage's locale prop.
export const dynamicParams = false;

export async function generateStaticParams() {
  return (await getAgeEligibilityExams()).map((exam) => ({ examSlug: exam.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ examSlug: string }> }): Promise<Metadata> {
  const { examSlug } = await params;
  const exam = await getAgeEligibilityExamBySlug(examSlug);
  if (!exam) return {};

  const t = getAgeCalcStrings("mr");
  const title = `${t.pageTitle(exam.shortName, exam.year)} | Clear Cutoff`;
  const description = t.metaDescription(exam.shortName, exam.fullName);
  const hiUrl = `https://clearcutoff.in/hi/tools/age-eligibility-calculator/${exam.slug}`;

  return buildMetadata({ locale: "mr", path: `/age-eligibility-calculator/${exam.slug}`, title, description });
}

export default async function Page({ params }: { params: Promise<{ examSlug: string }> }) {
  const { examSlug } = await params;
  const exam = await getAgeEligibilityExamBySlug(examSlug);
  if (!exam) notFound();

  return (
    <>
      <PageJsonLd
        locale="mr"
        path={`/age-eligibility-calculator/${exam.slug}`}
        trail={[
          { name: "वय पात्रता कॅल्क्युलेटर", path: "/age-eligibility-calculator" },
          { name: `${exam.shortName} वय कॅल्क्युलेटर`, path: `/age-eligibility-calculator/${exam.slug}` },
        ]}
        app={{ name: `${exam.shortName} वय पात्रता कॅल्क्युलेटर`, description: `${exam.shortName} (${exam.fullName}) च्या कटऑफ तारखेनुसार तुमचे अचूक वय आणि श्रेणीनुसार (General/OBC/SC/ST/PwD) पात्रता तात्काळ तपासा.` }}
        faqs={exam.faqs}
      />
      <AgeEligibilityPage exam={exam} locale="mr" />
    </>
  );
}

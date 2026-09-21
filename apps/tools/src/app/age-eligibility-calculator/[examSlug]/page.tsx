import { Metadata } from "next";
import { buildMetadata } from "@/lib/seo";
import PageJsonLd from "@/components/PageJsonLd";
import { notFound } from "next/navigation";
import AgeEligibilityPage from "@/components/AgeEligibilityPage";
import { getAgeEligibilityExams, getAgeEligibilityExamBySlug } from "@/lib/ageEligibility";

// Static export needs the full param set up front — an unlisted slug 404s
// rather than resolving on demand.
export const dynamicParams = false;

export async function generateStaticParams() {
  return (await getAgeEligibilityExams()).map((exam) => ({ examSlug: exam.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ examSlug: string }> }): Promise<Metadata> {
  const { examSlug } = await params;
  const exam = await getAgeEligibilityExamBySlug(examSlug);
  if (!exam) return {};

  const title = `${exam.shortName} Age Calculator (${exam.year}) - Eligibility & Cutoff Date | Clear Cutoff`;
  const description = `Calculate your exact age for ${exam.shortName} (${exam.fullName}) and check category-wise eligibility instantly. Free tool, nothing is uploaded.`;

  return buildMetadata({ locale: "en", path: `/age-eligibility-calculator/${exam.slug}`, title, description });
}

export default async function Page({ params }: { params: Promise<{ examSlug: string }> }) {
  const { examSlug } = await params;
  const exam = await getAgeEligibilityExamBySlug(examSlug);
  if (!exam) notFound();

  return (
    <>
      <PageJsonLd
        locale="en"
        path={`/age-eligibility-calculator/${exam.slug}`}
        trail={[
          { name: "Age Eligibility Calculator", path: "/age-eligibility-calculator" },
          { name: `${exam.shortName} Age Calculator`, path: `/age-eligibility-calculator/${exam.slug}` },
        ]}
        app={{ name: `${exam.shortName} Age Eligibility Calculator`, description: `Calculate your exact age as on the ${exam.shortName} cutoff date and check category-wise (General/OBC/SC/ST/PwD) age eligibility instantly.` }}
        faqs={exam.faqs}
      />
      <AgeEligibilityPage exam={exam} />
    </>
  );
}

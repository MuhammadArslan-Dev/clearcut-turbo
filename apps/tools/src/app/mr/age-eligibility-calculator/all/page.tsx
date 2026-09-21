import { Metadata } from "next";
import { Suspense } from "react";
import Text from "@clearcut/ui/text";
import SiteHeader from "@/components/SiteHeader";
import ToolsFooter from "@/components/SiteFooter";
import AgeEligibilityDirectory from "@/components/AgeEligibilityDirectory";
import { getAgeEligibilityCategories, getAgeEligibilityExams } from "@/lib/ageEligibility";

export async function generateMetadata(): Promise<Metadata> {
  const exams = await getAgeEligibilityExams();
  return {
    title: `सर्व ${exams.length} परीक्षा वय कॅल्क्युलेटर | Clear Cutoff`,
    description: "UPSC, SSC, बँकिंग, रेल्वे, संरक्षण, State PSC, टीचिंग आणि इतर — प्रत्येक परीक्षेचे वय कॅल्क्युलेटर शोधा किंवा श्रेणीनुसार फिल्टर करा.",
    alternates: {
      canonical: "https://clearcutoff.in/mr/tools/age-eligibility-calculator/all",
      languages: {
        en: "https://clearcutoff.in/tools/age-eligibility-calculator/all",
        hi: "https://clearcutoff.in/hi/tools/age-eligibility-calculator/all",
        mr: "https://clearcutoff.in/mr/tools/age-eligibility-calculator/all",
      },
    },
  };
}

export default async function Page() {
  const exams = await getAgeEligibilityExams();
  const categories = await getAgeEligibilityCategories("mr");

  return (
    <>
      <SiteHeader locale="mr" tool="age-eligibility-calculator" />

      <main className="max-w-[1100px] mx-auto px-4 md:px-6 pb-16">
        <div className="text-center py-10 md:py-14">
          <Text as="h1" variant="display-medium" weight="bold" color="gray-normal">
            सर्व परीक्षा वय कॅल्क्युलेटर
          </Text>
          <Text as="p" variant="body-large" color="gray-muted" className="mt-3 max-w-xl mx-auto">
            {exams.length} परीक्षांमधील वय पात्रता नियम आणि श्रेणी सवलती पहा.
          </Text>
        </div>

        <Suspense>
          <AgeEligibilityDirectory exams={exams} categories={categories} locale="mr" basePath="/mr/tools/age-eligibility-calculator" />
        </Suspense>
      </main>

      <ToolsFooter locale="mr" />
    </>
  );
}

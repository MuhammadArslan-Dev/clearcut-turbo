import { Metadata } from "next";
import { Suspense } from "react";
import Text from "@clearcut/ui/text";
import SiteHeader from "@/components/SiteHeader";
import ToolsFooter from "@/components/SiteFooter";
import AgeEligibilityDirectory from "@/components/AgeEligibilityDirectory";
import { AGE_ELIGIBILITY_EXAMS } from "@/lib/ageEligibility";

export const metadata: Metadata = {
  title: `All ${AGE_ELIGIBILITY_EXAMS.length} Exam Age Calculators | Clear Cutoff`,
  description:
    "Browse every exam age calculator — UPSC, SSC, Banking, Railways, Defence, State PSC, Teaching and more. Search or filter by category.",
  alternates: { canonical: "https://clearcutoff.in/tools/age-eligibility-calculator/all" },
};

export default function Page() {
  return (
    <>
      <SiteHeader tool="age-eligibility-calculator" />

      <main className="max-w-[1100px] mx-auto px-4 md:px-6 pb-16">
        <div className="text-center py-10 md:py-14">
          <Text as="h1" variant="display-medium" weight="bold" color="gray-normal">
            All Exam Age Calculators
          </Text>
          <Text as="p" variant="body-large" color="gray-muted" className="mt-3 max-w-xl mx-auto">
            Explore age eligibility rules and category relaxations across all {AGE_ELIGIBILITY_EXAMS.length} exams.
          </Text>
        </div>

        <Suspense>
          <AgeEligibilityDirectory exams={AGE_ELIGIBILITY_EXAMS} />
        </Suspense>
      </main>

      <ToolsFooter />
    </>
  );
}

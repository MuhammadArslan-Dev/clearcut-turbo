import { Metadata } from "next";
import { Suspense } from "react";
import Text from "@clearcut/ui/text";
import SiteHeader from "@/components/SiteHeader";
import ToolsFooter from "@/components/SiteFooter";
import AgeEligibilityDirectory from "@/components/AgeEligibilityDirectory";
import { AGE_ELIGIBILITY_EXAMS } from "@/lib/ageEligibility";

export const metadata: Metadata = {
  title: `सभी ${AGE_ELIGIBILITY_EXAMS.length} परीक्षा आयु कैलकुलेटर | Clear Cutoff`,
  description: "UPSC, SSC, बैंकिंग, रेलवे, रक्षा, State PSC, टीचिंग और अन्य — हर परीक्षा का आयु कैलकुलेटर खोजें या श्रेणी अनुसार फ़िल्टर करें।",
  alternates: {
    canonical: "https://clearcutoff.in/hi/tools/age-eligibility-calculator/all",
    languages: {
      en: "https://clearcutoff.in/tools/age-eligibility-calculator/all",
      hi: "https://clearcutoff.in/hi/tools/age-eligibility-calculator/all",
    },
  },
};

export default function Page() {
  return (
    <>
      <SiteHeader locale="hi" tool="age-eligibility-calculator" />

      <main className="max-w-[1100px] mx-auto px-4 md:px-6 pb-16">
        <div className="text-center py-10 md:py-14">
          <Text as="h1" variant="display-medium" weight="bold" color="gray-normal">
            सभी परीक्षा आयु कैलकुलेटर
          </Text>
          <Text as="p" variant="body-large" color="gray-muted" className="mt-3 max-w-xl mx-auto">
            {AGE_ELIGIBILITY_EXAMS.length} परीक्षाओं में आयु पात्रता नियम और श्रेणी छूट देखें।
          </Text>
        </div>

        <Suspense>
          <AgeEligibilityDirectory exams={AGE_ELIGIBILITY_EXAMS} locale="hi" basePath="/hi/tools/age-eligibility-calculator" />
        </Suspense>
      </main>

      <ToolsFooter locale="hi" />
    </>
  );
}

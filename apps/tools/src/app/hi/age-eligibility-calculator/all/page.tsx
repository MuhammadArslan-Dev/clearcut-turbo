import { Metadata } from "next";
import { buildMetadata, toolsUrl } from "@/lib/seo";
import PageJsonLd from "@/components/PageJsonLd";
import Text from "@clearcut/ui/text";
import SiteHeader from "@/components/SiteHeader";
import ToolsFooter from "@/components/SiteFooter";
import AgeEligibilityDirectory from "@/components/AgeEligibilityDirectory";
import { getAgeEligibilityCategories, getAgeEligibilityExams } from "@/lib/ageEligibility";

export async function generateMetadata(): Promise<Metadata> {
  const exams = await getAgeEligibilityExams();
  return buildMetadata({
    locale: "hi",
    path: "/age-eligibility-calculator/all",
    title: `सभी ${exams.length} परीक्षा आयु कैलकुलेटर | Clear Cutoff`,
    description: "UPSC, SSC, बैंकिंग, रेलवे, रक्षा, State PSC, टीचिंग और अन्य — हर परीक्षा का आयु कैलकुलेटर खोजें या श्रेणी अनुसार फ़िल्टर करें।",
  });
}

export default async function Page() {
  const exams = await getAgeEligibilityExams();
  const categories = await getAgeEligibilityCategories("hi");

  return (
    <>
      <PageJsonLd
        locale="hi"
        path="/age-eligibility-calculator/all"
        trail={[
          { name: "आयु पात्रता कैलकुलेटर", path: "/age-eligibility-calculator" },
          { name: "सभी परीक्षाएं", path: "/age-eligibility-calculator/all" },
        ]}
        collection={{
          name: `सभी ${exams.length} परीक्षा आयु कैलकुलेटर`,
          description: "UPSC, SSC, बैंकिंग, रेलवे, रक्षा, State PSC, टीचिंग और अन्य — हर परीक्षा का आयु कैलकुलेटर खोजें या श्रेणी अनुसार फ़िल्टर करें।",
          items: exams.map((e) => ({ name: `${e.shortName} आयु कैलकुलेटर`, url: toolsUrl("hi", `/age-eligibility-calculator/${e.slug}`) })),
        }}
      />
      <SiteHeader locale="hi" tool="age-eligibility-calculator" />

      <main className="max-w-[1100px] mx-auto px-4 md:px-6 pb-16">
        <div className="text-center py-10 md:py-14">
          <Text as="h1" variant="display-medium" weight="bold" color="gray-normal">
            सभी परीक्षा आयु कैलकुलेटर
          </Text>
          <Text as="p" variant="body-large" color="gray-muted" className="mt-3 max-w-xl mx-auto">
            {exams.length} परीक्षाओं में आयु पात्रता नियम और श्रेणी छूट देखें।
          </Text>
        </div>
          <AgeEligibilityDirectory exams={exams} categories={categories} locale="hi" basePath="/hi/tools/age-eligibility-calculator" />

      </main>

      <ToolsFooter locale="hi" />
    </>
  );
}

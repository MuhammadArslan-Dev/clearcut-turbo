import { Metadata } from "next";
import { buildMetadata } from "@/lib/seo";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import SyllabusTrackerApp from "@/components/syllabus-tracker/SyllabusTrackerApp";
import SyllabusAbout from "@/components/SyllabusAbout";
import PageJsonLd from "@/components/PageJsonLd";
import { getSyllabusStrings } from "@/lib/syllabusTrackerStrings";

const t = getSyllabusStrings("mr");

// Marathi mirror of ../../syllabus-tracker/page.tsx — see that file for the
// deep-link/SPA-fallback design notes (public/_redirects has a matching
// rule for /mr/syllabus-tracker/*, and src/lib/syllabusTrackerUrl.ts is
// locale-aware so it reads/writes the "/mr/tools/syllabus-tracker" URL
// root instead of the English one).
export const metadata: Metadata = buildMetadata({
  locale: "mr",
  path: "/syllabus-tracker",
  title: t.metaTitle,
  description: t.metaDescription,
  ogDescription: t.metaOgDescription,
});

export default function Page() {
  return (
    <>
      <PageJsonLd
        locale="mr"
        path="/syllabus-tracker"
        trail={[{ name: "अभ्यासक्रम ट्रॅकर", path: "/syllabus-tracker" }]}
        app={{ name: "अभ्यासक्रम ट्रॅकर", description: t.metaDescription, category: "EducationalApplication" }}
      />
      <SiteHeader locale="mr" tool="syllabus-tracker" />
      <main className="min-h-[70vh] bg-[var(--color-background-gray-subtle)]">
        <SyllabusTrackerApp locale="mr" />
      </main>
      <SyllabusAbout locale="mr" />
      <SiteFooter locale="mr" />
    </>
  );
}

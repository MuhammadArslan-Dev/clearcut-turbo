import { Metadata } from "next";
import { buildMetadata } from "@/lib/seo";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import SyllabusTrackerApp from "@/components/syllabus-tracker/SyllabusTrackerApp";
import SyllabusAbout from "@/components/SyllabusAbout";
import PageJsonLd from "@/components/PageJsonLd";
import { getSyllabusStrings } from "@/lib/syllabusTrackerStrings";

const t = getSyllabusStrings("hi");

// Hindi mirror of ../../syllabus-tracker/page.tsx — see that file for the
// deep-link/SPA-fallback design notes (public/_redirects has a matching
// rule for /hi/syllabus-tracker/*, and src/lib/syllabusTrackerUrl.ts is
// locale-aware so it reads/writes the "/hi/tools/syllabus-tracker" URL
// root instead of the English one).
export const metadata: Metadata = buildMetadata({
  locale: "hi",
  path: "/syllabus-tracker",
  title: t.metaTitle,
  description: t.metaDescription,
  ogDescription: t.metaOgDescription,
});

export default function Page() {
  return (
    <>
      <PageJsonLd
        locale="hi"
        path="/syllabus-tracker"
        trail={[{ name: "सिलेबस ट्रैकर", path: "/syllabus-tracker" }]}
        app={{ name: "सिलेबस ट्रैकर", description: t.metaDescription, category: "EducationalApplication" }}
      />
      <SiteHeader locale="hi" tool="syllabus-tracker" />
      <main className="min-h-[70vh] bg-[var(--color-background-gray-subtle)]">
        <SyllabusTrackerApp locale="hi" />
      </main>
      <SyllabusAbout locale="hi" />
      <SiteFooter locale="hi" />
    </>
  );
}

import { Metadata } from "next";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import SyllabusTrackerApp from "@/components/syllabus-tracker/SyllabusTrackerApp";
import { getSyllabusStrings } from "@/lib/syllabusTrackerStrings";

const t = getSyllabusStrings("hi");

// Hindi mirror of ../../syllabus-tracker/page.tsx — see that file for the
// deep-link/SPA-fallback design notes (public/_redirects has a matching
// rule for /hi/syllabus-tracker/*, and src/lib/syllabusTrackerUrl.ts is
// locale-aware so it reads/writes the "/hi/tools/syllabus-tracker" URL
// root instead of the English one).
export const metadata: Metadata = {
  title: t.metaTitle,
  description: t.metaDescription,
  alternates: {
    canonical: "https://clearcutoff.in/hi/tools/syllabus-tracker",
    languages: {
      en: "https://clearcutoff.in/tools/syllabus-tracker",
      hi: "https://clearcutoff.in/hi/tools/syllabus-tracker",
      mr: "https://clearcutoff.in/mr/tools/syllabus-tracker",
    },
  },
  openGraph: {
    title: t.metaTitle,
    description: t.metaOgDescription,
    url: "https://clearcutoff.in/hi/tools/syllabus-tracker",
    siteName: "Clear Cutoff",
    type: "website",
  },
};

export default function Page() {
  return (
    <>
      <SiteHeader locale="hi" tool="syllabus-tracker" />
      <main className="min-h-[70vh] bg-[var(--color-background-gray-subtle)]">
        <SyllabusTrackerApp locale="hi" />
      </main>
      <SiteFooter locale="hi" />
    </>
  );
}

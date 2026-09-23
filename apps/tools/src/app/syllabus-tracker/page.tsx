import { Metadata } from "next";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import SyllabusTrackerApp from "@/components/syllabus-tracker/SyllabusTrackerApp";
import { getSyllabusStrings } from "@/lib/syllabusTrackerStrings";

const t = getSyllabusStrings("en");

export const metadata: Metadata = {
  title: t.metaTitle,
  description: t.metaDescription,
  alternates: {
    canonical: "https://clearcutoff.in/tools/syllabus-tracker",
    languages: {
      en: "https://clearcutoff.in/tools/syllabus-tracker",
      hi: "https://clearcutoff.in/hi/tools/syllabus-tracker",
      mr: "https://clearcutoff.in/mr/tools/syllabus-tracker",
    },
  },
  openGraph: {
    title: t.metaTitle,
    description: t.metaOgDescription,
    url: "https://clearcutoff.in/tools/syllabus-tracker",
    siteName: "Clear Cutoff",
    type: "website",
  },
};

// Deliberately a plain, non-dynamic page — NOT a [[...slug]] catch-all.
// output: "export" (next.config.ts) enforces generateStaticParams even in
// `next dev`, not just at build time: a catch-all here would hard-error on
// any fresh/hard-reloaded URL whose slug wasn't pre-generated (real
// exam/level slugs come from a live backend and can't be known at build
// time). The only file that physically exists is this one, at the bare
// /syllabus-tracker path.
//
// Deep links (/syllabus-tracker/htet, /syllabus-tracker/htet/level-1-prt)
// work anyway, without Next ever routing to them directly:
//  - In-app, SyllabusTrackerApp updates the URL with the raw History API
//    (no Next navigation involved) as the user moves through the wizard —
//    see src/lib/syllabusTrackerUrl.ts.
//  - In production, public/_redirects rewrites any nested
//    /syllabus-tracker/* path back to this same built page with a 200 (a
//    Cloudflare Pages-level rewrite, entirely outside Next's own routing),
//    and SyllabusTrackerApp parses the real window.location client-side to
//    restore the right step.
//  - In local `next dev` only, a hard reload/fresh visit to a nested path
//    has no _redirects equivalent and 404s — an accepted local-only gap;
//    reaching that URL via the app's own navigation (never a fresh load)
//    is the supported path, exactly as it will be in production.
export default function Page() {
  return (
    <>
      <SiteHeader tool="syllabus-tracker" />
      <main className="min-h-[70vh] bg-[var(--color-background-gray-subtle)]">
        <SyllabusTrackerApp locale="en" />
      </main>
      <SiteFooter locale="en" />
    </>
  );
}

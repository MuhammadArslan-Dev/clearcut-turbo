import { Metadata } from "next";
import { buildMetadata } from "@/lib/seo";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import SyllabusTrackerApp from "@/components/syllabus-tracker/SyllabusTrackerApp";
import SyllabusAbout from "@/components/SyllabusAbout";
import PageJsonLd from "@/components/PageJsonLd";
import { getSyllabusStrings } from "@/lib/syllabusTrackerStrings";

const t = getSyllabusStrings("en");

export const metadata: Metadata = buildMetadata({
  locale: "en",
  path: "/syllabus-tracker",
  title: t.metaTitle,
  description: t.metaDescription,
  ogDescription: t.metaOgDescription,
});

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
      <PageJsonLd
        locale="en"
        path="/syllabus-tracker"
        trail={[{ name: "Syllabus Tracker", path: "/syllabus-tracker" }]}
        app={{ name: "Syllabus Tracker", description: t.metaDescription, category: "EducationalApplication" }}
      />
      <SiteHeader tool="syllabus-tracker" />
      <main className="min-h-[70vh] bg-[var(--color-background-gray-subtle)]">
        <SyllabusTrackerApp locale="en" />
      </main>
      <SyllabusAbout locale="en" />
      <SiteFooter locale="en" />
    </>
  );
}

import Header from "@/components/layout/headers/Header";
import CoursePage from "@/components/pages/CoursePage";
import { getCourse } from "@/lib/data/courses";
import { getExamBySlug } from "@/lib/data/staticExams";
import JsonLd from "@clearcut/ui/json-ld";
import { generateSeoMetadata, SITE_URL } from "@/lib/seo/metadata";
import FloatingButton from "@/components/global/FloatingButton";

type Props = { params: Promise<{ slug: string; locale: string }> };

// Builds a readable, keyword-bearing title fragment for course slugs that
// have no matching STATIC_EXAMS entry (e.g. "htet-level-1-prt"). Without
// this, every such slug fell back to one identical hardcoded string, giving
// Google several distinct sitemap URLs with the same <title>.
function humanizeSlug(slug: string): string {
  const levelMatch = slug.match(/^([a-z]+)-level-(\d+)-([a-z]+)$/i);
  if (levelMatch) {
    const [, exam, level, grade] = levelMatch;
    return `${exam.toUpperCase()} Level ${level} (${grade.toUpperCase()})`;
  }
  return slug
    .split("-")
    .map((word) => (word.length <= 4 ? word.toUpperCase() : word[0].toUpperCase() + word.slice(1)))
    .join(" ");
}

// API call commented out — using static data
// async function getLandingData({ slug }: { slug: string }) {
//   try {
//     const res = await fetch(
//       `${process.env.API_URL}/api/blog/exam?short_name=${slug}&first=true`,
//       { next: { revalidate: 1800 } },
//     );
//     if (!res.ok) return null;
//     return await res.json();
//   } catch (error) {
//     console.error(error);
//     return null;
//   }
// }

export async function generateMetadata({ params }: Props) {
  const { slug } = await params;
  const exam = getExamBySlug(slug);

  if (!exam) {
    // Still a real, distinct page (see src/lib/data/courses.ts) even when
    // this slug has no matching entry in STATIC_EXAMS — omitting `url` here
    // made generateSeoMetadata fall back to the homepage as canonical,
    // which told Google every such page was a duplicate of "/" and got it
    // dropped from the index ("Alternate page with proper canonical tag").
    // The title/description are derived per-slug (not one shared string) so
    // distinct URLs like htet-level-1-prt / -2-tgt / -3-pgt don't collide.
    const label = humanizeSlug(slug);
    return generateSeoMetadata({
      title: `${label} Course | Clear Cutoff`,
      description: `Prepare for ${label} with Clear Cutoff — structured video lectures, previous year papers, revision notes, and full-length test series.`,
      url: `/teaching/${slug}`,
    });
  }

  return generateSeoMetadata({
    title: `${exam.short_name} Preparation Course — PYQs, Notes & Tests | Clear Cutoff`,
    description: `Prepare for the ${exam.name} with Clear Cutoff — video lectures, PYQs, notes, and test series to help you crack ${exam.short_name}.`,
    url: `/teaching/${slug}`,
    image: exam.logo_url ?? undefined,
    keywords: [exam.short_name, exam.name, "Clear Cutoff", "Course", "Teaching", `${exam.short_name} preparation`],
  });
}

export default async function Course({ params }: Props) {
  const { slug, locale } = await params;
  const resolvedLocale = locale === "hi" ? "hi" : "en";
  const exam = getExamBySlug(slug);
  const course = getCourse(slug);

  return (
    <>
      <div className="flex flex-col">
        <Header items={course?.navLink} />

        <JsonLd
          data={{
            "@context": "https://schema.org",
            "@type": "BreadcrumbList",
            itemListElement: [
              { "@type": "ListItem", position: 1, name: "Home", item: SITE_URL },
              { "@type": "ListItem", position: 2, name: "Teaching", item: `${SITE_URL}/teaching` },
              {
                "@type": "ListItem",
                position: 3,
                name: exam?.short_name ?? slug.toUpperCase(),
                item: `${SITE_URL}/teaching/${slug}`,
              },
            ],
          }}
        />

        {exam && (
          <JsonLd
            data={{
              "@context": "https://schema.org",
              "@type": "Course",
              name: exam.short_name,
              description: exam.name,
              url: `https://clearcutoff.in/teaching/${slug}`,
              image: exam.logo_url,
              provider: {
                "@type": "Organization",
                name: "Clear Cutoff",
                url: "https://clearcutoff.in",
                sameAs: "https://clearcutoff.in",
              },
            }}
          />
        )}

        <CoursePage params={{ slug, locale: resolvedLocale }} data={exam} />
      </div>
      <FloatingButton course={exam?.short_name?.toLowerCase()} />
    </>
  );
}

import Header from "@/components/layout/headers/Header";
import CoursePage from "@/components/pages/CoursePage";
import { getCourse } from "@/lib/data/courses";
import { getExamBySlug } from "@/lib/data/staticExams";
import JsonLd from "@clearcut/ui/json-ld";
import { generateSeoMetadata } from "@/lib/seo/metadata";
import FloatingButton from "@/components/global/FloatingButton";

type Props = { params: Promise<{ slug: string; locale: string }> };

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
    return generateSeoMetadata({
      title: "Teaching Exam Course | Clear Cutoff",
      description: "Explore teaching exam courses on Clear Cutoff — PYQs, notes, video lectures, and test series.",
    });
  }

  return generateSeoMetadata({
    title: `${exam.short_name} Course | Clear Cutoff`,
    description: exam.name,
    url: `/teaching/${slug}`,
    image: exam.logo_url ?? undefined,
    keywords: [exam.short_name, exam.name, "Clear Cutoff", "Course", "Teaching"],
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
      <FloatingButton />
    </>
  );
}

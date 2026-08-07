import clsx from "clsx";
import { Exam } from "@/types/page";
import CourseLogoCarousalData from "./CourseLogoCarousalData";
import { STATIC_EXAMS } from "@/lib/data/staticExams";
import { Locale, defaultLocale } from "@/lib/i18n/config";

// API call commented out — using static data
// async function getLandingData(): Promise<{ data: Exam[] }> {
//   const res = await fetch(`${process.env.API_URL}/api/blog/exam`, {
//     next: { revalidate: 1800 },
//   });
//   if (!res.ok) throw new Error("Failed to fetch landing data");
//   return res.json();
// }

export default async function CourseLogoCarousal({
  bgColor,
  active = true,
  showButton = true,
  data,
  locale = defaultLocale,
}: {
  data?: Exam;
  bgColor?: string;
  active?: boolean;
  showButton?: boolean;
  locale?: Locale;
}) {
  if (!active) return null;

  return (
    <div className={clsx(bgColor)} style={{ background: bgColor }}>
      <CourseLogoCarousalData courses={STATIC_EXAMS} data={data} showButton={showButton} locale={locale} />
    </div>
  );
}

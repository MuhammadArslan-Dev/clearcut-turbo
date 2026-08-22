import Section from "../../global/Section";
import CourseCard from "../../ui/cards/CourseCard";
import clsx from "clsx";
import { Exam } from "@/types/page";
import ExamListHeader from "./ExamListHeader";
import StudentTrustBlock from "@/components/global/StudentTrustBlock";
import { STATIC_EXAMS } from "@/lib/data/staticExams";
import { Locale, defaultLocale } from "@/lib/i18n/config";

// API call commented out — using static data
// async function getLandingData() {
//   const res = await fetch(`${process.env.API_URL}/api/blog/exam?status=active`, {
//     next: { revalidate: 1800 },
//   });
//   if (!res.ok) throw new Error("Failed to fetch landing data");
//   return res.json();
// }

export default async function ExamListSection({
  bgColor,
  active = true,
  data,
  locale = defaultLocale,
}: {
  data?: Exam;
  bgColor?: string;
  active?: boolean;
  locale?: Locale;
}) {
  if (!active) return null;

  return (
    <div className={clsx(bgColor)} style={{ background: bgColor }}>
      <Section padding="py-ym-section md:py-yd-section px-3" maxWidth="max-w-[1200px]" sectionId="exam-list-section">
        <div className="flex flex-col gap-12">
          <ExamListHeader />
          <div className="grid grid-cols-[repeat(auto-fit,minmax(300px,350px))] justify-center gap-6">
            {STATIC_EXAMS.map((item: Exam, index) => (
              <CourseCard
                key={item.exam_id}
                data={item}
                locale={locale}
                priority={index === 0}
              />
            ))}
          </div>
          <StudentTrustBlock locale={locale} />
        </div>
      </Section>
    </div>
  );
}

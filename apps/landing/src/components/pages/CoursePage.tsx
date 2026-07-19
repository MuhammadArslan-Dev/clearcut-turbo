import { getCourse } from "@/lib/data/courses";
import { notFound } from "next/navigation";
import { Exam } from "@/types/page";

import CoursePageHero from "@/components/sections/heros/CoursePageHero";

import HowItWorksSection from "@/components/sections/howitwork/HowItWorksSection";
import ComparisonSection from "@/components/sections/ComparisonSection";
import FAQsSection from "@/components/sections/FAQsSection";
import SinglePricingSection from "@/components/sections/SinglePricingSection";
import CourseLogoCarousal from "@/components/sections/carousal/CourseLogoCarousal";

type Props = {
  params: {
    slug: string;
    locale?: string;
  };
  data?: Exam;
};

export default async function CoursePage({ params, data }: Props) {
  const { slug, locale } = await params;
  const resolvedLocale = locale === "hi" ? "hi" : "en";
  const course = getCourse(slug);

  if (!course) return notFound();

  return (
    <>
      <CoursePageHero data={data} />
      <CourseLogoCarousal data={data} locale={resolvedLocale} />
      <SinglePricingSection data={data} />
      {/* <SectionRenderer data={data} sections={course?.sections || []} /> */}
    </>
  );
}

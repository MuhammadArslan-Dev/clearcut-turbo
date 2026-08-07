import React from "react";
import PricingSection from "./PricingSection";
import { Exam } from "@/types/page";
import { STATIC_EXAMS } from "@/lib/data/staticExams";
import { Locale, defaultLocale } from "@/lib/i18n/config";

// API call commented out — using static data
// async function getLandingData(): Promise<{ data: Exam[] }> {
//   const res = await fetch(`${process.env.API_URL}/api/blog/exam?status=active`, {
//     next: { revalidate: 1800 },
//   });
//   if (!res.ok) throw new Error("Failed to fetch landing data");
//   return res.json();
// }

export default async function PricingSectionWrapper({
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
  return (
    <PricingSection bgColor={bgColor} active={active} data={data} courses={STATIC_EXAMS} locale={locale} />
  );
}

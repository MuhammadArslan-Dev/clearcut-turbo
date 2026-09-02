import React from "react";
import PricingSection from "./PricingSection";
import { Exam } from "@/types/page";
import { Locale, defaultLocale } from "@/lib/i18n/config";

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
  return <PricingSection bgColor={bgColor} active={active} data={data} locale={locale} />;
}

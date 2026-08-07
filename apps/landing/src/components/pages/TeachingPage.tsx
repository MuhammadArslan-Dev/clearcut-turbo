import React from "react";
import SectionRenderer from "../global/SectionRenderer";
import { Section } from "@/lib/sections/registry";
import { Locale, defaultLocale } from "@/lib/i18n/config";

export default function TeachingPage({ locale = defaultLocale }: { locale?: Locale }) {
  const sections = [
    { type: "examList", bgColor: "#ffffff" },
    { type: "courseLogoCarousal", bgColor: "#f5f7fb", showButton: false },
    { type: "comparison", bgColor: "#ffffff" },
  ] satisfies Section[];
  return (
    <>
      <SectionRenderer sections={sections} locale={locale} />
    </>
  );
}

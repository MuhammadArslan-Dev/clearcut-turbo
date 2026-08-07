import React from "react";
import SectionRenderer from "../global/SectionRenderer";
import { Section } from "@/lib/sections/registry";
import { Locale, defaultLocale } from "@/lib/i18n/config";

export default function LandingPage({ locale = defaultLocale }: { locale?: Locale }) {
  const sections = [
    {
      type: "homeHero",
      title: "React Mastery",
      bgColor: "#ffffff",
    },
    { type: "courseLogoCarousal", bgColor: "#ffffff" },
    { type: "features", bgColor: "#f5f7fb" },
    { type: "howItWorks", bgColor: "#ffffff" },
    { type: "comparison", bgColor: "#f5f7fb" },
    { type: "pricing", bgColor: "#ffffff" },
    // { type: "testimonials", bgColor: "#f5f7fb" },
    { type: "faqs", bgColor: "#f5f7fb" },
  ] satisfies Section[];
  return (
    <>
      <SectionRenderer sections={sections} locale={locale} />
    </>
  );
}

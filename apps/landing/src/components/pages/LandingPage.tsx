import React from "react";
import SectionRenderer from "../global/SectionRenderer";
import { Section } from "@/lib/sections/registry";
import { Locale, defaultLocale } from "@/lib/i18n/config";
import { getFaq } from "@/lib/api/cms";

export default async function LandingPage({ locale = defaultLocale }: { locale?: Locale }) {
  const faq = await getFaq(locale);

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
    // Teaser only — FAQsSection caps this to its first 5 categories itself.
    // The full list lives on /faq.
    { type: "faqs", bgColor: "#f5f7fb", categories: faq?.categories },
  ] satisfies Section[];
  return (
    <>
      <SectionRenderer sections={sections} locale={locale} />
    </>
  );
}

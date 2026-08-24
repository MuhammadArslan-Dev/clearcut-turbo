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
      {/*
        This page is only 3 sections total, so "below the fold" barely
        exists — SectionRenderer's default lazy wrapper (LazySection) swaps
        a 400px placeholder for the real content once it's near the
        viewport, and this comparison section's real height (a full
        multi-row table + heading) is nowhere close to 400px. That mismatch
        was the single largest Cumulative Layout Shift contributor on this
        page (~0.44) — the placeholder-to-real-content swap itself, not
        anything image-related. Marking every section here eager (this
        page's content is lightweight — no heavy below-the-fold media)
        renders everything up front instead of via that swap.
      */}
      <SectionRenderer
        sections={sections}
        locale={locale}
        eagerTypes={["examList", "courseLogoCarousal", "comparison"]}
      />
    </>
  );
}

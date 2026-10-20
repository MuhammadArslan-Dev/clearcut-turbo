import type { Metadata } from "next";
import { toLocale } from "@/lib/i18n/config";
import { HTET_PAGES, type HtetPageKey } from "@/lib/data/htetInfo";
import { generateSeoMetadata } from "./metadata";

// Metadata for the HTET information pages. Each locale's copy is a real
// translation, so every locale is self-canonical with the full hreflang set.
export function htetPageMetadata(page: HtetPageKey, locale: string): Metadata {
  const resolvedLocale = toLocale(locale);
  const copy = HTET_PAGES[page][resolvedLocale];
  return generateSeoMetadata({
    title: copy.title,
    description: copy.description,
    url: `/htet/${page}`,
    locale: resolvedLocale,
    keywords: page === "age-limit" ? ["HTET age limit", "HTET maximum age", "HTET eligibility"] : ["HTET cutoff marks", "HTET qualifying marks", "HTET passing marks"],
  });
}

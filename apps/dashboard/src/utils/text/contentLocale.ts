import type { AppLocale } from "@/types/components/language";

// Backend-stored content (paper names, section names, test titles — parsed
// via parseTranslation()/mapPapersToItems()/mapSectionsToItems()) is
// locale-keyed JSON from Laravel with only "en"/"hi" keys — there is no
// Marathi exam content. The UI locale (AppLocale) can be "mr", but any
// lookup into that locale-keyed backend JSON must go through this fallback
// first, or it silently resolves to undefined ("N/A"/blank labels).
// Product decision: Marathi UI, Hindi content fallback (not English).
export type ContentLocale = "en" | "hi";

export function toContentLocale(locale: AppLocale | string): ContentLocale {
  return locale === "en" ? "en" : "hi";
}

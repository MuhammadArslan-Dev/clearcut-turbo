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

// A course/exam's own content language ("english"/"hindi"/"marathi" — the
// `id`s used by the dashboard's per-exam Content Language picker and stored
// on UExamEnrollment.language) is a DIFFERENT axis from the site-wide UI
// language (AppLocale, driven by the URL's locale prefix via next-intl's
// useLocale()). Content that's scoped to a specific enrollment —
// chapter/topic names (via getLocalizedName), notes, videos — must key off
// the enrollment's own language, not whatever locale the rest of the
// dashboard chrome happens to be rendered in: a user can browse the site in
// English while their MAHATET course is set to Marathi, and that course's
// content must still resolve against "mr", not "en".
//
// Returns a real AppLocale (not pre-collapsed to "hi") so callers like
// getLocalizedName() can still try the exact "mr" translation first and
// only fall back to Hindi per-item when that specific translation is
// missing — collapsing here would silently discard real Marathi
// translations that do exist (see getLocalizedName's own docblock for why
// that was a bug once already). "punjabi" has no dedicated UI/content
// locale in this app, so — like an unrecognized/missing value — it falls
// back to "hi", not "en": the one thing this must never do is silently
// default to English, which is the exact bug this function exists to fix.
export function courseLanguageToLocale(
  courseLanguage?: string | null,
): AppLocale {
  switch (courseLanguage) {
    case "english":
      return "en";
    case "hindi":
      return "hi";
    case "marathi":
      return "mr";
    default:
      return "hi";
  }
}

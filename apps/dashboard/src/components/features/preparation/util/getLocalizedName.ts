import { parseTranslation } from "@/utils/text/translation";
import { toContentLocale } from "@/utils/text/contentLocale";
import type { AppLocale } from "@/types/components/language";
import { LocalizedText } from "../types/types";

/**
 * Resolves a chapter/topic's display name for the current locale, falling
 * back to the untranslated `name` when no translation exists for that
 * locale (or the item has no translation data at all) — same fallback
 * pattern already used for level/paper names via parseTranslation +
 * translation?.[locale] (see PreparationPaywall.tsx, MainPaywall.tsx,
 * payment success/initiated pages, BottomBar.tsx's paper name).
 *
 * Goes through toContentLocale() rather than indexing by the raw UI
 * locale — content translation JSON only ever has "en"/"hi" keys, so a
 * Marathi UI locale must resolve to the Hindi content per the same
 * product decision toContentLocale() already encodes for paper/section
 * names.
 */
export function getLocalizedName(
  item: { name: string; translation?: string | Record<string, LocalizedText> | null },
  locale: AppLocale | string,
): string {
  const translation = parseTranslation<Record<string, LocalizedText>>(
    item.translation as string | Record<string, LocalizedText>,
  );

  return translation?.[toContentLocale(locale)]?.name ?? item.name;
}

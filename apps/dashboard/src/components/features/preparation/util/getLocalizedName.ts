import { parseTranslation } from "@/utils/text/translation";
import type { AppLocale } from "@/types/components/language";
import { LocalizedText } from "../types/types";

/**
 * Resolves a chapter/topic's display name for the current locale:
 *
 * 1. The exact selected locale's own translation, if this item has one.
 * 2. Otherwise, Hindi — chapters/topics are translated exam-by-exam, so a
 *    Marathi UI viewing a chapter whose Marathi translation hasn't landed
 *    yet must not show blank/English; same per-item fallback pattern used
 *    for level/paper names via parseTranslation + translation?.[locale]
 *    (see PreparationPaywall.tsx, MainPaywall.tsx, payment success/
 *    initiated pages, BottomBar.tsx's paper name).
 * 3. Otherwise, the untranslated `name` column.
 *
 * Earlier version always went through toContentLocale() — which maps any
 * non-"en" UI locale straight to "hi" — on the (once-true) assumption that
 * chapter/topic translation JSON only ever had "en"/"hi" keys. Real "mr"
 * translations exist now, so that blanket mapping was silently discarding
 * them and showing Hindi to Marathi users even when a Marathi name was
 * right there in the same JSON. Indexing by the raw locale first (falling
 * back to "hi" only when that specific item lacks the requested locale)
 * fixes this without giving up the "never show blank for mr" guarantee.
 */
export function getLocalizedName(
  item: { name: string; translation?: string | Record<string, LocalizedText> | null },
  locale: AppLocale | string,
): string {
  const translation = parseTranslation<Record<string, LocalizedText>>(
    item.translation as string | Record<string, LocalizedText>,
  );

  if (!translation) return item.name;

  const direct = translation[locale]?.name;
  if (direct) return direct;

  if (locale !== "en" && locale !== "hi") {
    const hiFallback = translation.hi?.name;
    if (hiFallback) return hiFallback;
  }

  return item.name;
}

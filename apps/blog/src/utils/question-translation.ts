import type { LocalizedNameBlob, Translation } from "@/components/blog/assessment-question/questions-list";

// Single source of truth for "which translation do we show for this
// question's CONTENT" (question text / options / correct answer /
// explanation). Several call sites duplicated this selection ad hoc and two
// of them disagreed: `questions-list.tsx` and the "similar questions" block
// in `assessment-question-block.tsx` already matched on `courseLanguage`,
// but that file's *main* selected-question block unconditionally rendered
// `translations[0]` instead — so a Hindi-preferring visitor still saw the
// English question/options/explanation for the one question the page is
// actually about. Centralizing fixes that drift in one place.
//
// This is deliberately separate from `getQuestionUrlParam` (utils/slugify.ts),
// which must keep always using `translations[0]` for URL/slug/canonical
// purposes regardless of viewer language — that's a documented, load-bearing
// contract for the question sitemap and the canonical-redirect logic. Content
// selection and URL selection are different concerns that happen to have
// shared the same (wrong, for content) shortcut.
export function selectTranslation(
  translations: Translation[] | undefined | null,
  courseLang: "en" | "hi",
): Translation | undefined {
  if (!translations || translations.length === 0) return undefined;
  if (translations.length === 1) return translations[0];
  return (
    translations.find((t) => t.locale === courseLang) ?? translations[0]
  );
}

// `useLanguageStore().courseLanguage` holds free-form text ("en", "hi", or
// legacy values) — normalize to the two locales `question_trans.locale`
// actually uses, matching the existing normalization already duplicated at
// each call site.
export function normalizeCourseLang(courseLanguage: string): "en" | "hi" {
  return courseLanguage.toLowerCase() === "en" ? "en" : "hi";
}

// Chapters/topics carry their translated name in a real `translations`
// column (array-cast by Eloquent, so it arrives already parsed); sections
// have no such column and carry the same {"en":{"name":...},"hi":{...}}
// shape inside `description` instead, as a raw JSON string. This tolerates
// either — same "string or already-an-object" flexibility as
// apps/dashboard's own parseTranslation() util, which this mirrors (see
// apps/dashboard/src/utils/text/translation.ts) since blog has no shared
// package for it and the two apps' translation-blob shapes are identical.
export function parseTranslationBlob(
  blob: string | LocalizedNameBlob | null | undefined,
): LocalizedNameBlob | undefined {
  if (!blob) return undefined;
  if (typeof blob === "string") {
    try {
      return JSON.parse(blob) as LocalizedNameBlob;
    } catch {
      return undefined;
    }
  }
  return blob;
}

// Resolves a chapter/topic/section's display name for the viewer's course
// language:
//   1. The exact selected locale's own translation, if present.
//   2. Otherwise Hindi, if present — these entities are translated one at a
//      time (not guaranteed complete for every chapter/topic/section), so a
//      Hindi-preferring viewer must not see a blank/English name just
//      because this particular item's Hindi translation hasn't landed yet.
//      Mirrors apps/dashboard's getLocalizedName() fallback for the exact
//      same reason (see its docblock).
//   3. Otherwise the untranslated `name` column.
export function getLocalizedEntityName(
  entity: { name?: string | null } | null | undefined,
  blob: string | LocalizedNameBlob | null | undefined,
  courseLang: "en" | "hi",
): string | null {
  const name = entity?.name ?? null;
  const translation = parseTranslationBlob(blob);
  if (!translation) return name;

  const direct = translation[courseLang]?.name;
  if (direct) return direct;

  if (courseLang !== "hi") {
    const hiFallback = translation.hi?.name;
    if (hiFallback) return hiFallback;
  }

  return name;
}

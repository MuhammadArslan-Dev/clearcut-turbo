import { getTranslations } from "next-intl/server";
import { generateLocaleMetadata } from "./generateLocaleMetadata";
import { levelShort, seoTitle } from "./seo-text";
import { levelLabel } from "./year-title";

// Metadata for the question-bank hubs: exam, level, its /subject and /year
// lists (messages: HubPage). Their /hi pages render Hindi headings and copy,
// so since phase 125 /hi is its own page — self-canonical with an en/hi/
// x-default hreflang set, listed in the sitemap — instead of canonicalizing
// to English. English titles/descriptions are the ones these pages had.

export type HubKind = "exam" | "level" | "subjects" | "years";

const PATH_SUFFIX: Record<HubKind, string> = { exam: "", level: "", subjects: "/subject", years: "/year" };

export function hubPath(kind: HubKind, exam: string, level?: string): string {
  return kind === "exam" ? `/${exam}` : `/${exam}/${level}${PATH_SUFFIX[kind]}`;
}

export async function hubMetadata({
  locale,
  kind,
  exam,
  level = "",
  noindex = false,
}: {
  locale: string;
  kind: HubKind;
  exam: string;
  level?: string;
  noindex?: boolean;
}) {
  const t = await getTranslations({ locale, namespace: "HubPage" });
  const values = { exam: exam.toUpperCase(), level: levelLabel(level), levelShort: levelShort(level) };
  return generateLocaleMetadata({
    locale,
    path: hubPath(kind, exam, level),
    title: seoTitle([t(`${kind}Title`, values), t(`${kind}TitleShort`, values)]),
    description: t(`${kind}Description`, values),
    noindex,
    hiTranslated: true,
  });
}

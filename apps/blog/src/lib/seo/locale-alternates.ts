/**
 * Canonical + hreflang for a page served at both `/<path>` (en) and
 * `/hi/<path>`. Only a page whose main content is really Hindi on /hi gets a
 * self-referencing /hi canonical and an en/hi hreflang pair (question pages
 * whose questions have Hindi translations, which /hi server-renders). Where
 * /hi shows the same main content as English (English-only sections, listing
 * pages), both URLs canonicalize to English and no Hindi alternate is
 * declared — Google treats localized versions as duplicates when the main
 * content is untranslated.
 */
export function localeAlternates({
  siteUrl,
  path,
  locale,
  hiTranslated,
}: {
  siteUrl: string;
  /** e.g. "/ctet/paper-1" or "ctet/paper-1"; "" or "/" for the home page. */
  path: string;
  locale: string | undefined;
  hiTranslated: boolean;
}): { canonical: string; languages?: Record<string, string> } {
  const base = siteUrl.replace(/\/+$/, "");
  const trimmed = path.replace(/^\/+/, "");
  const cleanPath = trimmed ? `/${trimmed}` : "";

  const enUrl = `${base}${cleanPath}` || "/";
  const hiUrl = `${base}/hi${cleanPath}`;

  if (!hiTranslated) return { canonical: enUrl };
  return {
    canonical: locale === "hi" ? hiUrl : enUrl,
    languages: { en: enUrl, hi: hiUrl, "x-default": enUrl },
  };
}

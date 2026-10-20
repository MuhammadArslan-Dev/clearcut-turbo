import { Metadata } from "next";
import { defaultLocale, locales, type Locale } from "@/lib/i18n/config";

export const SITE_URL = "https://clearcutoff.in";
export const SITE_NAME = "Clear Cutoff";

type SeoProps = {
  title: string;
  description: string;
  keywords?: string[];
  image?: string;
  url?: string;
  /** The page's own locale, used to build a self-referencing canonical URL.
   * Optional — defaults to `defaultLocale` ("en") so callers that haven't
   * been made locale-aware keep their exact previous behavior. */
  locale?: Locale;
  /** Locales this page's main content is really translated into. Defaults to
   * every locale. A locale left out gets no hreflang entry, and a page served
   * in it canonicalizes to English (its content is the English page's). */
  languages?: readonly Locale[];
};

// Default locale has NO prefix (next-intl `localePrefix: "as-needed"`).
// Never emits a redundant trailing slash (e.g. "en" root -> SITE_URL, "hi"
// root -> SITE_URL/hi, not SITE_URL/hi/ — the latter 30x-redirects to the
// former, which is the wrong URL to put in canonical/hreflang tags).
export function buildLocalizedUrl(locale: Locale, path: string): string {
  const prefix = locale === defaultLocale ? "" : `/${locale}`;
  const suffix = path === "/" ? "" : path;
  const combined = `${prefix}${suffix}`;
  return combined === "" ? SITE_URL : `${SITE_URL}${combined}`;
}

/**
 * hreflang map (page `alternates.languages` and sitemap `xhtml:link`) for the
 * locales a page is really translated into, plus x-default = English. Google
 * reads hreflang as "this URL is the <lang> version", so an English-only page
 * must not list its /hi or /mr copies. With English as the only version there
 * is nothing to annotate, so this returns undefined.
 */
export function hreflangAlternates(
  path: string,
  languages: readonly Locale[] = locales,
): Record<string, string> | undefined {
  const translated = locales.filter((l) => l === defaultLocale || languages.includes(l));
  if (translated.length < 2) return undefined;
  return {
    ...Object.fromEntries(translated.map((l) => [l, buildLocalizedUrl(l, path)])),
    "x-default": buildLocalizedUrl(defaultLocale, path),
  };
}

// The root layout's title template ("%s | Clear Cutoff", via buildMetadata)
// appends the site name to every page title, but most page titles already
// carry it ("Contact Us | Clear Cutoff", "Clear Cutoff Android App — …"),
// which rendered "… | Clear Cutoff | Clear Cutoff". A title that already
// names the site is used as-is; any other title still gets the template.
export function pageTitle(title: string): NonNullable<Metadata["title"]> {
  return title.toLowerCase().includes(SITE_NAME.toLowerCase()) ? { absolute: title } : title;
}

/** Locales a CMS-driven page (compare/alternatives) is translated into: the
 * CMS has English and, per page, optional Hindi copy — never Marathi. */
export function cmsPageLanguages(hasHindi: boolean): Locale[] {
  return hasHindi ? ["en", "hi"] : ["en"];
}

export function generateSeoMetadata({
  title,
  description,
  keywords = [],
  image = "/icons/og-image.png",
  url = "/",
  locale = defaultLocale,
  languages = locales,
}: SeoProps): Metadata {
  // Accept either a relative path ("/teaching") or a full URL — normalise to relative
  const path = url.startsWith("http") ? new URL(url).pathname : url;
  const canonicalLocale = languages.includes(locale) ? locale : defaultLocale;
  const canonicalUrl = buildLocalizedUrl(canonicalLocale, path);
  const hreflang = hreflangAlternates(path, languages);

  return {
    title: pageTitle(title),
    description,
    keywords,

    alternates: {
      canonical: canonicalUrl,
      ...(hreflang ? { languages: hreflang } : {}),
    },

    openGraph: {
      title,
      description,
      url: canonicalUrl,
      siteName: SITE_NAME,
      images: [
        {
          url: image,
          width: 1200,
          height: 630,
          alt: title,
        },
      ],
      type: "website",
    },

    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [image],
    },
  };
}
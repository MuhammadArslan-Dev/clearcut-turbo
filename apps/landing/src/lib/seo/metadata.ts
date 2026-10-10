import { Metadata } from "next";
import { defaultLocale, type Locale } from "@/lib/i18n/config";

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
};

// Default locale has NO prefix (next-intl `localePrefix: "as-needed"`).
// Never emits a redundant trailing slash (e.g. "en" root -> SITE_URL, "hi"
// root -> SITE_URL/hi, not SITE_URL/hi/ — the latter 30x-redirects to the
// former, which is the wrong URL to put in canonical/hreflang tags).
function buildLocalizedUrl(locale: Locale, path: string): string {
  const prefix = locale === defaultLocale ? "" : `/${locale}`;
  const suffix = path === "/" ? "" : path;
  const combined = `${prefix}${suffix}`;
  return combined === "" ? SITE_URL : `${SITE_URL}${combined}`;
}

export function generateSeoMetadata({
  title,
  description,
  keywords = [],
  image = "/icons/og-image.png",
  url = "/",
  locale = defaultLocale,
}: SeoProps): Metadata {
  // Accept either a relative path ("/teaching") or a full URL — normalise to relative
  const path = url.startsWith("http") ? new URL(url).pathname : url;
  const canonicalUrl = buildLocalizedUrl(locale, path);

  return {
    title,
    description,
    keywords,

    alternates: {
      canonical: canonicalUrl,
      languages: {
        "en": buildLocalizedUrl("en", path),
        "hi": buildLocalizedUrl("hi", path),
        "mr": buildLocalizedUrl("mr", path),
        "x-default": buildLocalizedUrl("en", path),
      },
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
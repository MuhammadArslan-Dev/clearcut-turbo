import { Metadata } from "next";

export const SITE_URL = "https://clearcutoff.in";
const SITE_NAME = "Clear Cutoff";

type SeoProps = {
  title: string;
  description: string;
  keywords?: string[];
  image?: string;
  url?: string;
};

export function generateSeoMetadata({
  title,
  description,
  keywords = [],
  image = "/icons/og-image.png",
  url = "/",
}: SeoProps): Metadata {
  // Accept either a relative path ("/teaching") or a full URL — normalise to relative
  const path = url.startsWith("http") ? new URL(url).pathname : url;
  const canonicalUrl = `${SITE_URL}${path}`;

  return {
    title,
    description,
    keywords,

    alternates: {
      canonical: canonicalUrl,
      languages: {
        // Default locale (en) has NO prefix — localePrefix: "as-needed"
        "en": canonicalUrl,
        "hi": `${SITE_URL}/hi${path}`,
        "x-default": canonicalUrl,
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
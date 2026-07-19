import { Metadata } from "next";

type LocaleSEOOptions = {
  locale?: string;
  path: string; // e.g. "ctet/level-1/year"
  title: string;
  description: string;
};

export function generateLocaleMetadata({
  locale = "en",
  path,
  title,
  description,
}: LocaleSEOOptions): Metadata {
  const base = process.env.NEXT_PUBLIC_SITE_URL || "";
  const cleanPath = path ? `/${path}` : "";

  const enUrl = `${base}/${cleanPath}`;
  const hiUrl = `${base}/hi/${cleanPath}`;

  const canonicalUrl = locale === "hi" ? hiUrl : enUrl;

  return {
    title,
    description,

    openGraph: {
      title,
      description,
      url: canonicalUrl,
      siteName: title,
      images: [
        {
          url: "https://cc-teaching-content-ind.s3.dualstack.ap-south-1.amazonaws.com/images/favicon.png",
          width: 1200,
          height: 630,
          alt: "ClearCutoff Exam Prep",
        },
      ],
      type: "website",
    },

    alternates: {
      canonical: canonicalUrl,
      languages: {
        en: enUrl,
        hi: hiUrl,
        "x-default": enUrl,
      },
    },
  };
}
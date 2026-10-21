import { Metadata } from "next";
import { localeAlternates } from "./locale-alternates";
import { seoDescription, titleText, type SeoTitle } from "./seo-text";

type LocaleSEOOptions = {
  locale?: string;
  path: string; // e.g. "ctet/level-1/year"
  /** Plain (the layout adds " | Clear Cutoff") or absolute — see seoTitle. */
  title: SeoTitle;
  description: string;
  /** Valid but empty pages stay reachable but out of the index. */
  noindex?: boolean;
  /** Whether /hi renders genuinely Hindi main content: then /hi is
   * self-canonical with an en/hi hreflang pair, else /hi canonicalizes to
   * English — see localeAlternates. Question pages decide per page
   * (lib/question-bank/hindi-page.ts); home stays off. */
  hiTranslated?: boolean;
};

export function generateLocaleMetadata({
  locale = "en",
  path,
  title,
  description,
  noindex = false,
  hiTranslated = false,
}: LocaleSEOOptions): Metadata {
  const { canonical: canonicalUrl, languages } = localeAlternates({
    siteUrl: process.env.NEXT_PUBLIC_SITE_URL || "",
    path,
    locale,
    hiTranslated,
  });

  const ogTitle = titleText(title);
  description = seoDescription(description);
  return {
    title,
    description,
    ...(noindex ? { robots: { index: false, follow: true } } : {}),

    openGraph: {
      title: ogTitle,
      description,
      url: canonicalUrl,
      siteName: "Clear Cutoff",
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
      ...(languages ? { languages } : {}),
    },
  };
}
// Single source of truth for this app's SEO: public URLs, hreflang sets,
// Open Graph / Twitter metadata and the JSON-LD builders. Every page's
// metadata goes through buildMetadata() and every schema through the
// builders below, so canonical/hreflang/og:url can never disagree with each
// other or with the sitemap (src/app/sitemap.ts uses the same helpers).
//
// See apps/tools/SEO.md for the rules this encodes and how to maintain it.

import type { Metadata } from "next";

export const SITE_ORIGIN = "https://clearcutoff.in";
export const SITE_NAME = "Clear Cutoff";

// The Cloudflare Worker serves this app under /tools (English) and the
// locale-OUTERMOST /hi/tools and /mr/tools (see apps/tools/worker). Those are
// the PUBLIC URLs — Next's own basePath ("/tools") plus its physical /hi and
// /mr folders is an internal detail that never appears in a canonical.
const TOOLS_BASE = "/tools";

export type SeoLocale = "en" | "hi" | "mr";
export const SEO_LOCALES: SeoLocale[] = ["en", "hi", "mr"];

const LOCALE_PREFIX: Record<SeoLocale, string> = { en: "", hi: "/hi", mr: "/mr" };
const OG_LOCALE: Record<SeoLocale, string> = { en: "en_IN", hi: "hi_IN", mr: "mr_IN" };

/** Public, absolute URL of a tools page. `path` is the route below /tools, e.g. "/resizer/htet"; "" is the tools index. */
export function toolsUrl(locale: SeoLocale, path = ""): string {
  return `${SITE_ORIGIN}${LOCALE_PREFIX[locale]}${TOOLS_BASE}${path}`;
}

/**
 * Self-referencing canonical + a COMPLETE, reciprocal hreflang set (every
 * locale lists every locale including itself, plus x-default = English), as
 * Google's localized-versions guidance requires. Every route in this app
 * exists in all three locales, so the set is always the same three URLs.
 */
export function alternatesFor(locale: SeoLocale, path: string) {
  const languages: Record<string, string> = {};
  for (const l of SEO_LOCALES) languages[l] = toolsUrl(l, path);
  languages["x-default"] = toolsUrl("en", path);
  return { canonical: toolsUrl(locale, path), languages };
}

// public/ is served under basePath, so the file lives at /tools/og/....
export const OG_IMAGE = {
  url: `${SITE_ORIGIN}${TOOLS_BASE}/og/clear-cutoff-tools.png`,
  width: 1200,
  height: 630,
  alt: "Clear Cutoff — free exam tools: photo & signature resizer, age eligibility calculator, syllabus tracker",
};

export function buildMetadata(opts: {
  locale: SeoLocale;
  /** Route below /tools, e.g. "/resizer" ("" for the tools index). */
  path: string;
  title: string;
  description: string;
  /** Shorter/different social description; defaults to `description`. */
  ogDescription?: string;
  /** true → <meta robots="noindex,follow"> (page stays crawlable, is kept out of the index). */
  noindex?: boolean;
}): Metadata {
  const { locale, path, title, description, ogDescription, noindex } = opts;
  const social = ogDescription ?? description;

  return {
    title,
    description,
    alternates: alternatesFor(locale, path),
    openGraph: {
      title,
      description: social,
      url: toolsUrl(locale, path),
      siteName: SITE_NAME,
      type: "website",
      locale: OG_LOCALE[locale],
      alternateLocale: SEO_LOCALES.filter((l) => l !== locale).map((l) => OG_LOCALE[l]),
      images: [OG_IMAGE],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description: social,
      images: [OG_IMAGE.url],
    },
    ...(noindex ? { robots: { index: false, follow: true } } : {}),
  };
}

/** "HTET Photo & Signature Resizer - Free Tool | Clear Cutoff" -> "HTET Photo & Signature Resizer". */
export function nameFromTitle(title: string): string {
  return title.split(/ \| /)[0].split(/ - | — /)[0].trim();
}

// ── JSON-LD ───────────────────────────────────────────────────────────────
// Only properties Schema.org defines and Google documents are emitted — no
// aggregateRating/review (there are no real ratings to report; inventing
// them would violate Google's structured-data guidelines).

const ORGANIZATION = {
  "@type": "Organization",
  name: SITE_NAME,
  url: SITE_ORIGIN,
  logo: { "@type": "ImageObject", url: `${SITE_ORIGIN}${TOOLS_BASE}/web-app-manifest-512x512.png` },
};

const CRUMB_LABELS: Record<SeoLocale, { home: string; tools: string }> = {
  en: { home: "Home", tools: "Free Tools" },
  hi: { home: "होम", tools: "मुफ्त टूल्स" },
  mr: { home: "मुख्यपृष्ठ", tools: "मोफत टूल्स" },
};

/** Google's own list of applicationCategory values; anything else is ignored. */
export type AppCategory = "UtilitiesApplication" | "EducationalApplication" | "MultimediaApplication";

export function breadcrumbSchema(locale: SeoLocale, trail: { name: string; path: string }[]) {
  const labels = CRUMB_LABELS[locale];
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: labels.home, item: SITE_ORIGIN },
      // /tools (the index) exists in English only, so every locale points there.
      { "@type": "ListItem", position: 2, name: labels.tools, item: toolsUrl("en") },
      ...trail.map((crumb, i) => ({
        "@type": "ListItem",
        position: i + 3,
        name: crumb.name,
        item: toolsUrl(locale, crumb.path),
      })),
    ],
  };
}

export function webApplicationSchema(opts: {
  locale: SeoLocale;
  path: string;
  name: string;
  description: string;
  category?: AppCategory;
}) {
  const url = toolsUrl(opts.locale, opts.path);
  return {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    "@id": `${url}#webapp`,
    name: opts.name,
    description: opts.description,
    url,
    inLanguage: opts.locale,
    applicationCategory: opts.category ?? "UtilitiesApplication",
    operatingSystem: "Any (runs in browser)",
    isAccessibleForFree: true,
    offers: { "@type": "Offer", price: "0", priceCurrency: "INR" },
    publisher: ORGANIZATION,
  };
}

/** Only for Q&A that is actually visible on the page (Google requires markup to match visible content). */
export function faqPageSchema(locale: SeoLocale, faqs: { q: string; a: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    inLanguage: locale,
    mainEntity: faqs.map((faq) => ({
      "@type": "Question",
      name: faq.q,
      acceptedAnswer: { "@type": "Answer", text: faq.a },
    })),
  };
}

/** A page that is mainly a list of links (hub / directory / category pages). */
export function collectionPageSchema(opts: {
  locale: SeoLocale;
  path: string;
  name: string;
  description: string;
  items: { name: string; url: string }[];
}) {
  return {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: opts.name,
    description: opts.description,
    url: toolsUrl(opts.locale, opts.path),
    inLanguage: opts.locale,
    isPartOf: { "@type": "WebSite", name: SITE_NAME, url: SITE_ORIGIN },
    mainEntity: {
      "@type": "ItemList",
      numberOfItems: opts.items.length,
      itemListElement: opts.items.map((item, i) => ({
        "@type": "ListItem",
        position: i + 1,
        name: item.name,
        url: item.url,
      })),
    },
  };
}

import JsonLd from "@clearcut/ui/json-ld";
import {
  AppCategory,
  SeoLocale,
  breadcrumbSchema,
  collectionPageSchema,
  faqPageSchema,
  webApplicationSchema,
} from "@/lib/seo";

/**
 * The structured data of one page, in one place: BreadcrumbList always,
 * WebApplication for pages that ARE a tool, FAQPage when the page shows
 * those Q&As, CollectionPage/ItemList when the page is a list of links.
 * `path` is the route below /tools (same value the page passes to
 * buildMetadata). Server component — emits <script type="application/ld+json">.
 */
export default function PageJsonLd({
  locale,
  path,
  trail,
  app,
  faqs,
  collection,
}: {
  locale: SeoLocale;
  path: string;
  /** Breadcrumb entries AFTER "Home > Free Tools", the last being this page. */
  trail: { name: string; path: string }[];
  app?: { name: string; description: string; category?: AppCategory };
  faqs?: { q: string; a: string }[];
  collection?: { name: string; description: string; items: { name: string; url: string }[] };
}) {
  return (
    <>
      <JsonLd id="breadcrumb-schema" data={breadcrumbSchema(locale, trail)} />
      {app && <JsonLd id="webapp-schema" data={webApplicationSchema({ locale, path, ...app })} />}
      {faqs && faqs.length > 0 && <JsonLd id="faq-schema" data={faqPageSchema(locale, faqs)} />}
      {collection && <JsonLd id="collection-schema" data={collectionPageSchema({ locale, path, ...collection })} />}
    </>
  );
}

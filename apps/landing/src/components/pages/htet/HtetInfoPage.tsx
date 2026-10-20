import Header from "@/components/layout/headers/Header";
import FooterWrap from "@/components/layout/FooterWrap";
import Section from "@/components/global/Section";
import Text from "@clearcut/ui/text";
import JsonLd from "@clearcut/ui/json-ld";
import { Link } from "@/i18n/navigation";
import type { Locale } from "@/lib/i18n/config";
import { buildLocalizedUrl } from "@/lib/seo/metadata";
import {
  CHECKED_ON,
  HTET_BULLETIN_URL,
  HTET_COURSE_LINK,
  HTET_PAGE_KEYS,
  HTET_PAGES,
  type HtetPageKey,
} from "@/lib/data/htetInfo";

// Shared layout for the HTET information pages (/htet/age-limit,
// /htet/cutoff-marks). All copy lives in lib/data/htetInfo.ts.
export default function HtetInfoPage({ page, locale }: { page: HtetPageKey; locale: Locale }) {
  const copy = HTET_PAGES[page][locale];
  const related = HTET_PAGE_KEYS.filter((key) => key !== page);

  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: buildLocalizedUrl(locale, "/") },
      { "@type": "ListItem", position: 2, name: copy.breadcrumb, item: buildLocalizedUrl(locale, `/htet/${page}`) },
    ],
  };

  return (
    <>
      <JsonLd data={breadcrumbSchema} />
      <Header items={[]} linkShow={false} />

      <Section sectionId={`htet-${page}`} maxWidth="max-w-3xl" padding="py-ym-section md:py-yd-section px-4">
        <article className="space-y-8">
          <header className="space-y-3">
            <Text as="h1" variant="display-medium" weight="bold" color="gray-normal">
              {copy.h1}
            </Text>
            <Text as="p" variant="body-large" color="gray-muted">
              {copy.intro}
            </Text>
          </header>

          {copy.table && (
            <div className="overflow-x-auto rounded-2xl border border-border-gray-subtle bg-white">
              <table className="w-full text-left">
                <caption className="sr-only">{copy.table.caption}</caption>
                <thead>
                  <tr className="border-b border-border-gray-subtle">
                    {copy.table.headers.map((header) => (
                      <th key={header} scope="col" className="p-4">
                        <Text as="span" variant="body-medium" weight="semibold" color="gray-normal">
                          {header}
                        </Text>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {copy.table.rows.map((row) => (
                    <tr key={row[0]} className="border-b border-border-gray-subtle last:border-0">
                      {row.map((cell, i) => (
                        <td key={i} className="p-4 align-top">
                          <Text as="span" variant="body-medium" color={i === 0 ? "gray-normal" : "gray-muted"}>
                            {cell}
                          </Text>
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <section className="space-y-3">
            <Text as="h2" variant="heading-large" weight="semibold" color="gray-normal">
              {copy.factsHeading}
            </Text>
            <dl className="divide-y divide-border-gray-subtle rounded-2xl border border-border-gray-subtle bg-white">
              {copy.facts.map((fact) => (
                <div key={fact.label} className="grid gap-1 p-4 md:grid-cols-[220px_1fr] md:gap-4">
                  <Text as="dt" variant="body-medium" weight="semibold" color="gray-normal">
                    {fact.label}
                  </Text>
                  <Text as="dd" variant="body-medium" color="gray-muted">
                    {fact.value}
                  </Text>
                </div>
              ))}
            </dl>
          </section>

          {copy.sections.map((section) => (
            <section key={section.heading} className="space-y-2">
              <Text as="h2" variant="heading-large" weight="semibold" color="gray-normal">
                {section.heading}
              </Text>
              <Text as="p" variant="body-large" color="gray-muted">
                {section.body}
              </Text>
            </section>
          ))}

          <section className="space-y-4">
            <Text as="h2" variant="heading-large" weight="semibold" color="gray-normal">
              {copy.faqHeading}
            </Text>
            {copy.faqs.map((faq) => (
              <div key={faq.q} className="space-y-1">
                <Text as="h3" variant="heading-small" weight="semibold" color="gray-normal">
                  {faq.q}
                </Text>
                <Text as="p" variant="body-medium" color="gray-muted">
                  {faq.a}
                </Text>
              </div>
            ))}
          </section>

          <section className="space-y-2 rounded-2xl border border-border-gray-subtle bg-white p-4">
            <Text as="h2" variant="heading-small" weight="semibold" color="gray-normal">
              {copy.sourceHeading}
            </Text>
            <Text as="p" variant="body-medium" color="gray-muted">
              {copy.source}
            </Text>
            <a href={HTET_BULLETIN_URL} target="_blank" rel="noopener noreferrer" className="text-brand underline">
              {copy.sourceLinkLabel}
            </a>
            <Text as="p" variant="body-small" color="gray-muted">
              {copy.checkedLabel}: <time dateTime={CHECKED_ON}>{CHECKED_ON}</time>
            </Text>
          </section>

          <nav aria-label={copy.relatedHeading} className="space-y-2">
            <Text as="h2" variant="heading-small" weight="semibold" color="gray-normal">
              {copy.relatedHeading}
            </Text>
            <ul className="space-y-1">
              {related.map((key) => (
                <li key={key}>
                  <Link href={`/htet/${key}`} className="text-brand underline">
                    {HTET_PAGES[key][locale].h1}
                  </Link>
                </li>
              ))}
              <li>
                <Link href="/teaching/htet" className="text-brand underline">
                  {HTET_COURSE_LINK[locale]}
                </Link>
              </li>
            </ul>
          </nav>
        </article>
      </Section>

      <FooterWrap />
    </>
  );
}

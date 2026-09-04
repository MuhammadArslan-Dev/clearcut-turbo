import Header from "@/components/layout/headers/Header";
import FooterWrap from "@/components/layout/FooterWrap";
import FloatingButton from "@/components/global/FloatingButton";
import Section from "@/components/global/Section";
import Text from "@clearcut/ui/text";
import Button from "@clearcut/ui/button";
import JsonLd from "@clearcut/ui/json-ld";
import { Link } from "@/i18n/navigation";
import { generateSeoMetadata, SITE_URL, SITE_NAME } from "@/lib/seo/metadata";
import { getFaq } from "@/lib/api/cms";
import FaqPageContent from "@/components/pages/faq/FaqPageContent";

export const revalidate = 3600;

// FAQ meta copy per locale — CMS locales are en/hi only (mr falls back to en,
// same as the CMS's own localization fallback), so this only needs two keys.
const META = {
  en: {
    title: "Frequently Asked Questions | Clear Cutoff",
    description: "Answers to common questions about Clear Cutoff's courses, tests, payments and refund guarantee.",
  },
  hi: {
    title: "अक्सर पूछे जाने वाले प्रश्न | Clear Cutoff",
    description: "Clear Cutoff के कोर्स, टेस्ट, भुगतान और रिफंड गारंटी से जुड़े आम सवालों के जवाब।",
  },
};

function resolveMeta(locale: string) {
  return locale === "hi" ? META.hi : META.en;
}

const HERO = {
  en: {
    badge: "Help center",
    headingPrefix: "Frequently asked ",
    headingHighlight: "questions",
    description: "Everything worth knowing before you start preparing with Clear Cutoff.",
    ctaTitle: "Still have a question?",
    ctaDescription: "Can’t find what you’re looking for? Our team is happy to help.",
    ctaContact: "Contact us",
    ctaStart: "Start for Free",
  },
  hi: {
    badge: "सहायता केंद्र",
    headingPrefix: "अक्सर पूछे जाने वाले ",
    headingHighlight: "प्रश्न",
    description: "Clear Cutoff के साथ तैयारी शुरू करने से पहले जानने योग्य सभी जरूरी बातें।",
    ctaTitle: "अभी भी कोई सवाल है?",
    ctaDescription: "जो ढूंढ रहे हैं वो नहीं मिला? हमारी टीम मदद के लिए तैयार है।",
    ctaContact: "संपर्क करें",
    ctaStart: "मुफ्त में शुरू करें",
  },
};

function resolveHero(locale: string) {
  return locale === "hi" ? HERO.hi : HERO.en;
}

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const meta = resolveMeta(locale);
  const faq = await getFaq(locale);
  const categoryLabels = (faq?.categories ?? []).map((c) => c.label);

  const metadata = generateSeoMetadata({
    title: meta.title,
    description: meta.description,
    keywords: ["Clear Cutoff FAQ", "teaching exam prep questions", ...categoryLabels],
    url: "/faq",
  });

  // The CMS FAQ content only has en/hi copy — no real Marathi translation
  // exists yet, so /mr/faq silently falls back to English. Advertising it as
  // an "mr" hreflang alternate would tell Google that's the Marathi version
  // when it isn't. Drop it here rather than in the shared generateSeoMetadata
  // helper, which other pages with real Marathi copy still rely on.
  const canonicalUrl = `${SITE_URL}/faq`;

  // Deliberately omit `images` on openGraph/twitter (rather than pointing at
  // the sitewide default from generateSeoMetadata): this route ships its own
  // opengraph-image.tsx, and Next only auto-attaches a file-convention image
  // when the resolved metadata has no explicit `images` of its own. Built
  // directly from `meta`/canonicalUrl rather than read back off `metadata`
  // — Next's OpenGraph/Twitter metadata types are discriminated unions, and
  // narrowing them back after generateSeoMetadata returns a plain `Metadata`
  // isn't worth fighting.
  return {
    ...metadata,
    alternates: {
      ...metadata.alternates,
      languages: {
        en: canonicalUrl,
        hi: `${SITE_URL}/hi/faq`,
        "x-default": canonicalUrl,
      },
    },
    openGraph: {
      title: meta.title,
      description: meta.description,
      url: canonicalUrl,
      siteName: SITE_NAME,
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: meta.title,
      description: meta.description,
    },
  };
}

export default async function FaqPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const hero = resolveHero(locale);

  const faq = await getFaq(locale);
  const categories = faq?.categories ?? [];

  // FAQPage structured data must mirror what's actually visible on the page
  // for Google to grant the rich-result snippet, so this is built from every
  // CMS category/question (not just the active tab) — same source as the UI.
  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: categories.flatMap((category) =>
      category.questions.map((q) => ({
        "@type": "Question",
        name: q.question,
        acceptedAnswer: {
          "@type": "Answer",
          text: q.answer,
        },
      })),
    ),
  };

  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: SITE_URL },
      { "@type": "ListItem", position: 2, name: "FAQ", item: `${SITE_URL}/faq` },
    ],
  };

  return (
    <>
      {faqSchema.mainEntity.length > 0 && <JsonLd id="faq-schema" data={faqSchema} />}
      <JsonLd id="faq-breadcrumb-schema" data={breadcrumbSchema} />
      <Header items={[]} linkShow={false} />

      <div className="relative overflow-hidden">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 top-0 h-[420px] bg-gradient-to-b from-[var(--color-primary-bg-soft)] to-transparent"
        />
        <Section sectionId="faq-hero" padding="pt-ym-section md:pt-yd-section pb-6 px-3" className="relative">
          <div className="max-w-2xl mx-auto text-center">
            <span className="inline-block body-small !font-semibold text-brand bg-[var(--color-primary-bg-soft)] rounded-full px-4 py-1.5 mb-5">
              {hero.badge}
            </span>
            <Text as="h1" variant="display-medium" weight="bold" color="gray-normal" className="mb-4">
              {hero.headingPrefix}
              <span className="text-brand">{hero.headingHighlight}</span>
            </Text>
            <Text as="p" variant="body-large" color="gray-muted">
              {hero.description}
            </Text>
          </div>
        </Section>
      </div>

      <Section sectionId="faq-list" padding="pb-ym-section md:pb-yd-section px-3">
        <FaqPageContent categories={categories} locale={locale} />
      </Section>

      <Section sectionId="faq-cta" padding="pb-ym-section md:pb-yd-section px-3">
        <div className="max-w-3xl mx-auto rounded-3xl bg-gradient-to-br from-brand to-brand-dark px-8 py-10 md:py-12 flex flex-col items-center text-center gap-3">
          <Text as="h2" variant="heading-xlarge" weight="bold" color="white">
            {hero.ctaTitle}
          </Text>
          <Text as="p" variant="body-large" color="white" className="max-w-lg opacity-90 mb-2">
            {hero.ctaDescription}
          </Text>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <Link href="/contact-us">
              <Button variant="solid" color="neutral" size="lg" className="!bg-white !text-brand">
                {hero.ctaContact}
              </Button>
            </Link>
            <Link href="/start">
              <Button variant="outlined" size="lg" className="!border-white !text-white hover:!bg-white/10">
                {hero.ctaStart}
              </Button>
            </Link>
          </div>
        </div>
      </Section>

      <FloatingButton />
      <FooterWrap />
    </>
  );
}

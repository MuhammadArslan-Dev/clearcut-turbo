import { notFound } from "next/navigation";
import Header from "@/components/layout/headers/Header";
import FooterWrap from "@/components/layout/FooterWrap";
import FloatingButton from "@/components/global/FloatingButton";
import Section from "@/components/global/Section";
import Text from "@clearcut/ui/text";
import JsonLd from "@clearcut/ui/json-ld";
import { generateSeoMetadata, SITE_URL } from "@/lib/seo/metadata";
import { getAlternativeBySlug, getAlternativesSlugs, getMarketingProof, mediaUrl } from "@/lib/api/cms";
import { slugify } from "@/lib/utils/slugify";
import ArticleHero from "@/components/pages/alternatives/ArticleHero";
import ArticleBody from "@/components/shared/article/ArticleBody";
import SummaryTable from "@/components/pages/alternatives/SummaryTable";
import ToolSection from "@/components/pages/alternatives/ToolSection";
import TableOfContents from "@/components/shared/article/TableOfContents";
import ArticleShare from "@/components/shared/article/ArticleShare";
import BackToTop from "@/components/shared/article/BackToTop";
import RelatedAlternatives from "@/components/pages/alternatives/RelatedAlternatives";
import StatsRow from "@/components/pages/compare/StatsRow";
import CtaBanner from "@/components/pages/compare/CtaBanner";
import PromiseSection from "@/components/pages/compare/PromiseSection";

// Alternatives pages are CMS-driven (dedicated `alternatives` collection),
// same ISR cadence as /compare — see src/lib/api/cms.ts.
export const revalidate = 3600;
export const dynamicParams = true;

export async function generateStaticParams() {
  const slugs = await getAlternativesSlugs();
  return slugs.map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ locale: string; slug: string }> }) {
  const { locale, slug } = await params;
  const page = await getAlternativeBySlug(slug, locale);
  if (!page) return {};

  const title = page.meta?.metaTitle || `Best ${page.competitorName} Alternatives | Clear Cutoff`;
  const description = page.meta?.metaDescription || page.hero.description || page.hero.title;
  const ogImage = mediaUrl(page.meta?.ogImage?.url);

  return generateSeoMetadata({
    title,
    description,
    keywords: [page.competitorName, "Clear Cutoff", "alternatives"],
    url: `/alternatives/${slug}`,
    image: ogImage,
  });
}

export default async function AlternativeArticlePage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;

  const [page, marketingProof] = await Promise.all([getAlternativeBySlug(slug, locale), getMarketingProof(locale)]);

  if (!page) notFound();

  const tools = page.tools ?? [];
  const tocItems = tools.map((tool) => ({ id: slugify(tool.name), text: tool.name }));
  const pageUrl = `${SITE_URL}/alternatives/${slug}`;

  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: SITE_URL },
      { "@type": "ListItem", position: 2, name: "Alternatives", item: `${SITE_URL}/alternatives` },
      { "@type": "ListItem", position: 3, name: page.competitorName, item: pageUrl },
    ],
  };

  return (
    <>
      <JsonLd data={breadcrumbSchema} />
      <Header items={[]} linkShow={false} />

      <ArticleHero hero={page.hero} />

      <Section sectionId="article-layout" padding="pb-ym-section md:pb-yd-section px-3" maxWidth="max-w-[1200px]">
        <div className="grid grid-cols-1 gap-10 lg:grid-cols-[260px_minmax(0,1fr)_100px]">
          <TableOfContents items={tocItems} />

          <div className="min-w-0">
            {page.introBody_html && <ArticleBody html={page.introBody_html} />}
            <SummaryTable title={page.summaryTableTitle} tools={tools} />
            {tools.map((tool, index) => (
              <ToolSection key={tool.name} tool={tool} index={index} />
            ))}

            {/* midCta/promise render here (inside the sidebar's grid row) rather
                than as separate full-width sections, so the sticky TOC/Share
                rail stays pinned through them and only releases once Related
                Alternatives — outside this grid — comes into view. */}
            <div className="mt-10">
              <CtaBanner cta={page.midCta} />
              <PromiseSection promise={page.promise} />
            </div>

            {/* Share (mobile — desktop uses the sticky rail) */}
            <div className="mt-8 border-t border-border-gray-subtle pt-6 lg:hidden">
              <ArticleShare url={pageUrl} title={page.hero.title} />
            </div>
          </div>

          <aside className="hidden lg:block">
            <div className="sticky top-24 flex flex-col items-center gap-3">
              <Text as="span" variant="body-small" weight="semibold" color="gray-muted" className="uppercase tracking-wider">
                Share
              </Text>
              <ArticleShare url={pageUrl} title={page.hero.title} orientation="vertical" />
            </div>
          </aside>
        </div>
      </Section>

      <RelatedAlternatives items={page.relatedAlternatives} />
      <StatsRow stats={marketingProof?.stats} />
      <CtaBanner cta={marketingProof?.finalCta} />

      <BackToTop />
      <FloatingButton />
      <FooterWrap />
    </>
  );
}

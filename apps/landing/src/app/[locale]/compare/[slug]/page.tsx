import { notFound } from "next/navigation";
import Header from "@/components/layout/headers/Header";
import FooterWrap from "@/components/layout/FooterWrap";
import FloatingButton from "@/components/global/FloatingButton";
import { generateSeoMetadata, SITE_URL } from "@/lib/seo/metadata";
import { getComparisonBySlug, getComparisonSlugs, getMarketingProof, mediaUrl } from "@/lib/api/cms";
import JsonLd from "@clearcut/ui/json-ld";
import CompareHero from "@/components/pages/compare/CompareHero";
import TrustedByBar from "@/components/pages/compare/TrustedByBar";
import ComparisonPoints from "@/components/pages/compare/ComparisonPoints";
import FeatureTable from "@/components/pages/compare/FeatureTable";
import CtaBanner from "@/components/pages/compare/CtaBanner";
import PromiseSection from "@/components/pages/compare/PromiseSection";
import IntegrationsSection from "@/components/pages/compare/IntegrationsSection";
import StatsRow from "@/components/pages/compare/StatsRow";

// Comparison pages are CMS-driven (clearcut-cms) rather than static snapshots,
// so use ISR instead of force-static — see src/lib/api/cms.ts for the revalidate window.
export const revalidate = 3600;
export const dynamicParams = true;

export async function generateStaticParams() {
  const slugs = await getComparisonSlugs();
  return slugs.map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ locale: string; slug: string }> }) {
  const { locale, slug } = await params;
  const comparison = await getComparisonBySlug(slug, locale);
  if (!comparison) return {};

  const title = comparison.meta?.metaTitle || comparison.hero.title;
  const description = comparison.meta?.metaDescription || comparison.hero.description || "";
  const ogImage = mediaUrl(comparison.meta?.ogImage?.url);

  return generateSeoMetadata({
    title,
    description,
    keywords: [comparison.competitorName, "Clear Cutoff", `Clear Cutoff vs ${comparison.competitorName}`],
    url: `/compare/${slug}`,
    image: ogImage,
  });
}

export default async function ComparePage({ params }: { params: Promise<{ locale: string; slug: string }> }) {
  const { locale, slug } = await params;

  const [comparison, marketingProof] = await Promise.all([
    getComparisonBySlug(slug, locale),
    getMarketingProof(locale),
  ]);

  if (!comparison) notFound();

  // No "/compare" listing page exists (it 404s), so this stays Home -> page.
  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: SITE_URL },
      { "@type": "ListItem", position: 2, name: comparison.hero.title, item: `${SITE_URL}/compare/${slug}` },
    ],
  };

  return (
    <>
      <JsonLd data={breadcrumbSchema} />
      <Header items={[]} linkShow={false} />

      <CompareHero comparison={comparison} />
      <TrustedByBar trustedBy={marketingProof?.trustedBy} />
      <ComparisonPoints
        sectionTitle={comparison.comparisonSectionTitle}
        points={comparison.comparisonPoints}
        competitorName={comparison.competitorName}
        competitorLogo={mediaUrl(comparison.competitorLogo?.url)}
      />
      <FeatureTable rows={comparison.featureTable} competitorName={comparison.competitorName} />
      <CtaBanner cta={comparison.midCta} />
      <PromiseSection promise={comparison.promise} />
      <IntegrationsSection integrations={marketingProof?.integrations} />
      <StatsRow stats={marketingProof?.stats} />
      <CtaBanner cta={marketingProof?.finalCta} />

      <FloatingButton />
      <FooterWrap />
    </>
  );
}

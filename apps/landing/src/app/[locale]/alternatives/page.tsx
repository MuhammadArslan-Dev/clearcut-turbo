import Header from "@/components/layout/headers/Header";
import FooterWrap from "@/components/layout/FooterWrap";
import FloatingButton from "@/components/global/FloatingButton";
import Section from "@/components/global/Section";
import Text from "@clearcut/ui/text";
import { Link } from "@clearcut/i18n/navigation";
import Button from "@clearcut/ui/button";
import { generateSeoMetadata } from "@/lib/seo/metadata";
import { getAlternativesList, getMarketingProof } from "@/lib/api/cms";
import StatsRow from "@/components/pages/compare/StatsRow";
import CtaBanner from "@/components/pages/compare/CtaBanner";

export const revalidate = 3600;

export function generateMetadata() {
  return generateSeoMetadata({
    title: "Clear Cutoff Alternatives & Competitors",
    description: "Explore how Clear Cutoff compares to other teaching-exam prep platforms.",
    keywords: ["Clear Cutoff alternatives", "teaching exam prep"],
    url: "/alternatives",
  });
}

export default async function AlternativesIndexPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;

  const [items, marketingProof] = await Promise.all([
    getAlternativesList(undefined, locale),
    getMarketingProof(locale),
  ]);

  return (
    <>
      <Header items={[]} linkShow={false} />

      <Section sectionId="alternatives-hero" padding="py-ym-section md:py-yd-section px-3">
        <div className="max-w-2xl mx-auto text-center">
          <Text as="h1" variant="display-medium" weight="bold" color="gray-normal" className="mb-4">
            Clear Cutoff alternatives and competitors
          </Text>
          <Text as="p" variant="body-large" color="gray-muted" className="mb-6">
            Explore how Clear Cutoff compares to other teaching-exam prep platforms.
          </Text>
          <Link href="/">
            <Button size="lg">Try for Free</Button>
          </Link>
        </div>
      </Section>

      <Section sectionId="alternatives-list" padding="pb-ym-section md:pb-yd-section px-3">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-3xl mx-auto">
          {items.map((item) => (
            <Link
              key={item.slug}
              href={`/alternatives/${item.slug}`}
              className="bg-white rounded-2xl p-6 border border-border-gray-subtle hover:border-brand transition-colors"
            >
              <Text as="p" variant="heading-small" weight="semibold" color="gray-normal" className="mb-2">
                {item.hero.title}
              </Text>
              {item.hero.description && (
                <Text as="p" variant="body-small" color="gray-muted">
                  {item.hero.description}
                </Text>
              )}
            </Link>
          ))}
        </div>
      </Section>

      <StatsRow stats={marketingProof?.stats} />
      <CtaBanner cta={marketingProof?.finalCta} />

      <FloatingButton />
      <FooterWrap />
    </>
  );
}

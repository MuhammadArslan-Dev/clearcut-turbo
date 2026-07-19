import Section from "@/components/global/Section";
import Text from "@clearcut/ui/text";
import { Link } from "@clearcut/i18n/navigation";
import type { AlternativeSummary } from "@/types/cms";

export default function RelatedAlternatives({ items }: { items?: AlternativeSummary[] }) {
  if (!items?.length) return null;

  return (
    <Section sectionId="related-alternatives" bgColor="bg-background-gray-subtle" padding="py-ym-section md:py-yd-section px-3">
      <Text as="h2" variant="heading-xlarge" weight="bold" color="gray-normal" className="mb-6 text-center">
        Related Alternatives
      </Text>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-3xl mx-auto">
        {items.map((item) => (
          <Link
            key={item.slug}
            href={`/alternatives/${item.slug}`}
            className="bg-white rounded-2xl p-5 border border-border-gray-subtle hover:border-brand transition-colors"
          >
            <Text as="p" variant="body-medium" weight="semibold" color="gray-normal">
              {item.hero.title}
            </Text>
          </Link>
        ))}
      </div>
    </Section>
  );
}

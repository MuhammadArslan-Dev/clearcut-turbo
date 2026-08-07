import Section from "@/components/global/Section";
import Text from "@clearcut/ui/text";
import type { MarketingProof } from "@/types/cms";

export default function StatsRow({ stats }: { stats?: MarketingProof["stats"] }) {
  if (!stats?.length) return null;

  return (
    <Section sectionId="stats" bgColor="bg-background-gray-subtle" padding="py-ym-section md:py-yd-section px-3">
      <div className="flex flex-wrap items-center justify-center gap-x-16 gap-y-8">
        {stats.map((stat) => (
          <div key={stat.label} className="text-center">
            <Text as="p" variant="heading-xlarge" weight="bold" className="text-brand">
              {stat.value}
            </Text>
            <Text as="p" variant="body-medium" color="gray-muted">
              {stat.label}
            </Text>
          </div>
        ))}
      </div>
    </Section>
  );
}

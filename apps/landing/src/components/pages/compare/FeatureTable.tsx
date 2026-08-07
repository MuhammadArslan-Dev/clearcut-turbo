import Section from "@/components/global/Section";
import Text from "@clearcut/ui/text";
import ComparisonTable from "@/components/shared/ComparisonTable";
import type { FeatureRow } from "@/types/cms";

export default function FeatureTable({
  rows,
  competitorName,
}: {
  rows?: FeatureRow[];
  competitorName: string;
}) {
  if (!rows?.length) return null;

  return (
    <Section sectionId="feature-table" padding="py-ym-section md:py-yd-section px-3">
      <Text as="h2" variant="display-small" weight="bold" color="gray-normal" className="text-center mb-10">
        Feature comparison
      </Text>

      <ComparisonTable
        competitorName={competitorName}
        rows={rows.map((row) => ({
          label: row.feature,
          coaching: row.theirText ?? "",
          app: row.yourText ?? "",
          coachingStatus: row.theirStatus,
          appStatus: row.yourStatus,
        }))}
      />
    </Section>
  );
}

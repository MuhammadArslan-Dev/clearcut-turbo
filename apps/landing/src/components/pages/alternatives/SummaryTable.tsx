import Text from "@clearcut/ui/text";
import type { AlternativeTool } from "@/types/cms";

export default function SummaryTable({ title, tools }: { title?: string; tools?: AlternativeTool[] }) {
  if (!title || !tools?.length) return null;

  return (
    <div className="mb-10">
      <Text as="h2" variant="heading-large" weight="bold" color="gray-normal" className="mb-4">
        {title}
      </Text>
      <div className="w-full overflow-x-auto">
        <div className="min-w-[600px] rounded-2xl border border-border-gray-subtle overflow-hidden">
          <div className="grid grid-cols-4 bg-background-gray-subtle px-6 py-3">
            <Text as="span" variant="body-small" weight="semibold" color="gray-normal">Platform</Text>
            <Text as="span" variant="body-small" weight="semibold" color="gray-normal">Best for</Text>
            <Text as="span" variant="body-small" weight="semibold" color="gray-normal">Standout feature</Text>
            <Text as="span" variant="body-small" weight="semibold" color="gray-normal">Pricing</Text>
          </div>
          {tools.map((tool, i) => (
            <div
              key={tool.name}
              className={`grid grid-cols-4 px-6 py-3 gap-2 ${i !== 0 ? "border-t border-border-gray-subtle" : ""}`}
            >
              <Text as="span" variant="body-small" weight="semibold" className="text-brand">{tool.name}</Text>
              <Text as="span" variant="body-small" color="gray-subtle">{tool.bestFor || "—"}</Text>
              <Text as="span" variant="body-small" color="gray-subtle">{tool.standoutFeature || "—"}</Text>
              <Text as="span" variant="body-small" color="gray-subtle">{tool.pricingSummary || "—"}</Text>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

import Image from "next/image";
import Section from "@/components/global/Section";
import Text from "@clearcut/ui/text";
import { Link } from "@clearcut/i18n/navigation";
import { mediaUrl } from "@/lib/api/cms";
import type { MarketingProof } from "@/types/cms";

export default function IntegrationsSection({
  integrations,
}: {
  integrations?: MarketingProof["integrations"];
}) {
  if (!integrations?.logos?.length) return null;

  return (
    <Section sectionId="integrations" padding="py-ym-section md:py-yd-section px-3">
      <div className="text-center max-w-2xl mx-auto mb-10">
        {integrations.title && (
          <Text as="h2" variant="display-small" weight="bold" color="gray-normal" className="mb-3">
            {integrations.title}
          </Text>
        )}
        {integrations.description && (
          <Text as="p" variant="body-large" color="gray-subtle">
            {integrations.description}
          </Text>
        )}
      </div>

      <div className="flex flex-wrap items-center justify-center gap-8 mb-6">
        {integrations.logos.map((entry) => {
          const src = mediaUrl(entry.logo?.url);
          if (!src) return null;
          return (
            <Image key={entry.name} src={src} alt={entry.name} width={100} height={40} className="object-contain h-10 w-auto" />
          );
        })}
      </div>

      {integrations.linkLabel && (
        <div className="text-center">
          <Link href={integrations.linkUrl || "#"} className="text-brand font-semibold">
            {integrations.linkLabel} →
          </Link>
        </div>
      )}
    </Section>
  );
}

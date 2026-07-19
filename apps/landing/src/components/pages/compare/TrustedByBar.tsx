import Image from "next/image";
import Text from "@clearcut/ui/text";
import { mediaUrl } from "@/lib/api/cms";
import type { MarketingProof } from "@/types/cms";

export default function TrustedByBar({ trustedBy }: { trustedBy?: MarketingProof["trustedBy"] }) {
  if (!trustedBy?.logos?.length) return null;

  return (
    <div className="py-8 border-y border-border-gray-subtle">
      <div className="max-w-[1100px] mx-auto px-3 flex flex-col items-center gap-6">
        {trustedBy.label && (
          <Text as="p" variant="body-small" weight="semibold" color="gray-muted" className="uppercase tracking-wide">
            {trustedBy.label}
          </Text>
        )}
        <div className="flex flex-wrap items-center justify-center gap-x-10 gap-y-4">
          {trustedBy.logos.map((entry) => {
            const src = mediaUrl(entry.logo?.url);
            if (!src) return null;
            return (
              <Image key={entry.name} src={src} alt={entry.name} width={120} height={32} unoptimized className="object-contain h-8 w-auto opacity-80" />
            );
          })}
        </div>
      </div>
    </div>
  );
}

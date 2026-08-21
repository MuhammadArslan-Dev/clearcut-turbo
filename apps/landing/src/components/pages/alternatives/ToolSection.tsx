import Image from "next/image";
import { Check, X } from "lucide-react";
import Text from "@clearcut/ui/text";
import { mediaUrl } from "@/lib/api/cms";
import { slugify } from "@/lib/utils/slugify";
import type { AlternativeTool } from "@/types/cms";

export default function ToolSection({ tool, index }: { tool: AlternativeTool; index: number }) {
  const logoSrc = mediaUrl(tool.logo?.url);
  const hasProsCons = Boolean(tool.pros?.length || tool.cons?.length);

  return (
    <div id={slugify(tool.name)} className="scroll-mt-24 py-8 border-b border-border-gray-subtle last:border-b-0">
      <div className="flex items-center gap-3 mb-2">
        {logoSrc && (
          <Image src={logoSrc} alt={tool.name} width={32} height={32} className="rounded-md object-contain" />
        )}
        <Text as="h2" variant="heading-large" weight="bold" color="gray-normal">
          {index + 1}. {tool.name}
        </Text>
      </div>

      {tool.bestFor && (
        <Text as="p" variant="body-medium" weight="semibold" className="text-brand mb-3">
          Best for: {tool.bestFor}
        </Text>
      )}

      <Text as="p" variant="body-medium" color="gray-subtle" className="mb-4 leading-relaxed">
        {tool.description}
      </Text>

      {!!tool.features?.length && (
        <div className="mb-4">
          <Text as="p" variant="body-medium" weight="semibold" color="gray-normal" className="mb-2">
            Key features
          </Text>
          <ul className="list-disc pl-6 space-y-1">
            {tool.features.map((f) => (
              <li key={f.text}>
                <Text as="span" variant="body-medium" color="gray-subtle">
                  {f.text}
                </Text>
              </li>
            ))}
          </ul>
        </div>
      )}

      {hasProsCons ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          {!!tool.pros?.length && (
            <div>
              <Text as="p" variant="body-medium" weight="semibold" color="gray-normal" className="mb-2">Pros</Text>
              <ul className="space-y-1">
                {tool.pros.map((p) => (
                  <li key={p.text} className="flex items-start gap-2">
                    <Check size={16} className="text-success shrink-0 mt-0.5" />
                    <Text as="span" variant="body-small" color="gray-subtle">{p.text}</Text>
                  </li>
                ))}
              </ul>
            </div>
          )}
          {!!tool.cons?.length && (
            <div>
              <Text as="p" variant="body-medium" weight="semibold" color="gray-normal" className="mb-2">Cons</Text>
              <ul className="space-y-1">
                {tool.cons.map((c) => (
                  <li key={c.text} className="flex items-start gap-2">
                    <X size={16} className="text-red-500 shrink-0 mt-0.5" />
                    <Text as="span" variant="body-small" color="gray-subtle">{c.text}</Text>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      ) : (
        !!tool.limitations?.length && (
          <div className="mb-4">
            <Text as="p" variant="body-medium" weight="semibold" color="gray-normal" className="mb-2">
              Limitations
            </Text>
            <ul className="list-disc pl-6 space-y-1">
              {tool.limitations.map((l) => (
                <li key={l.text}>
                  <Text as="span" variant="body-medium" color="gray-subtle">
                    {l.text}
                  </Text>
                </li>
              ))}
            </ul>
          </div>
        )
      )}

      {!!tool.pricingTiers?.length ? (
        <div className="mb-4">
          <Text as="p" variant="body-medium" weight="semibold" color="gray-normal" className="mb-2">
            Pricing
          </Text>
          <ul className="space-y-1">
            {tool.pricingTiers.map((tier) => (
              <li key={tier.planName} className="flex gap-2">
                <Text as="span" variant="body-small" weight="semibold" color="gray-normal">{tier.planName}:</Text>
                <Text as="span" variant="body-small" color="gray-subtle">{tier.price}</Text>
              </li>
            ))}
          </ul>
        </div>
      ) : (
        tool.pricingSummary && (
          <Text as="p" variant="body-medium" color="gray-subtle" className="mb-4">
            <Text as="span" weight="semibold" color="gray-normal">Pricing: </Text>
            {tool.pricingSummary}
          </Text>
        )
      )}

      {(tool.rating?.g2Score || tool.rating?.capterraScore) && (
        <div className="flex gap-6 mb-4">
          {tool.rating?.g2Score && (
            <Text as="p" variant="body-small" color="gray-muted">
              G2: {tool.rating.g2Score} {tool.rating.g2ReviewCount && `(${tool.rating.g2ReviewCount})`}
            </Text>
          )}
          {tool.rating?.capterraScore && (
            <Text as="p" variant="body-small" color="gray-muted">
              Capterra: {tool.rating.capterraScore} {tool.rating.capterraReviewCount && `(${tool.rating.capterraReviewCount})`}
            </Text>
          )}
        </div>
      )}

      {tool.testimonial?.quote && (
        <blockquote className="border-l-2 border-brand pl-4 italic">
          <Text as="p" variant="body-medium" color="gray-subtle" className="mb-1">
            “{tool.testimonial.quote}”
          </Text>
          {tool.testimonial.authorName && (
            <Text as="p" variant="body-small" weight="semibold" color="gray-muted">
              — {tool.testimonial.authorName}
              {tool.testimonial.authorRole && `, ${tool.testimonial.authorRole}`}
              {tool.testimonial.authorCompany && `, ${tool.testimonial.authorCompany}`}
            </Text>
          )}
        </blockquote>
      )}
    </div>
  );
}

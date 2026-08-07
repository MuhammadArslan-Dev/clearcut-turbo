import Section from "@/components/global/Section";
import Text from "@clearcut/ui/text";
import Button from "@clearcut/ui/button";
import { Link } from "@clearcut/i18n/navigation";
import type { CmsCtaBlock } from "@/types/cms";

export default function CtaBanner({ cta }: { cta?: CmsCtaBlock }) {
  if (!cta?.title && !cta?.ctaLabel) return null;

  return (
    <Section sectionId="cta-banner" padding="py-ym-section md:py-yd-section px-3">
      <div className="bg-brand rounded-3xl px-8 py-12 flex flex-col items-center text-center gap-4">
        {cta.title && (
          <Text as="h2" variant="heading-xlarge" weight="bold" color="white">
            {cta.title}
          </Text>
        )}
        {cta.description && (
          <Text as="p" variant="body-large" color="white" className="max-w-2xl opacity-90">
            {cta.description}
          </Text>
        )}
        {cta.ctaLabel && (
          <Link href={cta.ctaUrl || "#"} className="mt-2">
            <Button variant="solid" color="neutral" size="lg" className="!bg-white !text-brand">
              {cta.ctaLabel}
            </Button>
          </Link>
        )}
      </div>
    </Section>
  );
}

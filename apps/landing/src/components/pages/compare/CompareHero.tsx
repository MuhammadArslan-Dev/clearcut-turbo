import Image from "next/image";
import Section from "@/components/global/Section";
import Text from "@clearcut/ui/text";
import Button from "@clearcut/ui/button";
import { Link } from "@clearcut/i18n/navigation";
import { IMAGES } from "@/constants/images";
import { mediaUrl } from "@/lib/api/cms";
import type { ComparisonDoc } from "@/types/cms";
import MainAppLogo from "@/components/icons/main-app-logo";

export default function CompareHero({ comparison }: { comparison: ComparisonDoc }) {
  const { hero, competitorName, competitorLogo } = comparison;
  const logoSrc = mediaUrl(competitorLogo?.url);

  return (
    <Section sectionId="compare-hero" padding="py-ym-section md:py-yd-section px-3">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
        <div>
          {hero.eyebrow && (
            <Text as="p" variant="body-medium" weight="semibold" className="text-brand mb-2 uppercase tracking-wide">
              {hero.eyebrow}
            </Text>
          )}
          <Text as="h1" variant="heading-xlarge" weight="bold" color="gray-normal" className="mb-4">
            {hero.title}
          </Text>
          {hero.description && (
            <Text as="p" variant="body-large" color="gray-muted" className="mb-6">
              {hero.description}
            </Text>
          )}
          {hero.ctaLabel && (
            <Link href={hero.ctaUrl || "#"}>
              <Button size="lg">{hero.ctaLabel}</Button>
            </Link>
          )}
        </div>

        <div className="relative rounded-3xl bg-gradient-to-br from-brand to-brand-dark p-10 min-h-[280px] flex items-center justify-center">
          <div className="flex items-center gap-6">
            <div className="bg-white rounded-2xl shadow-lg p-6 w-32 h-32 flex items-center justify-center">
              {logoSrc ? (
                <Image src={logoSrc} alt={competitorName} width={80} height={80} unoptimized className="object-contain" />
              ) : (
                <Text as="span" variant="heading-medium" weight="semibold">
                  {competitorName}
                </Text>
              )}
            </div>
            <div className="bg-brand-dark text-white rounded-full w-12 h-12 flex items-center justify-center shrink-0">
              <Text as="span" variant="body-medium" weight="bold" color="white">
                Vs
              </Text>
            </div>
            <div className="bg-white rounded-2xl shadow-lg p-6 w-32 h-32 flex items-center justify-center">
               <MainAppLogo variant="icon" width={42} />
              {/* <Image src={IMAGES.mainLogo} alt="Clear Cutoff" width={90} height={40} className="object-contain" /> */}
            </div>
          </div>
        </div>
      </div>
    </Section>
  );
}

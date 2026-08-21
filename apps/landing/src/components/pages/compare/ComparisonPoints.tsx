import Image from "next/image";
import { Briefcase, Sparkles } from "lucide-react";
import Section from "@/components/global/Section";
import Text from "@clearcut/ui/text";
import MainAppLogo from "@/components/icons/main-app-logo";
import type { ComparisonPoint } from "@/types/cms";

export default function ComparisonPoints({
  sectionTitle,
  points,
  competitorName,
  competitorLogo,
}: {
  sectionTitle?: string;
  points?: ComparisonPoint[];
  competitorName: string;
  competitorLogo?: string;
}) {
  if (!points?.length) return null;

  return (
    <Section
      sectionId="comparison-points"
      padding="py-ym-section md:py-yd-section px-3"
      className="bg-gradient-to-b from-primary-subtle to-white"
    >
      <div className="flex flex-col gap-14">
        {sectionTitle && (
          <Text as="h2" variant="heading-xlarge" weight="bold" color="gray-normal" className="text-center">
            {sectionTitle}
          </Text>
        )}

        <div className="flex flex-col gap-10">
          {points.map((point) => (
            <div key={point.title} className="flex flex-col gap-4">
              <Text as="h3" variant="heading-large" weight="bold" color="gray-normal" className="text-center">
                {point.title}
              </Text>

              <div className="relative grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-white rounded-2xl shadow-sm p-6 flex items-start gap-4">
                  <div className="shrink-0 w-9 h-9 rounded-lg bg-primary-subtle flex items-center justify-center">
                    <MainAppLogo variant="icon" width={16} />
                  </div>
                  <Text as="p" variant="body-large" color="gray-subtle">
                    {point.yourText}
                  </Text>
                </div>

                <div className="bg-white rounded-2xl shadow-sm p-6 flex items-start gap-4 md:flex-row-reverse">
                  <div className="shrink-0 w-9 h-9 rounded-lg bg-background-gray-subtle flex items-center justify-center overflow-hidden">
                    {competitorLogo ? (
                      <Image
                        src={competitorLogo}
                        alt={competitorName}
                        width={36}
                        height={36}
                        className="object-contain w-full h-full"
                      />
                    ) : (
                      <Briefcase size={20} className="text-text-gray-muted" />
                    )}
                  </div>
                  <Text as="p" variant="body-large" color="gray-muted">
                    {point.theirText}
                  </Text>
                </div>

                <div className="flex absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-gradient-to-br from-brand to-brand items-center justify-center shadow-md">
                  <Text as="span" variant="body-small" weight="bold" color="white">
                    vs
                  </Text>
                </div>
              </div>

              {point.impactText && (
                <div className="bg-primary-subtle border border-primary-soft rounded-xl p-4 flex items-start gap-3">
                  <Sparkles size={18} className="text-brand shrink-0 mt-0.5" />
                  <Text as="p" variant="body-large" color="gray-normal">
                    <Text as="span" weight="bold">
                      Impact:{" "}
                    </Text>
                    {point.impactText}
                  </Text>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </Section>
  );
}

import React from "react";
import Section from "../global/Section";
import ComparisonTable from "../shared/ComparisonTable";
import HeaderBlock from "../shared/text-render/HeaderBlock";
import clsx from "clsx";
import FireIcon from "../icons/fire-icon";
import { Exam } from "@/types/page";
import Text from "@clearcut/ui/text";
import { Locale, defaultLocale } from "@/lib/i18n/config";

const CONTENT: Record<Locale, { eyebrow: string; heading: React.ReactNode; description: string; note: string }> = {
  en: {
    eyebrow: "Clear Cutoff vs coaching centres",
    heading: (
      <>
        <span className="text-brand">All</span> subjects, <span className="text-brand">unlimited</span> practice!
      </>
    ),
    description: "Save money, study anytime and prepare fully without going to coaching!",
    note: "Comparison based on common coaching-centre practices",
  },
  hi: {
    eyebrow: "Clear Cutoff बनाम कोचिंग सेंटर",
    heading: (
      <>
        <span className="text-brand">सभी</span> विषय, <span className="text-brand">अनलिमिटेड</span> अभ्यास!
      </>
    ),
    description: "पैसे बचाएं, कभी भी पढ़ें और बिना कोचिंग जाए पूरी तैयारी करें!",
    note: "तुलना सामान्य कोचिंग सेंटर की प्रथाओं के आधार पर",
  },
  mr: {
    eyebrow: "Clear Cutoff वि. कोचिंग सेंटर",
    heading: (
      <>
        <span className="text-brand">सर्व</span> विषय, <span className="text-brand">अमर्यादित</span> सराव!
      </>
    ),
    description: "पैसे वाचवा, कधीही अभ्यास करा आणि कोचिंगला न जाता पूर्ण तयारी करा!",
    note: "सामान्य कोचिंग सेंटर पद्धतींवर आधारित तुलना",
  },
};

export default async function ComparisonSection({
  bgColor = "bg-[#f1f5fa]",
  active = true,
  data,
  locale = defaultLocale,
}: {
  data?: Exam;
  bgColor?: string;
  active?: boolean;
  locale?: Locale;
}) {
  if (!active) return null;

  const t = CONTENT[locale];

  return (
    <div className={clsx(bgColor)} style={{ background: bgColor }}>
      <Section padding="py-ym-section md:py-yd-section px-3" sectionId="comparison-section">
        <div className="flex flex-col gap-12">
          <HeaderBlock
            eyebrow={{ text: t.eyebrow }}
            heading={{ text: t.heading }}
            description={{ text: t.description }}
            eyebrowOptions={{ alignMobile: "center", alignDesktop: "center" }}
            headingOptions={{ alignMobile: "center", alignDesktop: "center", font: "display-medium !font-semibold" }}
            descriptionOptions={{ alignMobile: "center", alignDesktop: "center" }}
            containerClassName="mx-auto"
          />
          <div className="space-y-4">
            <ComparisonTable locale={locale} />
            <div className="flex items-center justify-center gap-1 mx-auto w-full">
              <FireIcon size={24} variant="outline" />
              <Text as="p" variant="heading-small" color="gray-muted">
                {t.note}
              </Text>
            </div>
          </div>
        </div>
      </Section>
    </div>
  );
}

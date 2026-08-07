import Section from "../global/Section";
import HeaderBlock from "../shared/text-render/HeaderBlock";
import React, { memo } from "react";
import AlarmClockIcon from "../icons/alarm-clock-icon";
import CloudIcon from "../icons/cloud-icon";
import DiscountIcon from "../icons/discount-icon";
import clsx from "clsx";
import { Exam } from "@/types/page";
import { Locale, defaultLocale } from "@/lib/i18n/config";

type IconKey = "cloud" | "flag" | "clock";
type FeatureItem = { id: number; icon: IconKey; heading: React.ReactNode; description: React.ReactNode };

const featureIcons: Record<IconKey, React.ReactNode> = {
  cloud: <CloudIcon />,
  flag: <DiscountIcon color="#192839" type="flag" />,
  clock: <AlarmClockIcon />,
};

type FeaturesContent = {
  eyebrow: string;
  heading: React.ReactNode;
  description: string;
  features: FeatureItem[];
};

const CONTENT: Record<Locale, FeaturesContent> = {
  en: {
    eyebrow: "Exam prep anytime, anywhere",
    heading: (
      <>
        <span className="text-brand">Everything you need</span> to pass the exam
      </>
    ),
    description:
      "Videos, notes and tests for every subject to prepare, practise and succeed — all in one place",
    features: [
      {
        id: 1,
        icon: "cloud",
        heading: "Practise with PYQs, notes and videos",
        description:
          "Solve PYQs as per the new syllabus, make notes on important topics, and watch videos for tough subjects.",
      },
      {
        id: 2,
        icon: "flag",
        heading: "Your favourite YouTube teachers",
        description:
          "Learn easily in Hindi or English from your favourite, trusted teachers.",
      },
      {
        id: 3,
        icon: "clock",
        heading: "Try it for free",
        description:
          "Use all features free during the trial. Watch videos, take tests, then decide whether to continue.",
      },
    ],
  },
  hi: {
    eyebrow: "कभी भी, कहीं भी परीक्षा की तैयारी",
    heading: (
      <>
        परीक्षा पास करने के लिए <span className="text-brand">ज़रूरी सब कुछ</span>
      </>
    ),
    description:
      "तैयारी, अभ्यास और सफलता के लिए सभी विषयों के वीडियो, नोट्स और टेस्ट — सब कुछ एक ही जगह",
    features: [
      {
        id: 1,
        icon: "cloud",
        heading: "PYQ, नोट्स और वीडियो से अभ्यास करें",
        description: "नए सिलेबस के अनुसार PYQ हल करें, महत्वपूर्ण टॉपिक के नोट्स बनाएं और कठिन विषयों के वीडियो देखें।",
      },
      {
        id: 2,
        icon: "flag",
        heading: "YouTube के पसंदीदा शिक्षक",
        description: "अपने पसंदीदा और भरोसेमंद शिक्षकों से हिंदी या अंग्रेजी में आसानी से सीखें।",
      },
      {
        id: 3,
        icon: "clock",
        heading: "फ्री में आज़माएं",
        description: "ट्रायल अवधि में सभी फीचर्स मुफ्त उपयोग करें। वीडियो देखें, टेस्ट हल करें और फिर निर्णय लें कि आगे जारी रखना है या नहीं।",
      },
    ],
  },
};

export default React.memo(function FeaturesSection({
  bgColor,
  active = true,
  eyebrow = true,
  dec = true,
  gap = "gap-8",
  data,
  locale = defaultLocale,
}: {
  data?: Exam;
  bgColor?: string;
  active?: boolean;
  eyebrow?: boolean;
  dec?: boolean;
  gap?: string;
  locale?: Locale;
}) {
  if (!active) return null;

  const t = CONTENT[locale];

  return (
    <div className={clsx(bgColor)} style={{ background: bgColor }}>
      <Section maxWidth="max-w-[1120px]" sectionId="features-section" padding="py-ym-section md:py-yd-section px-3 scroll-mt-16 md:scroll-mt-12">
        <div className={clsx("grid grid-cols-1 md:grid-cols-2", gap)}>
          <div className="col-span-1 order-1 flex items-center">
            <HeaderBlock
              eyebrow={{ text: eyebrow && t.eyebrow }}
              heading={{ text: t.heading }}
              description={{ text: dec && t.description }}
              eyebrowOptions={{ alignMobile: "center", alignDesktop: "left" }}
              headingOptions={{ alignMobile: "center", alignDesktop: "left", font: "display-medium !font-semibold" }}
              descriptionOptions={{ alignMobile: "center", alignDesktop: "left" }}
              headingClassName="mb-3"
              containerClassName="mx-auto"
            />
          </div>
          <div className="col-span-1 order-2">
            <div className="flex flex-col gap-3">
              {t.features.map((item) => (
                <Feature key={item.id} icon={featureIcons[item.icon]} heading={item.heading} description={item.description} />
              ))}
            </div>
          </div>
        </div>
      </Section>
    </div>
  );
});

const Feature = memo(function Feature({
  icon,
  heading,
  description,
}: {
  icon: React.ReactNode;
  heading: React.ReactNode;
  description: React.ReactNode;
}) {
  return (
    <div className="flex items-center gap-4 p-2">
      <div className="w-14 h-14 rounded-md flex justify-center items-center border-2 border-gray-200 bg-white shrink-0">
        {icon}
      </div>
      <HeaderBlock
        heading={{ text: heading }}
        description={{ text: description }}
        headingOptions={{ alignMobile: "left", alignDesktop: "left", font: "heading-small !font-semibold" }}
        descriptionOptions={{ alignMobile: "left", alignDesktop: "left", font: "body-medium", color: "text-text-gray-subtle" }}
        headingClassName="mb-1"
        containerClassName="max-w-3xl mx-auto"
      />
    </div>
  );
});

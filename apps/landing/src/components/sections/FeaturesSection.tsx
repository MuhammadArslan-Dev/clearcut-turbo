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
        heading: "Try it free for 3 days",
        description:
          "The first chapter of every subject, the first test of every chapter and today's daily test — all free. Like it? Unlock the full course.",
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
        heading: "3 दिन फ्री में आज़माएं",
        description: "हर विषय का पहला चैप्टर, हर चैप्टर का पहला टेस्ट और आज का डेली टेस्ट — सब फ्री। पसंद आए तो पूरा कोर्स अनलॉक करें।",
      },
    ],
  },
  mr: {
    eyebrow: "कधीही, कुठेही परीक्षेची तयारी",
    heading: (
      <>
        परीक्षा उत्तीर्ण होण्यासाठी <span className="text-brand">आवश्यक सर्व काही</span>
      </>
    ),
    description:
      "तयारी, सराव आणि यशासाठी प्रत्येक विषयाचे व्हिडिओ, नोट्स आणि टेस्ट — सर्व काही एकाच ठिकाणी",
    features: [
      {
        id: 1,
        icon: "cloud",
        heading: "PYQ, नोट्स आणि व्हिडिओंसह सराव करा",
        description: "नवीन अभ्यासक्रमानुसार PYQ सोडवा, महत्त्वाच्या विषयांच्या नोट्स तयार करा आणि कठीण विषयांचे व्हिडिओ पाहा.",
      },
      {
        id: 2,
        icon: "flag",
        heading: "तुमचे आवडते YouTube शिक्षक",
        description: "तुमच्या आवडत्या आणि विश्वासू शिक्षकांकडून हिंदी किंवा इंग्रजीत सहज शिका.",
      },
      {
        id: 3,
        icon: "clock",
        heading: "3 दिवस मोफत वापरून पाहा",
        description: "प्रत्येक विषयाचा पहिला चॅप्टर, प्रत्येक चॅप्टरची पहिली टेस्ट आणि आजची डेली टेस्ट — सगळं मोफत. आवडलं तर पूर्ण कोर्स अनलॉक करा.",
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

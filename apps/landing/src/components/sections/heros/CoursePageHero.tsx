"use client";
import Section from "../../global/Section";
import HeaderBlock from "../../shared/text-render/HeaderBlock";
import OverViewFeatureCard from "../../ui/cards/OverViewFeatureCard";
import HeroActions from "./HeroActions";
import { Exam } from "@/types/page";
import { CheckIconGreen } from "@/components/shared/ComparisonTable";
import { Locale } from "@/lib/i18n/config";
import { useLocale } from "next-intl";

const COPY: Record<Locale, {
  heading: (examName: string) => React.ReactNode;
  description: string;
  features: (examName: string) => string[];
}> = {
  en: {
    heading: (examName) => (
      <>
        Crack the <span className="text-brand">{examName}</span> exam with PYQ-based tests, notes and videos
      </>
    ),
    description: "Real exam-level questions, sectional tests and full-length papers — all in one place.",
    features: (examName) => [
      `Smart prep for the ${examName} exam`,
      "Full course + test series",
      "Refund assurance policy",
    ],
  },
  hi: {
    heading: (examName) => (
      <>
        PYQ आधारित टेस्ट, नोट्स और वीडियो के साथ <span className="text-brand">{examName}</span> परीक्षा पास करें
      </>
    ),
    description: "असली परीक्षा स्तर के प्रश्न, सेक्शनल टेस्ट और फुल लेंथ पेपर — सब कुछ एक ही जगह पर।",
    features: (examName) => [
      `${examName} परीक्षा की स्मार्ट तैयारी`,
      "पूरा कोर्स + टेस्ट सीरीज़",
      "रिफंड एश्योरेंस पॉलिसी",
    ],
  },
  mr: {
    heading: (examName) => (
      <>
        PYQ आधारित टेस्ट, नोट्स आणि व्हिडिओंसह <span className="text-brand">{examName}</span> परीक्षा उत्तीर्ण करा
      </>
    ),
    description: "खऱ्या परीक्षेच्या स्तराचे प्रश्न, सेक्शनल टेस्ट आणि फुल लेंथ पेपर — सर्व काही एकाच ठिकाणी.",
    features: (examName) => [
      `${examName} परीक्षेची स्मार्ट तयारी`,
      "पूर्ण कोर्स + टेस्ट सिरीज",
      "रिफंड अ‍ॅश्युरन्स पॉलिसी",
    ],
  },
};

export default function CoursePageHero({ data }: { data?: Exam }) {
  const examName = data?.short_name ?? "HTET";
  const t = COPY[useLocale()];

  const featureItem = t.features(examName).map((heading, i) => ({
    id: i + 1,
    icon: <CheckIconGreen size={20} />,
    heading,
  }));

  return (
    <Section padding="py-[36px] md:py-[80px] px-3" sectionId="course-page-hero">
      <div className="grid md:grid-cols-11 gap-10 md:gap-12">
        <div className="md:col-span-6">
          <div className="flex flex-col justify-center h-full gap-10">
            <HeaderBlock
              heading={{ text: t.heading(examName) }}
              description={{ text: t.description }}
              eyebrowOptions={{ alignMobile: "center", alignDesktop: "left" }}
              headingOptions={{ alignMobile: "center", alignDesktop: "left", font: "heading-xlarge !font-semibold" }}
              descriptionOptions={{ alignMobile: "center", alignDesktop: "left" }}
              containerClassName="max-w-3xl mx-auto"
            />
            <div className="md:block hidden">
              <HeroActions />
            </div>
          </div>
        </div>
        <div className="md:col-span-5 w-full flex flex-col justify-center items-left space-y-2 px-2">
          {featureItem.map((item) => (
            <OverViewFeatureCard key={item.id} icon={item.icon} heading={{ text: item.heading }} />
          ))}
        </div>
      </div>
    </Section>
  );
}

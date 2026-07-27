import Section from "../../global/Section";
import HeaderBlock from "../../shared/text-render/HeaderBlock";
import HeroActions from "./HeroActions";
import Image from "next/image";
import { Exam } from "@/types/page";
import { IMAGES } from "@/constants/images";
import { Locale, defaultLocale } from "@/lib/i18n/config";

const CONTENT: Record<Locale, { heading: React.ReactNode; description: string }> = {
  en: {
    heading: (
      <>
        Crack the <span className="text-brand">HTET</span> exam with PYQ-based tests, notes and videos
      </>
    ),
    description:
      "Real exam-level questions, sectional tests and full-length papers — all in one place.",
  },
  hi: {
    heading: (
      <>
        PYQ आधारित टेस्ट, नोट्स और वीडियो के साथ <span className="text-brand">HTET</span> परीक्षा पास करें
      </>
    ),
    description:
      "असली परीक्षा स्तर के प्रश्न, सेक्शनल टेस्ट और फुल लेंथ पेपर — सब कुछ एक ही जगह पर।",
  },
};

export default function HomeHero({
  data,
  locale = defaultLocale,
}: {
  data?: Exam;
  locale?: Locale;
}) {
  const t = CONTENT[locale];
  return (
    <Section padding="py-ym-section md:py-[64px] px-3" sectionId="home-hero">
      <div className="grid md:grid-cols-11 gap-12">
        <div className="md:col-span-6 md:order-1 order-2">
          <div className="flex flex-col justify-center h-full gap-10">
            <HeaderBlock
              heading={{ text: t.heading }}
              description={{ text: t.description }}
              eyebrowOptions={{ alignMobile: "center", alignDesktop: "left" }}
              headingOptions={{ alignMobile: "center", alignDesktop: "left", font: "heading-xlarge !font-semibold" }}
              descriptionOptions={{ alignMobile: "center", alignDesktop: "left" }}
              containerClassName="max-w-3xl mx-auto"
            />
            <HeroActions />
          </div>
        </div>
        <div className="md:col-span-5 w-full flex justify-center items-center md:order-2 order-1">
          <Image
            src={IMAGES.heroImage}
            alt="User Image with pen and paper"
            width={320}
            height={320}
           priority
            sizes="(max-width: 768px) 80vw, 320px"
          />
        </div>
      </div>
    </Section>
  );
}

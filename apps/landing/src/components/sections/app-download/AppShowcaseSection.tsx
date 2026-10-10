import Image from "next/image";
import Section from "@/components/global/Section";
import HeaderBlock from "@/components/shared/text-render/HeaderBlock";
import { Locale, defaultLocale } from "@/lib/i18n/config";
import { IMAGES } from "@/constants/images";
import AppShowcaseScroller from "./AppShowcaseScroller";

const SHOWCASE_IMAGES = [
  IMAGES.appDownload.showcase1,
  IMAGES.appDownload.showcase2,
  IMAGES.appDownload.showcase3,
  IMAGES.appDownload.showcase4,
  IMAGES.appDownload.showcase5,
];

const CONTENT: Record<
  Locale,
  { eyebrow: string; heading: React.ReactNode; description: string; alt: string[] }
> = {
  en: {
    eyebrow: "A look inside the app",
    heading: (
      <>
        Your Preparation, <span className="text-brand">In One Place</span>
      </>
    ),
    description: "Explore sample screens for practice, learning and revision.",
    alt: [
      "Previous Year Papers screen — practice, analyse, improve",
      "Complete Study Material screen — learn at your own pace",
      "Notes of all Subjects screen — study, understand and prepare",
      "Question Trends screen — focus on important topics",
      "Practice Tests screen — build confidence anytime, anywhere",
    ],
  },
  hi: {
    eyebrow: "ऐप के अंदर एक नज़र",
    heading: (
      <>
        आपकी तैयारी, <span className="text-brand">एक ही जगह</span>
      </>
    ),
    description: "अभ्यास, सीखने और रिवीज़न के सैंपल स्क्रीन देखें।",
    alt: [
      "पिछले वर्षों के प्रश्नपत्र स्क्रीन",
      "संपूर्ण स्टडी मटीरियल स्क्रीन",
      "सभी विषयों के नोट्स स्क्रीन",
      "क्वेश्चन ट्रेंड्स स्क्रीन",
      "प्रैक्टिस टेस्ट स्क्रीन",
    ],
  },
  mr: {
    eyebrow: "अ‍ॅपच्या आत एक नजर",
    heading: (
      <>
        तुमची तयारी, <span className="text-brand">एकाच ठिकाणी</span>
      </>
    ),
    description: "सराव, शिक्षण आणि उजळणीसाठी नमुना स्क्रीन पाहा.",
    alt: [
      "मागील वर्षांचे प्रश्नपत्र स्क्रीन",
      "संपूर्ण अभ्यास साहित्य स्क्रीन",
      "सर्व विषयांच्या नोट्स स्क्रीन",
      "क्वेश्चन ट्रेंड्स स्क्रीन",
      "सराव चाचणी स्क्रीन",
    ],
  },
};

export default function AppShowcaseSection({ locale = defaultLocale }: { locale?: Locale }) {
  const t = CONTENT[locale];

  return (
    <Section sectionId="app-showcase-section" maxWidth="max-w-[1200px]" padding="py-ym-section md:py-yd-section px-3 scroll-mt-16 md:scroll-mt-12">
      <HeaderBlock
        eyebrow={{ text: t.eyebrow }}
        heading={{ text: t.heading }}
        description={{ text: t.description }}
        eyebrowOptions={{ alignMobile: "center", alignDesktop: "center" }}
        headingOptions={{ alignMobile: "center", alignDesktop: "center", font: "display-medium !font-semibold" }}
        descriptionOptions={{ alignMobile: "center", alignDesktop: "center" }}
        headingClassName="mb-3"
        containerClassName="mb-10 md:mb-16 mx-auto"
      />

      <AppShowcaseScroller>
        {SHOWCASE_IMAGES.map((src, index) => (
          <div
            key={src}
            data-showcase-card
            className="relative shrink-0 w-[200px] sm:w-[220px] aspect-[9/16] rounded-2xl overflow-hidden shadow-lg snap-start bg-[var(--color-background-gray-subtle)]"
          >
            <Image src={src} alt={t.alt[index]} fill sizes="220px" className="object-cover" priority={index === 0} />
          </div>
        ))}
      </AppShowcaseScroller>
    </Section>
  );
}

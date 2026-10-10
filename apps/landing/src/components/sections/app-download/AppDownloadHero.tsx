import { Download } from "lucide-react";
import Section from "@/components/global/Section";
import HeaderBlock from "@/components/shared/text-render/HeaderBlock";
import { Chip } from "@clearcut/ui/chip";
import { Button } from "@clearcut/ui/button";
import { Locale, defaultLocale } from "@/lib/i18n/config";
import { IMAGES } from "@/constants/images";
import PhoneMockup from "./PhoneMockup";
import DownloadLinkButton from "./DownloadLinkButton";
import { PLAY_STORE_URL } from "@/lib/data/appLinks";

export type AppPlatform = "android" | "ios";

const CONTENT: Record<Locale, { heading: React.ReactNode; description: string }> = {
  en: {
    heading: (
      <>
        Prepare Smart. <span className="text-brand">Clear Your Cutoff.</span>
      </>
    ),
    description:
      "Practice real previous-year questions, learn from multiple teachers, and prepare for CTET, REET, HTET and more — all in one app.",
  },
  hi: {
    heading: (
      <>
        स्मार्ट तैयारी करें। <span className="text-brand">अपना कटऑफ पार करें।</span>
      </>
    ),
    description:
      "असली पिछले वर्षों के प्रश्नों का अभ्यास करें, कई शिक्षकों से सीखें, और CTET, REET, HTET और अन्य परीक्षाओं की तैयारी करें — सब एक ही ऐप में।",
  },
  mr: {
    heading: (
      <>
        स्मार्ट तयारी करा। <span className="text-brand">तुमचा कटऑफ पार करा.</span>
      </>
    ),
    description:
      "खऱ्या मागील वर्षांच्या प्रश्नांचा सराव करा, अनेक शिक्षकांकडून शिका आणि CTET, REET, HTET व इतर परीक्षांची तयारी करा — सर्व एकाच अ‍ॅपमध्ये.",
  },
};

const PLATFORM_COPY: Record<Locale, Record<AppPlatform, { badge: string; ctaLabel: string }>> = {
  en: {
    android: { badge: "Free Android App · TET Preparation", ctaLabel: "Download on Google Play" },
    ios: { badge: "iOS App · TET Preparation", ctaLabel: "Coming soon on the App Store" },
  },
  hi: {
    android: { badge: "फ्री एंड्रॉइड ऐप · TET तैयारी", ctaLabel: "Google Play पर डाउनलोड करें" },
    ios: { badge: "iOS ऐप · TET तैयारी", ctaLabel: "App Store पर जल्द आ रहा है" },
  },
  mr: {
    android: { badge: "मोफत अँड्रॉइड अ‍ॅप · TET तयारी", ctaLabel: "Google Play वर डाउनलोड करा" },
    ios: { badge: "iOS अ‍ॅप · TET तयारी", ctaLabel: "App Store वर लवकरच येत आहे" },
  },
};

export default function AppDownloadHero({
  platform,
  locale = defaultLocale,
}: {
  platform: AppPlatform;
  locale?: Locale;
}) {
  const t = CONTENT[locale];
  const p = PLATFORM_COPY[locale][platform];
  const isAndroid = platform === "android";

  return (
    <Section sectionId="app-download-hero" maxWidth="max-w-[1200px]" padding="pt-4 pb-ym-section md:pt-6 md:pb-[64px] px-3">
      <div className="relative overflow-hidden rounded-[28px]">
        {/* Decorative blurred circles — CSS only, same brand tokens used everywhere else */}
        <div aria-hidden className="pointer-events-none absolute -top-16 -right-16 w-72 h-72 rounded-full bg-brand/10 blur-2xl" />
        <div aria-hidden className="pointer-events-none absolute -bottom-20 -left-16 w-64 h-64 rounded-full bg-brand/5 blur-2xl" />

        <div className="relative grid md:grid-cols-11 gap-12 bg-[var(--color-background-gray-subtle)] rounded-[28px] p-6 md:p-12">
          <div className="md:col-span-6 order-2 md:order-1 flex flex-col justify-center gap-6">
            <Chip size="md" className="bg-white border border-border-gray-subtle w-fit text-text-gray-subtle">
              <span className="inline-flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[var(--color-success)]" />
                {p.badge}
              </span>
            </Chip>

            <HeaderBlock
              as="h1"
              heading={{ text: t.heading }}
              description={{ text: t.description }}
              headingOptions={{ alignMobile: "center", alignDesktop: "left", font: "display-medium !font-bold" }}
              descriptionOptions={{ alignMobile: "center", alignDesktop: "left" }}
              headingClassName="mb-3"
              containerClassName="max-w-xl mx-auto md:mx-0"
            />

            <div className="flex flex-col items-center md:items-start gap-2">
              {isAndroid ? (
                <DownloadLinkButton href={PLAY_STORE_URL} icon={<Download size={18} />}>
                  {p.ctaLabel}
                </DownloadLinkButton>
              ) : (
                <Button variant="solid" color="primary" size="lg" disabled sx={{ borderRadius: "50px" }} leftIcon={<Download size={18} />}>
                  {p.ctaLabel}
                </Button>
              )}
            </div>
          </div>

          <div className="md:col-span-5 order-1 md:order-2 flex items-center justify-center">
            <PhoneMockup widthClassName="w-[220px] sm:w-[200px]" screenshotSrc={IMAGES.appDownload.heroScreenshot} />
          </div>
        </div>
      </div>
    </Section>
  );
}

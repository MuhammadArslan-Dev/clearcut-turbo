import { Download } from "lucide-react";
import Section from "@/components/global/Section";
import Text from "@clearcut/ui/text";
import { Chip } from "@clearcut/ui/chip";
import { Button } from "@clearcut/ui/button";
import { Locale, defaultLocale } from "@/lib/i18n/config";
import DownloadLinkButton from "./DownloadLinkButton";
import { PLAY_STORE_URL } from "@/lib/data/appLinks";
import type { AppPlatform } from "./AppDownloadHero";

const CONTENT: Record<Locale, { heading: React.ReactNode; description: string }> = {
  en: {
    heading: (
      <>
        Start Your <span className="text-brand">Teaching Exams Preparation</span> Today
      </>
    ),
    description: "Practice previous-year questions, explore video lessons and build a study routine with Clear Cutoff.",
  },
  hi: {
    heading: (
      <>
        आज ही अपनी <span className="text-brand">टीचिंग परीक्षा तैयारी</span> शुरू करें
      </>
    ),
    description: "Clear Cutoff के साथ पिछले वर्षों के प्रश्नों का अभ्यास करें, वीडियो लेक्चर देखें और एक स्टडी रूटीन बनाएं।",
  },
  mr: {
    heading: (
      <>
        आजच तुमची <span className="text-brand">टीचिंग परीक्षा तयारी</span> सुरू करा
      </>
    ),
    description: "Clear Cutoff सोबत मागील वर्षांच्या प्रश्नांचा सराव करा, व्हिडिओ धडे पाहा आणि अभ्यासाची दिनचर्या तयार करा.",
  },
};

const PLATFORM_COPY: Record<Locale, Record<AppPlatform, { badge: string; ctaLabel: string }>> = {
  en: {
    android: { badge: "Free Android App", ctaLabel: "Download on Google Play" },
    ios: { badge: "iOS App", ctaLabel: "Coming soon on the App Store" },
  },
  hi: {
    android: { badge: "फ्री एंड्रॉइड ऐप", ctaLabel: "Google Play पर डाउनलोड करें" },
    ios: { badge: "iOS ऐप", ctaLabel: "App Store पर जल्द आ रहा है" },
  },
  mr: {
    android: { badge: "मोफत अँड्रॉइड अ‍ॅप", ctaLabel: "Google Play वर डाउनलोड करा" },
    ios: { badge: "iOS अ‍ॅप", ctaLabel: "App Store वर लवकरच येत आहे" },
  },
};

export default function AppDownloadFinalCta({
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
    <Section sectionId="app-download-final-cta" maxWidth="max-w-[1200px]" padding="py-ym-section md:py-yd-section px-3">
      <div
        className="relative overflow-hidden rounded-[28px] px-6 py-14 md:py-20 text-center"
        style={{ background: "linear-gradient(135deg, var(--color-text-gray-normal), var(--color-primary-stronger))" }}
      >
        <div aria-hidden className="pointer-events-none absolute -top-10 -right-10 w-56 h-56 rounded-full bg-brand/40 blur-2xl" />
        <div aria-hidden className="pointer-events-none absolute -bottom-16 -left-10 w-48 h-48 rounded-full bg-brand/30 blur-2xl" />

        <div className="relative flex flex-col items-center gap-5 max-w-2xl mx-auto">
          <Chip size="md" className="bg-white/10 text-white w-fit">
            <span className="inline-flex items-center gap-2">
              <Download size={14} />
              {p.badge}
            </span>
          </Chip>

          <Text as="h2" variant="display-small" weight="bold" className="!text-white">
            {t.heading}
          </Text>
          <Text as="p" variant="body-large" className="!text-white/70">
            {t.description}
          </Text>

          <div className="flex flex-col items-center gap-2 mt-2">
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
      </div>
    </Section>
  );
}

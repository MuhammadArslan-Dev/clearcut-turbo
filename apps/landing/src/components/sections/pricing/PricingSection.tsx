import React from "react";
import Section from "../../global/Section";
import Text from "@clearcut/ui/text";
import PricingCard, { InfinityIcon, ShieldIcon, ClockFeatureIcon } from "../../ui/cards/PricingCard";
import clsx from "clsx";
import { Exam } from "@/types/page";
import StudentTrustBlock from "@/components/global/StudentTrustBlock";
import { Locale, defaultLocale } from "@/lib/i18n/config";

type Props = { data?: Exam; bgColor?: string; active?: boolean; locale?: Locale };

const PRICING_COPY: Record<Locale, {
  headingLine1: string;
  headingLine2: string;
  subtitle: string;
  planTitle: string;
  priceNote: string;
  buttonText: string;
  badgeText: string;
  trustText: string;
  featureLabels: [string, string, string];
  points: { title: string; description: string }[];
}> = {
  en: {
    headingLine1: "Everything you need to",
    headingLine2: "ace your exam",
    subtitle: "Smart preparation. Better practice. Higher scores.",
    planTitle: "Full access plan",
    priceNote: "1-Month Subscription Starting From",
    buttonText: "Start for free",
    badgeText: "Most popular",
    trustText: "No payment required · Cancel anytime",
    featureLabels: ["Unlimited Access", "Trusted by Thousands", "Study at your own pace"],
    points: [
      { title: "All subjects included", description: "Study every subject for your exam in one place." },
      { title: "Unlimited practice tests", description: "Practise with mini tests, sectional tests and PYQs, and boost your score." },
      { title: "Choose your plan", description: "Unlimited access for 6 or 15 months. Study at your own pace, whenever your exam is." },
      { title: "3-day free trial before paying", description: "Start preparing without paying anything." },
    ],
  },
  hi: {
    headingLine1: "आपकी परीक्षा पास करने के लिए",
    headingLine2: "सब कुछ यहाँ है",
    subtitle: "स्मार्ट तैयारी। बेहतर अभ्यास। बेहतर स्कोर।",
    planTitle: "फुल एक्सेस प्लान",
    priceNote: "1 महीने का सब्सक्रिप्शन शुरू से",
    buttonText: "फ्री में शुरू करें",
    badgeText: "सबसे लोकप्रिय",
    trustText: "कोई भुगतान आवश्यक नहीं · कभी भी रद्द करें",
    featureLabels: ["असीमित एक्सेस", "हज़ारों का भरोसा", "अपनी गति से पढ़ें"],
    points: [
      { title: "सभी विषय शामिल", description: "अपनी परीक्षा के सभी विषय एक ही जगह पढ़ें।" },
      { title: "असीमित अभ्यास टेस्ट", description: "मिनी टेस्ट, सेक्शनल टेस्ट और PYQs से प्रैक्टिस करें, और अपने नंबर बढ़ाएं।" },
      { title: "अपना प्लान चुनें", description: "6 या 15 महीने के लिए अनलिमिटेड एक्सेस। अपनी गति से पढ़ें, चाहे परीक्षा कब भी हो।" },
      { title: "भुगतान से पहले 3 दिन मुफ्त ट्रायल", description: "बिना पैसे दिए तैयारी शुरू करें।" },
    ],
  },
};

/**
 * The one pricing widget for the whole app — rendered for both the
 * `pricing` (homepage) and `singlePricing` (every per-exam page) section
 * types (see lib/sections/registry.ts). Those used to be two different
 * components (a 3-card exam grid here, a title+points card there); now it's
 * a single generic "what's included" + price-card layout with no exam name
 * or exam-switcher anywhere in it, since the plan is identical either way.
 */
export default async function PricingSection({ bgColor, active = true, locale = defaultLocale }: Props) {
  const t = PRICING_COPY[locale];

  if (!active) return null;

  const features = [
    { icon: <InfinityIcon />, label: t.featureLabels[0] },
    { icon: <ShieldIcon />, label: t.featureLabels[1] },
    { icon: <ClockFeatureIcon />, label: t.featureLabels[2] },
  ];

  return (
    <div className={clsx(bgColor)} style={{ background: bgColor }}>
      <Section padding="py-ym-section md:py-yd-section px-3 scroll-mt-16 md:scroll-mt-12" sectionId="pricing-section">
        <div className="flex flex-col gap-14">
          <div className="w-full max-w-[1000px] mx-auto grid grid-cols-1 md:grid-cols-2 gap-12 md:gap-10 items-center px-2">
            <div className="flex flex-col gap-4 order-2 md:order-1">
              <div className="flex flex-col gap-1">
                <div className="relative inline-block w-fit pr-8 pt-2">
                  <Text as="h2" className="heading-xlarge !leading-[1.4] md:!text-[38px] !font-bold text-text-gray-normal">
                    {t.headingLine1}
                    <br />
                    <span className="text-brand">{t.headingLine2}</span>
                  </Text>
                  <span className="absolute top-0 right-0 text-[var(--color-brand)]">
                    <SparkleIcon />
                  </span>
                </div>
                <span className="h-1 w-10 rounded-full bg-brand mt-1" />
                <Text as="p" variant="body-large" color="gray-muted">{t.subtitle}</Text>
              </div>

              <div className="flex flex-col gap-3">
                {t.points.map((point, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-4 rounded-2xl border border-[var(--color-border-gray-subtle)] bg-white px-4 py-3.5"
                  >
                    <span className="shrink-0 grid place-items-center w-10 h-10 rounded-xl bg-[var(--color-primary-bg-soft)]">
                      <CheckIconBrand />
                    </span>
                    <div className="flex-1">
                      <Text as="p" variant="body-large" weight="semibold" color="gray-normal">{point.title}</Text>
                      <Text as="p" variant="body-medium" color="gray-muted">{point.description}</Text>
                    </div>
                    <span className="hidden sm:block heading-medium !font-bold text-brand/25">
                      {String(index + 1).padStart(2, "0")}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="order-1 md:order-2 flex justify-center md:justify-end">
              <PricingCard
                badgeText={t.badgeText}
                priceNote={t.priceNote}
                price={99}
                features={features}
                buttonText={t.buttonText}
                trustText={t.trustText}
              />
            </div>
          </div>

          <StudentTrustBlock locale={locale} />
        </div>
      </Section>
    </div>
  );
}

const CheckIconBrand = () => (
  <svg width="20" height="20" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="0.5" y="0.5" width="15" height="15" rx="7.5" fill="var(--color-brand)" />
    <rect x="0.5" y="0.5" width="15" height="15" rx="7.5" stroke="var(--color-brand)" />
    <path d="M11.3346 5.5L6.7513 10.0833L4.66797 8" stroke="white" strokeWidth="1.66667" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const SparkleIcon = () => (
  <svg width="22" height="22" viewBox="0 0 22 22" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path
      d="M11 2c.5 3.5 2 5 5.5 5.5-3.5.5-5 2-5.5 5.5-.5-3.5-2-5-5.5-5.5C9 7 10.5 5.5 11 2Z"
      fill="currentColor"
    />
    <path d="M18 13c.28 1.6.9 2.22 2.5 2.5-1.6.28-2.22.9-2.5 2.5-.28-1.6-.9-2.22-2.5-2.5 1.6-.28 2.22-.9 2.5-2.5Z" fill="currentColor" />
  </svg>
);

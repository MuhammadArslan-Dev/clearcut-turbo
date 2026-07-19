import React from "react";
import Section from "../../global/Section";
import HeaderBlock from "../../shared/text-render/HeaderBlock";
import PricingCard, { PricingPlan } from "../../ui/cards/PricingCard";
import clsx from "clsx";
import { Exam } from "@/types/page";
import { parsePrice } from "@/lib/data/courses";
import StudentTrustBlock from "@/components/global/StudentTrustBlock";
import GuaranteeBadge from "@/components/shared/GuaranteeBadge";
import { Locale, defaultLocale } from "@/lib/i18n/config";

type Props = { courses?: Exam[]; data?: Exam; bgColor?: string; active?: boolean; locale?: Locale };

const PRICING_COPY: Record<Locale, {
  eyebrow: string;
  heading: React.ReactNode;
  description: string;
  planTitle: (name: string) => string;
  fallbackTitle: string;
  subtitle: string;
  priceNote: string;
  buttonText: string;
  points: (examName: string) => { title: string; description: string }[];
}> = {
  en: {
    eyebrow: "Simple. Transparent. Affordable.",
    heading: (
      <>
        <span className="text-brand">One</span> price, <span className="text-brand">everything</span> included!
      </>
    ),
    description: "Pay once. 6 months of access. Everything you need to pass on the first attempt.",
    planTitle: (name) => `${name} exam`,
    fallbackTitle: "CTET 2024",
    subtitle: "A great choice for power users and teams.",
    priceNote: "6-month subscription",
    buttonText: "Enrol now",
    points: (examName) => [
      { title: "All subjects included", description: `Study all ${examName} subjects in one place.` },
      { title: "Unlimited practice tests", description: "Practise with mini tests, sectional tests and PYQs — and boost your score." },
      { title: "Choose your plan", description: "Unlimited access for 6 or 15 months. Study at your own pace, whenever your exam is." },
      { title: "3-day free trial before paying", description: `Start preparing for ${examName} without paying anything.` },
    ],
  },
  hi: {
    eyebrow: "सरल। पारदर्शी। किफायती।",
    heading: (
      <>
        <span className="text-brand">एक</span> कीमत, <span className="text-brand">सब कुछ</span> शामिल!
      </>
    ),
    description: "एक बार भुगतान। 6 महीने का एक्सेस। पहली कोशिश में पास होने के लिए ज़रूरी सब कुछ।",
    planTitle: (name) => `${name} परीक्षा`,
    fallbackTitle: "CTET 2024",
    subtitle: "पावर यूज़र्स और टीम के लिए बेहतरीन विकल्प।",
    priceNote: "6 महीने का सब्सक्रिप्शन",
    buttonText: "अभी एनरोल करें",
    points: (examName) => [
      { title: "सभी विषय शामिल", description: `एक ही जगह पर ${examName} के सभी विषय पढ़ें।` },
      { title: "असीमित अभ्यास टेस्ट", description: "मिनी टेस्ट, सेक्शनल टेस्ट और PYQs से प्रैक्टिस करें - अपने नंबर बढ़ाएं।" },
      { title: "अपना प्लान चुनें", description: "6 या 15 महीने के लिए अनलिमिटेड एक्सेस। अपनी गति से पढ़ें, चाहे परीक्षा कब भी हो।" },
      { title: "भुगतान से पहले 3 दिन मुफ्त ट्रायल", description: `${examName} की तैयारी बिना पैसे दिए शुरू करें।` },
    ],
  },
};

export default async function PricingSection({ courses = [], bgColor, active = true, locale = defaultLocale }: Props) {
  const t = PRICING_COPY[locale];

  const getCourseByName = (name: string) =>
    courses.find((c) => c?.short_name?.toLowerCase() === name.toLowerCase());

  const buildPlan = (course: Exam | undefined, id: number): PricingPlan => ({
    id,
    title: course?.short_name ? t.planTitle(course.short_name) : t.fallbackTitle,
    subtitle: t.subtitle,
    price: 99,
    priceNote: t.priceNote,
    buttonText: t.buttonText,
    points: t.points(course?.short_name ?? ""),
  });

  const htet = getCourseByName("htet");
  const ctet = getCourseByName("ctet");
  const reet = getCourseByName("reet");
  const pricingPlans = [buildPlan(htet, 1), buildPlan(ctet, 2), buildPlan(reet, 3)];

  if (!active) return null;

  return (
    <div className={clsx(bgColor)} style={{ background: bgColor }}>
      <Section padding="py-ym-section md:py-yd-section px-3 scroll-mt-16 md:scroll-mt-12" sectionId="pricing-section">
        <div className="flex flex-col gap-10">
          <div className="space-y-4">
            <HeaderBlock
              eyebrow={{ text: t.eyebrow }}
              heading={{ text: t.heading }}
              description={{ text: t.description }}
              eyebrowOptions={{ alignMobile: "center", alignDesktop: "center" }}
              headingOptions={{ alignMobile: "center", alignDesktop: "center", font: "display-small md:display-medium !font-semibold" }}
              descriptionOptions={{ alignMobile: "center", alignDesktop: "center" }}
              containerClassName="mx-auto"
            />
            <GuaranteeBadge />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 px-2">
            {pricingPlans.map((plan) => (
              <PricingCard key={plan.id} {...plan} />
            ))}
          </div>
          <StudentTrustBlock locale={locale} />
        </div>
      </Section>
    </div>
  );
}

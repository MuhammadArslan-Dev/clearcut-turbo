"use client";
import React from "react";
import Section from "../global/Section";
import HeaderBlock from "../shared/text-render/HeaderBlock";
import Paragraph from "../shared/text-render/Paragraph";
import { CourseRating } from "../ui/cards/CourseCard";
import StarIcon from "../icons/star-icon";
import PricingCard, { PricingPlan } from "../ui/cards/PricingCard";
import clsx from "clsx";
import { Exam } from "@/types/page";
import { parsePrice } from "@/lib/data/courses";
import GuaranteeBadge from "../shared/GuaranteeBadge";
import { Locale } from "@/lib/i18n/config";
import { useLocale } from "next-intl";

const COPY: Record<Locale, {
  eyebrow: string;
  heading: React.ReactNode;
  description: string;
  planTitle: (name: string) => string;
  subtitle: string;
  priceNote: string;
  buttonText: string;
  points: (examName: string) => { title: string; description: string }[];
  studentsUsed: React.ReactNode;
  studentsSubtext: string;
  ratingSuffix: string;
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
    subtitle: "A great choice for power users and teams.",
    priceNote: "6-month subscription",
    buttonText: "Enrol now",
    points: (examName) => [
      { title: "All subjects included", description: `Study all ${examName} subjects in one place.` },
      { title: "Unlimited practice tests", description: "Practise with mini tests, sectional tests and PYQs — and boost your score." },
      { title: "Choose your plan", description: "Unlimited access for 6 or 15 months. Study at your own pace, whenever your exam is." },
      { title: "3-day free trial before paying", description: `Start preparing for ${examName} without paying anything.` },
    ],
    studentsUsed: <><span className="text-brand">10,000+</span> students used this to pass the TET exam.</>,
    studentsSubtext: "Join thousands of successful TET aspirants who chose smart, affordable prep over expensive coaching!",
    ratingSuffix: "  average rating from our students!",
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
    subtitle: "पावर यूज़र्स और टीम के लिए बेहतरीन विकल्प।",
    priceNote: "6 महीने का सब्सक्रिप्शन",
    buttonText: "अभी एनरोल करें",
    points: (examName) => [
      { title: "सभी विषय शामिल", description: `एक ही जगह पर ${examName} के सभी विषय पढ़ें।` },
      { title: "असीमित अभ्यास टेस्ट", description: "मिनी टेस्ट, सेक्शनल टेस्ट और PYQs से प्रैक्टिस करें - अपने नंबर बढ़ाएं।" },
      { title: "अपना प्लान चुनें", description: "6 या 15 महीने के लिए अनलिमिटेड एक्सेस। अपनी गति से पढ़ें, चाहे परीक्षा कब भी हो।" },
      { title: "भुगतान से पहले 3 दिन मुफ्त ट्रायल", description: `${examName} की तैयारी बिना पैसे दिए शुरू करें।` },
    ],
    studentsUsed: <><span className="text-brand">10,000+</span> विद्यार्थियों ने TET परीक्षा पास करने के लिए इसका उपयोग किया।</>,
    studentsSubtext: "हजारों सफल TET अभ्यर्थियों से जुड़ें जिन्होंने महंगी कोचिंग के बजाय स्मार्ट और किफायती तैयारी चुनी!",
    ratingSuffix: "  हमारे विद्यार्थियों द्वारा औसत रेटिंग!",
  },
};

export default function SinglePricingSection({
  bgColor,
  active = true,
  data,
}: {
  data?: Exam;
  bgColor?: string;
  active?: boolean;
  courseName?: string;
  coursePrice?: number | string;
}) {
  const t = COPY[useLocale()];
  const parsedPrice = parsePrice(data?.price);
  const examName = data?.short_name ?? "";

  const pricingPlans: PricingPlan = {
    id: 1,
    title: t.planTitle(examName),
    subtitle: t.subtitle,
    price: 99,
    priceNote: t.priceNote,
    buttonText: t.buttonText,
    points: t.points(examName),
  };

  const studentsUsed = t.studentsUsed;

  const averageRating = (
    <><span className="text-black font-semibold text-xl">4.9+</span>{t.ratingSuffix}</>
  );

  if (!active) return null;

  return (
    <div className={clsx(bgColor)} style={{ background: bgColor }}>
      <Section padding="py-ym-section md:py-yd-section px-3" maxWidth="max-w-[1000px]" sectionId="pricing-section">
        <div className="grid md:gap-12 md:grid-cols-10 items-center">
          <div className="max-w-xl mx-auto lg:mx-0 md:col-span-6 flex flex-col justify-between h-full pt-6">
            <HeaderBlock
              eyebrow={{ text: t.eyebrow }}
              heading={{ text: t.heading }}
              description={{ text: t.description }}
              eyebrowOptions={{ alignMobile: "center", alignDesktop: "left" }}
              headingOptions={{ alignMobile: "center", alignDesktop: "left", font: "display-small md:display-medium !font-semibold" }}
              descriptionOptions={{ alignMobile: "center", alignDesktop: "left" }}
            />

            <GuaranteeBadge />

            <div className="mt-8 flex-col gap-6 md:flex hidden">
              <Paragraph
                text={{ text: studentsUsed }}
                textOptions={{ alignMobile: "center", alignDesktop: "left", font: "heading-large !font-semibold" }}
              />
              <Paragraph
                text={{ text: t.studentsSubtext }}
                textOptions={{ alignMobile: "center", alignDesktop: "left", font: "body-medium" }}
              />
              <div className="flex justify-center lg:justify-start">
                <CourseRating
                  icon={<StarIcon variant="without-border" type="filled" />}
                  ratingText={averageRating}
                  iconGap="gap-2"
                  ratingTextClass={{ font: "body-large", alignDesktop: "left" }}
                />
              </div>
            </div>
          </div>

          <div className="w-full max-w-md flex justify-center md:justify-end md:col-span-4">
            <PricingCard guaranteeBadge={true} {...pricingPlans} />
          </div>

          <div className="mt-8 flex md:hidden flex-col gap-6">
            <Paragraph
              text={{ text: studentsUsed }}
              textOptions={{ alignMobile: "center", alignDesktop: "left", font: "heading-large !font-semibold" }}
            />
            <Paragraph
              text={{ text: t.studentsSubtext }}
              textOptions={{ alignMobile: "center", alignDesktop: "left", font: "body-medium" }}
            />
            <div className="flex justify-center lg:justify-start">
              <CourseRating
                align="items-center justify-center"
                icon={<StarIcon variant="without-border" type="filled" />}
                ratingText={averageRating}
                iconGap="gap-2"
                ratingTextClass={{ font: "body-large", alignDesktop: "left" }}
              />
            </div>
          </div>
        </div>
      </Section>
    </div>
  );
}

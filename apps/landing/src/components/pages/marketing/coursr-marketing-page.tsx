"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import Image from "next/image";
import clsx from "clsx";
import { AnimatePresence, motion } from "framer-motion";

import Section from "@/components/global/Section";
import Text from "@clearcut/ui/text";
import Badge from "@/components/ui/Badge";
import Button from "@clearcut/ui/button";
import { Card } from "@clearcut/ui/card";
import MainInput from "@clearcut/ui/main-input";
import MainAppLogo from "@/components/icons/main-app-logo";
import StarIcon from "@/components/icons/star-icon";
import { IMAGES } from "@/constants/images";
import WhatsappIcon from "@/components/icons/whatsapp-icon";
import { EASE } from "@/lib/animations-premium";
import { CheckIconGreen } from "@/components/shared/ComparisonTable";
import FeaturesSection from "@/components/sections/FeaturesSection";
import GuaranteeBadge from "@/components/shared/GuaranteeBadge";
import HeaderBlock from "@/components/shared/text-render/HeaderBlock";
import ContinueFreeButton from "@/components/ui/buttons/ContinueFreeButton";
import { RotatingBadge } from "@/components/features/animation/RotatingBadge";
import { Locale } from "@/lib/i18n/config";
import { useLocale } from "next-intl";

type Review = {
  reviewHighLight: string[];
  role: string;
  name: string;
  date: string;
  review: (courseName: string) => string;
  stars: number;
  gender: "male" | "female";
};

const COPY: Record<Locale, {
  pricingEyebrow: string;
  pricingHeading: React.ReactNode;
  pricingDescription: string;
  trialButton: string;
  heroHeading: (courseName: string) => React.ReactNode;
  heroSubtitle: (courseName: string) => string;
  heroFeatures: string[];
  heroTrustCard: (courseName: string, stateName: string) => React.ReactNode;
  testimonialsHeading: React.ReactNode;
  reviews: Review[];
  justJoined: (name: string, city: string) => React.ReactNode;
}> = {
  en: {
    pricingEyebrow: "Simple. Transparent. Affordable.",
    pricingHeading: (
      <>
        <span className="text-brand">One</span> price, <span className="text-brand">everything</span> included!
      </>
    ),
    pricingDescription: "Pay once. 6 months of access. Everything you need to pass on the first attempt.",
    trialButton: "Start your 3-day free trial",
    heroHeading: (courseName) => (
      <>
        Score 90+ in the <span className="text-brand">{courseName}</span> exam
      </>
    ),
    heroSubtitle: (courseName) =>
      `Prepare for all ${courseName} subjects with our all-in-one course and test series!`,
    heroFeatures: [
      "All exam sections covered",
      "Videos, notes and concepts",
      "50+ papers in the test series",
      "Free demo classes",
    ],
    heroTrustCard: (courseName, stateName) => (
      <>
        Trusted by <span className="text-brand">10000+</span> students to pass the{" "}
        <span className="text-brand">{courseName}</span> exam in <span className="text-brand">{stateName}</span>
      </>
    ),
    testimonialsHeading: (
      <>
        Our <span className="text-brand">students&apos;</span> <span className="text-brand">success</span> stories
      </>
    ),
    reviews: [
      {
        reviewHighLight: ["96% marks"],
        role: "Student",
        name: "Rahul",
        date: "Dec 2025",
        gender: "male",
        review: (courseName) =>
          `I joined Clear Cutoff for ${courseName} and it's really good. I cleared my exam on the very first attempt! All subjects are here. My subject was Hindi and I couldn't find all subjects in one place before.`,
        stars: 5,
      },
      {
        reviewHighLight: ["96% marks"],
        role: "Student",
        name: "Riya",
        date: "Feb 2026",
        gender: "female",
        review: (courseName) =>
          `The best place to prepare for ${courseName}. I covered the topics here that weren't clear in my coaching class. I can study anytime, even late at night when the internet speed is good.`,
        stars: 5,
      },
      {
        reviewHighLight: ["96% marks"],
        role: "Student",
        name: "Deeksha",
        date: "March 2026",
        gender: "female",
        review: (courseName) =>
          `I failed ${courseName} last year but now my score is improving. The notes are very helpful and revision is easy. And if I don't pass, they'll refund my money — so no tension now.`,
        stars: 5,
      },
    ],
    justJoined: (name, city) => (
      <>
        <span className="!font-semibold">{name}</span>
        {" from "}
        <span className="!font-semibold">{city}</span>
        {" just joined"}
      </>
    ),
  },
  hi: {
    pricingEyebrow: "सरल। पारदर्शी। किफायती।",
    pricingHeading: (
      <>
        <span className="text-brand">एक</span> कीमत, <span className="text-brand">सब कुछ</span> शामिल!
      </>
    ),
    pricingDescription: "एक बार भुगतान। 6 महीने का एक्सेस। पहली कोशिश में पास होने के लिए ज़रूरी सब कुछ।",
    trialButton: "3-दिन का फ्री ट्रायल शुरू करें",
    heroHeading: (courseName) => (
      <>
        <span className="text-brand">{courseName}</span> परीक्षा में 90+ अंक प्राप्त करें
      </>
    ),
    heroSubtitle: (courseName) =>
      `हमारे ऑल-इन-वन कोर्स और टेस्ट सीरीज़ के साथ ${courseName} के सभी विषयों की तैयारी करें!`,
    heroFeatures: [
      "परीक्षा के सभी सेक्शन कवर",
      "वीडियो, नोट्स और कॉन्सेप्ट",
      "टेस्ट सीरीज़ में 50+ पेपर",
      "फ्री डेमो क्लासेस",
    ],
    heroTrustCard: (courseName, stateName) => (
      <>
        <span className="text-brand">{stateName}</span> में <span className="text-brand">{courseName}</span> परीक्षा पास करने के लिए <span className="text-brand">10000+</span> छात्रों का भरोसा
      </>
    ),
    testimonialsHeading: (
      <>
        हमारे <span className="text-brand">विद्यार्थियों</span> की <span className="text-brand">सफलता</span> कहानियां
      </>
    ),
    reviews: [
      {
        reviewHighLight: ["96% अंक"],
        role: "विद्यार्थी",
        name: "राहुल",
        date: "Dec 2025",
        gender: "male",
        review: (courseName) =>
          `मैंने ${courseName} के लिए Clear Cutoff जॉइन किया और यह काफी अच्छा है। मैंने पहली बार में ही अपना एग्जाम क्लियर कर लिया! सभी सब्जेक्ट यहां हैं। मेरा सब्जेक्ट हिंदी था और मुझे सारे सब्जेक्ट एक ही जगह नहीं मिल रहे थे।`,
        stars: 5,
      },
      {
        reviewHighLight: ["96% अंक"],
        role: "विद्यार्थी",
        name: "रिया",
        date: "Feb 2026",
        gender: "female",
        review: (courseName) =>
          `${courseName} की तैयारी के लिए सबसे अच्छी जगह। मैंने यहां वो टॉपिक्स कवर किए जो मेरी कोचिंग क्लास में क्लियर नहीं हुए थे। मैं कभी भी पढ़ सकती हूँ, यहां तक कि देर रात में जब इंटरनेट स्पीड अच्छी होती है।`,
        stars: 5,
      },
      {
        reviewHighLight: ["96% अंक"],
        role: "विद्यार्थी",
        name: "दीक्षा",
        date: "March 2026",
        gender: "female",
        review: (courseName) =>
          `मैं पिछले साल ${courseName} में फेल हो गई थी लेकिन अब मेरा स्कोर अच्छा हो रहा है। नोट्स बहुत मददगार हैं और रिविजन करना आसान है। और अगर मैं पास नहीं हुई, तो मेरे पैसे वापस कर देंगे। तो अब कोई टेंशन नहीं है।`,
        stars: 5,
      },
    ],
    justJoined: (name, city) => (
      <>
        <span className="!font-semibold">{city}</span>
        {" से "}
        <span className="!font-semibold">{name}</span>
        {" अभी-अभी जुड़े"}
      </>
    ),
  },
};

const REVIEW_AVATARS: Record<"male" | "female", string> = {
  male: "https://cc-teaching-content-ind.s3.dualstack.ap-south-1.amazonaws.com/images/icon-male-user.png",
  female: "https://cc-teaching-content-ind.s3.dualstack.ap-south-1.amazonaws.com/images/icon-female-user.png",
};

const STATES = [
  { name: "Haryana", code: "htet" },
  { name: "Rajasthan", code: "reet" },
  { name: "Uttar Pradesh", code: "uptet" },
];

const SOCIAL_PROOF_DATA: Record<string, { name: string; city: string }[]> = {
  htet: [
    { name: "S**shi", city: "Gurugram" },
    { name: "Saptarshi", city: "Jhajjar" },
    { name: "R**ul", city: "Mahendragarh" },
    { name: "P**ya", city: "Panipat" },
    { name: "A**a", city: "Rohtak" },
    { name: "N**a", city: "Sonipat" },
  ],
  reet: [
    { name: "S**shi", city: "Ajmer" },
    { name: "Saptarshi", city: "Bikaner" },
    { name: "R**ul", city: "Bharatpur" },
    { name: "P**ya", city: "Jodhpur" },
    { name: "A**a", city: "Alwar" },
    { name: "N**a", city: "Jaipur" },
  ],
  uptet: [
    { name: "S**shi", city: "Agra" },
    { name: "Saptarshi", city: "Prayagraj" },
    { name: "R**ul", city: "Gorakhpur" },
    { name: "P**ya", city: "Varanasi" },
    { name: "A**a", city: "Meerut" },
    { name: "N**a", city: "Auraiya" },
  ],
  hptet: [
    { name: "S**shi", city: "Hamirpur" },
    { name: "Saptarshi", city: "Kangra" },
    { name: "R**ul", city: "Bilaspur" },
    { name: "P**ya", city: "Mandi" },
    { name: "A**a", city: "Kinnaur" },
    { name: "N**a", city: "Solan" },
  ],
};

const EXAM_TAGS = ["Subjects", "Notes", "PYQs"];
const OFFER_ENDS = new Date("2026-05-07T23:59:59");

function pad(n: number) {
  return String(n).padStart(2, "0");
}

function useCountdown(target: Date) {
  const [left, setLeft] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
  });
  useEffect(() => {
    function tick() {
      const diff = target.getTime() - Date.now();
      if (diff <= 0) {
        setLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
        return;
      }
      setLeft({
        days: Math.floor(diff / 86_400_000),
        hours: Math.floor((diff % 86_400_000) / 3_600_000),
        minutes: Math.floor((diff % 3_600_000) / 60_000),
        seconds: Math.floor((diff % 60_000) / 1_000),
      });
    }
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [target]);
  return left;
}

export default function CoursrMarketingPage({ data }: any) {
  const t = COPY[useLocale()];
  return (
    <div className="bg-brand/10">
      <div className="flex flex-col max-w-[600px] bg-white mx-auto">
        <HeroSection data={data} />
        <TestimonialsSection data={data} />
        <div className="bg-white pb-6 px-4">
          <div className="max-w-xl mx-auto lg:mx-0 md:col-span-6 flex flex-col justify-between h-full pt-6">
            <HeaderBlock
              eyebrow={{ text: t.pricingEyebrow }}
              heading={{ text: t.pricingHeading }}
              description={{ text: t.pricingDescription }}
              eyebrowOptions={{ alignMobile: "center", alignDesktop: "center" }}
              headingOptions={{
                alignMobile: "center",
                alignDesktop: "center",
                font: "display-small md:display-medium !font-semibold",
              }}
              descriptionOptions={{
                alignMobile: "center",
                alignDesktop: "center",
              }}
            />
            <GuaranteeBadge pY="py-2" />
          </div>
        </div>
        <FeaturesSection
          gap="gap-2"
          bgColor="bg-[#f1f5fa]"
          eyebrow={false}
          dec={false}
        />
      </div>

      <div
        className={clsx(
          "sticky bottom-0 left-0 right-0 space-y-2 z-50 bg-white shadow-[var(--shadow-floating-bar)]",
        )}
      >
        <div className="flex items-center gap-3 px-4 pt-3">
          <div className="shrink-0 flex flex-col items-center">
            <Text
              as="span"
              variant="body-small"
              weight="semibold"
              color="gray-normal"
              className="line-through leading-none"
            >
              ₹1299
            </Text>
            <Text
              as="span"
              variant="heading-xlarge"
              weight="semibold"
              color="gray-normal"
            >
              {data === 'ugcnet' ? '₹149' : '₹99'} 
            </Text>
          </div>
          <div className="flex-1 md:hidden">
            <ContinueFreeButton
              marketing="course-marketing"
              course={data}
              fullWidth
              showShimmer
              text={t.trialButton}
            />
          </div>
        </div>
        <div className="flex items-center justify-center gap-1 pb-2 text-sm text-[#4B5563]">
          <RotatingBadge
            animationDuration={0.45}
            direction="up"
            items={["Videos", "Notes", "PDFs", "Tests"]}
          />
        </div>
      </div>
    </div>
  );
}

function HeroSection({ data }: { data: string }) {
  const courseName = data?.toUpperCase() + " 2026" || "";
  const stateName = STATES?.find((s) => s.code === data)?.name || "";
  const t = COPY[useLocale()];

  return (
    <Section
      sectionId="newdesign-hero"
      maxWidth="max-w-full"
      padding="p-4 tablet:px-4 tablet:py-8"
      bgColor="bg-white"
    >
      <div className="space-y-5">
        <div className="space-y-1">
          <Text
            as="h2"
            variant="heading-xlarge"
            weight="semibold"
            color="gray-normal"
          >
            {t.heroHeading(courseName)}
          </Text>
          <Text as="h4" variant="heading-small" color="gray-normal">
            {t.heroSubtitle(courseName)}
          </Text>
        </div>
        <SocialProofStack data={data} />
        <div className="space-y-1 px-4">
          {t.heroFeatures.map((item, index) => (
            <div
              key={index}
              className="flex items-center gap-3 bg-color-primary-subtle"
            >
              <CheckIconGreen color="#0083ff" size={16} />
              <Text
                as="span"
                variant="body-large"
                weight="normal"
                color="gray-subtle"
              >
                {item}
              </Text>
            </div>
          ))}
        </div>
        <Card
          bordercolor="white"
          borderRadius={12}
          className="!bg-[#006BD1]/9"
        >
          <Text
            as="span"
            variant="body-medium"
            weight="normal"
            className="text-center"
            color="gray-subtle"
          >
            {t.heroTrustCard(courseName, stateName)}
          </Text>
        </Card>
      </div>
    </Section>
  );
}

function TestimonialsSection({ data }: any) {
  const courseName = data?.toUpperCase() + " 2026" || "";
  const c = COPY[useLocale()];

  const reviews = useMemo(
    () =>
      c.reviews.map((r) => ({
        profile: (
          <Image
            src={REVIEW_AVATARS[r.gender]}
            alt={`${r.name} - student reviewer`}
            width={48}
            height={48}
            className="w-full h-full object-cover"
            priority
          />
        ),
        role: r.role,
        name: r.name,
        date: r.date,
        review: r.review(courseName),
        stars: r.stars,
      })),
    [courseName, c],
  );

  return (
    <Section
      sectionId="newdesign-testimonials"
      maxWidth="max-w-full"
      padding="px-5 py-7"
      bgColor="bg-[#f1f5fa]"
    >
      <div className="space-y-5">
        <div className="flex flex-col gap-12">
          <Text
            as="h3"
            variant="heading-2xlarge"
            weight="semibold"
            className="text-center"
            color="gray-normal"
          >
            {c.testimonialsHeading}
          </Text>
        </div>
        <div className="space-y-3">
          {reviews.map((r, i) => (
            <TestimonialCard key={i} {...r} />
          ))}
        </div>
      </div>
    </Section>
  );
}

function TestimonialCard({
  name,
  profile,
  stars,
  date,
  review,
}: {
  name: React.ReactNode;
  profile?: React.ReactNode;
  stars?: number;
  date?: React.ReactNode;
  review?: React.ReactNode;
}) {
  return (
    <Card
      bgcolor="#ffffff"
      bordercolor="#e8f2fb"
      padding="14px"
      borderRadius={12}
    >
      <div className="flex gap-3 item">
        <div className="w-10 h-10 rounded-full bg-color-primary text-white body-small overflow-hidden !font-bold flex items-center justify-center shrink-0">
          {profile}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <Text
                as="span"
                variant="heading-small"
                weight="semibold"
                color="gray-normal"
                className="block truncate"
              >
                {name}
              </Text>
              <Text as="span" variant="body-xsmall" color="gray-muted">
                {date}
              </Text>
            </div>
            <div className="flex flex-col items-end gap-1 shrink-0">
              <div className="flex gap-0.5">
                {Array.from({ length: stars || 0 }).map((_, i) => (
                  <StarIcon key={i} size={16} />
                ))}
              </div>
            </div>
          </div>
          <Text
            as="p"
            variant="body-medium"
            color="gray-subtle"
            className="mt-1.5 leading-relaxed"
          >
            {review}
          </Text>
        </div>
      </div>
    </Card>
  );
}

type SocialProofItem = { id: number; name: string; city: string };

function SocialProofStack({ data }: { data: any }) {
  const [item, setItem] = useState<SocialProofItem | null>(null);
  const indexRef = useRef(0);
  const idRef = useRef(0);
  const c = COPY[useLocale()];
  const socialProof = SOCIAL_PROOF_DATA[data?.toLowerCase()] || [];

  useEffect(() => {
    if (!socialProof.length) return;
    function push() {
      const current = socialProof[indexRef.current % socialProof.length];
      setItem({ ...current, id: idRef.current++ });
      indexRef.current++;
    }
    push();
    const timer = setInterval(push, 3500);
    return () => clearInterval(timer);
  }, []);

  if (!item) return null;

  return (
    <div className="relative h-[36px] -mt-4 -mb-0.5 overflow-hidden">
      <AnimatePresence mode="wait">
        <motion.div
          key={item.id}
          className="absolute left-0 right-0"
          initial={{ y: 76, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -76, opacity: 0 }}
          transition={{ duration: 0.55, ease: EASE }}
        >
          <div className="flex items-center gap-3 bg-brand/10 rounded-lg px-4 py-0.5 w-fit">
            <Text as="p" variant="body-medium" color="gray-normal">
              {c.justJoined(item.name, item.city)}
            </Text>
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

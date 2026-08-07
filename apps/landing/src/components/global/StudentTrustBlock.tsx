import React from "react";
import Paragraph from "../shared/text-render/Paragraph";
import { CourseRating } from "../ui/cards/CourseCard";
import StarIcon from "../icons/star-icon";
import { Locale, defaultLocale } from "@/lib/i18n/config";

const CONTENT: Record<Locale, { headline: React.ReactNode; subtext: string; ratingSuffix: string }> = {
  en: {
    headline: (
      <>
        <span className="text-brand">10000+</span> students used this to pass the TET exam.
      </>
    ),
    subtext:
      "Join thousands of successful TET aspirants who chose smart, affordable prep over expensive coaching!",
    ratingSuffix: "  average rating from our students!",
  },
  hi: {
    headline: (
      <>
        <span className="text-brand">10000+</span> विद्यार्थियों ने TET परीक्षा पास करने के लिए इसका उपयोग किया।
      </>
    ),
    subtext:
      "हजारों सफल TET अभ्यर्थियों से जुड़ें जिन्होंने महंगी कोचिंग के बजाय स्मार्ट और किफायती तैयारी चुनी!",
    ratingSuffix: "  हमारे विद्यार्थियों द्वारा औसत रेटिंग!",
  },
};

export default function StudentTrustBlock({ locale = defaultLocale }: { locale?: Locale }) {
  const t = CONTENT[locale];
  return (
    <div className="flex flex-col gap-8 max-w-lg mx-auto">
      <Paragraph
        text={{ text: t.headline }}
        textOptions={{ alignMobile: "center", alignDesktop: "center", font: "heading-large !font-semibold" }}
      />

      <Paragraph
        text={{ text: t.subtext }}
        textOptions={{ alignMobile: "center", alignDesktop: "center", font: "body-medium !font-normal" }}
      />

      <div className="flex justify-center w-full">
        <CourseRating
          icon={<StarIcon variant="without-border" type="filled" />}
          ratingText={
            <>
              <span className="text-black font-semibold text-xl">4.9+</span>
              {t.ratingSuffix}
            </>
          }
          ratingTextClass={{ font: "body-large !font-normal" }}
          iconGap="gap-2 justify-center w-full"
        />
      </div>
    </div>
  );
}

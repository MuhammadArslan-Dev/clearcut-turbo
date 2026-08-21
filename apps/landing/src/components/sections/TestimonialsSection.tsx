"use client";

import React, { useMemo } from "react";
import Section from "../global/Section";
import HeaderBlock from "../shared/text-render/HeaderBlock";
import ReviewCarousal from "../features/reviews/ReviewCarousal";
import Image from "next/image";
import ReviewMainCard from "../features/reviews/ReviewMainCard";
import Text from "@clearcut/ui/text";
import clsx from "clsx";
import CloudIcon from "../icons/cloud-icon";
import AlarmClockIcon from "../icons/alarm-clock-icon";
import { Exam } from "@/types/page";

export default React.memo(function TestimonialsSection({
  bgColor = "bg-[#f1f5fa]",
  active = true,
  data,
}: {
  data?: Exam;
  bgColor?: string;
  active?: boolean;
}) {
  const reviews = useMemo(() => {
    return Array.from({ length: 6 }).map(() => ({
      profile: (
        <Image
          src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d"
          alt="Student reviewer profile photo"
          width={48}
          height={48}
          className="w-full h-full object-cover"
        />
      ),
      name: "जॉन डो",
      reviewHighLight: ["96% अंक"],
      role: "विद्यार्थी",
      review: "मैं अपनी परीक्षा पास करने में संघर्ष कर रहा था। इस प्लेटफॉर्म के साथ, मैंने 96% अंक हासिल किए। यह गेम-चेंजर साबित हुआ!",
    }));
  }, []);

  if (!active) return null;

  return (
    <div className={clsx(bgColor)} style={{ background: bgColor }}>
      <Section padding="py-ym-section md:py-yd-section px-3" maxWidth="max-w-full" sectionId="testimonials-section">
        <div className="flex flex-col">
          <div className="flex flex-col gap-12">
            <HeaderBlock
              eyebrow={{ text: "हजारों Teaching अभ्यर्थियों का भरोसा" }}
              heading={{
                text: (
                  <>
                    हमारे <span className="text-brand">विद्यार्थियों</span> की <span className="text-brand">सफलता</span> कहानियां
                  </>
                ),
              }}
              description={{ text: "हमारे PYQ, मिनी टेस्ट और मार्गदर्शन से अपने अंक सुधारने वाले हजारों विद्यार्थियों से जुड़ें!" }}
              eyebrowOptions={{ alignMobile: "center", alignDesktop: "center" }}
              headingOptions={{ alignMobile: "center", alignDesktop: "center", font: "display-medium !font-semibold" }}
              descriptionOptions={{ alignMobile: "center", alignDesktop: "center" }}
              containerClassName="mx-auto px-2"
            />
            <div className="flex flex-col gap-4">
              {reviews.length > 0 && <ReviewCarousal reviews={reviews} />}
              {reviews.length > 0 && <ReviewCarousal direction="right" reviews={reviews} />}
            </div>
          </div>

          <div className="px-3 space-y-4 flex flex-col items-center -mt-[120px] z-[1]">
            <ReviewMainCard />
            <div className="flex md:gap-16 text-center">
              <div className="p-5 flex flex-col gap-2 items-center w-full">
                <div className="flex gap-2 items-center">
                  <CloudIcon type="download" />
                  <Text as="h3" variant="heading-large" weight="semibold">
                    10K<span className="text-brand">+</span>
                  </Text>
                </div>
                <Text as="p" variant="body-medium">Clear Cutoff पर विद्यार्थी</Text>
              </div>
              <div className="p-5 flex flex-col gap-2 items-center w-full">
                <div className="flex gap-2 items-center">
                  <AlarmClockIcon />
                  <Text as="h3" variant="heading-large" weight="semibold">
                    #<span className="text-brand">1</span>
                  </Text>
                </div>
                <Text as="p" variant="body-medium">TET परीक्षाओं के लिए नंबर 1 पसंद</Text>
              </div>
            </div>
          </div>
        </div>
      </Section>
    </div>
  );
});

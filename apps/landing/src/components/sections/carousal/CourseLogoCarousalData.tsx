import React from "react";
import Section from "../../global/Section";
import Text from "@clearcut/ui/text";
import Button from "@clearcut/ui/button";
import LogoCarousel from "../LogoCarousel";
import { Link } from "@clearcut/i18n/navigation";
import { Exam } from "@/types/page";
import { Locale, defaultLocale } from "@/lib/i18n/config";

const LOGOS = [
  { src: null, title: "HTET", subtitle: "Haryana" },
  { src: null, title: "REET", subtitle: "Rajasthan" },
  { src: null, title: "CTET", subtitle: "India" },
  { src: null, title: "BTET", subtitle: "Bihar" },
  { src: null, title: "MPTET", subtitle: "Madhya Pradesh" },
  { src: null, title: "HPTET", subtitle: "Himachal Pradesh" },
  { src: null, title: "UPTET", subtitle: "Uttar Pradesh" },
  { src: null, title: "PTET", subtitle: "Punjab" },
];

export default async function CourseLogoCarousalData({
  showButton = true,
  data,
  courses,
  locale = defaultLocale,
}: {
  data?: Exam;
  showButton?: boolean;
  courses?: Exam[];
  locale?: Locale;
}) {
  const logos2 =
    courses?.map((course) => ({
      src: course?.logo_url ?? "/icons/Logo-48x48.png",
      title: course?.short_name ?? "CTET",
      subtitle: course?.state ?? "India",
    })) ?? [];

  const examName = data?.short_name || "TET";

  const isEn = locale === "en";
  const trustHeading = isEn ? (
    <>
      Trusted by <span className="text-brand">10,000+</span> students to pass {examName} exams across India
    </>
  ) : (
    <>
      भारत भर में कई {examName} परीक्षाएं पास करने के लिए <span className="text-brand">10,000+</span> विद्यार्थियों का भरोसा
    </>
  );
  const otherExamsHeading = isEn ? (
    <>
      Preparing for other exams? Explore all of Clear Cutoff&apos;s <span className="text-brand">Teaching Exams</span>!
    </>
  ) : (
    <>
      क्या आप अन्य परीक्षाओं की तैयारी कर रहे हैं? Clear Cutoff के सभी <span className="text-brand">Teaching Exams</span> देखें!
    </>
  );
  const allCoursesBtn = isEn ? "See all courses and test series!" : "सभी कोर्स और टेस्ट सीरीज देखें!";

  return (
    <Section padding="py-4" maxWidth="max-w-screen" sectionId="course-logo-carousal">
      <div className="flex flex-col gap-6">
        {showButton && (
          <Text as="h2" variant="heading-large" weight="semibold" className="text-center">
            {trustHeading}
          </Text>
        )}

        <LogoCarousel logos={logos2.length ? logos2 : LOGOS} speed={60} direction="left" pauseOnHover className="mx-auto" />

        {showButton && (
          <div className="flex flex-col md:flex-row items-center justify-center gap-6 md:gap-14">
            <Text as="h3" variant="heading-small" weight="semibold" className="text-center">
              {otherExamsHeading}
            </Text>
            <Link href="/teaching" className="cursor-pointer">
              <Button size="sm" rounded="50px" variant="outlined" color="primary">
                {allCoursesBtn}
              </Button>
            </Link>
          </div>
        )}
      </div>
    </Section>
  );
}

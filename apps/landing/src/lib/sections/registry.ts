import dynamic from "next/dynamic";
import HomeHero from "@/components/sections/heros/HomeHero";
import CoursePageHero from "@/components/sections/heros/CoursePageHero";

import FeaturesSection from "@/components/sections/FeaturesSection";
import ExamListSection from "@/components/sections/exam-list/ExamListSection";
import HowItWorksSection from "@/components/sections/howitwork/HowItWorksSection";
import ComparisonSection from "@/components/sections/ComparisonSection";
import CourseLogoCarousal from "@/components/sections/carousal/CourseLogoCarousal";
import PricingSectionWrapper from "@/components/sections/pricing/PricingSectionWrapper";

// Heavy, below-the-fold Client Components — code-split into their own chunks
// so their JS is fetched only when needed instead of bloating the initial
// homepage bundle. SSR stays on (default) so the rendered markup is still
// present in the server-rendered HTML for SEO and first paint.
const TestimonialsSection = dynamic(
  () => import("@/components/sections/TestimonialsSection"),
);
const FAQsSection = dynamic(
  () => import("@/components/sections/FAQsSection"),
);

export type SectionType = keyof typeof sectionRegistry;
export type Section = {
  type: SectionType;
  id?: string;
  bgColor?: string;
  active?: boolean;
  showButton?: boolean;
  courseName?: string;
  [key: string]: unknown;
};
export const sectionRegistry = {
  // 🔥 HERO SECTIONS
  homeHero: HomeHero,
  courseHero: CoursePageHero,

  // 🔥 CORE SECTIONS
  features: FeaturesSection,
  testimonials: TestimonialsSection,
  examList: ExamListSection,
  howItWorks: HowItWorksSection,
  comparison: ComparisonSection,
  faqs: FAQsSection,

  // 🔥 PRICING — one shared widget for both the homepage grid and every
  // per-exam page; there is no longer a separate single-exam component.
  pricing: PricingSectionWrapper,
  singlePricing: PricingSectionWrapper,

  // 🔥 EXTRA
  courseLogoCarousal: CourseLogoCarousal,
} as const;

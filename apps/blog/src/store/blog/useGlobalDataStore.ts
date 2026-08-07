import { createStore } from "@clearcut/state/create-store";

interface GlobalData {
  global: {
    comparison_table: ComparisonTable;
    course_hero: CourseHero;
    features: FeaturesSection;
    hero: Hero;
    how_it_works: HowItWorksSection;
    logoCarousel: logoCarouselSection;
  };
  reviews: ReviewsSection;
  faqs: FAQSSection;
}

interface GlobalDataStore extends Partial<GlobalData> {
  setData: (data: Partial<GlobalData>) => void;
}

export const useGlobalDataStore = createStore<GlobalDataStore>("globalDataStore", (set) => ({
  global: {} as GlobalData["global"],
  reviews: {} as ReviewsSection,
  faqs: {} as FAQSSection,

  setData: (data) => {
    if (!data) return;
    set((state) => ({ ...state, ...data })); // merge directly
  },
}));

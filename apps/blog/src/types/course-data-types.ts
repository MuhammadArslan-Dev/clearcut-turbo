// 1️⃣ Define a reusable type for items with `id` and `text`
type Item = {
  id: string;
  [key: string]: string | null;
};

type Logo = {
  url: string | null;
  alt: string | null;
}

type FAQs = {
  question: string | null;
  answer: string | null;
  category: string | null;
};
type Feactures = {
  description: string | null;
  heading: string | null;
  id: string;
  image: string | null;
};

type Hero = {
  backgroundImage: string | null;
  ctaLink: string | null;
  ctaText: string | null;
  enabled: boolean;
  highlight: Item[];
  eyebrow: string | null;
  heading: string | null;
  subheading: string | null;
};

type HowitWorks = {
  btn_text: string | null;
  description: string | null;
  heading: string | null;
  id: string;
  image: string | null;
  subheading: string | null;
};

type logos = {
  heading: string | null;
  id: string;
  logo: string | null;
  subheading: string | null;
};
type LogoItem = {
  heading: string | null;
  subheading: string | null;
  logo: string |Logo | null;
};


interface ReviewItem {
  name: string;
  profile: string |Logo | null; // Payload upload can return ID or full media object
  gender: 'male' | 'female';
  profession: string;
  review: string;
  reviewHighlight: Item[];
  rating: number;
}

// 2️⃣ Define the main structure type
interface ComparisonTable {
  enabled: boolean;
  eyebrow: string;
  heading: string;
  subheading: string;
  highlight: Item[];
  comparison: Item[];
  clear_cutoff: Item[];
  coaching_center: Item[];
}

interface CourseHero {
  course_hero_ctaLink: string;
  course_hero_ctaText: string;
  course_hero_eyebrow: string;
  course_hero_heading: string;
  course_hero_subheading: string;
}

interface FAQSSection {
  enabled: boolean;
  eyebrow: string;
  heading: string;
  subheading: string;
  highlight: Item[];
  categories: Item[];
  faqs: FAQs[];
}

interface FeaturesSection {
  enabled: boolean;
  eyebrow: string;
  heading: string;
  subheading: string;
  highlight: Item[];
  features: Feactures[]; // Use your defined Feactures type
}

interface HowItWorksSection {
  enabled: boolean;
  eyebrow: string;
  heading: string;
  subheading: string;
  highlight: Item[];
  how_it_works: HowitWorks[];
}

interface logoCarouselSection {
  enabled: boolean;
  logos: logos[];
}

interface ReviewsSection {
  enabled: boolean;
  eyebrow: string;
  heading: string;
  subheading: string;
  highlight: Item[];
  reviews: ReviewItem[];
}

interface GlobalDataState {
  comparison_table: ComparisonTable;
  course_hero: CourseHero;
  faqs: FAQSSection;
  features: FeaturesSection;
  hero: Hero;
  how_it_works: HowItWorksSection;
  logoCarousel: logoCarouselSection;
  reviews: ReviewsSection;
}

interface Exam {
    id: number;
    exam_id: string;
    name: string;
    short_name: string;
    state: string;
    conducting_body: string;
    logo_url: string;
    exam_type: string;
    exam_frequency: string;
    evaluation_type: string;
    upcoming_exam: string;
    status: "active" | "inactive" | "archived";
    rating: string;
    price: number;
    combo_price: number;
    marking_schema: string; // or you can parse it to a JSON object
    metadata: string; // or you can parse it to a JSON object
    createdAt: string;
    updatedAt: string;
}
// types/payload.d.ts

export type SectionColor = string | null;

export interface SectionGroup {
  enabled: boolean;
  heading: string;
  color?: SectionColor;
}



export interface Page {
  id: string;
  title: string;
  slug: string;
  seo_title: string;
  seo_description: string;

  hero?: SectionGroup;
  course_hero?: SectionGroup;
  logoCarousel?: SectionGroup;
  features?: SectionGroup;
  how_it_works?: SectionGroup;
  comparison_table?: SectionGroup;
  reviews?: SectionGroup;
  faqs?: SectionGroup;


  createdAt?: string;
  updatedAt?: string;
}

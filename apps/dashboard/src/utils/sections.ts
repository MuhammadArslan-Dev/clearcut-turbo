export const sections = [
  { id: "hero", label: "Hero" },
  { id: "pricing", label: "Pricing" },
  { id: "features", label: "Features" },
  { id: "howitworks", label: "How it works" },
  { id: "comparison", label: "Comparison" },
  { id: "faqs", label: "FAQs" },
  { id: "carousel", label: "Carousel" },
  { id: "reviews", label: "Reviews" },
] as const

export type SectionId = (typeof sections)[number]["id"]

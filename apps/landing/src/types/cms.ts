// Shapes returned by the Payload CMS REST API (clearcut-cms).
// Mirrors src/collections/Comparisons.ts and src/globals/MarketingProof.ts
// in the CMS repo. Kept as plain types here since the two apps don't share
// a package — update by hand if those CMS fields change.

export type CmsMedia = {
  id: string;
  url: string;
  alt?: string;
  width?: number;
  height?: number;
};

export type CmsCtaBlock = {
  title?: string;
  description?: string;
  ctaLabel?: string;
  ctaUrl?: string;
};

export type ComparisonPoint = {
  title: string;
  yourText: string;
  theirText: string;
  impactText?: string;
};

export type FeatureStatus = "yes" | "warning" | "no";

export type FeatureRow = {
  feature: string;
  yourStatus: FeatureStatus;
  yourText?: string;
  theirStatus: FeatureStatus;
  theirText?: string;
};

export type ComparisonDoc = {
  id: string;
  competitorName: string;
  competitorLogo?: CmsMedia;
  slug: string;
  hero: {
    eyebrow?: string;
    title: string;
    description?: string;
    ctaLabel?: string;
    ctaUrl?: string;
  };
  comparisonSectionTitle?: string;
  comparisonPoints?: ComparisonPoint[];
  featureTable?: FeatureRow[];
  midCta?: CmsCtaBlock;
  promise?: CmsCtaBlock & { body?: string };
  meta?: {
    metaTitle?: string;
    metaDescription?: string;
    ogImage?: CmsMedia;
  };
};

// Mirrors src/collections/Alternatives.ts in the CMS repo.
export type ToolRating = {
  g2Score?: string;
  g2ReviewCount?: string;
  capterraScore?: string;
  capterraReviewCount?: string;
};

export type ToolTestimonial = {
  quote?: string;
  authorName?: string;
  authorRole?: string;
  authorCompany?: string;
};

export type PricingTier = {
  planName: string;
  price: string;
};

export type AlternativeTool = {
  name: string;
  logo?: CmsMedia;
  bestFor?: string;
  standoutFeature?: string;
  description: string;
  features?: { text: string }[];
  pros?: { text: string }[];
  cons?: { text: string }[];
  limitations?: { text: string }[];
  pricingSummary?: string;
  pricingTiers?: PricingTier[];
  rating?: ToolRating;
  testimonial?: ToolTestimonial;
};

export type AlternativeSummary = {
  id: string;
  competitorName: string;
  competitorLogo?: CmsMedia;
  slug: string;
  hero: {
    title: string;
    description?: string;
  };
  publishedDate?: string;
};

export type AlternativeDoc = AlternativeSummary & {
  hero: AlternativeSummary["hero"] & {
    eyebrow?: string;
    ctaLabel?: string;
    ctaUrl?: string;
  };
  introBody_html?: string;
  summaryTableTitle?: string;
  tools?: AlternativeTool[];
  midCta?: CmsCtaBlock;
  promise?: CmsCtaBlock & { body?: string };
  relatedAlternatives?: AlternativeSummary[];
  meta?: {
    metaTitle?: string;
    metaDescription?: string;
    ogImage?: CmsMedia;
  };
};

export type MarketingProof = {
  trustedBy?: {
    label?: string;
    logos?: { name: string; logo: CmsMedia }[];
  };
  integrations?: {
    title?: string;
    description?: string;
    linkLabel?: string;
    linkUrl?: string;
    logos?: { name: string; logo: CmsMedia }[];
  };
  stats?: { value: string; label: string }[];
  finalCta?: CmsCtaBlock;
};

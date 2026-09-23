// Age-eligibility types and accessors for the /tools/age-eligibility-calculator
// pages. The exam data itself (age limits, category relaxations,
// qualification, notes, FAQs) lives in the clearcut-tools-backend database
// (tool "age-calculator") and is fetched at build time by
// src/lib/api/toolsApi.ts — nothing is hand-authored in this file anymore.
//
// Like the resizer, there is deliberately no fallback to local data: a build
// that can't reach the backend fails instead of shipping stale age limits
// (see toolsApi.ts's header). Note that rows the backend flags
// is_placeholder are template-generated defaults, not verified official
// figures — verify them against the official notification before relying on
// them.

import { getAgeEligibilityData } from "./api/toolsApi";

export type AgeCategoryRow = {
  key: string;
  label: string;
  minAge: number;
  /** null = no upper age limit for this exam/category. */
  maxAge: number | null;
  relaxation: string;
};

// An exam's group is its category slug ("civil-services", "banking", ...).
// The categories themselves (label per language, order, active flag) are
// managed in the backend (tool_categories of the "age-calculator" tool), so
// a new category appears without a code change.
export type ExamGroup = string;

export type AgeLocale = "en" | "hi" | "mr";

export type AgeCategory = {
  slug: string;
  label: string;
  /** Optional icon key set in the backend; the hub page maps known keys/slugs to an icon. */
  icon: string | null;
  sortOrder: number;
};

export type AgeEligibilityExam = {
  slug: string;
  shortName: string;
  fullName: string;
  conductingBody: string;
  group: ExamGroup;
  year: number;
  /** 1 = first "Popular" exam; null = not popular. Set by popular_rank in the backend. */
  popularRank: number | null;
  categories: AgeCategoryRow[];
  qualification: string;
  specialRelaxations: string[];
  importantNotes: string[];
  faqs: { q: string; a: string }[];
};

export type AgeEligibilityData = {
  exams: AgeEligibilityExam[];
  categories: Record<AgeLocale, AgeCategory[]>;
};

export async function getAgeEligibilityCategories(locale: AgeLocale = "en"): Promise<AgeCategory[]> {
  return (await getAgeEligibilityData()).categories[locale];
}

/** The hub's "Popular Calculators": exams with a popular_rank, lowest rank first. */
export async function getPopularAgeExams(limit = 6): Promise<AgeEligibilityExam[]> {
  const exams = await getAgeEligibilityExams();
  return exams
    .filter((e) => e.popularRank !== null)
    .sort((a, b) => (a.popularRank as number) - (b.popularRank as number))
    .slice(0, limit);
}

export async function getAgeEligibilityExams(): Promise<AgeEligibilityExam[]> {
  return (await getAgeEligibilityData()).exams;
}

export async function getAgeEligibilityExamBySlug(slug: string): Promise<AgeEligibilityExam | undefined> {
  const exams = await getAgeEligibilityExams();
  return exams.find((exam) => exam.slug === slug);
}

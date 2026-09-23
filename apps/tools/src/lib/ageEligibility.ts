// Age-eligibility data for the /tools/age-eligibility-calculator/{examSlug}
// pages.
//
// This file hand-authors the 5 teaching exams Clear Cutoff itself is built
// around (CTET/HTET/UPTET/REET/HPTET) — these have real, individually
// researched copy. Every other exam (the other 80 on age.exammint.in's own
// directory, which this catalog mirrors for design/feature parity) is
// template-generated from a compact per-category-group ruleset in
// ageEligibilityCatalog.ts — see that file's own header for why, and its
// sourcing caveat, which applies equally here.
//
// SOURCING NOTE (for the 5 exams below): min/max age figures come from each
// exam's general public notification pattern (CTET/HPTET/REET have no upper
// age limit for the TET itself; HTET and UPTET do). Category-wise
// *relaxation* figures follow the standard Indian government reservation
// convention (OBC +3, SC/ST +5, PwD +10, ex-servicemen per service rendered)
// since exam-specific relaxation notifications aren't always published in a
// stable, citable form and can change year to year. Treat every number here
// as a well-informed default, not a guarantee — the disclaimer on each page
// says so explicitly, same as every other calculator in this space.

// CATALOG_EXAMS's own module does `import type {...} from "./ageEligibility"`
// (this file) — that's erased at compile time, so importing its value here
// doesn't create a real runtime circular dependency.
import { CATALOG_EXAMS } from "./ageEligibilityCatalog";

export type AgeCategoryRow = {
  key: string;
  label: string;
  minAge: number;
  /** null = no upper age limit for this exam/category. */
  maxAge: number | null;
  relaxation: string;
};

// Mirrors age.exammint.in/calculators/'s own category filter chips — used
// by the hub page's "All Exams / Civil Services / Banking / ..." filter.
export type ExamGroup =
  | "Civil Services"
  | "SSC Exams"
  | "Banking"
  | "Railways"
  | "Defence"
  | "Engineering"
  | "Medical"
  | "State PSC"
  | "Teaching"
  | "Insurance"
  | "Police";

export type AgeEligibilityExam = {
  slug: string;
  shortName: string;
  fullName: string;
  conductingBody: string;
  group: ExamGroup;
  year: number;
  categories: AgeCategoryRow[];
  qualification: string;
  specialRelaxations: string[];
  importantNotes: string[];
  faqs: { q: string; a: string }[];
};

const HAND_AUTHORED_EXAMS: AgeEligibilityExam[] = [
  {
    slug: "ctet",
    shortName: "CTET",
    fullName: "Central Teacher Eligibility Test",
    conductingBody: "Central Board of Secondary Education (CBSE)",
    group: "Teaching",
    year: 2026,
    categories: [
      { key: "general", label: "General / UR", minAge: 18, maxAge: null, relaxation: "—" },
      { key: "obc", label: "OBC (NCL)", minAge: 18, maxAge: null, relaxation: "—" },
      { key: "sc_st", label: "SC / ST", minAge: 18, maxAge: null, relaxation: "—" },
      { key: "pwd", label: "PwD", minAge: 18, maxAge: null, relaxation: "—" },
    ],
    qualification:
      "Paper 1 (classes 1–5): Senior Secondary + 2-yr Diploma in Elementary Education (or equivalent), or Graduation + 2-yr Diploma in Elementary Education. Paper 2 (classes 6–8): Graduation + B.Ed, or Senior Secondary + 4-yr Bachelor in Elementary Education (B.El.Ed) or equivalent.",
    specialRelaxations: [
      "CTET has no upper age limit — candidates of any age above 18 can appear, and can attempt the exam any number of times.",
      "A CTET qualifying certificate is valid for a lifetime as per the latest CBSE policy.",
    ],
    importantNotes: [
      "This calculator follows CBSE's general CTET eligibility pattern for Paper 1 and Paper 2.",
      "There is no CTET-prescribed upper age limit for any category.",
      "Always verify the latest official CTET notification for exact qualification codes accepted for your paper.",
    ],
    faqs: [
      {
        q: "Is there an upper age limit for CTET?",
        a: "No. CTET has no maximum age limit — you can appear at any age as long as you're at least 18 and meet the educational qualification for the paper you're applying for.",
      },
      {
        q: "How many times can I attempt CTET?",
        a: "There's no limit on the number of attempts. You can appear in every CTET cycle as long as you remain eligible.",
      },
      {
        q: "What's the difference between CTET Paper 1 and Paper 2?",
        a: "Paper 1 qualifies you to teach classes 1–5 (primary level); Paper 2 qualifies you to teach classes 6–8 (upper primary level). You can appear for both in the same session if you meet both qualification requirements.",
      },
      {
        q: "How long is a CTET certificate valid?",
        a: "As per CBSE's current policy, a CTET qualifying certificate is valid for a lifetime.",
      },
      {
        q: "Should I still verify the official CTET notification?",
        a: "Yes. Use this tool for a quick check, then verify the latest official CTET notification on the CBSE CTET website before applying.",
      },
    ],
  },
  {
    slug: "htet",
    shortName: "HTET",
    fullName: "Haryana Teacher Eligibility Test",
    conductingBody: "Board of School Education Haryana (BSEH)",
    group: "Teaching",
    year: 2026,
    categories: [
      { key: "general", label: "General / UR", minAge: 18, maxAge: 38, relaxation: "—" },
      { key: "obc", label: "OBC / BC", minAge: 18, maxAge: 41, relaxation: "+3 Years" },
      { key: "sc_st", label: "SC / ST (Haryana)", minAge: 18, maxAge: 43, relaxation: "+5 Years" },
      { key: "pwd", label: "PwD", minAge: 18, maxAge: 48, relaxation: "+10 Years" },
      { key: "ex_servicemen", label: "Ex-Servicemen", minAge: 18, maxAge: 43, relaxation: "+5 Years" },
    ],
    qualification:
      "Varies by level: PRT (JBT/D.El.Ed), TGT (Graduation + B.Ed), and PGT (Post Graduation + B.Ed) each have their own qualification requirement. Candidates must also have studied Hindi or Sanskrit at the secondary/senior secondary level.",
    specialRelaxations: [
      "Haryana-domicile reserved-category candidates get the relaxation shown above over the General category's upper limit.",
      "Relaxation for Ex-Servicemen is capped at the years of military service actually rendered, subject to the maximum shown.",
    ],
    importantNotes: [
      "This calculator follows BSEH's general HTET age-limit pattern for PRT/TGT/PGT levels.",
      "Age is calculated as of the exam's official cutoff date — verify the exact date in the current year's notification.",
      "Category relaxation rules can be revised by the Haryana government — always check the latest official BSEH HTET notification.",
    ],
    faqs: [
      {
        q: "What is the age limit for HTET?",
        a: "The General category range is 18 to 38 years as of the exam's cutoff date, with additional relaxation for reserved categories as shown in the table above.",
      },
      {
        q: "Does HTET have category-wise age relaxation?",
        a: "Yes. OBC/BC, SC/ST, PwD, and Ex-Servicemen candidates from Haryana get upper-age relaxation over the General category limit.",
      },
      {
        q: "What qualification do I need for HTET?",
        a: "It depends on the level: PRT needs JBT/D.El.Ed, TGT needs Graduation + B.Ed, and PGT needs a relevant Post Graduate degree + B.Ed.",
      },
      {
        q: "Is HTET only for Haryana-domicile candidates?",
        a: "HTET itself is open to candidates from any state, but the age relaxation for reserved categories generally applies to Haryana-domicile candidates — check the official notification for details.",
      },
      {
        q: "Should I still verify the official HTET notification?",
        a: "Yes. Use this tool for a quick estimate, then verify the official BSEH HTET notification before applying.",
      },
    ],
  },
  {
    slug: "uptet",
    shortName: "UPTET",
    fullName: "Uttar Pradesh Teacher Eligibility Test",
    conductingBody: "Uttar Pradesh Basic Education Board",
    group: "Teaching",
    year: 2026,
    categories: [
      { key: "general", label: "General / UR", minAge: 18, maxAge: 35, relaxation: "—" },
      { key: "obc", label: "OBC", minAge: 18, maxAge: 40, relaxation: "+5 Years" },
      { key: "sc_st", label: "SC / ST", minAge: 18, maxAge: 40, relaxation: "+5 Years" },
      { key: "pwd", label: "PwD", minAge: 18, maxAge: 50, relaxation: "+15 Years" },
      { key: "ex_servicemen", label: "Ex-Servicemen", minAge: 18, maxAge: 40, relaxation: "+5 Years" },
    ],
    qualification:
      "Paper 1 (classes 1–5): Senior Secondary + D.El.Ed / B.T.C., or Graduation + D.El.Ed. Paper 2 (classes 6–8): Graduation + B.Ed, or equivalent. Age limits above follow the Paper 1 pattern — Paper 2 candidates should check the official notification, as its range is sometimes set slightly higher.",
    specialRelaxations: [
      "PwD candidates get the largest relaxation band (+15 years) over the General category limit.",
      "Female and third-gender candidates from UP may receive additional relaxation under state government rules — verify in the official notification.",
    ],
    importantNotes: [
      "This calculator follows UP Basic Education Board's general UPTET age-limit pattern for Paper 1.",
      "Paper 2's age range can differ from Paper 1 — always cross-check against the paper you're applying for in the official notification.",
      "There is no cap on the number of UPTET attempts.",
    ],
    faqs: [
      {
        q: "What is the age limit for UPTET?",
        a: "The General category range is 18 to 35 years as of the exam's cutoff date, with relaxation for OBC, SC/ST, PwD and Ex-Servicemen candidates as shown above.",
      },
      {
        q: "Is the age limit different for Paper 1 and Paper 2?",
        a: "It can be — Paper 2's upper limit is sometimes set slightly higher than Paper 1's in the official notification. Always verify the exact range for the paper you're applying for.",
      },
      {
        q: "How many attempts are allowed for UPTET?",
        a: "There's no maximum limit on the number of attempts — you can apply as many times as you remain eligible.",
      },
      {
        q: "Does UPTET have PwD relaxation?",
        a: "Yes, PwD candidates get a 15-year relaxation over the General category's upper age limit.",
      },
      {
        q: "Should I still verify the official UPTET notification?",
        a: "Yes. Use this tool for a quick estimate, then verify the latest official UP Basic Education Board notification before applying.",
      },
    ],
  },
  {
    slug: "reet",
    shortName: "REET",
    fullName: "Rajasthan Eligibility Examination for Teachers",
    conductingBody: "Board of Secondary Education, Rajasthan (BSER)",
    group: "Teaching",
    year: 2026,
    categories: [
      { key: "general", label: "General / UR", minAge: 18, maxAge: null, relaxation: "—" },
      { key: "obc", label: "OBC / EWS", minAge: 18, maxAge: null, relaxation: "—" },
      { key: "sc_st", label: "SC / ST", minAge: 18, maxAge: null, relaxation: "—" },
      { key: "pwd", label: "PwD", minAge: 18, maxAge: null, relaxation: "—" },
    ],
    qualification:
      "Level 1 (classes 1–5): Senior Secondary + 2-yr Diploma in Elementary Education (or equivalent). Level 2 (classes 6–8): Graduation + 2-yr Diploma in Elementary Education, or Graduation + B.Ed.",
    specialRelaxations: [
      "BSER does not prescribe an upper age limit for the REET eligibility exam itself — only a minimum age of 18.",
      "Separate age limits (commonly 21–40, with category relaxation) apply only if you later use your REET score in an actual teacher recruitment drive, not to REET eligibility itself.",
    ],
    importantNotes: [
      "This calculator checks eligibility for the REET exam itself, not for any specific recruitment drive that later accepts REET scores.",
      "If you're applying to a recruitment notification that uses REET, check that notification's own age limit separately.",
      "Always verify the latest official BSER REET notification before applying.",
    ],
    faqs: [
      {
        q: "Is there an upper age limit for REET?",
        a: "No. BSER does not set an upper age limit for the REET eligibility exam itself — you just need to be at least 18 years old.",
      },
      {
        q: "Why do some sources say REET's age limit is 21–40?",
        a: "That range applies to specific teacher recruitment drives that later use REET scores, not to the REET exam itself. The exam has no upper age limit.",
      },
      {
        q: "What qualification do I need for REET?",
        a: "Level 1 (classes 1–5) needs Senior Secondary + a 2-year Diploma in Elementary Education. Level 2 (classes 6–8) needs Graduation + a Diploma in Elementary Education or B.Ed.",
      },
      {
        q: "How long is a REET certificate valid?",
        a: "As per the current Rajasthan government policy, a REET qualifying certificate is valid for a lifetime.",
      },
      {
        q: "Should I still verify the official REET notification?",
        a: "Yes. Use this tool for a quick check, then verify the latest official BSER REET notification before applying.",
      },
    ],
  },
  {
    slug: "hptet",
    shortName: "HPTET",
    fullName: "Himachal Pradesh Teacher Eligibility Test",
    conductingBody: "Himachal Pradesh Board of School Education (HPBOSE)",
    group: "Teaching",
    year: 2026,
    categories: [
      { key: "general", label: "General / UR", minAge: 18, maxAge: null, relaxation: "—" },
      { key: "obc", label: "OBC", minAge: 18, maxAge: null, relaxation: "—" },
      { key: "sc_st", label: "SC / ST", minAge: 18, maxAge: null, relaxation: "—" },
      { key: "pwd", label: "PwD", minAge: 18, maxAge: null, relaxation: "—" },
    ],
    qualification:
      "Varies by level: JBT (Senior Secondary + JBT/D.El.Ed), TGT (Graduation + B.Ed), Language Teacher and Shastri/classical-language levels each have their own qualification requirement — check the official notification for your level.",
    specialRelaxations: [
      "HPTET has no upper age limit — candidates of any age above 18 can appear, for any of its levels.",
      "An HPTET qualifying certificate is valid for a lifetime as per current HPBOSE policy.",
    ],
    importantNotes: [
      "This calculator follows HPBOSE's general HPTET eligibility pattern.",
      "There is no HPTET-prescribed upper age limit for any category or level.",
      "Always verify the latest official HPTET notification for the exact qualification code for your level (JBT / TGT / Language Teacher / etc.).",
    ],
    faqs: [
      {
        q: "Is there an upper age limit for HPTET?",
        a: "No. HPTET has no maximum age limit — you can appear at any age as long as you're at least 18 and meet the educational qualification for your level.",
      },
      {
        q: "How many times can I attempt HPTET?",
        a: "There's no limit on the number of attempts. You can appear in every HPTET cycle as long as you remain eligible.",
      },
      {
        q: "What levels does HPTET cover?",
        a: "HPTET covers multiple levels — JBT, TGT (Arts/Non-Medical/Medical), Language Teacher, and Shastri, among others — each with its own qualification requirement.",
      },
      {
        q: "How long is an HPTET certificate valid?",
        a: "As per HPBOSE's current policy, an HPTET qualifying certificate is valid for a lifetime.",
      },
      {
        q: "Should I still verify the official HPTET notification?",
        a: "Yes. Use this tool for a quick check, then verify the latest official HPBOSE HPTET notification before applying.",
      },
    ],
  },
];

// The 5 hand-authored teaching exams first (better, individually-researched
// copy), then the rest of age.exammint.in's directory. CATALOG_EXAMS doesn't
// include CTET — HAND_AUTHORED_EXAMS' entry is used instead, so there's no
// duplicate slug.
export const AGE_ELIGIBILITY_EXAMS: AgeEligibilityExam[] = [...HAND_AUTHORED_EXAMS, ...CATALOG_EXAMS];

export function getAgeEligibilityExamBySlug(slug: string): AgeEligibilityExam | undefined {
  return AGE_ELIGIBILITY_EXAMS.find((exam) => exam.slug === slug);
}

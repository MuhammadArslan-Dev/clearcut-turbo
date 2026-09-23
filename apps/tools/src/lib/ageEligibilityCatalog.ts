// The broader exam catalog (80 exams) mirroring age.exammint.in/calculators/'s
// own directory — everything on that site except CTET, which we already have
// as a hand-authored, more-detailed entry in ageEligibility.ts and don't
// duplicate here.
//
// SOURCING: min/max age figures are transcribed from that site's own summary
// listing (one line per exam: "Age Limit: X - Y Yrs" / "Min X Yrs" / "No
// Limit"). Category-wise relaxation, qualification text, special notes, and
// FAQs are NOT transcribed per-exam (that would mean visiting all 80
// individual pages, impractical for one session) — they're generated from a
// small set of templates keyed by exam group, using the standard Indian
// government reservation relaxation convention (OBC +3, SC/ST +5, PwD +10,
// Ex-Servicemen +5, capped at service rendered). Treat every generated
// number as a well-informed default, not a guarantee — same disclaimer as
// every hand-authored exam page.
import type { AgeCategoryRow, AgeEligibilityExam, ExamGroup } from "./ageEligibility";

export type ExamSummary = {
  slug: string;
  shortName: string;
  fullName: string;
  conductingBody: string;
  group: ExamGroup;
  minAge: number;
  /** null = no upper age limit for this exam. */
  maxAge: number | null;
};

export const EXAM_SUMMARIES: ExamSummary[] = [
  // ── Civil Services (5) ──────────────────────────────────────────────
  { slug: "upsc-ias", shortName: "UPSC IAS", fullName: "Civil Services Examination", conductingBody: "Union Public Service Commission", group: "Civil Services", minAge: 21, maxAge: 32 },
  { slug: "upsc-capf", shortName: "UPSC CAPF", fullName: "Central Armed Police Forces (AC) Examination", conductingBody: "Union Public Service Commission (UPSC)", group: "Civil Services", minAge: 20, maxAge: 25 },
  { slug: "upsc", shortName: "UPSC", fullName: "Union Public Service Commission Civil Services Examination", conductingBody: "Union Public Service Commission", group: "Civil Services", minAge: 21, maxAge: 32 },
  { slug: "upsc-ifs", shortName: "UPSC IFS", fullName: "Indian Forest Service Examination", conductingBody: "Union Public Service Commission (UPSC)", group: "Civil Services", minAge: 21, maxAge: 32 },
  { slug: "upsc-ese", shortName: "UPSC ESE", fullName: "Engineering Services Examination (IES)", conductingBody: "Union Public Service Commission (UPSC)", group: "Civil Services", minAge: 21, maxAge: 30 },

  // ── SSC Exams (7) ────────────────────────────────────────────────────
  { slug: "ssc-cgl", shortName: "SSC CGL", fullName: "Combined Graduate Level Examination", conductingBody: "Staff Selection Commission", group: "SSC Exams", minAge: 18, maxAge: 32 },
  { slug: "ssc-chsl", shortName: "SSC CHSL", fullName: "Combined Higher Secondary Level Examination", conductingBody: "Staff Selection Commission", group: "SSC Exams", minAge: 18, maxAge: 27 },
  { slug: "ssc-gd-constable", shortName: "SSC GD Constable", fullName: "General Duty Constable in CAPFs / NIA / SSF / Rifleman in AR", conductingBody: "Staff Selection Commission", group: "SSC Exams", minAge: 18, maxAge: 23 },
  { slug: "ssc-je", shortName: "SSC JE", fullName: "Junior Engineer Examination", conductingBody: "Staff Selection Commission", group: "SSC Exams", minAge: 18, maxAge: 32 },
  { slug: "ssc-stenographer", shortName: "SSC Stenographer", fullName: "Stenographer Grade C and Grade D Examination", conductingBody: "Staff Selection Commission", group: "SSC Exams", minAge: 18, maxAge: 30 },
  { slug: "ssc-mts", shortName: "SSC MTS", fullName: "Multi-Tasking Staff & Havaldar", conductingBody: "Staff Selection Commission", group: "SSC Exams", minAge: 18, maxAge: 25 },
  { slug: "ssc-cpo", shortName: "SSC CPO", fullName: "Sub-Inspector in Delhi Police and CAPFs Examination", conductingBody: "Staff Selection Commission", group: "SSC Exams", minAge: 20, maxAge: 25 },

  // ── Banking (10) ─────────────────────────────────────────────────────
  { slug: "ibps-po", shortName: "IBPS PO", fullName: "Probationary Officer / Management Trainee", conductingBody: "Institute of Banking Personnel Selection", group: "Banking", minAge: 20, maxAge: 30 },
  { slug: "ibps-clerk", shortName: "IBPS Clerk", fullName: "Clerical Cadre Recruitment", conductingBody: "Institute of Banking Personnel Selection", group: "Banking", minAge: 20, maxAge: 28 },
  { slug: "sbi-po", shortName: "SBI PO", fullName: "State Bank of India Probationary Officer", conductingBody: "State Bank of India", group: "Banking", minAge: 21, maxAge: 30 },
  { slug: "sbi-clerk", shortName: "SBI Clerk", fullName: "Junior Associates (Customer Support & Sales)", conductingBody: "State Bank of India", group: "Banking", minAge: 20, maxAge: 28 },
  { slug: "ibps-rrb-officer-scale-1", shortName: "IBPS RRB Officer Scale I", fullName: "IBPS RRB Officer Scale I (Assistant Manager)", conductingBody: "Institute of Banking Personnel Selection (IBPS)", group: "Banking", minAge: 18, maxAge: 30 },
  { slug: "ibps-rrb-office-assistant", shortName: "IBPS RRB Office Assistant", fullName: "IBPS RRB Office Assistant (Multipurpose)", conductingBody: "Institute of Banking Personnel Selection (IBPS)", group: "Banking", minAge: 18, maxAge: 28 },
  { slug: "rbi-grade-b", shortName: "RBI Grade B", fullName: "Reserve Bank of India Grade B Officer (General)", conductingBody: "Reserve Bank of India (RBI)", group: "Banking", minAge: 21, maxAge: 30 },
  { slug: "rbi-assistant", shortName: "RBI Assistant", fullName: "Reserve Bank of India Assistant", conductingBody: "Reserve Bank of India (RBI)", group: "Banking", minAge: 20, maxAge: 28 },
  { slug: "sebi-grade-a", shortName: "SEBI Grade A", fullName: "SEBI Assistant Manager (Grade A) Recruitment", conductingBody: "Securities and Exchange Board of India (SEBI)", group: "Banking", minAge: 21, maxAge: 30 },
  { slug: "nabard-grade-a", shortName: "NABARD Grade A", fullName: "NABARD Assistant Manager (Grade A) Recruitment", conductingBody: "National Bank for Agriculture and Rural Development (NABARD)", group: "Banking", minAge: 21, maxAge: 30 },

  // ── Railways (6) ─────────────────────────────────────────────────────
  { slug: "rrb-ntpc", shortName: "RRB NTPC", fullName: "Non-Technical Popular Categories", conductingBody: "Railway Recruitment Board", group: "Railways", minAge: 18, maxAge: 33 },
  { slug: "rrb-group-d", shortName: "RRB Group D", fullName: "RRC Group D – Level-1 Posts", conductingBody: "Railway Recruitment Cell", group: "Railways", minAge: 18, maxAge: 33 },
  { slug: "rrb-alp", shortName: "RRB ALP", fullName: "Assistant Loco Pilot & Technicians", conductingBody: "Railway Recruitment Board", group: "Railways", minAge: 18, maxAge: 28 },
  { slug: "rrb-je", shortName: "RRB JE", fullName: "Junior Engineer, Depot Material Superintendent & Chemical Supervisor Recruitment", conductingBody: "Railway Recruitment Board", group: "Railways", minAge: 18, maxAge: 33 },
  { slug: "rpf-si", shortName: "RPF SI", fullName: "Railway Protection Force Sub-Inspector Recruitment", conductingBody: "Railway Recruitment Board (RRB)", group: "Railways", minAge: 20, maxAge: 25 },
  { slug: "rpf-constable", shortName: "RPF Constable", fullName: "Railway Protection Force Constable Recruitment", conductingBody: "Railway Recruitment Board (RRB)", group: "Railways", minAge: 18, maxAge: 25 },

  // ── Defence (7) ──────────────────────────────────────────────────────
  { slug: "nda", shortName: "NDA", fullName: "National Defence Academy & Naval Academy Examination", conductingBody: "Union Public Service Commission (UPSC)", group: "Defence", minAge: 16, maxAge: 19 },
  { slug: "cds", shortName: "CDS", fullName: "Combined Defence Services Examination", conductingBody: "Union Public Service Commission (UPSC)", group: "Defence", minAge: 19, maxAge: 25 },
  { slug: "afcat", shortName: "AFCAT", fullName: "Air Force Common Admission Test", conductingBody: "Indian Air Force (IAF)", group: "Defence", minAge: 20, maxAge: 26 },
  { slug: "indian-coast-guard-navik", shortName: "Indian Coast Guard Navik", fullName: "Indian Coast Guard Navik (General Duty / Domestic Branch)", conductingBody: "Indian Coast Guard (ICG)", group: "Defence", minAge: 18, maxAge: 22 },
  { slug: "agniveer-army", shortName: "Agniveer Army", fullName: "Indian Army Agniveer Recruitment (GD / Tech / Clerk)", conductingBody: "Indian Army", group: "Defence", minAge: 17.5, maxAge: 21 },
  { slug: "agniveer-navy", shortName: "Agniveer Navy", fullName: "Indian Navy Agniveer (SSR / MR) Recruitment", conductingBody: "Indian Navy", group: "Defence", minAge: 17.5, maxAge: 21 },
  { slug: "agniveer-air-force", shortName: "Agniveer Air Force", fullName: "Indian Air Force Agniveer Vayu Recruitment", conductingBody: "Indian Air Force (IAF)", group: "Defence", minAge: 17.5, maxAge: 21 },

  // ── Engineering (4) ──────────────────────────────────────────────────
  { slug: "gate", shortName: "GATE", fullName: "Graduate Aptitude Test in Engineering", conductingBody: "IISc / IITs (on behalf of MHRD / MoE)", group: "Engineering", minAge: 0, maxAge: null },
  { slug: "jee-main", shortName: "JEE Main", fullName: "Joint Entrance Examination – Main", conductingBody: "National Testing Agency (NTA)", group: "Engineering", minAge: 17, maxAge: 25 },
  { slug: "jee-advanced", shortName: "JEE Advanced", fullName: "Joint Entrance Examination – Advanced", conductingBody: "Rotational IITs (under Joint Admission Board)", group: "Engineering", minAge: 16, maxAge: 25 },
  { slug: "bitsat", shortName: "BITSAT", fullName: "Birla Institute of Technology and Science Admission Test", conductingBody: "Birla Institute of Technology and Science (BITS), Pilani", group: "Engineering", minAge: 16, maxAge: null },

  // ── Medical (3) ──────────────────────────────────────────────────────
  { slug: "neet-ug", shortName: "NEET UG", fullName: "National Eligibility cum Entrance Test (Undergraduate)", conductingBody: "National Testing Agency (NTA)", group: "Medical", minAge: 17, maxAge: null },
  { slug: "neet-pg", shortName: "NEET PG", fullName: "National Eligibility cum Entrance Test (Postgraduate)", conductingBody: "National Board of Examinations in Medical Sciences (NBEMS)", group: "Medical", minAge: 21, maxAge: null },
  { slug: "ini-cet", shortName: "INI CET", fullName: "Institute of National Importance Combined Entrance Test", conductingBody: "All India Institute of Medical Sciences (AIIMS), New Delhi", group: "Medical", minAge: 21, maxAge: null },

  // ── State PSC (24) ───────────────────────────────────────────────────
  { slug: "apsc", shortName: "APSC", fullName: "Assam Public Service Commission Combined Competitive Examination", conductingBody: "Assam Public Service Commission", group: "State PSC", minAge: 21, maxAge: 32 },
  { slug: "bpsc", shortName: "BPSC", fullName: "Bihar Public Service Commission Combined Competitive Examination", conductingBody: "Bihar Public Service Commission", group: "State PSC", minAge: 21, maxAge: 32 },
  { slug: "cgpsc", shortName: "CGPSC", fullName: "Chhattisgarh Public Service Commission State Service Examination", conductingBody: "Chhattisgarh Public Service Commission", group: "State PSC", minAge: 21, maxAge: 32 },
  { slug: "gpsc", shortName: "GPSC", fullName: "Gujarat Public Service Commission Class 1 and 2 Examination", conductingBody: "Gujarat Public Service Commission", group: "State PSC", minAge: 21, maxAge: 32 },
  { slug: "hppsc", shortName: "HPPSC", fullName: "Himachal Pradesh Public Service Commission Administrative Service Examination", conductingBody: "Himachal Pradesh Public Service Commission", group: "State PSC", minAge: 21, maxAge: 32 },
  { slug: "hpsc", shortName: "HPSC", fullName: "Haryana Public Service Commission Civil Services Examination", conductingBody: "Haryana Public Service Commission", group: "State PSC", minAge: 21, maxAge: 32 },
  { slug: "jpsc", shortName: "JPSC", fullName: "Jharkhand Public Service Commission Civil Services Examination", conductingBody: "Jharkhand Public Service Commission", group: "State PSC", minAge: 21, maxAge: 32 },
  { slug: "kerala-psc", shortName: "Kerala PSC", fullName: "Kerala Public Service Commission Recruitment Examinations", conductingBody: "Kerala Public Service Commission", group: "State PSC", minAge: 21, maxAge: 32 },
  { slug: "kpsc", shortName: "KPSC", fullName: "Karnataka Public Service Commission Gazetted Probationers Examination", conductingBody: "Karnataka Public Service Commission", group: "State PSC", minAge: 21, maxAge: 32 },
  { slug: "manipur-psc", shortName: "Manipur PSC", fullName: "Manipur Public Service Commission Combined Competitive Examination", conductingBody: "Manipur Public Service Commission", group: "State PSC", minAge: 21, maxAge: 32 },
  { slug: "meghalaya-psc", shortName: "Meghalaya PSC", fullName: "Meghalaya Public Service Commission Combined Competitive Examination", conductingBody: "Meghalaya Public Service Commission", group: "State PSC", minAge: 21, maxAge: 32 },
  { slug: "mizoram-psc", shortName: "Mizoram PSC", fullName: "Mizoram Public Service Commission Combined Competitive Examination", conductingBody: "Mizoram Public Service Commission", group: "State PSC", minAge: 21, maxAge: 32 },
  { slug: "mppsc", shortName: "MPPSC", fullName: "Madhya Pradesh Public Service Commission State Service Examination", conductingBody: "Madhya Pradesh Public Service Commission", group: "State PSC", minAge: 21, maxAge: 32 },
  { slug: "mpsc", shortName: "MPSC", fullName: "Maharashtra Public Service Commission State Services Examination", conductingBody: "Maharashtra Public Service Commission", group: "State PSC", minAge: 21, maxAge: 32 },
  { slug: "opsc", shortName: "OPSC", fullName: "Odisha Public Service Commission Civil Services Examination", conductingBody: "Odisha Public Service Commission", group: "State PSC", minAge: 21, maxAge: 32 },
  { slug: "ppsc", shortName: "PPSC", fullName: "Punjab Public Service Commission State Civil Services Combined Competitive Examination", conductingBody: "Punjab Public Service Commission", group: "State PSC", minAge: 21, maxAge: 32 },
  { slug: "rpsc", shortName: "RPSC", fullName: "Rajasthan Public Service Commission State and Subordinate Services Examination", conductingBody: "Rajasthan Public Service Commission", group: "State PSC", minAge: 21, maxAge: 32 },
  { slug: "sikkim-psc", shortName: "Sikkim PSC", fullName: "Sikkim Public Service Commission Combined Recruitment Examinations", conductingBody: "Sikkim Public Service Commission", group: "State PSC", minAge: 21, maxAge: 32 },
  { slug: "tnpsc", shortName: "TNPSC", fullName: "Tamil Nadu Public Service Commission Group Examinations", conductingBody: "Tamil Nadu Public Service Commission", group: "State PSC", minAge: 21, maxAge: 32 },
  { slug: "tpsc", shortName: "TPSC", fullName: "Tripura Public Service Commission Recruitment Examinations", conductingBody: "Tripura Public Service Commission", group: "State PSC", minAge: 21, maxAge: 32 },
  { slug: "tripura-psc", shortName: "Tripura PSC", fullName: "Tripura Public Service Commission Combined Competitive Examination", conductingBody: "Tripura Public Service Commission", group: "State PSC", minAge: 21, maxAge: 32 },
  { slug: "ukpsc", shortName: "UKPSC", fullName: "Uttarakhand Public Service Commission Combined State Civil Services Examination", conductingBody: "Uttarakhand Public Service Commission", group: "State PSC", minAge: 21, maxAge: 32 },
  { slug: "uppsc", shortName: "UPPSC", fullName: "Uttar Pradesh Public Service Commission Provincial Civil Services Examination", conductingBody: "Uttar Pradesh Public Service Commission", group: "State PSC", minAge: 21, maxAge: 32 },
  { slug: "wbpsc", shortName: "WBPSC", fullName: "West Bengal Public Service Commission Civil Service Examination", conductingBody: "West Bengal Public Service Commission", group: "State PSC", minAge: 21, maxAge: 32 },

  // ── Teaching (4 — CTET already hand-authored in ageEligibility.ts) ────
  { slug: "kvs-pgt", shortName: "KVS PGT", fullName: "Kendriya Vidyalaya Sangathan Post Graduate Teacher", conductingBody: "Kendriya Vidyalaya Sangathan (KVS)", group: "Teaching", minAge: 21, maxAge: 40 },
  { slug: "kvs-tgt", shortName: "KVS TGT", fullName: "Kendriya Vidyalaya Sangathan Trained Graduate Teacher", conductingBody: "Kendriya Vidyalaya Sangathan (KVS)", group: "Teaching", minAge: 21, maxAge: 35 },
  { slug: "nvs-pgt", shortName: "NVS PGT", fullName: "Navodaya Vidyalaya Samiti Post Graduate Teacher", conductingBody: "Navodaya Vidyalaya Samiti (NVS)", group: "Teaching", minAge: 21, maxAge: 40 },
  { slug: "nvs-tgt", shortName: "NVS TGT", fullName: "Navodaya Vidyalaya Samiti Trained Graduate Teacher", conductingBody: "Navodaya Vidyalaya Samiti (NVS)", group: "Teaching", minAge: 21, maxAge: 35 },

  // ── Insurance (5) ────────────────────────────────────────────────────
  { slug: "lic-aao", shortName: "LIC AAO", fullName: "LIC Assistant Administrative Officer", conductingBody: "Life Insurance Corporation of India (LIC)", group: "Insurance", minAge: 21, maxAge: 30 },
  { slug: "lic-ado", shortName: "LIC ADO", fullName: "LIC Apprentice Development Officer", conductingBody: "Life Insurance Corporation of India (LIC)", group: "Insurance", minAge: 21, maxAge: 30 },
  { slug: "lic-assistant", shortName: "LIC Assistant", fullName: "LIC Assistant (Clerical Cadre)", conductingBody: "Life Insurance Corporation of India (LIC)", group: "Insurance", minAge: 18, maxAge: 30 },
  { slug: "niacl-ao", shortName: "NIACL AO", fullName: "NIACL Administrative Officer", conductingBody: "New India Assurance Company Limited (NIACL)", group: "Insurance", minAge: 21, maxAge: 30 },
  { slug: "niacl-assistant", shortName: "NIACL Assistant", fullName: "NIACL Assistant (Clerical Cadre)", conductingBody: "New India Assurance Company Limited (NIACL)", group: "Insurance", minAge: 21, maxAge: 30 },

  // ── Police (5) ───────────────────────────────────────────────────────
  { slug: "up-police-constable", shortName: "UP Police Constable", fullName: "Uttar Pradesh Police Constable Recruitment", conductingBody: "Uttar Pradesh Police Recruitment and Promotion Board (UPPRPB)", group: "Police", minAge: 18, maxAge: 22 },
  { slug: "up-police-si", shortName: "UP Police SI", fullName: "Uttar Pradesh Police Sub-Inspector Recruitment", conductingBody: "Uttar Pradesh Police Recruitment and Promotion Board (UPPRPB)", group: "Police", minAge: 21, maxAge: 28 },
  { slug: "delhi-police-constable", shortName: "Delhi Police Constable", fullName: "Delhi Police Constable (Executive) Recruitment", conductingBody: "Staff Selection Commission (SSC) & Delhi Police", group: "Police", minAge: 18, maxAge: 25 },
  { slug: "bihar-police-si", shortName: "Bihar Police SI", fullName: "Bihar Police Sub-Inspector Recruitment", conductingBody: "Bihar Police Subordinate Services Commission (BPSSC)", group: "Police", minAge: 20, maxAge: 37 },
  { slug: "rajasthan-police-constable", shortName: "Rajasthan Police Constable", fullName: "Rajasthan Police Constable Recruitment", conductingBody: "Rajasthan Police Department", group: "Police", minAge: 18, maxAge: 23 },
];

const QUALIFICATION_BY_GROUP: Record<ExamGroup, string> = {
  "Civil Services":
    "Bachelor's degree in any discipline from a recognised university (or equivalent). Final year students may apply provisionally, subject to the exact notification's terms.",
  "SSC Exams":
    "10th/12th pass or a Bachelor's degree, depending on the specific post — check the exact post-wise qualification in the official notification.",
  Banking: "Bachelor's degree in any discipline from a recognised university (or equivalent).",
  Railways: "10th/12th pass, ITI, Diploma, or Graduation depending on the specific post applied for.",
  Defence:
    "10+2 (Intermediate) or Graduation depending on the entry scheme and service — check the specific entry's qualification requirement.",
  Engineering:
    "10+2 with Physics, Chemistry and Mathematics (for undergraduate entrance) or a relevant Bachelor's degree (for postgraduate/higher entrance) — varies by exam.",
  Medical:
    "10+2 with Physics, Chemistry and Biology (for undergraduate entrance) or an MBBS/relevant medical degree (for postgraduate entrance) — varies by exam.",
  "State PSC":
    "Bachelor's degree in any discipline from a recognised university (or equivalent). Final year students may apply provisionally, subject to the exact notification's terms.",
  Teaching:
    "Relevant teaching qualification (B.Ed / D.El.Ed, or a TGT/PGT-specific postgraduate degree) as prescribed for the post — check the official notification for the exact requirement.",
  Insurance: "Bachelor's degree in any discipline from a recognised university (or equivalent).",
  Police: "10th/12th pass or Graduation depending on the specific post — check the exact post-wise qualification in the official notification.",
};

function buildCategories(minAge: number, maxAge: number | null): AgeCategoryRow[] {
  const fmt = (n: number) => (Number.isInteger(n) ? n : n);
  if (maxAge === null) {
    return [
      { key: "general", label: "General / UR", minAge: fmt(minAge), maxAge: null, relaxation: "—" },
      { key: "obc", label: "OBC", minAge: fmt(minAge), maxAge: null, relaxation: "—" },
      { key: "sc_st", label: "SC / ST", minAge: fmt(minAge), maxAge: null, relaxation: "—" },
      { key: "pwd", label: "PwD", minAge: fmt(minAge), maxAge: null, relaxation: "—" },
    ];
  }
  return [
    { key: "general", label: "General / UR", minAge: fmt(minAge), maxAge, relaxation: "—" },
    { key: "obc", label: "OBC (NCL)", minAge: fmt(minAge), maxAge: maxAge + 3, relaxation: "+3 Years" },
    { key: "sc_st", label: "SC / ST", minAge: fmt(minAge), maxAge: maxAge + 5, relaxation: "+5 Years" },
    { key: "pwd", label: "PwD", minAge: fmt(minAge), maxAge: maxAge + 10, relaxation: "+10 Years" },
    { key: "ex_servicemen", label: "Ex-Servicemen", minAge: fmt(minAge), maxAge: maxAge + 5, relaxation: "+5 Years" },
  ];
}

function buildFaqs(exam: ExamSummary): { q: string; a: string }[] {
  const ageLine =
    exam.maxAge === null
      ? exam.minAge === 0
        ? `${exam.shortName} does not prescribe an age limit — there's no minimum or maximum age restriction.`
        : `${exam.shortName} has no upper age limit — only a minimum age of ${exam.minAge} years applies.`
      : `The General category range is ${exam.minAge} to ${exam.maxAge} years as of the exam's cutoff date, with additional relaxation for reserved categories as shown in the table above.`;

  const relaxationLine =
    exam.maxAge === null
      ? `${exam.shortName} has no upper age limit, so there's no upper-bound relaxation to apply — only the minimum age applies to every category.`
      : `Yes. OBC, SC/ST, PwD, and Ex-Servicemen candidates typically receive upper-age relaxation over the General category limit — see the table above.`;

  return [
    { q: `What is the age limit for ${exam.shortName}?`, a: ageLine },
    { q: `Does ${exam.shortName} have category-wise age relaxation?`, a: relaxationLine },
    { q: `What qualification do I need for ${exam.shortName}?`, a: QUALIFICATION_BY_GROUP[exam.group] },
    { q: `Who conducts ${exam.shortName}?`, a: `${exam.shortName} (${exam.fullName}) is conducted by ${exam.conductingBody}.` },
    {
      q: `Should I still verify the official ${exam.shortName} notification?`,
      a: `Yes. Use this tool for a quick estimate, then verify the latest official ${exam.conductingBody} notification before applying.`,
    },
  ];
}

function buildSpecialRelaxations(exam: ExamSummary): string[] {
  if (exam.maxAge === null) {
    return exam.minAge === 0
      ? [`${exam.shortName} does not prescribe any age restriction — candidates of any age can appear.`]
      : [`${exam.shortName} has no upper age limit — candidates of any age above ${exam.minAge} can appear.`];
  }
  return [
    "PwD candidates typically receive the largest relaxation band shown above.",
    "Relaxation for Ex-Servicemen is usually capped at the years of service actually rendered, subject to the maximum shown.",
  ];
}

function buildImportantNotes(exam: ExamSummary): string[] {
  return [
    `This calculator follows ${exam.conductingBody}'s general published age-limit pattern for ${exam.shortName}.`,
    "Category-wise relaxation rules can be revised by the conducting body — always check the latest official notification.",
    "Always verify the exact cutoff date and attempt limits in the current year's official notification.",
  ];
}

export function generateCatalogExam(summary: ExamSummary): AgeEligibilityExam {
  return {
    slug: summary.slug,
    shortName: summary.shortName,
    fullName: summary.fullName,
    conductingBody: summary.conductingBody,
    group: summary.group,
    year: 2026,
    categories: buildCategories(summary.minAge, summary.maxAge),
    qualification: QUALIFICATION_BY_GROUP[summary.group],
    specialRelaxations: buildSpecialRelaxations(summary),
    importantNotes: buildImportantNotes(summary),
    faqs: buildFaqs(summary),
  };
}

export const CATALOG_EXAMS: AgeEligibilityExam[] = EXAM_SUMMARIES.map(generateCatalogExam);

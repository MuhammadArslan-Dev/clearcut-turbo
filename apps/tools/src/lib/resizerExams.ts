// Data source for the resizer tool's spoke pages (public URL:
// clearcutoff.in/tools/resizer/{slug}) — ONE dynamic page template
// (src/app/[examSlug]/page.tsx) reads from this array via
// generateStaticParams, so adding an exam is "add an entry here", never "add
// a new page file". This app is statically exported (see next.config.ts),
// so every slug listed here is the FULL set of spoke pages that ever get
// built — dynamicParams is false, an unlisted slug 404s.
//
// PLACEHOLDER DATA: photoSpec/signatureSpec below are the tool's own
// generic defaults (ResizeImageTool.tsx's PRESETS.photo/signature), NOT yet
// verified against each exam's actual application-form requirements. Do not
// treat these as accurate until replaced with real per-exam figures —
// wrong numbers here could get a candidate's real application rejected.
// Same list/order as apps/go-marketing/src/pages/[...locale]/exam/[slug].astro's
// EXAMS array (the other repo's per-exam page), kept in sync deliberately.

export interface ResizerExamSpec {
  slug: string;
  shortName: string;
  fullName: string;
  /** Groups exams for the hub page's browse list — purely presentational. */
  category: string;
  photoSpec: { widthPx: number; heightPx: number; minKB: number; maxKB: number };
  signatureSpec: { widthPx: number; heightPx: number; minKB: number; maxKB: number };
}

type Spec = { widthPx: number; heightPx: number; minKB: number; maxKB: number };

const GENERIC_PHOTO_SPEC: Spec = { widthPx: 200, heightPx: 230, minKB: 20, maxKB: 50 };
const GENERIC_SIGNATURE_SPEC: Spec = { widthPx: 140, heightPx: 60, minKB: 10, maxKB: 20 };

/**
 * FAQ copy (and the FAQPage JSON-LD built from it in app/[slug]/page.tsx) is
 * derived from an exam's own photoSpec/signatureSpec at render time instead
 * of being stored per-entry — every one of the 114 RESIZER_EXAMS rows used
 * to repeat the identical `genericFaqs(shortName, photoSpec)` call, so
 * keeping it a function here means the FAQ set only has to change in one
 * place, and it's guaranteed to always match the specs shown on the page.
 *
 * Marks/cutoff questions deliberately don't state a number: qualifying
 * marks vary by exam and category and change every cycle, and this file's
 * own PLACEHOLDER DATA note above already warns not to treat its specs as
 * verified — inventing a specific cutoff here would risk misleading a real
 * candidate the same way a wrong photo spec would.
 */
export function getExamFaqs(examShortName: string, photoSpec: Spec = GENERIC_PHOTO_SPEC, signatureSpec: Spec = GENERIC_SIGNATURE_SPEC) {
  const isPlaceholder = photoSpec === GENERIC_PHOTO_SPEC;
  return [
    {
      q: `What is the required photo size for ${examShortName}?`,
      a: isPlaceholder
        ? `Check the exact dimensions and file size on the official ${examShortName} notification. This tool's default preset (${photoSpec.widthPx}×${photoSpec.heightPx}px, ${photoSpec.minKB}–${photoSpec.maxKB}KB) is a common passport-photo requirement, not a confirmed ${examShortName}-specific figure yet.`
        : `This tool is pre-configured to ${photoSpec.widthPx}×${photoSpec.heightPx}px, ${photoSpec.minKB}–${photoSpec.maxKB}KB for ${examShortName}. Always cross-check against the latest official ${examShortName} notification before submitting, since exam authorities occasionally revise these requirements.`,
    },
    {
      q: `Can I use this tool for my ${examShortName} signature too?`,
      a: "Yes, pick the Signature preset (or draw one directly) and it resizes/compresses the same way as the photo tool.",
    },
    {
      q: "Is my photo uploaded anywhere?",
      a: "No. Resizing and compression happen entirely in your browser using the Canvas API. The file never leaves your device.",
    },
    {
      q: `Where can I find notes for the ${examShortName} exam?`,
      a: `This tool only handles photo and signature resizing for your application form. For ${examShortName} study notes, practice tests and previous year questions, visit the Clear Cutoff app at clearcutoff.in.`,
    },
    {
      q: `What is the required image size for the ${examShortName} form?`,
      a: `The ${examShortName} application form typically needs two images: a photo (${photoSpec.widthPx}×${photoSpec.heightPx}px, ${photoSpec.minKB}–${photoSpec.maxKB}KB) and a signature (${signatureSpec.widthPx}×${signatureSpec.heightPx}px, ${signatureSpec.minKB}–${signatureSpec.maxKB}KB). Use the presets above to resize and compress both automatically.`,
    },
    {
      q: `What is the signature image size for ${examShortName}?`,
      a: `The ${examShortName} signature preset in this tool is ${signatureSpec.widthPx}×${signatureSpec.heightPx}px, ${signatureSpec.minKB}–${signatureSpec.maxKB}KB. Always confirm against the latest official ${examShortName} notification before submitting.`,
    },
    {
      q: `Is there a minimum qualifying mark for ${examShortName}?`,
      a: `Qualifying marks vary by category (General/OBC/EWS/SC/ST) and are set by the official conducting body each cycle. Always check the latest official ${examShortName} notification or result for the exact cutoff rather than relying on a fixed number.`,
    },
    {
      q: `Which app or tool is best for resizing photos for ${examShortName}?`,
      a: `Clear Cutoff's free Photo & Signature Resizer (this tool) is purpose-built for exam application forms. It applies the exact ${examShortName} dimensions and file-size limits automatically, works entirely in your browser, and needs no signup or download.`,
    },
  ];
}

// Category label for our own 7 originally-listed exams (the ones this
// platform actually teaches — kept in sync with apps/go-marketing's EXAMS
// array, see note above). Everything after it is a general exam directory
// sourced from a competitor's public spec table (resizer.exammint.in) to
// widen this tool's search-traffic coverage beyond our own taught exams —
// same PLACEHOLDER-DATA caveat applies: verify against the official
// notification before treating any of these numbers as authoritative.
const OWN_EXAMS_CATEGORY = "Teaching Exams (TET / TGT / PGT)";

export const RESIZER_EXAMS: ResizerExamSpec[] = [
  {
    slug: "htet",
    shortName: "HTET",
    fullName: "Haryana Teacher Eligibility Test",
    category: OWN_EXAMS_CATEGORY,
    photoSpec: GENERIC_PHOTO_SPEC,
    signatureSpec: GENERIC_SIGNATURE_SPEC,
  },
  {
    slug: "ctet",
    shortName: "CTET",
    fullName: "Central Teacher Eligibility Test",
    category: OWN_EXAMS_CATEGORY,
    photoSpec: { widthPx: 350, heightPx: 450, minKB: 10, maxKB: 100 },
    signatureSpec: { widthPx: 350, heightPx: 150, minKB: 3, maxKB: 30 },
  },
  {
    slug: "reet",
    shortName: "REET",
    fullName: "Rajasthan Eligibility Examination for Teachers",
    category: OWN_EXAMS_CATEGORY,
    photoSpec: GENERIC_PHOTO_SPEC,
    signatureSpec: GENERIC_SIGNATURE_SPEC,
  },
  {
    slug: "up-tet",
    shortName: "UPTET",
    fullName: "Uttar Pradesh Teacher Eligibility Test",
    category: OWN_EXAMS_CATEGORY,
    photoSpec: GENERIC_PHOTO_SPEC,
    signatureSpec: GENERIC_SIGNATURE_SPEC,
  },
  {
    slug: "hptet",
    shortName: "HPTET",
    fullName: "Himachal Pradesh Teacher Eligibility Test",
    category: OWN_EXAMS_CATEGORY,
    photoSpec: GENERIC_PHOTO_SPEC,
    signatureSpec: GENERIC_SIGNATURE_SPEC,
  },
  {
    slug: "up-pgt",
    shortName: "UP PGT",
    fullName: "UP Post Graduate Teacher",
    category: OWN_EXAMS_CATEGORY,
    photoSpec: GENERIC_PHOTO_SPEC,
    signatureSpec: GENERIC_SIGNATURE_SPEC,
  },
  {
    slug: "up-tgt",
    shortName: "UP TGT",
    fullName: "UP Trained Graduate Teacher",
    category: OWN_EXAMS_CATEGORY,
    photoSpec: GENERIC_PHOTO_SPEC,
    signatureSpec: GENERIC_SIGNATURE_SPEC,
  },

  // ---- Central Government Exams ----
  {
    slug: "upsc",
    shortName: "UPSC (IAS, IPS)",
    fullName: "Union Public Service Commission Civil Services Examination",
    category: "Central Government Exams",
    photoSpec: { widthPx: 400, heightPx: 400, minKB: 20, maxKB: 300 },
    signatureSpec: { widthPx: 400, heightPx: 400, minKB: 20, maxKB: 100 },
  },
  {
    slug: "ssc-cgl",
    shortName: "SSC CGL",
    fullName: "Staff Selection Commission Combined Graduate Level Examination",
    category: "Central Government Exams",
    photoSpec: { widthPx: 275, heightPx: 354, minKB: 20, maxKB: 50 },
    signatureSpec: { widthPx: 140, heightPx: 60, minKB: 10, maxKB: 20 },
  },
  {
    slug: "ssc-chsl",
    shortName: "SSC CHSL",
    fullName: "Staff Selection Commission Combined Higher Secondary Level Examination",
    category: "Central Government Exams",
    photoSpec: { widthPx: 200, heightPx: 240, minKB: 20, maxKB: 50 },
    signatureSpec: { widthPx: 200, heightPx: 80, minKB: 10, maxKB: 20 },
  },
  {
    slug: "ssc-gd",
    shortName: "SSC GD",
    fullName: "Staff Selection Commission General Duty Constable Examination",
    category: "Central Government Exams",
    photoSpec: { widthPx: 200, heightPx: 240, minKB: 20, maxKB: 50 },
    signatureSpec: { widthPx: 240, heightPx: 80, minKB: 10, maxKB: 20 },
  },
  {
    slug: "neet",
    shortName: "NEET UG",
    fullName: "National Eligibility cum Entrance Test (Undergraduate)",
    category: "Central Government Exams",
    photoSpec: { widthPx: 275, heightPx: 354, minKB: 10, maxKB: 200 },
    signatureSpec: { widthPx: 275, heightPx: 118, minKB: 4, maxKB: 30 },
  },
  {
    slug: "neet-pg",
    shortName: "NEET PG",
    fullName: "National Eligibility cum Entrance Test (Postgraduate)",
    category: "Central Government Exams",
    photoSpec: { widthPx: 350, heightPx: 450, minKB: 10, maxKB: 80 },
    signatureSpec: { widthPx: 350, heightPx: 150, minKB: 10, maxKB: 80 },
  },
  {
    slug: "jee",
    shortName: "JEE Main",
    fullName: "Joint Entrance Examination (Main)",
    category: "Central Government Exams",
    photoSpec: { widthPx: 275, heightPx: 354, minKB: 10, maxKB: 200 },
    signatureSpec: { widthPx: 275, heightPx: 118, minKB: 10, maxKB: 100 },
  },
  {
    slug: "india-post-gds",
    shortName: "India Post GDS",
    fullName: "India Post Gramin Dak Sevak Recruitment",
    category: "Central Government Exams",
    photoSpec: { widthPx: 320, heightPx: 400, minKB: 30, maxKB: 100 },
    signatureSpec: { widthPx: 300, heightPx: 120, minKB: 20, maxKB: 100 },
  },
  {
    slug: "ssc-mts",
    shortName: "SSC MTS",
    fullName: "Staff Selection Commission Multi Tasking Staff Examination",
    category: "Central Government Exams",
    photoSpec: { widthPx: 200, heightPx: 240, minKB: 20, maxKB: 50 },
    signatureSpec: { widthPx: 240, heightPx: 80, minKB: 10, maxKB: 20 },
  },
  {
    slug: "iocl",
    shortName: "IOCL",
    fullName: "Indian Oil Corporation Limited Apprentice & Officer Recruitment",
    category: "Central Government Exams",
    photoSpec: { widthPx: 200, heightPx: 230, minKB: 20, maxKB: 50 },
    signatureSpec: { widthPx: 140, heightPx: 60, minKB: 10, maxKB: 20 },
  },
  {
    slug: "nptel",
    shortName: "NPTEL/SWAYAM",
    fullName: "NPTEL/SWAYAM Online Certification Examination",
    category: "Central Government Exams",
    photoSpec: { widthPx: 350, heightPx: 450, minKB: 10, maxKB: 200 },
    signatureSpec: { widthPx: 300, heightPx: 120, minKB: 4, maxKB: 30 },
  },
  {
    slug: "nicl",
    shortName: "NICL",
    fullName: "National Insurance Company Limited (AO & Assistant) Recruitment",
    category: "Central Government Exams",
    photoSpec: { widthPx: 200, heightPx: 230, minKB: 20, maxKB: 50 },
    signatureSpec: { widthPx: 140, heightPx: 60, minKB: 10, maxKB: 20 },
  },
  {
    slug: "dsssb",
    shortName: "DSSSB",
    fullName: "Delhi Subordinate Services Selection Board Recruitment Examination",
    category: "Central Government Exams",
    photoSpec: { widthPx: 480, heightPx: 672, minKB: 50, maxKB: 300 },
    signatureSpec: { widthPx: 140, heightPx: 110, minKB: 10, maxKB: 40 },
  },
  {
    slug: "rrb-alp",
    shortName: "RRB ALP",
    fullName: "Railway Recruitment Board Assistant Loco Pilot Examination",
    category: "Central Government Exams",
    photoSpec: { widthPx: 275, heightPx: 354, minKB: 50, maxKB: 150 },
    signatureSpec: { widthPx: 275, heightPx: 157, minKB: 30, maxKB: 49 },
  },
  {
    slug: "railway-rrb",
    shortName: "Railway RRB NTPC",
    fullName: "Railway Recruitment Board Non-Technical Popular Categories Examination",
    category: "Central Government Exams",
    photoSpec: { widthPx: 240, heightPx: 240, minKB: 30, maxKB: 70 },
    signatureSpec: { widthPx: 140, heightPx: 60, minKB: 30, maxKB: 70 },
  },
  {
    slug: "rrb-group-d",
    shortName: "RRB Group D",
    fullName: "Railway Recruitment Board Group D (Level 1) Examination",
    category: "Central Government Exams",
    photoSpec: { widthPx: 240, heightPx: 240, minKB: 20, maxKB: 50 },
    signatureSpec: { widthPx: 140, heightPx: 60, minKB: 10, maxKB: 40 },
  },
  {
    slug: "agniveer",
    shortName: "Agniveer",
    fullName: "Indian Army Agnipath Agniveer Recruitment",
    category: "Central Government Exams",
    photoSpec: { widthPx: 350, heightPx: 450, minKB: 10, maxKB: 50 },
    signatureSpec: { widthPx: 350, heightPx: 150, minKB: 10, maxKB: 20 },
  },
  {
    slug: "ssc-steno",
    shortName: "SSC Stenographer",
    fullName: "Staff Selection Commission Stenographer Grade C & D Examination",
    category: "Central Government Exams",
    photoSpec: { widthPx: 275, heightPx: 354, minKB: 20, maxKB: 50 },
    signatureSpec: { widthPx: 236, heightPx: 79, minKB: 10, maxKB: 20 },
  },
  {
    slug: "ssc-selection-post",
    shortName: "SSC Selection Post",
    fullName: "Staff Selection Commission Selection Post Examination",
    category: "Central Government Exams",
    photoSpec: { widthPx: 275, heightPx: 354, minKB: 20, maxKB: 50 },
    signatureSpec: { widthPx: 236, heightPx: 79, minKB: 10, maxKB: 20 },
  },
  {
    slug: "crpf",
    shortName: "CRPF",
    fullName: "Central Reserve Police Force Recruitment Examination",
    category: "Central Government Exams",
    photoSpec: { widthPx: 350, heightPx: 450, minKB: 50, maxKB: 100 },
    signatureSpec: { widthPx: 350, heightPx: 150, minKB: 20, maxKB: 50 },
  },
  {
    slug: "upsc-nda",
    shortName: "UPSC NDA & NA",
    fullName: "UPSC National Defence Academy & Naval Academy Examination",
    category: "Central Government Exams",
    photoSpec: { widthPx: 350, heightPx: 350, minKB: 20, maxKB: 300 },
    signatureSpec: { widthPx: 350, heightPx: 350, minKB: 20, maxKB: 300 },
  },
  {
    slug: "upsc-capf",
    shortName: "UPSC CAPF",
    fullName: "UPSC Central Armed Police Forces (Assistant Commandant) Examination",
    category: "Central Government Exams",
    photoSpec: { widthPx: 350, heightPx: 350, minKB: 20, maxKB: 300 },
    signatureSpec: { widthPx: 350, heightPx: 350, minKB: 20, maxKB: 300 },
  },
  {
    slug: "aibe",
    shortName: "AIBE",
    fullName: "All India Bar Examination",
    category: "Central Government Exams",
    photoSpec: { widthPx: 350, heightPx: 450, minKB: 10, maxKB: 50 },
    signatureSpec: { widthPx: 350, heightPx: 150, minKB: 10, maxKB: 20 },
  },
  {
    slug: "indian-navy",
    shortName: "Indian Navy Agniveer",
    fullName: "Indian Navy Agnipath Agniveer Recruitment",
    category: "Central Government Exams",
    photoSpec: { widthPx: 350, heightPx: 450, minKB: 10, maxKB: 50 },
    signatureSpec: { widthPx: 350, heightPx: 150, minKB: 10, maxKB: 20 },
  },

  // ---- State PSCs (Public Service Commissions) ----
  {
    slug: "wbcs",
    shortName: "WBCS",
    fullName: "West Bengal Civil Service Examination",
    category: "State PSCs (Public Service Commissions)",
    photoSpec: { widthPx: 138, heightPx: 177, minKB: 20, maxKB: 100 },
    signatureSpec: { widthPx: 138, heightPx: 59, minKB: 10, maxKB: 20 },
  },
  {
    slug: "opsc",
    shortName: "OPSC",
    fullName: "Odisha Public Service Commission Examination",
    category: "State PSCs (Public Service Commissions)",
    photoSpec: { widthPx: 200, heightPx: 240, minKB: 20, maxKB: 100 },
    signatureSpec: { widthPx: 140, heightPx: 60, minKB: 10, maxKB: 50 },
  },
  {
    slug: "apsc",
    shortName: "APSC",
    fullName: "Assam Public Service Commission Examination",
    category: "State PSCs (Public Service Commissions)",
    photoSpec: { widthPx: 200, heightPx: 250, minKB: 20, maxKB: 50 },
    signatureSpec: { widthPx: 140, heightPx: 60, minKB: 10, maxKB: 20 },
  },
  {
    slug: "mppsc",
    shortName: "MPPSC",
    fullName: "Madhya Pradesh Public Service Commission Examination",
    category: "State PSCs (Public Service Commissions)",
    photoSpec: { widthPx: 275, heightPx: 354, minKB: 25, maxKB: 200 },
    signatureSpec: { widthPx: 275, heightPx: 118, minKB: 25, maxKB: 200 },
  },
  {
    slug: "jpsc",
    shortName: "JPSC",
    fullName: "Jharkhand Public Service Commission Examination",
    category: "State PSCs (Public Service Commissions)",
    photoSpec: { widthPx: 275, heightPx: 354, minKB: 20, maxKB: 50 },
    signatureSpec: { widthPx: 275, heightPx: 118, minKB: 10, maxKB: 20 },
  },
  {
    slug: "mpsc",
    shortName: "MPSC (Maharashtra)",
    fullName: "Maharashtra Public Service Commission Examination",
    category: "State PSCs (Public Service Commissions)",
    photoSpec: { widthPx: 275, heightPx: 354, minKB: 20, maxKB: 50 },
    signatureSpec: { widthPx: 275, heightPx: 118, minKB: 10, maxKB: 20 },
  },
  {
    slug: "tnpsc",
    shortName: "TNPSC",
    fullName: "Tamil Nadu Public Service Commission Examination",
    category: "State PSCs (Public Service Commissions)",
    photoSpec: { widthPx: 275, heightPx: 354, minKB: 20, maxKB: 50 },
    signatureSpec: { widthPx: 275, heightPx: 118, minKB: 10, maxKB: 20 },
  },
  {
    slug: "kpsc",
    shortName: "KPSC (Kerala)",
    fullName: "Kerala Public Service Commission Examination",
    category: "State PSCs (Public Service Commissions)",
    photoSpec: { widthPx: 150, heightPx: 200, minKB: 20, maxKB: 30 },
    signatureSpec: { widthPx: 150, heightPx: 100, minKB: 20, maxKB: 30 },
  },
  {
    slug: "uppsc",
    shortName: "UPPSC",
    fullName: "Uttar Pradesh Public Service Commission Examination",
    category: "State PSCs (Public Service Commissions)",
    photoSpec: { widthPx: 180, heightPx: 216, minKB: 20, maxKB: 50 },
    signatureSpec: { widthPx: 216, heightPx: 108, minKB: 10, maxKB: 30 },
  },
  {
    slug: "upsssc",
    shortName: "UPSSSC",
    fullName: "Uttar Pradesh Subordinate Services Selection Commission PET",
    category: "State PSCs (Public Service Commissions)",
    photoSpec: { widthPx: 350, heightPx: 450, minKB: 50, maxKB: 100 },
    signatureSpec: { widthPx: 350, heightPx: 150, minKB: 30, maxKB: 50 },
  },
  {
    slug: "gpsc",
    shortName: "GPSC",
    fullName: "Gujarat Public Service Commission Examination",
    category: "State PSCs (Public Service Commissions)",
    photoSpec: { widthPx: 130, heightPx: 180, minKB: 10, maxKB: 15 },
    signatureSpec: { widthPx: 275, heightPx: 90, minKB: 10, maxKB: 15 },
  },
  {
    slug: "rpsc",
    shortName: "RPSC",
    fullName: "Rajasthan Public Service Commission Examination",
    category: "State PSCs (Public Service Commissions)",
    photoSpec: { widthPx: 240, heightPx: 320, minKB: 20, maxKB: 50 },
    signatureSpec: { widthPx: 280, heightPx: 80, minKB: 20, maxKB: 50 },
  },
  {
    slug: "hpsc",
    shortName: "HPSC (Haryana)",
    fullName: "Haryana Public Service Commission Examination",
    category: "State PSCs (Public Service Commissions)",
    photoSpec: { widthPx: 138, heightPx: 177, minKB: 10, maxKB: 100 },
    signatureSpec: { widthPx: 138, heightPx: 59, minKB: 10, maxKB: 50 },
  },
  {
    slug: "bpsc",
    shortName: "BPSC (Bihar)",
    fullName: "Bihar Public Service Commission Examination",
    category: "State PSCs (Public Service Commissions)",
    photoSpec: { widthPx: 250, heightPx: 250, minKB: 20, maxKB: 50 },
    signatureSpec: { widthPx: 220, heightPx: 100, minKB: 10, maxKB: 20 },
  },
  {
    slug: "tspsc",
    shortName: "TSPSC",
    fullName: "Telangana State Public Service Commission Examination",
    category: "State PSCs (Public Service Commissions)",
    photoSpec: { widthPx: 275, heightPx: 354, minKB: 20, maxKB: 50 },
    signatureSpec: { widthPx: 275, heightPx: 118, minKB: 10, maxKB: 30 },
  },
  {
    slug: "cgpsc",
    shortName: "CGPSC",
    fullName: "Chhattisgarh Public Service Commission Examination",
    category: "State PSCs (Public Service Commissions)",
    photoSpec: { widthPx: 275, heightPx: 354, minKB: 30, maxKB: 100 },
    signatureSpec: { widthPx: 275, heightPx: 118, minKB: 20, maxKB: 50 },
  },
  {
    slug: "ukpsc",
    shortName: "UKPSC",
    fullName: "Uttarakhand Public Service Commission Examination",
    category: "State PSCs (Public Service Commissions)",
    photoSpec: { widthPx: 150, heightPx: 200, minKB: 30, maxKB: 50 },
    signatureSpec: { widthPx: 150, heightPx: 100, minKB: 20, maxKB: 30 },
  },
  {
    slug: "appsc",
    shortName: "APPSC (Arunachal Pradesh)",
    fullName: "Arunachal Pradesh Public Service Commission Examination",
    category: "State PSCs (Public Service Commissions)",
    photoSpec: { widthPx: 200, heightPx: 250, minKB: 50, maxKB: 100 },
    signatureSpec: { widthPx: 140, heightPx: 60, minKB: 20, maxKB: 50 },
  },
  {
    slug: "manipur-psc",
    shortName: "Manipur PSC",
    fullName: "Manipur Public Service Commission Examination",
    category: "State PSCs (Public Service Commissions)",
    photoSpec: { widthPx: 140, heightPx: 177, minKB: 20, maxKB: 50 },
    signatureSpec: { widthPx: 140, heightPx: 80, minKB: 10, maxKB: 20 },
  },
  {
    slug: "ppsc",
    shortName: "PPSC (Punjab)",
    fullName: "Punjab Public Service Commission Examination",
    category: "State PSCs (Public Service Commissions)",
    photoSpec: { widthPx: 140, heightPx: 177, minKB: 10, maxKB: 40 },
    signatureSpec: { widthPx: 140, heightPx: 80, minKB: 10, maxKB: 40 },
  },
  {
    slug: "goa-psc",
    shortName: "Goa PSC",
    fullName: "Goa Public Service Commission Examination",
    category: "State PSCs (Public Service Commissions)",
    photoSpec: { widthPx: 200, heightPx: 250, minKB: 10, maxKB: 500 },
    signatureSpec: { widthPx: 140, heightPx: 80, minKB: 10, maxKB: 500 },
  },
  {
    slug: "kas",
    shortName: "KAS (Kerala)",
    fullName: "Kerala Administrative Service Examination",
    category: "State PSCs (Public Service Commissions)",
    photoSpec: { widthPx: 150, heightPx: 200, minKB: 20, maxKB: 200 },
    signatureSpec: { widthPx: 140, heightPx: 80, minKB: 20, maxKB: 100 },
  },
  {
    slug: "hppsc",
    shortName: "HPPSC",
    fullName: "Himachal Pradesh Public Service Commission Examination",
    category: "State PSCs (Public Service Commissions)",
    photoSpec: { widthPx: 110, heightPx: 140, minKB: 10, maxKB: 40 },
    signatureSpec: { widthPx: 110, heightPx: 140, minKB: 10, maxKB: 30 },
  },
  {
    slug: "mizoram-psc",
    shortName: "Mizoram PSC",
    fullName: "Mizoram Public Service Commission Examination",
    category: "State PSCs (Public Service Commissions)",
    photoSpec: { widthPx: 130, heightPx: 200, minKB: 0, maxKB: 10240 },
    signatureSpec: { widthPx: 177, heightPx: 98, minKB: 0, maxKB: 75 },
  },
  {
    slug: "meghalaya-psc",
    shortName: "Meghalaya PSC",
    fullName: "Meghalaya Public Service Commission Examination",
    category: "State PSCs (Public Service Commissions)",
    photoSpec: { widthPx: 150, heightPx: 200, minKB: 20, maxKB: 50 },
    signatureSpec: { widthPx: 150, heightPx: 100, minKB: 20, maxKB: 50 },
  },
  {
    slug: "nagaland-psc",
    shortName: "Nagaland PSC",
    fullName: "Nagaland Public Service Commission Examination",
    category: "State PSCs (Public Service Commissions)",
    photoSpec: { widthPx: 200, heightPx: 240, minKB: 0, maxKB: 100 },
    signatureSpec: { widthPx: 200, heightPx: 100, minKB: 0, maxKB: 100 },
  },
  {
    slug: "sikkim-psc",
    shortName: "Sikkim PSC",
    fullName: "Sikkim Public Service Commission Examination",
    category: "State PSCs (Public Service Commissions)",
    photoSpec: { widthPx: 150, heightPx: 200, minKB: 10, maxKB: 50 },
    signatureSpec: { widthPx: 150, heightPx: 100, minKB: 5, maxKB: 30 },
  },
  {
    slug: "tripura-psc",
    shortName: "Tripura PSC",
    fullName: "Tripura Public Service Commission Examination",
    category: "State PSCs (Public Service Commissions)",
    photoSpec: { widthPx: 200, heightPx: 250, minKB: 20, maxKB: 100 },
    signatureSpec: { widthPx: 200, heightPx: 100, minKB: 10, maxKB: 50 },
  },
  {
    slug: "jkpsc",
    shortName: "JKPSC",
    fullName: "Jammu & Kashmir Public Service Commission Examination",
    category: "State PSCs (Public Service Commissions)",
    photoSpec: { widthPx: 200, heightPx: 240, minKB: 10, maxKB: 20 },
    signatureSpec: { widthPx: 200, heightPx: 100, minKB: 10, maxKB: 20 },
  },
  {
    slug: "jkssb",
    shortName: "JKSSB",
    fullName: "Jammu & Kashmir Services Selection Board Examination",
    category: "State PSCs (Public Service Commissions)",
    photoSpec: { widthPx: 180, heightPx: 225, minKB: 20, maxKB: 50 },
    signatureSpec: { widthPx: 180, heightPx: 100, minKB: 10, maxKB: 20 },
  },

  // ---- Banking Exams ----
  {
    slug: "sbi-clerk",
    shortName: "SBI Clerk",
    fullName: "State Bank of India Junior Associate (Clerk) Recruitment",
    category: "Banking Exams",
    photoSpec: { widthPx: 200, heightPx: 230, minKB: 20, maxKB: 50 },
    signatureSpec: { widthPx: 140, heightPx: 60, minKB: 10, maxKB: 20 },
  },
  {
    slug: "sbi-po",
    shortName: "SBI PO",
    fullName: "State Bank of India Probationary Officer Recruitment",
    category: "Banking Exams",
    photoSpec: { widthPx: 200, heightPx: 230, minKB: 20, maxKB: 50 },
    signatureSpec: { widthPx: 140, heightPx: 60, minKB: 10, maxKB: 20 },
  },
  {
    slug: "rbi-grade-b",
    shortName: "RBI Grade B",
    fullName: "Reserve Bank of India Grade B Officer Recruitment",
    category: "Banking Exams",
    photoSpec: { widthPx: 200, heightPx: 230, minKB: 20, maxKB: 50 },
    signatureSpec: { widthPx: 140, heightPx: 60, minKB: 10, maxKB: 20 },
  },
  {
    slug: "sbi-cbo",
    shortName: "SBI CBO",
    fullName: "State Bank of India Circle Based Officer Recruitment",
    category: "Banking Exams",
    photoSpec: { widthPx: 200, heightPx: 230, minKB: 20, maxKB: 50 },
    signatureSpec: { widthPx: 140, heightPx: 60, minKB: 10, maxKB: 20 },
  },
  {
    slug: "idbi-am",
    shortName: "IDBI AM",
    fullName: "IDBI Bank Assistant Manager Recruitment",
    category: "Banking Exams",
    photoSpec: { widthPx: 200, heightPx: 230, minKB: 20, maxKB: 50 },
    signatureSpec: { widthPx: 140, heightPx: 60, minKB: 10, maxKB: 20 },
  },
  {
    slug: "boi-po",
    shortName: "BOI PO",
    fullName: "Bank of India Probationary Officer Recruitment",
    category: "Banking Exams",
    photoSpec: { widthPx: 200, heightPx: 230, minKB: 20, maxKB: 50 },
    signatureSpec: { widthPx: 140, heightPx: 60, minKB: 10, maxKB: 20 },
  },
  {
    slug: "canara-bank",
    shortName: "Canara Bank",
    fullName: "Canara Bank PO/Clerk Recruitment",
    category: "Banking Exams",
    photoSpec: { widthPx: 200, heightPx: 230, minKB: 20, maxKB: 50 },
    signatureSpec: { widthPx: 140, heightPx: 60, minKB: 10, maxKB: 20 },
  },
  {
    slug: "union-bank",
    shortName: "Union Bank of India",
    fullName: "Union Bank of India PO/Clerk Recruitment",
    category: "Banking Exams",
    photoSpec: { widthPx: 200, heightPx: 230, minKB: 20, maxKB: 50 },
    signatureSpec: { widthPx: 140, heightPx: 60, minKB: 10, maxKB: 20 },
  },
  {
    slug: "central-bank-india",
    shortName: "Central Bank of India",
    fullName: "Central Bank of India PO/Clerk Recruitment",
    category: "Banking Exams",
    photoSpec: { widthPx: 200, heightPx: 230, minKB: 20, maxKB: 50 },
    signatureSpec: { widthPx: 140, heightPx: 60, minKB: 10, maxKB: 20 },
  },
  {
    slug: "rbi-assistant",
    shortName: "RBI Assistant",
    fullName: "Reserve Bank of India Assistant Recruitment",
    category: "Banking Exams",
    photoSpec: { widthPx: 200, heightPx: 230, minKB: 20, maxKB: 50 },
    signatureSpec: { widthPx: 140, heightPx: 60, minKB: 10, maxKB: 20 },
  },
  {
    slug: "ibps",
    shortName: "IBPS",
    fullName: "Institute of Banking Personnel Selection (PO/Clerk) Examination",
    category: "Banking Exams",
    photoSpec: { widthPx: 200, heightPx: 230, minKB: 20, maxKB: 50 },
    signatureSpec: { widthPx: 140, heightPx: 60, minKB: 10, maxKB: 20 },
  },

  // ---- Police Exams ----
  {
    slug: "wb-police",
    shortName: "West Bengal Police",
    fullName: "West Bengal Police Constable/SI Recruitment Examination",
    category: "Police Exams",
    photoSpec: { widthPx: 200, heightPx: 240, minKB: 10, maxKB: 50 },
    signatureSpec: { widthPx: 140, heightPx: 80, minKB: 10, maxKB: 50 },
  },
  {
    slug: "haryana-police",
    shortName: "Haryana Police",
    fullName: "Haryana Police Constable/SI Recruitment Examination",
    category: "Police Exams",
    photoSpec: { widthPx: 138, heightPx: 177, minKB: 20, maxKB: 40 },
    signatureSpec: { widthPx: 138, heightPx: 59, minKB: 10, maxKB: 30 },
  },
  {
    slug: "rajasthan-police",
    shortName: "Rajasthan Police",
    fullName: "Rajasthan Police Constable/SI Recruitment Examination",
    category: "Police Exams",
    photoSpec: { widthPx: 350, heightPx: 450, minKB: 50, maxKB: 100 },
    signatureSpec: { widthPx: 400, heightPx: 200, minKB: 20, maxKB: 50 },
  },
  {
    slug: "maharashtra-police",
    shortName: "Maharashtra Police",
    fullName: "Maharashtra Police Constable/SI Recruitment Examination",
    category: "Police Exams",
    photoSpec: { widthPx: 160, heightPx: 200, minKB: 5, maxKB: 20 },
    signatureSpec: { widthPx: 256, heightPx: 64, minKB: 5, maxKB: 20 },
  },
  {
    slug: "up-police",
    shortName: "UP Police (OTR)",
    fullName: "Uttar Pradesh Police Constable/SI One Time Registration",
    category: "Police Exams",
    photoSpec: { widthPx: 180, heightPx: 225, minKB: 20, maxKB: 50 },
    signatureSpec: { widthPx: 200, heightPx: 80, minKB: 5, maxKB: 20 },
  },
  {
    slug: "tn-police",
    shortName: "Tamil Nadu Police",
    fullName: "Tamil Nadu Police Constable/SI Recruitment Examination",
    category: "Police Exams",
    photoSpec: { widthPx: 275, heightPx: 354, minKB: 20, maxKB: 50 },
    signatureSpec: { widthPx: 200, heightPx: 80, minKB: 10, maxKB: 20 },
  },
  {
    slug: "kerala-police",
    shortName: "Kerala Police",
    fullName: "Kerala Police Constable/SI Recruitment Examination",
    category: "Police Exams",
    photoSpec: { widthPx: 150, heightPx: 200, minKB: 20, maxKB: 30 },
    signatureSpec: { widthPx: 150, heightPx: 100, minKB: 20, maxKB: 30 },
  },
  {
    slug: "bihar-police",
    shortName: "Bihar Police",
    fullName: "Bihar Police Constable/SI Recruitment Examination",
    category: "Police Exams",
    photoSpec: { widthPx: 200, heightPx: 230, minKB: 30, maxKB: 50 },
    signatureSpec: { widthPx: 140, heightPx: 60, minKB: 20, maxKB: 50 },
  },
  {
    slug: "assam-police",
    shortName: "Assam Police",
    fullName: "Assam Police Constable/SI Recruitment Examination",
    category: "Police Exams",
    photoSpec: { widthPx: 280, heightPx: 350, minKB: 100, maxKB: 450 },
    signatureSpec: { widthPx: 280, heightPx: 200, minKB: 50, maxKB: 100 },
  },
  {
    slug: "mp-police",
    shortName: "Madhya Pradesh Police",
    fullName: "Madhya Pradesh Police Constable/SI Recruitment Examination",
    category: "Police Exams",
    photoSpec: { widthPx: 200, heightPx: 250, minKB: 50, maxKB: 200 },
    signatureSpec: { widthPx: 300, heightPx: 100, minKB: 30, maxKB: 100 },
  },
  {
    slug: "karnataka-police",
    shortName: "Karnataka Police",
    fullName: "Karnataka Police Constable/SI Recruitment Examination",
    category: "Police Exams",
    photoSpec: { widthPx: 200, heightPx: 250, minKB: 30, maxKB: 100 },
    signatureSpec: { widthPx: 140, heightPx: 80, minKB: 20, maxKB: 50 },
  },
  {
    slug: "telangana-police",
    shortName: "Telangana Police",
    fullName: "Telangana Police Constable/SI Recruitment Examination",
    category: "Police Exams",
    photoSpec: { widthPx: 275, heightPx: 354, minKB: 20, maxKB: 50 },
    signatureSpec: { widthPx: 200, heightPx: 80, minKB: 10, maxKB: 30 },
  },
  {
    slug: "gujarat-police",
    shortName: "Gujarat Police",
    fullName: "Gujarat Police Constable/SI Recruitment Examination",
    category: "Police Exams",
    photoSpec: { widthPx: 200, heightPx: 250, minKB: 30, maxKB: 100 },
    signatureSpec: { widthPx: 140, heightPx: 80, minKB: 10, maxKB: 50 },
  },
  {
    slug: "jk-police",
    shortName: "J&K Police",
    fullName: "Jammu & Kashmir Police Constable/SI Recruitment Examination",
    category: "Police Exams",
    photoSpec: { widthPx: 200, heightPx: 250, minKB: 50, maxKB: 200 },
    signatureSpec: { widthPx: 140, heightPx: 80, minKB: 20, maxKB: 100 },
  },
  {
    slug: "delhi-police",
    shortName: "Delhi Police",
    fullName: "Delhi Police Constable/SI Recruitment Examination",
    category: "Police Exams",
    photoSpec: { widthPx: 100, heightPx: 120, minKB: 20, maxKB: 50 },
    signatureSpec: { widthPx: 140, heightPx: 60, minKB: 10, maxKB: 20 },
  },
  {
    slug: "punjab-police",
    shortName: "Punjab Police",
    fullName: "Punjab Police Constable/SI Recruitment Examination",
    category: "Police Exams",
    photoSpec: { widthPx: 200, heightPx: 240, minKB: 20, maxKB: 50 },
    signatureSpec: { widthPx: 140, heightPx: 80, minKB: 10, maxKB: 20 },
  },
  {
    slug: "hp-police",
    shortName: "Himachal Pradesh Police",
    fullName: "Himachal Pradesh Police Constable/SI Recruitment Examination",
    category: "Police Exams",
    photoSpec: { widthPx: 110, heightPx: 140, minKB: 10, maxKB: 40 },
    signatureSpec: { widthPx: 140, heightPx: 110, minKB: 10, maxKB: 40 },
  },
  {
    slug: "uttarakhand-police",
    shortName: "Uttarakhand Police",
    fullName: "Uttarakhand Police Constable/SI Recruitment Examination",
    category: "Police Exams",
    photoSpec: { widthPx: 150, heightPx: 200, minKB: 10, maxKB: 20 },
    signatureSpec: { widthPx: 150, heightPx: 100, minKB: 10, maxKB: 20 },
  },
  {
    slug: "odisha-police",
    shortName: "Odisha Police",
    fullName: "Odisha Police Constable/SI Recruitment Examination",
    category: "Police Exams",
    photoSpec: { widthPx: 200, heightPx: 240, minKB: 35, maxKB: 50 },
    signatureSpec: { widthPx: 140, heightPx: 60, minKB: 25, maxKB: 50 },
  },
  {
    slug: "cg-police",
    shortName: "Chhattisgarh Police",
    fullName: "Chhattisgarh Police Constable/SI Recruitment Examination",
    category: "Police Exams",
    photoSpec: { widthPx: 200, heightPx: 240, minKB: 50, maxKB: 200 },
    signatureSpec: { widthPx: 140, heightPx: 80, minKB: 10, maxKB: 50 },
  },
  {
    slug: "goa-police",
    shortName: "Goa Police",
    fullName: "Goa Police Constable/SI Recruitment Examination",
    category: "Police Exams",
    photoSpec: { widthPx: 600, heightPx: 600, minKB: 20, maxKB: 500 },
    signatureSpec: { widthPx: 200, heightPx: 100, minKB: 10, maxKB: 50 },
  },
  {
    slug: "meghalaya-police",
    shortName: "Meghalaya Police",
    fullName: "Meghalaya Police Constable/SI Recruitment Examination",
    category: "Police Exams",
    photoSpec: { widthPx: 140, heightPx: 178, minKB: 20, maxKB: 50 },
    signatureSpec: { widthPx: 178, heightPx: 140, minKB: 10, maxKB: 50 },
  },
  {
    slug: "manipur-police",
    shortName: "Manipur Police",
    fullName: "Manipur Police Constable/SI Recruitment Examination",
    category: "Police Exams",
    photoSpec: { widthPx: 200, heightPx: 240, minKB: 20, maxKB: 50 },
    signatureSpec: { widthPx: 140, heightPx: 80, minKB: 10, maxKB: 20 },
  },
  {
    slug: "tripura-police",
    shortName: "Tripura Police",
    fullName: "Tripura Police Constable/SI Recruitment Examination",
    category: "Police Exams",
    photoSpec: { widthPx: 200, heightPx: 240, minKB: 20, maxKB: 50 },
    signatureSpec: { widthPx: 140, heightPx: 80, minKB: 10, maxKB: 20 },
  },

  // ---- Judiciary Exams ----
  {
    slug: "delhi-judiciary",
    shortName: "Delhi Judicial Service",
    fullName: "Delhi Judicial Service (Civil Judge) Examination",
    category: "Judiciary Exams",
    photoSpec: { widthPx: 200, heightPx: 240, minKB: 20, maxKB: 50 },
    signatureSpec: { widthPx: 140, heightPx: 80, minKB: 10, maxKB: 20 },
  },
  {
    slug: "patna-hc-stenographer",
    shortName: "Patna High Court Stenographer",
    fullName: "Patna High Court Stenographer Recruitment Examination",
    category: "Judiciary Exams",
    photoSpec: { widthPx: 200, heightPx: 240, minKB: 20, maxKB: 50 },
    signatureSpec: { widthPx: 140, heightPx: 80, minKB: 10, maxKB: 20 },
  },
  {
    slug: "bombay-hc-clerk",
    shortName: "Bombay High Court Clerk",
    fullName: "Bombay High Court Clerk Recruitment Examination",
    category: "Judiciary Exams",
    photoSpec: { widthPx: 200, heightPx: 240, minKB: 20, maxKB: 50 },
    signatureSpec: { widthPx: 120, heightPx: 80, minKB: 10, maxKB: 20 },
  },
  {
    slug: "himachal-hc-stenographer",
    shortName: "Himachal Pradesh High Court Stenographer",
    fullName: "Himachal Pradesh High Court Stenographer Recruitment Examination",
    category: "Judiciary Exams",
    photoSpec: { widthPx: 200, heightPx: 240, minKB: 20, maxKB: 50 },
    signatureSpec: { widthPx: 140, heightPx: 80, minKB: 10, maxKB: 20 },
  },
  {
    slug: "gauhati-hc-clerk",
    shortName: "Gauhati High Court Clerk",
    fullName: "Gauhati High Court Clerk Recruitment Examination",
    category: "Judiciary Exams",
    photoSpec: { widthPx: 200, heightPx: 240, minKB: 20, maxKB: 100 },
    signatureSpec: { widthPx: 140, heightPx: 80, minKB: 10, maxKB: 50 },
  },
  {
    slug: "maharashtra-judiciary",
    shortName: "Maharashtra Judicial Service",
    fullName: "Maharashtra Judicial Service (Civil Judge) Examination",
    category: "Judiciary Exams",
    photoSpec: { widthPx: 200, heightPx: 240, minKB: 20, maxKB: 50 },
    signatureSpec: { widthPx: 140, heightPx: 80, minKB: 10, maxKB: 20 },
  },
  {
    slug: "chhattisgarh-judiciary",
    shortName: "Chhattisgarh Judicial Service",
    fullName: "Chhattisgarh Judicial Service (Civil Judge) Examination",
    category: "Judiciary Exams",
    photoSpec: { widthPx: 200, heightPx: 240, minKB: 20, maxKB: 100 },
    signatureSpec: { widthPx: 140, heightPx: 80, minKB: 10, maxKB: 100 },
  },
  {
    slug: "rajasthan-judiciary",
    shortName: "Rajasthan Judicial Service",
    fullName: "Rajasthan Judicial Service (Civil Judge) Examination",
    category: "Judiciary Exams",
    photoSpec: { widthPx: 240, heightPx: 320, minKB: 20, maxKB: 50 },
    signatureSpec: { widthPx: 280, heightPx: 80, minKB: 20, maxKB: 50 },
  },
  {
    slug: "karnataka-judiciary",
    shortName: "Karnataka Judicial Service",
    fullName: "Karnataka Judicial Service (Civil Judge) Examination",
    category: "Judiciary Exams",
    photoSpec: { widthPx: 200, heightPx: 240, minKB: 20, maxKB: 50 },
    signatureSpec: { widthPx: 140, heightPx: 80, minKB: 10, maxKB: 20 },
  },
  {
    slug: "wb-judiciary",
    shortName: "West Bengal Judicial Service",
    fullName: "West Bengal Judicial Service (Civil Judge) Examination",
    category: "Judiciary Exams",
    photoSpec: { widthPx: 200, heightPx: 240, minKB: 20, maxKB: 50 },
    signatureSpec: { widthPx: 140, heightPx: 80, minKB: 10, maxKB: 20 },
  },

  // ---- Other / Education Exams ----
  {
    slug: "polytechnic",
    shortName: "Polytechnic Admissions",
    fullName: "State Polytechnic Admission / Entrance Examination",
    category: "Other / Education Exams",
    photoSpec: { widthPx: 350, heightPx: 450, minKB: 10, maxKB: 50 },
    signatureSpec: { widthPx: 350, heightPx: 150, minKB: 10, maxKB: 20 },
  },
  {
    slug: "iti",
    shortName: "ITI Admission",
    fullName: "Industrial Training Institute Admission",
    category: "Other / Education Exams",
    photoSpec: { widthPx: 350, heightPx: 450, minKB: 10, maxKB: 50 },
    signatureSpec: { widthPx: 350, heightPx: 150, minKB: 10, maxKB: 20 },
  },
  {
    slug: "tancet",
    shortName: "TANCET",
    fullName: "Tamil Nadu Common Entrance Test",
    category: "Other / Education Exams",
    photoSpec: { widthPx: 240, heightPx: 320, minKB: 20, maxKB: 50 },
    signatureSpec: { widthPx: 250, heightPx: 70, minKB: 10, maxKB: 20 },
  },
  {
    slug: "up-bed",
    shortName: "UP B.Ed JEE",
    fullName: "Uttar Pradesh B.Ed Joint Entrance Examination",
    category: "Other / Education Exams",
    photoSpec: { widthPx: 350, heightPx: 450, minKB: 20, maxKB: 50 },
    signatureSpec: { widthPx: 350, heightPx: 150, minKB: 20, maxKB: 50 },
  },
  {
    slug: "hp-home-guard",
    shortName: "HP Home Guard",
    fullName: "Himachal Pradesh Home Guard Recruitment",
    category: "Other / Education Exams",
    photoSpec: { widthPx: 350, heightPx: 450, minKB: 10, maxKB: 40 },
    signatureSpec: { widthPx: 350, heightPx: 150, minKB: 10, maxKB: 20 },
  },
  {
    slug: "up-deled",
    shortName: "UP D.El.Ed",
    fullName: "Uttar Pradesh Diploma in Elementary Education Entrance Examination",
    category: "Other / Education Exams",
    photoSpec: { widthPx: 350, heightPx: 450, minKB: 10, maxKB: 50 },
    signatureSpec: { widthPx: 350, heightPx: 150, minKB: 2, maxKB: 20 },
  },
  {
    slug: "tet",
    shortName: "TET",
    fullName: "Teacher Eligibility Test (generic/state)",
    category: "Other / Education Exams",
    photoSpec: { widthPx: 350, heightPx: 450, minKB: 10, maxKB: 50 },
    signatureSpec: { widthPx: 350, heightPx: 150, minKB: 10, maxKB: 20 },
  },
  {
    slug: "pcc",
    shortName: "Police Clearance Certificate",
    fullName: "Police Clearance Certificate Application",
    category: "Other / Education Exams",
    photoSpec: { widthPx: 350, heightPx: 450, minKB: 50, maxKB: 100 },
    signatureSpec: { widthPx: 350, heightPx: 150, minKB: 10, maxKB: 20 },
  },
];

export function getResizerExamBySlug(slug: string): ResizerExamSpec | undefined {
  return RESIZER_EXAMS.find((e) => e.slug.toLowerCase() === slug.toLowerCase());
}

export interface ResizerCategory {
  slug: string;
  label: string;
  exams: ResizerExamSpec[];
}

function slugifyCategory(label: string): string {
  return label
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

// Derived once from RESIZER_EXAMS (in source order) rather than hand-listed,
// so a category can never drift out of sync with the exams that actually
// carry it — the same reasoning as getResizerExamBySlug reading off the one
// array instead of a parallel lookup table.
const RESIZER_CATEGORIES: ResizerCategory[] = (() => {
  const bySlug = new Map<string, ResizerCategory>();
  for (const exam of RESIZER_EXAMS) {
    const slug = slugifyCategory(exam.category);
    const existing = bySlug.get(slug);
    if (existing) {
      existing.exams.push(exam);
    } else {
      bySlug.set(slug, { slug, label: exam.category, exams: [exam] });
    }
  }
  return [...bySlug.values()];
})();

export function getResizerCategories(): ResizerCategory[] {
  return RESIZER_CATEGORIES;
}

export function getResizerCategoryBySlug(slug: string): ResizerCategory | undefined {
  return RESIZER_CATEGORIES.find((c) => c.slug === slug.toLowerCase());
}

// Exam objects only carry their category as a label string (for display),
// not the slug — this resolves the slug for breadcrumbs without adding a
// second field to every exam entry that would need to stay in sync by hand.
export function getCategoryForExam(exam: ResizerExamSpec): ResizerCategory | undefined {
  return RESIZER_CATEGORIES.find((c) => c.label === exam.category);
}

// Exam pages and category pages share ONE flat URL namespace
// (clearcutoff.in/tools/resizer/{slug} — see src/app/[slug]/page.tsx), so an
// exam slug and a category slug can never collide, or one page would
// silently shadow the other. Category slugs are derived from category
// labels (slugifyCategory above), not hand-picked, so this can't be caught
// by code review the way a hardcoded duplicate would — it has to be an
// assertion that fails loudly the moment a colliding exam is added.
const collidingSlug = RESIZER_CATEGORIES.map((c) => c.slug).find((slug) => getResizerExamBySlug(slug));
if (collidingSlug) {
  throw new Error(
    `resizerExams.ts: category slug "${collidingSlug}" collides with an exam slug — rename the exam's slug or the category label.`,
  );
}

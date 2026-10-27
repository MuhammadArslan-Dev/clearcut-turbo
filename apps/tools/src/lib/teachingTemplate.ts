// Teaching-exam resizer template (CC-159): the "{Exam} Photo & Signature
// Size {Year} ({KB})" title/H1/meta, the exam FAQ, the "upload problems"
// rows and the "Verified against [link] on [date]" sources.
//
// Every number shown comes from the exam's own documents (tools backend →
// toolsApi.ts), never from copy in this file or the dictionary, so a spec
// change in the sheet changes the title, FAQ and fixes together.

import { getExamFaqs, isPhotoLiveCapture, type ExamDocument, type ExamDocumentType, type ResizerExamSpec } from "./resizerExams";
import { getDict, type Locale } from "./dictionary";
import { getAgeEligibilityExams } from "./ageEligibility";

/**
 * Rollout set (CC-159): teaching exams get the new template first. UP TGT,
 * UP PGT (and Canara Bank, TNPSC) are deliberately not here — they already
 * convert well, so they stay on the old title until a baseline is logged.
 */
// UPTET ("up-tet") joins once its specs are verified from upessc.up.gov.in.
const TEMPLATE_SLUGS = new Set(["ctet", "ugc-net", "htet", "hptet", "reet"]);

/** Application session used in titles when the sheet has no `sessionTag` for the exam. */
export const DEFAULT_SESSION = "2026";

/** The template covers English and Hindi pages; Marathi keeps the old copy. */
export function usesTeachingTemplate(exam: Pick<ResizerExamSpec, "slug">, locale: Locale): boolean {
  return TEMPLATE_SLUGS.has(exam.slug) && locale !== "mr";
}

export function sessionOf(exam: Pick<ResizerExamSpec, "sessionTag">): string {
  return exam.sessionTag ?? DEFAULT_SESSION;
}

type UploadDoc = ExamDocument & { spec: NonNullable<ExamDocument["spec"]>; noMinimum: boolean };

/** Documents the student uploads (not live-captured) that have a full size spec, in display order. */
function uploadDocs(exam: ResizerExamSpec): UploadDoc[] {
  return exam.documents
    .filter((d) => d.mode === "upload" && d.spec !== null)
    .map((d) => ({ ...d, spec: d.spec!, noMinimum: exam.noMinimumDocs.includes(d.type) }));
}

/** "10–100 KB", or "up to 19 KB" when the notice gives only a maximum. */
function kbRange(doc: UploadDoc, locale: Locale, dash = "–"): string {
  return doc.noMinimum ? getDict(locale).teaching.upToKB(doc.spec.maxKB) : `${doc.spec.minKB}${dash}${doc.spec.maxKB} KB`;
}

function specText(doc: UploadDoc, locale: Locale): string {
  return `${doc.spec.widthPx}×${doc.spec.heightPx} px, ${kbRange(doc, locale)}`;
}

function formatLabel(format: string): string {
  const f = format.toLowerCase();
  if (f === "jpg" || f === "jpeg") return "JPG/JPEG";
  return f.toUpperCase();
}

function formatsOf(docs: UploadDoc[]): string {
  return [...new Set(docs.map((d) => formatLabel(d.format)))].join(", ");
}

const docName = (locale: Locale, type: ExamDocumentType) => getDict(locale).teaching.docName[type];

/** Title, meta description and H1 for a template exam. */
export function teachingSeo(exam: ResizerExamSpec, locale: Locale) {
  const t = getDict(locale).teaching;
  const year = sessionOf(exam);
  const docs = uploadDocs(exam);
  const photo = docs.find((d) => d.type === "photo");
  const signature = docs.find((d) => d.type === "signature");
  // The "(10-100 KB)" in the title is the photo's range; an exam whose photo
  // is captured live on the portal falls back to its first uploaded document.
  const headline = photo ?? docs[0];
  const kb = headline ? kbRange(headline, locale, "-") : "";
  return {
    title: kb ? t.title(exam.shortName, year, kb) : `${t.h1(exam.shortName, year)} | Clear Cutoff`,
    description: t.description(
      exam.shortName,
      year,
      photo ? specText(photo, locale) : "—",
      signature ? specText(signature, locale) : "—",
    ),
    h1: t.h1(exam.shortName, year),
  };
}

/**
 * The sheet's `verification` is unverified | partly_verified |
 * official_verified (tools backend ToolExamDocument::VERIFICATIONS). Only
 * official_verified with its source link and date counts here.
 */
function isOfficiallyVerified(doc: ExamDocument): doc is ExamDocument & { sourceUrl: string; verifiedOn: string } {
  return doc.verification === "official_verified" && !!doc.sourceUrl && !!doc.verifiedOn;
}

export interface VerifiedSource {
  url: string;
  /** ISO date, YYYY-MM-DD. */
  date: string;
}

/**
 * Official sources the exam's specs were checked against — one entry per
 * distinct URL, with its latest check date. Only documents marked verified
 * in the sheet count, so an unverified exam returns [] and shows no block.
 */
export function verifiedSources(exam: ResizerExamSpec): VerifiedSource[] {
  const byUrl = new Map<string, string>();
  for (const doc of uploadDocs(exam)) {
    if (!isOfficiallyVerified(doc)) continue;
    const prev = byUrl.get(doc.sourceUrl);
    if (!prev || doc.verifiedOn > prev) byUrl.set(doc.sourceUrl, doc.verifiedOn);
  }
  return [...byUrl].map(([url, date]) => ({ url, date }));
}

/**
 * The upload-problems section is published only when every uploaded
 * document of the exam is verified against an official source (CC-159:
 * "do not publish until the spec box is filled and verified").
 */
export function hasVerifiedSpecs(exam: ResizerExamSpec): boolean {
  const docs = uploadDocs(exam);
  return docs.length > 0 && docs.every(isOfficiallyVerified);
}

export interface UploadProblem {
  /** Stable anchor, e.g. "photo-too-large" — linkable as #photo-too-large. */
  id: string;
  problem: string;
  why: string;
  fix: string;
}

/** Problem / why / fix rows built from the exam's own verified numbers (6–8 rows for photo + signature [+ thumb]). */
export function uploadProblems(exam: ResizerExamSpec, locale: Locale): UploadProblem[] {
  const r = getDict(locale).teaching.rows;
  const docs = uploadDocs(exam);
  const s = exam.shortName;
  const rows: UploadProblem[] = [];

  for (const doc of docs) {
    const name = docName(locale, doc.type);
    const id = doc.type.replace(/_/g, "-");
    rows.push({ id: `${id}-too-large`, problem: r.tooLargeQ(s, name, doc.spec.maxKB), why: r.tooLargeWhy, fix: r.tooLargeFix(name, specText(doc, locale)) });
    // No official minimum (e.g. HPTET "less than 20 kb") → no "too small" problem to describe.
    if (!doc.noMinimum) {
      rows.push({ id: `${id}-too-small`, problem: r.tooSmallQ(s, name, doc.spec.minKB), why: r.tooSmallWhy, fix: r.tooSmallFix(name, specText(doc, locale)) });
    }
  }
  if (docs.length > 0) {
    rows.push({ id: "wrong-format", problem: r.wrongFormatQ(s), why: r.wrongFormatWhy, fix: r.wrongFormatFix(formatsOf(docs)) });
    rows.push({ id: "photo-blurred", problem: r.blurredQ(s), why: r.blurredWhy, fix: r.blurredFix });
  }
  return rows;
}

/** Exam FAQ for template pages — replaces the off-intent notes / minimum-marks / best-app questions. */
export function teachingFaqs(exam: ResizerExamSpec, locale: Locale, withProblemsSection: boolean) {
  const f = getDict(locale).teaching.faq;
  const s = exam.shortName;
  const docs = uploadDocs(exam);
  return [
    ...docs.map((doc) => {
      const name = docName(locale, doc.type);
      return { q: f.sizeQ(s, name), a: f.sizeA(s, name, specText(doc, locale), formatLabel(doc.format)) };
    }),
    ...(docs.length > 0 ? [{ q: f.formatQ(s), a: f.formatA(formatsOf(docs)) }] : []),
    { q: f.rejectQ(s), a: withProblemsSection ? f.rejectWithSection(s) : f.rejectNoSection(s) },
    { q: f.privacyQ, a: f.privacyA },
  ];
}

const DATE_LOCALE: Record<Locale, string> = { en: "en-GB", hi: "hi-IN", mr: "mr-IN" };

/** "12 Oct 2026" style date for the verified block. */
export function formatVerifiedDate(iso: string, locale: Locale): string {
  const date = new Date(`${iso}T00:00:00Z`);
  if (Number.isNaN(date.getTime())) return iso;
  return new Intl.DateTimeFormat(DATE_LOCALE[locale], { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" }).format(date);
}

/**
 * Slug of the exam's age-limit calculator page, if one is built. The two
 * tools name some exams differently ("up-tet" here, "uptet" there), so the
 * hyphen-less form is tried too.
 */
export async function ageCalculatorSlugFor(slug: string): Promise<string | undefined> {
  const available = new Set((await getAgeEligibilityExams()).map((exam) => exam.slug));
  return [slug, slug.replace(/-/g, "")].find((candidate) => available.has(candidate));
}

/** Whether this page shows the upload-problems section (template exam + fully verified specs). */
export function showsUploadProblems(exam: ResizerExamSpec, locale: Locale): boolean {
  return usesTeachingTemplate(exam, locale) && hasVerifiedSpecs(exam);
}

/** The Q&A of the page's visible FAQ section — template FAQ or the original one. */
export function spokeFaqs(exam: ResizerExamSpec, locale: Locale): { q: string; a: string }[] {
  if (usesTeachingTemplate(exam, locale)) return teachingFaqs(exam, locale, showsUploadProblems(exam, locale));
  return getExamFaqs(exam.shortName, exam.photoSpec, exam.signatureSpec, locale, { photoLive: isPhotoLiveCapture(exam) });
}

/**
 * Everything the FAQPage JSON-LD may describe: the FAQ section plus the
 * upload-problem rows when that section is on the page (one FAQPage per
 * page; Google requires every entry to be visible).
 */
export function spokeJsonLdFaqs(exam: ResizerExamSpec, locale: Locale): { q: string; a: string }[] {
  const faqs = spokeFaqs(exam, locale);
  if (!showsUploadProblems(exam, locale)) return faqs;
  const t = getDict(locale).teaching;
  return [
    ...faqs,
    ...uploadProblems(exam, locale).map((row) => ({ q: row.problem, a: `${t.whyLabel}: ${row.why} ${t.fixLabel}: ${row.fix}` })),
  ];
}

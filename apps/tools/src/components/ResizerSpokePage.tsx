import SiteHeader from "./SiteHeader";
import SiteFooter from "./SiteFooter";
import Text from "@clearcut/ui/text";
import ResizeImageTool from "./ResizeImageTool";
import FAQAccordion, { AccordionItem } from "./FAQAccordion";
import RecentExamTracker from "./RecentExamTracker";
import AppDownloadWidget from "./AppDownloadWidget";
import { FadeIn } from "./motion";
import { ResizerExamSpec, ResizerCategory, ExamDocument, ExamDocumentType, getExamFaqs, isPhotoLiveCapture } from "@/lib/resizerExams";
import type { PresetKey } from "./ResizeImageTool";
import { ExamOfficialRequirements } from "@/lib/officialRequirements";
import { getCategoryLabel, getDict, Locale } from "@/lib/dictionary";
import LocaleLink from "./LocaleLink";
import RelatedExams from "./RelatedExams";
import OfficialRequirements from "./OfficialRequirements";

const DOC_LABEL_KEY = {
  photo: "specPhoto",
  signature: "specSignature",
  left_thumb: "specLeftThumb",
  right_thumb: "specRightThumb",
  handwritten_declaration: "specDeclaration",
} as const satisfies Record<ExamDocumentType, string>;

// Which resizer tile handles which document type ("draw" is the Signature tile).
const PRESET_BY_DOC = {
  photo: "photo",
  signature: "draw",
  left_thumb: "thumb",
  right_thumb: "right_thumb",
  handwritten_declaration: "declaration",
} as const satisfies Record<ExamDocumentType, PresetKey>;

function SpecTable({ documents, locale }: { documents: ExamDocument[]; locale: Locale }) {
  const t = getDict(locale).spoke;

  return (
    <div className="max-w-[620px] mx-auto w-full overflow-x-auto rounded-2xl border border-[var(--color-border-gray-subtle)]">
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="bg-brand/5">
            <th className="px-4 py-3 body-medium !font-semibold text-text-gray-normal">{t.specDocument}</th>
            <th className="px-4 py-3 body-medium !font-semibold text-text-gray-normal">
              {getDict(locale).tool.dimensions}
            </th>
            <th className="px-4 py-3 body-medium !font-semibold text-text-gray-normal">{t.specFileSize}</th>
          </tr>
        </thead>
        <tbody>
          {documents.map((doc) => (
            <tr key={doc.type} className="border-t border-[var(--color-border-gray-subtle)]">
              <td className="px-4 py-3 body-medium !font-semibold text-text-gray-normal">{t[DOC_LABEL_KEY[doc.type]]}</td>
              {doc.mode === "live_capture" ? (
                <td colSpan={2} className="px-4 py-3 body-medium text-text-gray-muted">
                  {t.liveCapture}
                </td>
              ) : (
                <>
                  <td className="px-4 py-3 body-medium text-text-gray-muted">
                    {doc.spec ? `${doc.spec.widthPx}×${doc.spec.heightPx}px` : "—"}
                  </td>
                  <td className="px-4 py-3 body-medium text-text-gray-muted">
                    {doc.spec ? `${doc.spec.minKB}–${doc.spec.maxKB}KB` : "—"}
                  </td>
                </>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/**
 * Spoke page — one dynamic template (src/app/[examSlug]/page.tsx) rendering
 * this same component for every exam in resizerExams.ts, not a separate
 * hardcoded page per exam. Same tool as the hub (ResizeHubPage), plus an
 * exam-specific spec table and FAQ section.
 */
export default function ResizerSpokePage({
  exam,
  category,
  officialRequirements,
  locale = "en",
}: {
  exam: ResizerExamSpec;
  category?: ResizerCategory;
  officialRequirements?: ExamOfficialRequirements;
  locale?: Locale;
}) {
  const t = getDict(locale).spoke;
  const photoLive = isPhotoLiveCapture(exam);
  const hasExtraDocs = exam.documents.some((d) => d.type !== "photo" && d.type !== "signature");
  // Tiles = the exam's uploadable documents, in the backend's order. A
  // live-captured photograph gets no tile; if nothing is uploadable at all,
  // keep the classic Photo + Signature pair.
  const uploadDocs = exam.documents.filter((d) => d.mode === "upload");
  const allowedPresets: PresetKey[] = uploadDocs.length ? uploadDocs.map((d) => PRESET_BY_DOC[d.type]) : ["photo", "draw"];
  const specOf = (type: ExamDocumentType) => uploadDocs.find((d) => d.type === type)?.spec ?? undefined;
  const faqItems: AccordionItem[] = getExamFaqs(exam.shortName, exam.photoSpec, exam.signatureSpec, locale, { photoLive }).map(
    (faq, i) => ({
      id: `faq-${i}`,
      title: faq.q,
      content: faq.a,
    }),
  );
  return (
    <div>
      <RecentExamTracker exam={exam} />
      <SiteHeader locale={locale} />

      <div className="px-4 md:px-6 py-10 md:py-14">
        <FadeIn className="max-w-[620px] mx-auto text-center flex flex-col items-center gap-4 mb-10">
          <h1 className="heading-xlarge !text-[32px] md:!text-[48px] md:!leading-[1.25] !font-bold text-text-gray-normal">
            {t.h1(exam.shortName)}
          </h1>
          <p className="body-large !text-[17px] md:!text-[19px] text-text-gray-muted">{t.lead(exam.shortName, exam.fullName)}</p>
        </FadeIn>

        {/* Only Photo + Signature — the two document types resizerExams.ts
            actually has verified per-exam specs for, and the only pair the
            Image Resizer mode ever shows (matches ResizeHubPage). */}
        {photoLive && (
          <div className="max-w-[620px] mx-auto mb-6 rounded-xl border border-[var(--color-border-gray-subtle)] bg-[var(--color-gray-bg-soft)] p-4 text-center">
            <Text as="p" variant="body-small" color="gray-muted">
              {t.livePhotoNote(exam.shortName)}
            </Text>
          </div>
        )}

        <ResizeImageTool
          photoSpec={specOf("photo") ?? exam.photoSpec}
          signatureSpec={specOf("signature") ?? exam.signatureSpec}
          thumbSpec={specOf("left_thumb")}
          rightThumbSpec={specOf("right_thumb")}
          declarationSpec={specOf("handwritten_declaration")}
          allowedPresets={allowedPresets}
          locale={locale}
        />

        {category && (
          <RelatedExams
            exam={exam}
            categoryExams={category.exams}
            categoryLabel={getCategoryLabel(category.label, locale)}
            locale={locale}
          />
        )}

        <div className="mt-16 md:mt-20 flex flex-col items-center gap-4">
          <h2 className="heading-large !font-bold text-text-gray-normal text-center">
            {hasExtraDocs ? t.specsTitleDocs(exam.shortName) : t.specsTitle(exam.shortName)}
          </h2>
          <SpecTable documents={exam.documents} locale={locale} />
        </div>

        {officialRequirements && (
          <OfficialRequirements shortName={exam.shortName} data={officialRequirements} locale={locale} />
        )}

        <div className="mt-16 md:mt-20 max-w-[720px] mx-auto">
          <h2 className="heading-large !font-bold text-text-gray-normal text-center mb-6">
            {t.faqsTitle(exam.shortName)}
          </h2>
          <FAQAccordion items={faqItems} defaultOpenId={faqItems[0]?.id} />
        </div>

        <AppDownloadWidget locale={locale} />

        <div className="mt-10 text-center">
          <Text as="p" variant="body-small" color="gray-muted">
            {t.differentExamPrompt}{" "}
            <LocaleLink locale={locale} href="/" className="text-brand font-semibold">
              {t.useGeneralResizer}
            </LocaleLink>
          </Text>
        </div>
      </div>

      <SiteFooter locale={locale} />
    </div>
  );
}

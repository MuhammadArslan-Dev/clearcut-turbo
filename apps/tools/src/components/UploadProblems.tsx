import type { ReactNode } from "react";
import Text from "@clearcut/ui/text";
import FAQAccordion from "./FAQAccordion";
import OpenDetailsOnHash from "./OpenDetailsOnHash";
import type { ResizerExamSpec } from "@/lib/resizerExams";
import { getDict, type Locale } from "@/lib/dictionary";
import { formatVerifiedDate, sessionOf, uploadProblems, verifiedSources, type VerifiedSource } from "@/lib/teachingTemplate";

/** "Verified against ctet.nic.in on 12 Oct 2026" — one line per official source. */
export function VerifiedSourcesNote({ sources, locale }: { sources: VerifiedSource[]; locale: Locale }) {
  const t = getDict(locale).teaching;
  if (sources.length === 0) return null;
  return (
    <div className="flex flex-col gap-1 items-center text-center">
      {sources.map((source) => {
        let host: string = t.officialSource;
        try {
          host = new URL(source.url).hostname.replace(/^www\./, "");
        } catch {
          // keep the generic label for a malformed URL
        }
        return (
          <Text key={source.url} as="p" variant="body-small" color="gray-muted">
            {t.verifiedPrefix}{" "}
            <a href={source.url} target="_blank" rel="noopener noreferrer" className="text-brand font-semibold underline">
              {host}
            </a>{" "}
            {t.verifiedOn} {formatVerifiedDate(source.date, locale)}
          </Text>
        );
      })}
    </div>
  );
}

/**
 * "{Exam} {Year} photo & signature upload problems – fixes" (CC-159): spec
 * box, verified source, problem → why → fix rows (each a linkable
 * <details>, e.g. #photo-too-large), the portal's exact messages when the
 * team has captured them, and a way back to the tool. Rendered only for
 * exams whose specs are verified — see hasVerifiedSpecs().
 */
export default function UploadProblems({
  exam,
  locale,
  specBox,
}: {
  exam: ResizerExamSpec;
  locale: Locale;
  /** The exam's spec table, shown above the rows. */
  specBox: ReactNode;
}) {
  const t = getDict(locale).teaching;
  const rows = uploadProblems(exam, locale);
  if (rows.length === 0) return null;

  return (
    <section id="upload-problems" className="mt-16 md:mt-20 max-w-[720px] mx-auto flex flex-col gap-6 scroll-mt-24">
      <div className="text-center flex flex-col items-center gap-2">
        <h2 className="heading-large !font-bold text-text-gray-normal">{t.problemsTitle(exam.shortName, sessionOf(exam))}</h2>
        <Text as="p" variant="body-medium" color="gray-muted" className="max-w-[560px]">
          {t.problemsLead(exam.shortName)}
        </Text>
      </div>

      <OpenDetailsOnHash />
      {specBox}
      <VerifiedSourcesNote sources={verifiedSources(exam)} locale={locale} />

      <FAQAccordion
        items={rows.map((row) => ({
          id: row.id,
          title: row.problem,
          content: (
            <span className="flex flex-col gap-2">
              <span>
                <strong className="text-text-gray-normal">{t.whyLabel}:</strong> {row.why}
              </span>
              <span>
                <strong className="text-text-gray-normal">{t.fixLabel}:</strong> {row.fix}
              </span>
            </span>
          ),
        }))}
      />

      {/* Only messages captured verbatim from the live portal — never paraphrased. */}
      {exam.portalErrors.length > 0 && (
        <div className="flex flex-col gap-3">
          <h3 className="heading-small !font-bold text-text-gray-normal">{t.exactMessageTitle}</h3>
          {exam.portalErrors.map((error) => (
            <div key={error.message} className="flex flex-col gap-1">
              <blockquote className="border-l-4 border-brand pl-3 body-medium text-text-gray-normal">{error.message}</blockquote>
              <Text as="p" variant="body-small" color="gray-muted">
                <strong className="text-text-gray-normal">{t.fixLabel}:</strong> {error.fix}
              </Text>
            </div>
          ))}
        </div>
      )}

      <div className="flex justify-center">
        <a
          href="#resizer"
          className="inline-flex items-center justify-center rounded-full bg-brand px-6 py-3 body-medium !font-semibold text-white hover:bg-[var(--color-brand-hover)] transition-colors"
        >
          {t.cta(exam.shortName)}
        </a>
      </div>
    </section>
  );
}

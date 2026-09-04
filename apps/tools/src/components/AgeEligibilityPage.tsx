import clsx from "clsx";
import Text from "@clearcut/ui/text";
import SiteHeader from "./SiteHeader";
import ToolsFooter from "./SiteFooter";
import FAQAccordion, { AccordionItem } from "./FAQAccordion";
import AgeEligibilityCalculator from "./AgeEligibilityCalculator";
import type { AgeEligibilityExam } from "@/lib/ageEligibility";
import type { Locale } from "@/lib/dictionary";
import { getAgeCalcStrings } from "@/lib/ageCalculatorStrings";

const CATEGORY_TONE: Record<string, string> = {
  general: "bg-[var(--color-primary-bg-soft)] text-brand",
  obc: "bg-[var(--color-warning-bg-soft)] text-[var(--color-warning-strong)]",
  sc_st: "bg-[var(--color-success-bg-soft)] text-[var(--color-success-strong)]",
  pwd: "bg-[var(--color-danger-bg-soft)] text-[var(--color-danger-strong)]",
  ex_servicemen: "bg-[var(--color-gray-bg-soft)] text-text-gray-muted",
};

function categoryTone(key: string): string {
  return CATEGORY_TONE[key] ?? CATEGORY_TONE.general;
}

export default function AgeEligibilityPage({ exam, locale = "en" }: { exam: AgeEligibilityExam; locale?: Locale }) {
  const t = getAgeCalcStrings(locale);
  const faqItems: AccordionItem[] = exam.faqs.map((faq, index) => ({
    id: `faq-${index}`,
    title: faq.q,
    content: faq.a,
  }));

  return (
    <>
      <SiteHeader locale={locale} tool="age-eligibility-calculator" />

      <main className="max-w-[1000px] mx-auto px-4 md:px-6 pb-16">
        {/* Hero */}
        <div className="text-center py-10 md:py-14">
          <Text as="h1" variant="display-medium" weight="bold" color="gray-normal">
            {t.pageTitle(exam.shortName, exam.year)}
          </Text>
          <Text as="p" variant="body-large" color="gray-muted" className="mt-3">
            {exam.fullName} • {t.conductedBy}{" "}
            <span className="!font-semibold text-text-gray-normal">{exam.conductingBody}</span>
          </Text>
        </div>

        {/* Calculator */}
        <AgeEligibilityCalculator exam={exam} locale={locale} />

        {/* Category-wise Age Limits Table */}
        <section className="mt-16">
          <Text as="h2" variant="heading-large" weight="bold" color="gray-normal">
            {t.ageLimitsTableTitle}
          </Text>
          <Text as="p" variant="body-medium" color="gray-muted" className="mt-1 mb-4">
            {t.ageLimitsTableSubtitle(exam.shortName)}
          </Text>

          <div className="overflow-x-auto rounded-2xl border border-[var(--color-border-gray-subtle)]">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-[var(--color-gray-bg-soft)]">
                  <Th>{t.tableCategory}</Th>
                  <Th>{t.tableMinAge}</Th>
                  <Th>{t.tableMaxAge}</Th>
                </tr>
              </thead>
              <tbody>
                {exam.categories.map((c) => (
                  <tr key={c.key} className="border-t border-[var(--color-border-gray-subtle)]">
                    <Td>
                      <Text as="span" variant="body-medium" weight="semibold" color="gray-normal">
                        {c.label}
                      </Text>
                    </Td>
                    <Td>{c.minAge} Yrs</Td>
                    <Td>{c.maxAge === null ? t.noLimit : `${c.maxAge} Yrs`}</Td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* Eligibility Criteria */}
        <section className="mt-16">
          <Text as="h2" variant="heading-large" weight="bold" color="gray-normal" className="mb-4">
            {t.eligibilityCriteriaTitle}
          </Text>

          <div className="rounded-2xl bg-[var(--color-primary-bg-soft)] p-5 flex items-start gap-3">
            <span className="shrink-0 grid place-items-center w-9 h-9 rounded-full bg-white text-brand">
              <GraduationCapIcon />
            </span>
            <div>
              <Text as="p" variant="body-medium" weight="semibold" color="gray-normal">
                {t.educationalQualification}
              </Text>
              <Text as="p" variant="body-small" color="gray-muted" className="mt-1">
                {exam.qualification}
              </Text>
            </div>
          </div>

          <div className="mt-6 flex items-center gap-2">
            <span className="text-text-gray-muted">
              <UsersIcon />
            </span>
            <Text as="h3" variant="body-large" weight="semibold" color="gray-normal">
              {t.categoryRelaxationTitle}
            </Text>
          </div>

          <div className="mt-3 overflow-x-auto rounded-2xl border border-[var(--color-border-gray-subtle)]">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-[var(--color-gray-bg-soft)]">
                  <Th>{t.tableCategory}</Th>
                  <Th>{t.tableRelaxation}</Th>
                  <Th>{t.tableMaxAge}</Th>
                </tr>
              </thead>
              <tbody>
                {exam.categories.map((c) => (
                  <tr key={c.key} className="border-t border-[var(--color-border-gray-subtle)]">
                    <Td>
                      <span className={clsx("inline-block rounded-full px-2.5 py-1 body-xsmall !font-semibold", categoryTone(c.key))}>
                        {c.label}
                      </span>
                    </Td>
                    <Td>{c.relaxation}</Td>
                    <Td>
                      <Text as="span" variant="body-medium" weight="semibold" color="gray-normal">
                        {c.maxAge === null ? t.noLimit : `${c.maxAge} Yrs`}
                      </Text>
                    </Td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {exam.specialRelaxations.length > 0 && (
            <div className="mt-6 rounded-2xl bg-[var(--color-success-bg-soft)] p-5">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-[var(--color-success-strong)]">
                  <ShieldCheckIcon />
                </span>
                <Text as="p" variant="body-medium" weight="semibold" className="!text-[var(--color-success-strong)]">
                  {t.specialRelaxationsTitle}
                </Text>
              </div>
              <ul className="flex flex-col gap-1.5">
                {exam.specialRelaxations.map((note, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="mt-2 w-1.5 h-1.5 rounded-full bg-[var(--color-success-strong)] shrink-0" />
                    <Text as="span" variant="body-small" className="!text-[var(--color-success-strong)]">
                      {note}
                    </Text>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {exam.importantNotes.length > 0 && (
            <div className="mt-4 rounded-2xl bg-[var(--color-warning-bg-soft)] p-5">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-[var(--color-warning-strong)]">
                  <AlertIcon />
                </span>
                <Text as="p" variant="body-medium" weight="semibold" className="!text-[var(--color-warning-strong)]">
                  {t.importantNotesTitle}
                </Text>
              </div>
              <ul className="flex flex-col gap-1.5">
                {exam.importantNotes.map((note, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="mt-2 w-1.5 h-1.5 rounded-full bg-[var(--color-warning-strong)] shrink-0" />
                    <Text as="span" variant="body-small" className="!text-[var(--color-warning-strong)]">
                      {note}
                    </Text>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="mt-4 flex items-start gap-2 rounded-xl border border-[var(--color-border-gray-subtle)] p-4">
            <span className="shrink-0 mt-0.5 text-text-gray-muted">
              <InfoIcon />
            </span>
            <Text as="p" variant="body-small" color="gray-muted">
              {t.disclaimer(exam.conductingBody)}
            </Text>
          </div>
        </section>

        {/* FAQ */}
        <section className="mt-16">
          <Text as="h2" variant="heading-large" weight="bold" color="gray-normal">
            {t.faqTitle}
          </Text>
          <Text as="p" variant="body-medium" color="gray-muted" className="mt-1 mb-5">
            {t.faqSubtitle(exam.shortName)}
          </Text>
          <FAQAccordion items={faqItems} defaultOpenId={faqItems[0]?.id} />
        </section>
      </main>

      <ToolsFooter locale={locale} />
    </>
  );
}

function Th({ children }: { children: React.ReactNode }) {
  return (
    <th className="px-4 py-3 body-small !font-semibold text-text-gray-muted uppercase tracking-wide">{children}</th>
  );
}

function Td({ children }: { children: React.ReactNode }) {
  return <td className="px-4 py-3 body-medium text-text-gray-normal">{children}</td>;
}

function GraduationCapIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 10 12 5 2 10l10 5 10-5Z" />
      <path d="M6 12v5c0 1.5 3 3 6 3s6-1.5 6-3v-5" />
    </svg>
  );
}

function UsersIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  );
}

function ShieldCheckIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2 4 5v6c0 5 3.5 8.5 8 11 4.5-2.5 8-6 8-11V5l-8-3Z" />
      <path d="m9 12 2 2 4-4" />
    </svg>
  );
}

function AlertIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <path d="M12 8v4M12 16h.01" />
    </svg>
  );
}

function InfoIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <path d="M12 16v-4M12 8h.01" />
    </svg>
  );
}

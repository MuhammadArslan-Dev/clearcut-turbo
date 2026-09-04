"use client";

import React from "react";
import clsx from "clsx";
import Text from "@clearcut/ui/text";
import type { AgeEligibilityExam } from "@/lib/ageEligibility";
import type { Locale } from "@/lib/dictionary";
import { getAgeCalcStrings, MONTH_NAMES, QUALIFICATION_OPTIONS_BY_LOCALE } from "@/lib/ageCalculatorStrings";
import { ageOn, ageInMonths, checkEligibility, formatYearsMonths, parseDDMMYYYY, type EligibilityResult } from "@/lib/ageCalculator";

function currentAndNextYears(): number[] {
  const now = new Date().getFullYear();
  return [now, now + 1, now + 2];
}

export default function AgeEligibilityCalculator({ exam, locale = "en" }: { exam: AgeEligibilityExam; locale?: Locale }) {
  const t = getAgeCalcStrings(locale);
  const months = MONTH_NAMES[locale === "hi" ? "hi" : "en"];
  const qualificationOptions = QUALIFICATION_OPTIONS_BY_LOCALE[locale === "hi" ? "hi" : "en"];

  const [dobText, setDobText] = React.useState("");
  const [dobError, setDobError] = React.useState(false);
  const [categoryKey, setCategoryKey] = React.useState(exam.categories[0].key);
  const [qualification, setQualification] = React.useState("graduate");
  const [notifMonthIndex, setNotifMonthIndex] = React.useState(0);
  const [notifYear, setNotifYear] = React.useState(exam.year);
  const [result, setResult] = React.useState<{ years: number; months: number; elig: EligibilityResult } | null>(null);
  const dateInputRef = React.useRef<HTMLInputElement>(null);

  const years = currentAndNextYears();

  // Any input change invalidates a previous result — matches the reference
  // calculator's own behaviour: recalculating always requires an explicit click.
  React.useEffect(() => {
    setResult(null);
  }, [dobText, categoryKey, qualification, notifMonthIndex, notifYear]);

  const handleCalculate = () => {
    const dob = parseDDMMYYYY(dobText);
    if (!dob) {
      setDobError(true);
      setResult(null);
      return;
    }
    setDobError(false);

    const cutoff = new Date(notifYear, notifMonthIndex, 1);
    const category = exam.categories.find((c) => c.key === categoryKey) ?? exam.categories[0];
    const { years: y, months: m } = ageOn(dob, cutoff);
    const totalMonths = ageInMonths(dob, cutoff);
    const elig = checkEligibility(totalMonths, category.minAge, category.maxAge);
    setResult({ years: y, months: m, elig });
  };

  const openDatePicker = () => {
    const input = dateInputRef.current;
    if (!input) return;
    if (typeof input.showPicker === "function") {
      input.showPicker();
    } else {
      input.click();
    }
  };

  const handleNativeDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.value) return;
    const [y, m, d] = e.target.value.split("-");
    setDobText(`${d}/${m}/${y}`);
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {/* Form */}
      <div className="rounded-2xl border border-[var(--color-border-gray-subtle)] bg-[var(--color-gray-bg-soft)] overflow-hidden">
        <div className="px-6 py-5 border-b border-[var(--color-border-gray-subtle)]">
          <Text as="h2" variant="heading-medium" weight="semibold" color="gray-normal">
            {t.checkEligibility}
          </Text>
          <Text as="p" variant="body-small" color="gray-muted" className="mt-1">
            {t.enterDetails(exam.shortName)}
          </Text>
        </div>

        <div className="p-6 flex flex-col gap-4">
          <div>
            <label className="block body-small !font-semibold text-text-gray-normal mb-1.5" htmlFor="dob">
              {t.dateOfBirth}
            </label>
            <div className="relative">
              <input
                id="dob"
                type="text"
                inputMode="numeric"
                placeholder="DD/MM/YYYY"
                value={dobText}
                onChange={(e) => setDobText(e.target.value)}
                className={clsx(
                  "w-full rounded-lg border bg-white pl-3 pr-11 py-2.5 body-medium text-text-gray-normal outline-none transition-colors focus:border-brand",
                  dobError ? "border-[var(--color-danger)]" : "border-[var(--color-border-gray-subtle)]",
                )}
              />
              <button
                type="button"
                onClick={openDatePicker}
                aria-label="Pick a date"
                className="absolute right-2 top-1/2 -translate-y-1/2 w-7 h-7 grid place-items-center rounded-md text-text-gray-muted hover:bg-[var(--color-gray-bg-soft)] cursor-pointer"
              >
                <CalendarIcon />
              </button>
              <input
                ref={dateInputRef}
                type="date"
                onChange={handleNativeDateChange}
                className="absolute inset-0 opacity-0 pointer-events-none"
                tabIndex={-1}
                aria-hidden
              />
            </div>
            {dobError && (
              <Text as="p" variant="body-xsmall" className="mt-1 text-[var(--color-danger)]">
                {t.invalidDate}
              </Text>
            )}
          </div>

          <div>
            <label className="block body-small !font-semibold text-text-gray-normal mb-1.5" htmlFor="category">
              {t.category}
            </label>
            <select
              id="category"
              value={categoryKey}
              onChange={(e) => setCategoryKey(e.target.value)}
              className="w-full rounded-lg border border-[var(--color-border-gray-subtle)] bg-white px-3 py-2.5 body-medium text-text-gray-normal outline-none transition-colors focus:border-brand cursor-pointer"
            >
              {exam.categories.map((c) => (
                <option key={c.key} value={c.key}>
                  {c.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block body-small !font-semibold text-text-gray-normal mb-1.5" htmlFor="qualification">
              {t.qualifications}
            </label>
            <select
              id="qualification"
              value={qualification}
              onChange={(e) => setQualification(e.target.value)}
              className="w-full rounded-lg border border-[var(--color-border-gray-subtle)] bg-white px-3 py-2.5 body-medium text-text-gray-normal outline-none transition-colors focus:border-brand cursor-pointer"
            >
              {qualificationOptions.map((q) => (
                <option key={q.value} value={q.value}>
                  {q.label}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block body-small !font-semibold text-text-gray-normal mb-1.5" htmlFor="notifMonth">
                {t.notificationMonth}
              </label>
              <select
                id="notifMonth"
                value={notifMonthIndex}
                onChange={(e) => setNotifMonthIndex(Number(e.target.value))}
                className="w-full rounded-lg border border-[var(--color-border-gray-subtle)] bg-white px-3 py-2.5 body-medium text-text-gray-normal outline-none transition-colors focus:border-brand cursor-pointer"
              >
                {months.map((m, i) => (
                  <option key={m} value={i}>
                    {m}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block body-small !font-semibold text-text-gray-normal mb-1.5" htmlFor="notifYear">
                {t.notificationYear}
              </label>
              <select
                id="notifYear"
                value={notifYear}
                onChange={(e) => setNotifYear(Number(e.target.value))}
                className="w-full rounded-lg border border-[var(--color-border-gray-subtle)] bg-white px-3 py-2.5 body-medium text-text-gray-normal outline-none transition-colors focus:border-brand cursor-pointer"
              >
                {years.map((y) => (
                  <option key={y} value={y}>
                    {y}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <button
            type="button"
            onClick={handleCalculate}
            className="mt-1 w-full rounded-lg bg-brand hover:bg-[var(--color-brand-hover)] text-white body-medium !font-semibold py-3 transition-colors cursor-pointer"
          >
            {t.calculateEligibility}
          </button>
        </div>
      </div>

      {/* Result */}
      <ResultPanel result={result} examShortName={exam.shortName} locale={locale} />
    </div>
  );
}

function ResultPanel({
  result,
  examShortName,
  locale,
}: {
  result: { years: number; months: number; elig: EligibilityResult } | null;
  examShortName: string;
  locale: Locale;
}) {
  const t = getAgeCalcStrings(locale);

  if (!result) {
    return (
      <div className="rounded-2xl border border-dashed border-[var(--color-border-gray-subtle)] bg-white grid place-items-center p-8 text-center min-h-[280px]">
        <div>
          <span className="mx-auto mb-3 grid place-items-center w-12 h-12 rounded-full bg-[var(--color-gray-bg-soft)] text-text-gray-muted">
            <CalendarIcon size={22} />
          </span>
          <Text as="p" variant="body-medium" weight="semibold" color="gray-normal">
            {t.awaitingDetailsTitle}
          </Text>
          <Text as="p" variant="body-small" color="gray-muted" className="mt-1 max-w-[240px] mx-auto">
            {t.awaitingDetailsBody}
          </Text>
        </div>
      </div>
    );
  }

  const { elig } = result;
  const isEligible = elig.status === "eligible";
  const tone = isEligible ? "success" : "danger";

  const heading = isEligible ? t.fullyEligible : elig.status === "under_age" ? t.underAgeLimit : t.ageLimitExceeded;

  const pillText = isEligible
    ? t.eligibleMessage
    : elig.status === "under_age"
      ? t.underAgeMessage(formatYearsMonths(elig.shortByMonths))
      : t.overAgeMessage(formatYearsMonths(elig.overByMonths));

  return (
    <div
      className={clsx(
        "rounded-2xl border overflow-hidden",
        tone === "success" ? "border-[var(--color-success)]" : "border-[var(--color-danger)]",
      )}
    >
      <div
        className={clsx(
          "px-6 py-5 flex items-center gap-3",
          tone === "success" ? "bg-[var(--color-success)]" : "bg-[var(--color-danger)]",
        )}
      >
        {isEligible ? <CheckCircleIcon /> : <CrossCircleIcon />}
        <Text as="h2" variant="heading-medium" weight="bold" color="white">
          {heading}
        </Text>
      </div>

      <div
        className={clsx(
          "p-6 flex flex-col items-center text-center gap-4",
          tone === "success" ? "bg-[var(--color-success-bg-soft)]" : "bg-[var(--color-danger-bg-soft)]",
        )}
      >
        <div>
          <Text as="p" variant="body-xsmall" weight="semibold" color="gray-muted" className="uppercase tracking-wide">
            {t.exactAgeOnCutoff}
          </Text>
          <div className="flex items-end justify-center gap-2 mt-1">
            <span className="text-[42px] leading-none !font-bold text-text-gray-normal">{result.years}</span>
            <Text as="span" variant="body-medium" color="gray-muted" className="mb-1.5">
              {t.years}
            </Text>
            <span className="text-[42px] leading-none !font-bold text-text-gray-normal">{result.months}</span>
            <Text as="span" variant="body-medium" color="gray-muted" className="mb-1.5">
              {t.months}
            </Text>
          </div>
        </div>

        <div
          className={clsx(
            "w-full rounded-lg py-2.5 body-medium !font-semibold",
            tone === "success"
              ? "bg-[var(--color-success-bg-soft)] text-[var(--color-success-strong)] border border-[var(--color-success)]"
              : "bg-[var(--color-danger-bg-soft)] text-[var(--color-danger-strong)] border border-[var(--color-danger)]",
          )}
        >
          {pillText}
        </div>

        <div className="flex items-start gap-2 text-left bg-white/60 rounded-lg p-3">
          <span className="shrink-0 mt-0.5 text-text-gray-muted">
            <InfoIcon />
          </span>
          <Text as="p" variant="body-xsmall" color="gray-muted">
            {t.resultNote(examShortName)}
          </Text>
        </div>
      </div>
    </div>
  );
}

function CalendarIcon({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="18" rx="2" />
      <path d="M16 2v4M8 2v4M3 10h18" />
    </svg>
  );
}

function CheckCircleIcon() {
  return (
    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <path d="m9 12 2 2 4-4" />
    </svg>
  );
}

function CrossCircleIcon() {
  return (
    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <path d="m15 9-6 6M9 9l6 6" />
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

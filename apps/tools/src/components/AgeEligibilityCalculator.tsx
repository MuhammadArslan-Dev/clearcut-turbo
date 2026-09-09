"use client";

import React from "react";
import clsx from "clsx";
import Text from "@clearcut/ui/text";
import { Select, SelectOption } from "@clearcut/ui/select";
import type { AgeEligibilityExam } from "@/lib/ageEligibility";
import type { Locale } from "@/lib/dictionary";
import { getAgeCalcStrings, MONTH_NAMES, QUALIFICATION_OPTIONS_BY_LOCALE } from "@/lib/ageCalculatorStrings";
import { ageOn, checkEligibility, formatAgeBreakdown, type AgeBreakdown, type EligibilityResult } from "@/lib/ageCalculator";

function currentAndNextYears(): number[] {
  const now = new Date().getFullYear();
  return [now, now + 1, now + 2];
}

/** The latest birth date that still makes someone exactly 18 today — the
 * calendar guard rail: no day/month/year combination past this is selectable. */
function maxDob(): Date {
  const today = new Date();
  return new Date(today.getFullYear() - 18, today.getMonth(), today.getDate());
}

const MIN_DOB_YEAR = new Date().getFullYear() - 100;

function daysInMonth(year: number, monthIndex: number): number {
  return new Date(year, monthIndex + 1, 0).getDate();
}

/** Highest selectable day for a given year/month, respecting both the
 * month's real length and the 18-years-old ceiling. */
function maxSelectableDay(year: number, monthIndex: number): number {
  const cap = maxDob();
  const monthMax = daysInMonth(year, monthIndex);
  if (year === cap.getFullYear() && monthIndex === cap.getMonth()) {
    return Math.min(monthMax, cap.getDate());
  }
  return monthMax;
}

/** Highest selectable month (0-indexed) for a given year, respecting the ceiling. */
function maxSelectableMonth(year: number): number {
  const cap = maxDob();
  return year === cap.getFullYear() ? cap.getMonth() : 11;
}

export default function AgeEligibilityCalculator({ exam, locale = "en" }: { exam: AgeEligibilityExam; locale?: Locale }) {
  const t = getAgeCalcStrings(locale);
  const months = MONTH_NAMES[locale === "hi" ? "hi" : "en"];
  const qualificationOptions = QUALIFICATION_OPTIONS_BY_LOCALE[locale === "hi" ? "hi" : "en"];

  const [dobDay, setDobDay] = React.useState<number | "">("");
  const [dobMonth, setDobMonth] = React.useState<number | "">("");
  const [dobYear, setDobYear] = React.useState<number | "">("");
  const [dobError, setDobError] = React.useState(false);
  const [categoryKey, setCategoryKey] = React.useState(exam.categories[0].key);
  const [qualification, setQualification] = React.useState("graduate");
  const [notifMonthIndex, setNotifMonthIndex] = React.useState(0);
  const [notifYear, setNotifYear] = React.useState(exam.year);
  const [result, setResult] = React.useState<{ age: AgeBreakdown; elig: EligibilityResult } | null>(null);

  const years = currentAndNextYears();
  const maxYear = maxDob().getFullYear();
  const dobYearOptions = React.useMemo(() => {
    const opts: number[] = [];
    for (let y = maxYear; y >= MIN_DOB_YEAR; y--) opts.push(y);
    return opts;
  }, [maxYear]);

  const dobMonthOptions = React.useMemo(() => {
    const limit = dobYear === "" ? 11 : maxSelectableMonth(dobYear);
    return months.slice(0, limit + 1).map((label, i) => ({ label, value: i }));
  }, [dobYear, months]);

  const dobDayOptions = React.useMemo(() => {
    const limit = dobYear === "" || dobMonth === "" ? 31 : maxSelectableDay(dobYear, dobMonth);
    return Array.from({ length: limit }, (_, i) => i + 1);
  }, [dobYear, dobMonth]);

  // Changing the year can push a previously-picked month/day past the
  // 18-years-old ceiling (or past the new month's length) — clamp instead of
  // leaving a stale, now-invalid selection in place.
  React.useEffect(() => {
    if (dobYear === "") return;
    const monthLimit = maxSelectableMonth(dobYear);
    if (dobMonth !== "" && dobMonth > monthLimit) setDobMonth(monthLimit);
  }, [dobYear]); // eslint-disable-line react-hooks/exhaustive-deps

  React.useEffect(() => {
    if (dobYear === "" || dobMonth === "") return;
    const dayLimit = maxSelectableDay(dobYear, dobMonth);
    if (dobDay !== "" && dobDay > dayLimit) setDobDay(dayLimit);
  }, [dobYear, dobMonth]); // eslint-disable-line react-hooks/exhaustive-deps

  // Any input change invalidates a previous result — matches the reference
  // calculator's own behaviour: recalculating always requires an explicit click.
  React.useEffect(() => {
    setResult(null);
  }, [dobDay, dobMonth, dobYear, categoryKey, qualification, notifMonthIndex, notifYear]);

  const handleCalculate = () => {
    if (dobDay === "" || dobMonth === "" || dobYear === "") {
      setDobError(true);
      setResult(null);
      return;
    }
    setDobError(false);

    const dob = new Date(dobYear, dobMonth, dobDay);
    const cutoff = new Date(notifYear, notifMonthIndex, 1);
    const category = exam.categories.find((c) => c.key === categoryKey) ?? exam.categories[0];
    const age = ageOn(dob, cutoff);
    const elig = checkEligibility(dob, cutoff, category.minAge, category.maxAge);
    setResult({ age, elig });
  };

  const labels = { year: t.yearLabel, month: t.monthLabel, day: t.dayLabel };

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
            <label className="block body-small !font-semibold text-text-gray-normal mb-1.5">{t.dateOfBirth}</label>
            <div className="grid grid-cols-3 gap-2">
              <Select
                value={dobDay === "" ? "" : String(dobDay)}
                onValueChange={(v) => setDobDay(v === "" ? "" : Number(v))}
                placeholder={t.dobDay}
                error={dobError}
              >
                {dobDayOptions.map((d) => (
                  <SelectOption key={d} value={String(d)}>
                    {d}
                  </SelectOption>
                ))}
              </Select>
              <Select
                value={dobMonth === "" ? "" : String(dobMonth)}
                onValueChange={(v) => setDobMonth(v === "" ? "" : Number(v))}
                placeholder={t.dobMonth}
                error={dobError}
              >
                {dobMonthOptions.map((m) => (
                  <SelectOption key={m.value} value={String(m.value)}>
                    {m.label}
                  </SelectOption>
                ))}
              </Select>
              <Select
                value={dobYear === "" ? "" : String(dobYear)}
                onValueChange={(v) => setDobYear(v === "" ? "" : Number(v))}
                placeholder={t.dobYear}
                error={dobError}
              >
                {dobYearOptions.map((y) => (
                  <SelectOption key={y} value={String(y)}>
                    {y}
                  </SelectOption>
                ))}
              </Select>
            </div>
            <Text as="p" variant="body-xsmall" color="gray-muted" className="mt-1.5">
              {t.dobMinAgeNote}
            </Text>
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
            <Select value={categoryKey} onValueChange={setCategoryKey} id="category">
              {exam.categories.map((c) => (
                <SelectOption key={c.key} value={c.key}>
                  {c.label}
                </SelectOption>
              ))}
            </Select>
          </div>

          <div>
            <label className="block body-small !font-semibold text-text-gray-normal mb-1.5" htmlFor="qualification">
              {t.qualifications}
            </label>
            <Select value={qualification} onValueChange={setQualification} id="qualification">
              {qualificationOptions.map((q) => (
                <SelectOption key={q.value} value={q.value}>
                  {q.label}
                </SelectOption>
              ))}
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block body-small !font-semibold text-text-gray-normal mb-1.5" htmlFor="notifMonth">
                {t.notificationMonth}
              </label>
              <Select
                value={String(notifMonthIndex)}
                onValueChange={(v) => setNotifMonthIndex(Number(v))}
                id="notifMonth"
              >
                {months.map((m, i) => (
                  <SelectOption key={m} value={String(i)}>
                    {m}
                  </SelectOption>
                ))}
              </Select>
            </div>
            <div>
              <label className="block body-small !font-semibold text-text-gray-normal mb-1.5" htmlFor="notifYear">
                {t.notificationYear}
              </label>
              <Select value={String(notifYear)} onValueChange={(v) => setNotifYear(Number(v))} id="notifYear">
                {years.map((y) => (
                  <SelectOption key={y} value={String(y)}>
                    {y}
                  </SelectOption>
                ))}
              </Select>
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
      <ResultPanel result={result} examShortName={exam.shortName} locale={locale} labels={labels} />
    </div>
  );
}

function ResultPanel({
  result,
  examShortName,
  locale,
  labels,
}: {
  result: { age: AgeBreakdown; elig: EligibilityResult } | null;
  examShortName: string;
  locale: Locale;
  labels: { year: (n: number) => string; month: (n: number) => string; day: (n: number) => string };
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

  const { age, elig } = result;
  const isEligible = elig.status === "eligible";
  const tone = isEligible ? "success" : "danger";

  const heading = isEligible ? t.fullyEligible : elig.status === "under_age" ? t.underAgeLimit : t.ageLimitExceeded;

  const pillText = isEligible
    ? t.eligibleMessage
    : elig.status === "under_age"
      ? t.underAgeMessage(formatAgeBreakdown(elig.shortBy, labels))
      : t.overAgeMessage(formatAgeBreakdown(elig.overBy, labels));

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
          "p-6 flex flex-col h-full items-center text-center gap-4",
          tone === "success" ? "bg-[var(--color-success-bg-soft)]" : "bg-[var(--color-danger-bg-soft)]",
        )}
      >
        <div>
          <Text as="p" variant="body-xsmall" weight="semibold" color="gray-muted" className="uppercase tracking-wide">
            {t.exactAgeOnCutoff}
          </Text>
          <div className="flex items-end justify-center gap-2 mt-1 flex-wrap">
            <span className="text-[42px] leading-none !font-bold text-text-gray-normal">{age.years}</span>
            <Text as="span" variant="body-medium" color="gray-muted" className="mb-1.5">
              {t.years}
            </Text>
            <span className="text-[42px] leading-none !font-bold text-text-gray-normal">{age.months}</span>
            <Text as="span" variant="body-medium" color="gray-muted" className="mb-1.5">
              {t.months}
            </Text>
            <span className="text-[42px] leading-none !font-bold text-text-gray-normal">{age.days}</span>
            <Text as="span" variant="body-medium" color="gray-muted" className="mb-1.5">
              {t.days}
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

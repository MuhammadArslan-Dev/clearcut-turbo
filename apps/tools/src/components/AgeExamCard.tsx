import Link from "next/link";
import Text from "@clearcut/ui/text";
import type { AgeEligibilityExam } from "@/lib/ageEligibility";

const FEATURED_SLUGS = new Set(["ctet", "htet", "uptet", "reet", "hptet"]);

export function ageLimitLabel(exam: AgeEligibilityExam, noLimitLabel = "No Limit", minLabel = "Min"): string {
  const min = exam.categories[0]?.minAge ?? 0;
  const max = exam.categories[0]?.maxAge ?? null;
  if (min === 0 && max === null) return noLimitLabel;
  if (max === null) return `${minLabel} ${min} Yrs`;
  return `${min} - ${max} Yrs`;
}

export default function AgeExamCard({
  exam,
  href,
  ageLimitText,
  ageLimitLabelText,
  popularLabel,
  locale = "en",
}: {
  exam: AgeEligibilityExam;
  /** basePath-relative on "en" (e.g. "/age-eligibility-calculator/ctet" — next/link + this app's basePath produces "/tools/..."), full absolute path on "hi" (e.g. "/hi/tools/age-eligibility-calculator/ctet" — see LocaleLink.tsx for why Hindi can't go through next/link). */
  href: string;
  ageLimitText: string;
  ageLimitLabelText: string;
  popularLabel: string;
  locale?: "en" | "hi";
}) {
  const className =
    "group flex flex-col gap-2 rounded-2xl border border-[var(--color-border-gray-subtle)] bg-white p-5 shadow-[0_1px_3px_rgba(0,0,0,0.03)] transition-all hover:border-brand hover:shadow-[0_4px_18px_rgba(0,0,0,0.06)] hover:-translate-y-0.5";

  const content = (
    <>
      <div className="flex items-center justify-between gap-2">
        <span className="inline-block rounded-full bg-[var(--color-primary-bg-soft)] text-brand px-2.5 py-1 body-xsmall !font-semibold">
          {exam.group}
        </span>
        {FEATURED_SLUGS.has(exam.slug) && (
          <span className="inline-block rounded-full bg-[var(--color-warning-bg-soft)] text-[var(--color-warning-strong)] px-2.5 py-1 body-xsmall !font-semibold">
            {popularLabel}
          </span>
        )}
      </div>
      <Text as="p" variant="heading-small" weight="bold" color="gray-normal" className="group-hover:text-brand transition-colors">
        {exam.shortName}
      </Text>
      <Text as="p" variant="body-small" color="gray-muted">
        {exam.fullName}
      </Text>
      <Text as="p" variant="body-xsmall" color="gray-muted" className="mt-auto pt-2 border-t border-[var(--color-border-gray-subtle)]">
        {ageLimitLabelText}: <span className="!font-semibold text-text-gray-normal">{ageLimitText}</span>
      </Text>
    </>
  );

  if (locale === "hi") {
    return (
      <a href={href} className={className}>
        {content}
      </a>
    );
  }
  return (
    <Link href={href} className={className}>
      {content}
    </Link>
  );
}

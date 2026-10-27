"use client";

import { Link } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import Image from "next/image";
import { ArrowRightIcon } from "@heroicons/react/24/outline";
import { Card } from "@clearcut/ui/card";
import CalendarIcon from "@clearcut/ui/icons/calendar-icon";
import CircleClockIcon from "@clearcut/ui/icons/circle-clock-icon";
import WarningCirleIcon from "@clearcut/ui/icons/warning-circle-icon";
import ChartSuccessBarIcon from "../icons/chart-success-bar-icon";
import CheckIcon from "../icons/check-icon";

// The exam logos are busy multi-colour crests served from S3; the grayscale +
// opacity treatment is what the design shows and what this card always did.
const LOGO_FALLBACK =
  "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTNYAyuu-blwzsEjTj92dldM2I2UvueiguRwA&s";

export interface CourseCardProps {
  logo?: string | null;
  /** Short exam name shown under the logo, e.g. "CTET". */
  courseName?: string | null;
  /** Secondary line under the name, e.g. "Eligibility Exam". */
  examType?: string | null;
  examDate?: string | null;
  examMode?: string | null;
  duration?: string | null;
  cutoff?: string | null;
  /**
   * Makes the whole card a real locale-aware <a href> so crawlers can follow
   * it. Without it the card renders as plain, non-navigating content — an
   * onClick alone is not followable by a search engine.
   */
  href?: string;
  onClick?: () => void;
  bgColor?: string;
}

export default function CourseCard({
  logo,
  courseName,
  examType,
  examDate,
  examMode,
  duration,
  cutoff,
  href,
  onClick,
  bgColor = "white",
}: CourseCardProps) {
  const t = useTranslations("examCard");

  // Rows with no value are dropped rather than rendered as a dangling label.
  const points = [
    { id: "date", icon: <CalendarIcon />, label: t("examDate"), value: examDate },
    { id: "mode", icon: <WarningCirleIcon />, label: t("examMode"), value: examMode },
    { id: "duration", icon: <CircleClockIcon />, label: t("duration"), value: duration },
    { id: "cutoff", icon: <ChartSuccessBarIcon />, label: t("cutoff"), value: cutoff },
  ].filter((point) => Boolean(point.value));

  const card = (
    <Card
      bgcolor={bgColor}
      padding={0}
      maxWidth="540px"
      className="!rounded-xl border-slate-200 transition-shadow hover:shadow-md"
    >
      <div className="flex items-stretch">
        {/* Logo + exam name. Narrower on mobile: at 390 px the card is only
            ~358 px wide, and at the desktop 150 px this column left the facts
            beside it ~190 px — too little for "Exam Date : 06 September 2026",
            which then clipped (more so in Hindi, whose label is longer). */}
        <div className="flex w-[104px] shrink-0 flex-col items-center justify-center gap-1 px-2 py-5 sm:w-[150px] sm:px-3">
          <div className="relative h-16 w-16">
            <Image
              src={logo || LOGO_FALLBACK}
              alt=""
              width={64}
              height={64}
              className="h-16 w-16 rounded-full object-cover opacity-70 grayscale"
            />
            <div className="absolute bottom-0 right-0 flex h-5 w-5 items-center justify-center rounded-full bg-white">
              <CheckIcon variant="design" size={16} />
            </div>
          </div>

          <p className="heading-small !font-semibold mt-1 text-center text-surface-gray-normal">
            {courseName}
          </p>
          <p className="body-medium !font-normal text-center surface-text-gray-muted">
            {examType}
          </p>
        </div>

        {/* Facts + CTA */}
        <div className="flex min-w-0 flex-1 flex-col justify-center gap-2.5 border-l border-slate-200 px-3 py-5 sm:px-5">
          {points.map((point) => (
            // flex-wrap, not truncate: if a long value (the Hindi date is the
            // worst case) still doesn't fit, it drops to its own line rather
            // than being cut off mid-word with an ellipsis.
            <div key={point.id} className="flex flex-wrap items-center gap-x-1.5">
              <span className="flex shrink-0 items-center gap-2">
                {point.icon}
                <span className="body-medium !font-normal whitespace-nowrap surface-text-gray-muted">
                  {point.label} :
                </span>
              </span>
              <span className="body-medium !font-medium text-surface-gray-normal">
                {point.value}
              </span>
            </div>
          ))}

          {/* A span, not a button: the whole card is already the <a>, and an
              interactive element nested inside a link is invalid. */}
          <span className="mt-2 inline-flex w-full items-center justify-center gap-2 rounded-lg border border-blue-300 bg-white px-4 py-2.5 text-sm font-semibold text-blue-600 transition-colors group-hover/card:border-blue-400 group-hover/card:bg-blue-50">
            {t("viewExam")}
            <ArrowRightIcon className="h-4 w-4" aria-hidden="true" />
          </span>
        </div>
      </div>
    </Card>
  );

  if (!href) return card;

  return (
    <Link href={href} onClick={onClick} className="block w-full">
      {card}
    </Link>
  );
}

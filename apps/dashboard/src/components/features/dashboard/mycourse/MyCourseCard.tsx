"use client";
import Button from "@clearcut/ui/button";
import MainButton from "@/components/ui/button/main-button";
import { Card } from "@clearcut/ui/card";
import { ChevronIcon, LockIcon, SettingGearIcon } from "@/components/ui/icons";
import ProgressBar from "@/components/ui/ProgressBar";
import { CourseStatus } from "@/lib/status/courseStatus";
import { getCourseStatus } from "@/lib/status/getCourseStatus";
import { trialDaysLeft } from "@/lib/status/trialDaysLeft";
import { highlightTextUtil } from "@/utils/text/highlightTextUtil";
import clsx from "clsx";
import { useLocale, useTranslations } from "next-intl";
import Image from "next/image";
import React, { useEffect, useMemo, useRef } from "react";
import { getPriceForVariant } from "@/lib/payment/examPriceOverrides";
import type { CutoffMeterSummary } from "@/lib/dashboard/cutoffMeter";
import { meterPill } from "@/lib/dashboard/meterPill";
import { useCutoffMeterInfoStore } from "@/components/modals/cutoff-meter/useCutoffMeterInfoStore";
import { useModalStore } from "@/store/modal/useModalStore";
import { Meter, type MeterHandle } from "@clearcut/motion/meters/meter";
import Skeleton from "@clearcut/ui/skeleton";

/**
 * Meter panel (phase 98/99) = Cutoff Meter Studio's bar meter itself
 * (`Meter variant="bar"` from @clearcut/motion): "58 / 150", zone pill, the
 * zone-tinted track with confidence band, fill, pass tick + "Cutoff 90", Nibbu
 * riding the fill, "0 … 150" scale, ❄ cooling, lock, Δ chip + wobble. Below
 * it, centred, the gap line and "Range ±N · based on N tests" (reference).
 * Text is ours (en / hi / mr); everything else is the studio's artwork.
 */
function CutoffMeterPanel({ meter }: { meter: CutoffMeterSummary }) {
  const t = useTranslations("myCourses");
  const locale = useLocale();
  const ref = useRef<MeterHandle>(null);
  const locked = meter.locked || meter.meter === null;
  const cooling = !locked && !!meter.cooling?.active;
  const value = Math.round(meter.display_meter ?? meter.meter ?? 0);
  const gap = meter.display_gap ?? meter.gap ?? 0;
  const pass = Math.round(meter.pass_mark);
  const toUnlock = Math.max(meter.unlock_answers - meter.counted_answers, 1);
  const change =
    !locked && !cooling && meter.change ? Math.round(meter.change) : 0;

  // Studio "Score dropped / went up": Δ chip (+ wobble on a drop) once the fill has settled.
  useEffect(() => {
    if (!change) return;
    const id = setTimeout(() => {
      ref.current?.delta(change);
      if (change < 0) ref.current?.wobble();
    }, 1400);
    return () => clearTimeout(id);
  }, [change]);

  const openModal = useModalStore((s) => s.open);
  const setInfoMeter = useCutoffMeterInfoStore((s) => s.setMeter);
  const openInfo = () => {
    setInfoMeter(meter);
    openModal("cutoff-meter-info");
  };

  return (
    <>
      {/* Tap the meter → "how is this calculated" (bottom sheet on mobile, modal on desktop). */}
      <div
        role="button"
        tabIndex={0}
        aria-label={t("meterInfo.title")}
        onClick={() => openInfo()}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            openInfo();
          }
        }}
        className="flex cursor-pointer flex-col gap-2 rounded-xl outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-brand)]"
      >
        <Meter
          ref={ref}
          variant="bar"
          fluid
          lang={locale === "hi" ? "hi" : "en"}
          scale={{ max: meter.max_marks, cutoff: pass }}
          locked={locked}
          value={locked ? undefined : value}
          band={meter.band ?? 0}
          cooling={cooling}
          pill={meterPill(meter, t)}
          cutoffLabel={t("meterCutoff", { pass })}
          hideCoolChip
        />
        <div className="text-center">
          <p className="heading-medium !font-bold text-surface-gray-normal">
            {locked
              ? t("meterUnlock", { count: toUnlock })
              : cooling
                ? t("meterCooled", { marks: Math.round(meter.cooling.decay) })
                : gap > 0
                  ? t("meterGap", { marks: Math.ceil(gap) })
                  : t("meterAbove", { marks: Math.round(-gap) })}
          </p>
          {!locked && !!meter.band && (
            <p className="text-[13px] leading-[18px] text-surface-gray-muted">
              {meter.tests_count
                ? t("meterRangeTests", {
                    band: meter.band,
                    tests: meter.tests_count,
                  })
                : t("meterRange", { band: meter.band })}
            </p>
          )}
        </div>
      </div>
    </>
  );
}

function CutoffMeterPanelSkeleton() {
  // Same footprint as the studio bar meter + the two centred lines below it.
  return (
    <div className="flex flex-col gap-2" aria-hidden="true">
      <div className="flex items-end justify-between">
        <Skeleton variant="text" width={110} height={40} />
        <Skeleton
          variant="rectangular"
          width={96}
          height={24}
          borderRadius={999}
        />
      </div>
      <div className="pt-6">
        <Skeleton variant="rectangular" height={18} borderRadius={999} />
      </div>
      <Skeleton variant="text" width="100%" height={12} />
      <div className="flex flex-col items-center gap-1">
        <Skeleton variant="text" width={200} height={20} />
        <Skeleton variant="text" width={160} />
      </div>
    </div>
  );
}

export interface MyCOurseCardProps {
  price?: string | React.ReactNode | null;
  logo?: string | null;
  courseName?: string | null;
  examData?: string | number | null;
  rating?: string | number | null;
  badge?: string;
  /** Makes the status badge a button (look unchanged) — used for "Trial Ended" → payment (CC-111). */
  statusClick?: () => void;
  /** Enrollment creation date: the trial badge counts its days left from it (CC-67). */
  trialStartedAt?: string | number | null;
  // Exam `short_name` — drives the per-exam price override (e.g. HPTET)
  // shown in `myCourses.priceNote`. See @/lib/payment/examPriceOverrides.
  examShortName?: string | null;

  // progress bar
  topics?: {
    title?: string | null;
    completed?: string | number;
    total?: string | number;
  };
  tests?: {
    title?: string | null;
    completed?: string | number;
    total?: string | number;
  };

  maxWidth?: string;
  bgColor?: string;
  cardClasses?: string;

  // CTA Action
  continueClick?: () => void;
  // No subject/level picked yet (enrollment stage_id is null) — shows an
  // "Add subjects" hint above the Continue button.
  needsSubjects?: boolean;
  unlockClick?: () => void;
  /** Mobile carousel: hide the Buy block in the card (it is shown as its own
   * widget under the carousel instead). Desktop keeps it in the card. */
  hideBuyOnMobile?: boolean;
  /** "buy": render ONLY the Buy block (button + price + trial note) in a card —
   * the mobile widget above Today's Daily Test. Same code as inside the card. */
  part?: "all" | "buy";
  editClick?: () => void;

  // ── Cutoff Meter header (phase 98) ────────────────────────────────────────
  /** Paper / level the student picked ("Level 1 (PRT)"); title becomes "{exam} {level}". */
  levelName?: string | null;
  /** Days to the exam; null/undefined hides the line (past, missing or "Upcoming" date). */
  daysToExam?: number | null;
  /**
   * Cutoff Meter for this course. `undefined` = meter not available (feature
   * off / not loaded) → the legacy Chapters / Tests bars render instead (D1).
   */
  meter?: CutoffMeterSummary | null;
  /** Meter is on and its request is in flight → panel skeleton (no layout shift). */
  meterLoading?: boolean;
}

export default function MyCourseCard({
  price,
  bgColor,
  courseName,
  logo,
  examData,
  rating,
  badge,
  statusClick,
  trialStartedAt,
  examShortName,
  topics,
  tests,
  continueClick,
  needsSubjects = false,
  unlockClick,
  hideBuyOnMobile = false,
  part = "all",
  editClick,
  maxWidth = "400px",
  cardClasses,
  levelName,
  daysToExam,
  meter,
  meterLoading = false,
}: MyCOurseCardProps) {
  const t = useTranslations();
  const [continueLoading, setContinueLoading] = React.useState(false);
  const [unlockLoading, setUnlockLoading] = React.useState(false);

  const { label } = getCourseStatus(badge as CourseStatus, t, {
    color: false,
    trialDaysLeft: trialDaysLeft(trialStartedAt),
  });
  // Status pill label: "✓ Full plan" for a paid course, else the existing labels.
  const planLabel = badge === "active" ? `✓ ${t("myCourses.planFull")}` : label;
  const examPrice = useMemo(() => JSON.parse(price ?? "{}") ?? 0, [price]);

  // Same price for every exam, from the same source of truth as
  // payment/initiated — see @/lib/payment/examPriceOverrides.
  const monthlyPrice = useMemo(
    () => getPriceForVariant("1month", null, examShortName ?? undefined),
    [examShortName],
  );
  const buyBlock = (
    <>
              <MainButton
                className="mx-auto max-w-[320px] md:mx-0 md:max-w-none"
                fullWidth
                loading={unlockLoading}
                color="success"
                text={
                  badge === "expired"
                    ? t("myCourses.renewCourse")
                    : t("myCourses.buyFullCourse")
                }
                rightIcon={<ChevronIcon size={20} />}
                onClick={() => {
                  setUnlockLoading(true);
                  unlockClick?.();
                }}
              />
              <div className="flex flex-col items-center gap-1">
                <p className="body-medium !font-normal text-surface-gray-subtle flex gap-2 items-center">
                  <LockIcon size={20} />{" "}
                  <span>
                    {" "}
                    {t("myCourses.priceNote", {
                      price: monthlyPrice,
                    })}
                  </span>
                </p>
                {/* The 3-day trial note is for a student still on trial: not after the trial or a paid plan ended. */}
                {badge !== "expired" && badge !== "trial_end" && (
                  <p className="body-medium !font-normal text-surface-gray-muted">
                    {t("myCourses.trialLimit", { days: 3 })}
                  </p>
                )}
              </div>
    </>
  );

  // Mobile widget above Today's Daily Test: only the Buy block, in a plain card.
  if (part === "buy") {
    if (!unlockClick) return null;
    return (
      <Card className="!rounded-2xl" padding={0}>
        <div className="flex flex-col gap-3 p-4">{buyBlock}</div>
      </Card>
    );
  }

  return (
    <Card
      bgcolor={bgColor}
      minWidth={"250px"}
      padding={0}
      maxWidth={maxWidth}
      // The status badge below is positioned at -top-[10.5px] to straddle the
      // card's top edge, the way it does in production. Card clips by default,
      // which cut off its upper half.
      overflow="visible"
      // `!max-w-full` below `md`: the inner card should stretch edge to edge on
      // small screens, matching the outer column.
      //
      // The `!` is required, not cosmetic. `maxWidth` above resolves to an
      // INLINE `max-width: 400px` inside the shared Card, and an inline style
      // always beats a plain class — so a non-important `max-w-full` would be
      // silently ignored. Tailwind's important modifier emits
      // `max-width: 100% !important`, which does win. Same technique the blog's
      // exam-levels cards already use on this component (`!border-2 !rounded-lg`).
      //
      // Deliberately done here rather than in packages/ui/src/card.tsx: the
      // shared Card is global and must not change for one call site.
      className={clsx("!max-w-full md:!max-w-[400px]", cardClasses)}
    >
      <div className="flex flex-1 flex-col gap-3 px-4 pt-4 pb-2 relative">
        {/* Status pill straddles the card's top edge, as before phase 98 (user
            feedback 2026-11-11). "Trial Ended" stays a button (44px tap area). */}
        {statusClick ? (
          <button
            type="button"
            onClick={statusClick}
            className="absolute z-[1000] -top-[20.5px] right-5 cursor-pointer py-2.5"
          >
            <span className="flex items-center rounded-full text-center px-4 h-6 body-small !font-semibold bg-brand text-white">
              {planLabel}
            </span>
          </button>
        ) : (
          <div className="absolute flex z-[1000] items-center -top-[10.5px] right-5 rounded-full text-center px-4 h-6 body-small !font-semibold bg-brand text-white">
            {planLabel}
          </div>
        )}

        {/* ── Header (phase 98): logo · "{exam} {level}" · days to exam ── */}
        <div className="flex items-center gap-3">
          <div className="w-[48px] h-[48px] shrink-0 rounded-xl overflow-hidden">
            {logo ? (
              <Image
                src={logo}
                alt=""
                width={48}
                height={48}
                className="w-[48px] h-[48px] object-cover rounded-xl"
              />
            ) : (
              <div className="w-full h-full grid place-items-center bg-[var(--color-success-strong)] text-white heading-large !font-bold">
                {(examShortName ?? courseName ?? "?")
                  .trim()
                  .charAt(0)
                  .toUpperCase()}
              </div>
            )}
          </div>
          <div className="min-w-0 flex-1">
            {/* One line, never wraps (user feedback); a very long name ends in "…". */}
            <h5
              className="heading-large !font-semibold text-surface-gray-normal whitespace-nowrap overflow-hidden text-ellipsis"
              title={
                levelName &&
                examShortName &&
                levelName.trim().toLowerCase() !==
                  examShortName.trim().toLowerCase()
                  ? `${examShortName} ${levelName}`
                  : (examShortName ?? courseName ?? undefined)
              }
            >
              {levelName &&
              examShortName &&
              levelName.trim().toLowerCase() !==
                examShortName.trim().toLowerCase()
                ? `${examShortName} ${levelName}`
                : (examShortName ?? courseName)}
            </h5>
            {daysToExam != null &&
              (daysToExam <= 7 ? (
                // Final week (studio): the exam chip turns orange with 🔥.
                <span className="mt-0.5 inline-flex items-center gap-1 rounded-full px-2 body-small !font-semibold bg-[var(--color-warning-bg-soft)] text-[var(--color-warning-strong)]">
                  <span aria-hidden="true">🔥</span>
                  {t("myCourses.examFinalWeek", { days: daysToExam })}
                </span>
              ) : (
                <p className="mt-0.5 body-small !font-medium text-surface-gray-muted flex items-center gap-1">
                  <span aria-hidden="true">📅</span>
                  {t("myCourses.daysToExam", { days: daysToExam })}
                </p>
              ))}
          </div>
          {editClick && (
            <div className="shrink-0">
              <Button
                onClick={() => editClick?.()}
                size="sm"
                color="gray"
                variant="soft"
                rounded="50px"
                rightIcon={<SettingGearIcon color="#000" size={12} />}
              >
                {t("actions.edit")}
              </Button>
            </div>
          )}
        </div>

        {/* ── Cutoff Meter panel; legacy bars only while the meter is unavailable (D1/D2) ── */}
        {meterLoading ? (
          <CutoffMeterPanelSkeleton />
        ) : meter ? (
          <CutoffMeterPanel meter={meter} />
        ) : null}

        <div
          className={clsx(
            "flex flex-col gap-2",
            (meter || meterLoading) && "hidden",
          )}
        >
          {topics && (
            <div className="flex flex-col gap-1 px-1">
              <div className="flex justify-between text-surface-gray-muted">
                <p className="body-medium !font-normal">
                  {t("myCourses.chaptersCompleted")}
                </p>
                <p className="body-medium !font-normal">
                  {highlightTextUtil(
                    topics?.completed + " / " + topics?.total,
                    String(topics?.completed),
                    "text-[#192839]",
                  )}
                </p>
              </div>
              <div>
                <ProgressBar
                  showLabel={false}
                  completed={Number(topics?.completed ?? 2)}
                  total={Number(topics?.total ?? 12)}
                />
              </div>
              <div className="heading-small !font-semibold !text-surface-text-gray-normal">
                {t("myCourses.chaptersLabel")}
              </div>
            </div>
          )}
          {tests && (
            <div className="flex flex-col gap-1 px-1">
              <div className="flex justify-between text-surface-gray-muted">
                <p className="body-medium !font-normal">
                  {t("myCourses.testsAttempted")}
                </p>
                <p className="body-medium !font-normal">
                  {highlightTextUtil(
                    tests?.completed + " / " + tests?.total,
                    String(tests?.completed),
                    "text-[#192839]",
                  )}
                  {/* {tests?.completed}/{tests?.total} */}
                </p>
              </div>
              <div>
                <ProgressBar
                  showLabel={false}
                  total={Number(tests?.total ?? 12)}
                  completed={Number(tests?.completed ?? 2)}
                />
              </div>
              <div className="heading-small !font-semibold text-surface-text-gray-normal">
                {t("myCourses.testSeriesLabel")}
              </div>
            </div>
          )}
        </div>

        {/* mt-auto: in an equal-height carousel slide the buttons sit at the bottom. */}
        <div className="mt-auto flex flex-col gap-3 py-1">
          {continueClick && (
            <div>
              <MainButton
                className="mx-auto max-w-[320px] md:mx-0 md:max-w-none"
                loading={continueLoading}
                fullWidth
                onClick={() => {
                  setContinueLoading(true);
                  continueClick?.();
                }}
                text={
                  needsSubjects
                    ? t("myCourses.addSubjects")
                    : badge === "active"
                      ? t("myCourses.continueLearningActive")
                      : t("myCourses.continueLearning")
                }
                showShimmer
                rightIcon={<ChevronIcon size={20} />}
              />
            </div>
          )}
          {unlockClick && (
            // Mobile carousel moves this block to its own widget (part="buy").
            <div className={hideBuyOnMobile ? "hidden md:flex flex-col gap-3" : "contents"}>{buyBlock}</div>
          )}
        </div>
      </div>
    </Card>
  );
}

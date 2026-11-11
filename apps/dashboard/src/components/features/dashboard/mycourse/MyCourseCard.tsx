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
import { useTranslations } from "next-intl";
import Image from "next/image";
import React, { useMemo } from "react";
import { getPriceForVariant } from "@/lib/payment/examPriceOverrides";
import type { CutoffMeterSummary } from "@/lib/dashboard/cutoffMeter";
import Skeleton from "@clearcut/ui/skeleton";
import { useCountUp } from "@clearcut/motion/core";
import { motion, useReducedMotion } from "framer-motion";
import { Nib } from "@clearcut/motion/meters/nib";
import type { ZoneKey } from "@clearcut/motion/meters/zones";
import { CutoffMeterBar } from "./CutoffMeterBar";

/**
 * Zone styles, design tokens only. The spec's 3 colours plus the studio's
 * Safe Zone (pass + 10, user "sab kro" 2026-11-11). `fill` = bar colour.
 */
const ZONES = {
  needs_work: { key: "needsWork", fill: "var(--color-danger-subtle)", pill: "bg-[var(--color-danger-bg-soft)] text-[var(--color-danger-strong)]" },
  almost_there: { key: "almostThere", fill: "var(--color-warning-muted)", pill: "bg-[var(--color-warning-bg-soft)] text-[var(--color-warning-strong)]" },
  clear_zone: { key: "clearZone", fill: "var(--color-success)", pill: "bg-[var(--color-success-bg-soft)] text-[var(--color-success-strong)]" },
  safe_zone: { key: "safeZone", fill: "var(--color-success-strong)", pill: "bg-[var(--color-success-bg-soft)] text-[var(--color-success-strong)]" },
} as const;
const SOFT_BLUE_PILL = "bg-[var(--color-primary-bg-soft)] text-[var(--color-brand-dark)]";

/**
 * Meter panel (phase 98) — every Cutoff Meter Studio state:
 * Locked · Early estimate · Needs work · Almost there · Clear Zone · Safe Zone ·
 * Score dropped / went up (delta chip + wobble) · Cooling down (display-only
 * decay, desaturated bar, ❄). "Final week" lives in the card header.
 */
const STUDIO_ZONE: Record<NonNullable<CutoffMeterSummary["zone"]>, ZoneKey> = {
  needs_work: "need",
  almost_there: "almost",
  clear_zone: "clear",
  safe_zone: "safe",
};

/** Confidence band (± marks) per state, as the studio's state table: wide while early, tight when settled. */
function meterBand(meter: CutoffMeterSummary, change: number, cooling: boolean): number {
  if (meter.early) return 15;
  if (cooling) return 7;
  if (change < 0) return 6;
  return meter.confidence === "high" ? 4 : 6;
}

type NibPose = { mood: "happy" | "determined" | "wow" | "sleepy"; accessory: "none" | "cap" | "headband" | "zzz" | "star" };

/** Nibbu's pose per state, exactly as Cutoff Meter Studio's state table. */
function nibPose(meter: CutoffMeterSummary, change: number, cooling: boolean, finalWeek: boolean): NibPose {
  if (cooling) return { mood: "sleepy", accessory: "zzz" };
  if (change < 0) return { mood: "determined", accessory: "headband" }; // Score dropped
  if (meter.early) return { mood: "wow", accessory: "none" }; // Early estimate
  if (finalWeek) return { mood: "determined", accessory: "none" };
  switch (meter.zone) {
    case "needs_work":
      return { mood: "determined", accessory: "headband" };
    case "almost_there":
      return { mood: "determined", accessory: "none" };
    case "clear_zone":
      return { mood: "happy", accessory: "cap" };
    case "safe_zone":
      return { mood: "happy", accessory: "star" };
    default:
      return { mood: "happy", accessory: "none" };
  }
}

function CutoffMeterPanel({ meter, daysToExam }: { meter: CutoffMeterSummary; daysToExam?: number | null }) {
  const t = useTranslations("myCourses");
  const reduce = useReducedMotion();
  const locked = meter.locked || meter.meter === null;
  const cooling = !locked && meter.cooling?.active;
  const value = meter.display_meter ?? meter.meter ?? 0;
  const gap = meter.display_gap ?? meter.gap ?? 0;
  const zone = meter.zone ? ZONES[meter.zone] : null;
  const toUnlock = Math.max(meter.unlock_answers - meter.counted_answers, 1);
  // A change since the last test; hidden while cooling (that has its own message).
  const change = !locked && !cooling && meter.change ? Math.round(meter.change) : 0;
  // Design: the number counts up with the bar (same 1150 ms, 250 ms delay).
  const shown = useCountUp(locked ? 0 : Math.round(value), { duration: 1150, delay: 250 });
  const pose = nibPose(meter, change, !!cooling, daysToExam != null && daysToExam <= 7);

  const pill = locked
    ? { cls: "bg-[var(--color-surface-gray-muted)]/15 text-surface-gray-muted", text: t("meterZone.locked") }
    : cooling
      ? { cls: SOFT_BLUE_PILL, text: `❄ ${t("meterZone.cooling")}` }
      : meter.early
        ? { cls: SOFT_BLUE_PILL, text: t("meterZone.earlyEstimate") }
        : { cls: zone?.pill ?? "", text: t(`meterZone.${zone?.key ?? "needsWork"}`) + (meter.zone === "safe_zone" ? " ★" : "") };

  return (
    <motion.div
      className="flex flex-col gap-2 rounded-xl bg-[var(--color-background-gray-subtle)] px-3 pt-3 pb-2.5"
      // Score dropped: one gentle wobble once the needle has settled (studio, 600 ms).
      animate={change < 0 && !reduce ? { x: [0, -5, 4, -2, 1, 0] } : undefined}
      transition={{ duration: 0.6, delay: 1.3, ease: "easeInOut" }}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          <p className="leading-none text-surface-gray-normal">
            <span className="heading-2xxlarge !font-bold tabular-nums">{locked ? "?" : shown}</span>
            <span className="body-medium !font-semibold text-surface-gray-muted"> / {meter.max_marks}</span>
          </p>
          {change !== 0 && (
            <motion.span
              aria-label={t("meterChange", { change: change > 0 ? `+${change}` : `−${Math.abs(change)}` })}
              className={clsx(
                "rounded-full px-2 py-0.5 body-small !font-bold",
                change > 0
                  ? "bg-[var(--color-success-bg-soft)] text-[var(--color-success-strong)]"
                  : "bg-[var(--color-danger-bg-soft)] text-[var(--color-danger-strong)]",
              )}
              initial={reduce ? false : { opacity: 0, scale: 0.7, y: 6 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ delay: 0.9, type: "spring", stiffness: 420, damping: 18 }}
            >
              {change > 0 ? `+${change}` : `−${Math.abs(change)}`}
            </motion.span>
          )}
        </div>
        <span className={clsx("shrink-0 rounded-full px-3 py-1 body-small !font-semibold", pill.cls)}>{pill.text}</span>
      </div>
      {/* Cooling: colours drain (studio: grayscale .8, 1.4 s). */}
      {/* pt: room for Nibbu riding 30px above the fill's end (studio bar meter). */}
      <div
        className="pt-8 pb-2 transition-[filter] duration-[1400ms]"
        style={{ filter: cooling ? "grayscale(0.8) brightness(1.05)" : undefined }}
      >
        <CutoffMeterBar
          value={value}
          max={meter.max_marks}
          pass={meter.pass_mark}
          band={meterBand(meter, change, !!cooling)}
          zone={meter.zone ? STUDIO_ZONE[meter.zone] : "need"}
          locked={locked}
          ariaLabel={t("cutoffMeter")}
          rider={
            // Re-keyed so a pose change replays the studio pop / cap drop.
            <Nib key={`${pose.mood}-${pose.accessory}`} mood={pose.mood} accessory={pose.accessory} pop bob={!!cooling} />
          }
        />
      </div>
      <div className="flex items-center justify-between gap-2">
        <span className="body-small !font-medium text-surface-gray-muted">{t("cutoffMeter")}</span>
        <span className="body-small !font-semibold text-surface-gray-normal text-right">
          {locked
            ? t("meterUnlock", { count: toUnlock })
            : cooling
              ? t("meterCooled", { marks: Math.round(meter.cooling.decay) })
              : gap > 0
                ? t("meterGap", { marks: Math.ceil(gap) })
                : t("meterAbove", { marks: Math.round(-gap) })}
        </span>
      </div>
    </motion.div>
  );
}

function CutoffMeterPanelSkeleton() {
  return (
    <div className="flex flex-col gap-2 rounded-xl bg-[var(--color-background-gray-subtle)] px-3 pt-3 pb-2.5" aria-hidden="true">
      <div className="flex items-start justify-between">
        <Skeleton variant="text" width={90} height={36} />
        <Skeleton variant="rectangular" width={96} height={24} borderRadius={999} />
      </div>
      <Skeleton variant="rectangular" height={8} borderRadius={999} />
      <div className="flex justify-between">
        <Skeleton variant="text" width={80} />
        <Skeleton variant="text" width={120} />
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
      <div className="flex flex-col gap-3 px-4 pt-4 pb-2 relative">
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
                {(examShortName ?? courseName ?? "?").trim().charAt(0).toUpperCase()}
              </div>
            )}
          </div>
          <div className="min-w-0 flex-1">
            {/* One line, never wraps (user feedback); a very long name ends in "…". */}
            <h5
              className="heading-large !font-semibold text-surface-gray-normal whitespace-nowrap overflow-hidden text-ellipsis"
              title={levelName && examShortName ? `${examShortName} ${levelName}` : (courseName ?? undefined)}
            >
              {levelName && examShortName ? `${examShortName} ${levelName}` : courseName}
            </h5>
            {daysToExam != null &&
              (daysToExam <= 7 ? (
                // Final week (studio): the exam chip turns orange with 🔥.
                <span className="mt-1 inline-flex items-center gap-1 rounded-full px-2 py-0.5 body-small !font-semibold bg-[var(--color-warning-bg-soft)] text-[var(--color-warning-strong)]">
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
          <CutoffMeterPanel meter={meter} daysToExam={daysToExam} />
        ) : null}

        <div className={clsx("flex flex-col gap-2", (meter || meterLoading) && "hidden")}>
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

        <div className="flex flex-col gap-3 py-1">
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
            <>
              <MainButton
                className="mx-auto max-w-[320px] md:mx-0 md:max-w-none"
                fullWidth
                loading={unlockLoading}
                color="success"
                text={badge === "expired" ? t("myCourses.renewCourse") : t("myCourses.buyFullCourse")}
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
          )}
        </div>
      </div>
    </Card>
  );
}

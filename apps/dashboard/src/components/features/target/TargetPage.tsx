"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import clsx from "clsx";
import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { Meter, type MeterHandle } from "@clearcut/motion/meters/meter";
import { ZONES, zoneOf } from "@clearcut/motion/meters/zones";
import { Sparkline } from "@clearcut/motion/meters/sparkline";
import { meterPill } from "@/lib/dashboard/meterPill";
import dynamic from "next/dynamic";
import { useModalStore } from "@/store/modal/useModalStore";
import { useCutoffMeterInfoStore } from "@/components/modals/cutoff-meter/useCutoffMeterInfoStore";

const CutoffMeterInfoModal = dynamic(() => import("@/components/modals/cutoff-meter/CutoffMeterInfoModal"), {
  ssr: false,
});
import Skeleton from "@clearcut/ui/skeleton";
import MainButton from "@/components/ui/button/main-button";
import ProgressBar from "@/components/ui/ProgressBar";
import { useProgressCapabilities } from "@/components/features/preparation/hooks/useProgressCapabilities";
import { useGetCurrentCourse } from "@/hooks/course/useGetCurrentCourse";
import { useCutoffMeter } from "@/hooks/course/useCutoffMeter";
import { isApiError } from "@/lib/api/api-error";
import {
  markCutoffMeterActionClicked,
  type CutoffMeterAction,
  type CutoffMeterDetail,
} from "@/lib/dashboard/cutoffMeter";

/**
 * Preparation → Target tab (phase 99): Cutoff Meter gauge, today's plan and
 * predicted marks per subject, from ONE `GET /v2/cutoff-meter/{course}`.
 * Gauge + zone colours are the approved Cutoff Meter Studio artwork
 * (`@clearcut/motion/meters`); text is ours (en / hi / mr).
 */

const CARD = "rounded-[20px] border border-[var(--color-border-gray-subtle)] bg-white p-4";

/** Where a plan row leads (existing routes only). */
function actionHref(a: CutoffMeterAction, courseId: string): string {
  if (a.action_type === "SECTIONAL_TEST" || a.action_type === "FULL_LENGTH_TEST") return `/test-series/${courseId}`;
  if ((a.action_type === "TOPIC_TEST" || a.action_type === "LEARN") && a.topic_id) {
    const q = new URLSearchParams();
    if (a.chapter_id) q.set("chapter", String(a.chapter_id));
    q.set("topic", String(a.topic_id));
    return `/preparation/${courseId}?${q.toString()}`;
  }
  return `/preparation/${courseId}`;
}

/* ───────────────────────── Meter card ───────────────────────── */

/**
 * The studio's Meter Screen gauge card, 1:1 (reference 2026-11-11): big gauge
 * with "Cutoff N" at the tick, number + "predicted marks / max", the zone pill
 * under it, the gap line, "Range ±N · based on N tests", and a dashed row with
 * the "Last 5 weeks" sparkline (from meter_history).
 */
function MeterCard({ m }: { m: CutoffMeterDetail }) {
  const t = useTranslations();
  const tc = useTranslations("myCourses");
  const locale = useLocale();
  const ref = useRef<MeterHandle>(null);
  const locked = m.locked || m.meter === null;
  const cooling = !locked && !!m.cooling?.active;
  const value = Math.round(m.display_meter ?? m.meter ?? 0);
  const gap = m.display_gap ?? m.gap ?? 0;
  const pass = Math.round(m.pass_mark);
  const needed = Number(m.plan?.[0]?.params?.answers_needed ?? m.actions?.[0]?.params?.answers_needed);
  const toUnlock = Number.isFinite(m.unlock_answers)
    ? Math.max(m.unlock_answers - m.counted_answers, 1)
    : Number.isFinite(needed) ? needed : 5;
  const change = !locked && !cooling && m.change ? Math.round(m.change) : 0;
  const trend = m.trend ?? [];
  const zone = locked ? "locked" : zoneOf(value, { max: m.max_marks, cutoff: pass });
  // Tap the card → "How your Cutoff Meter works" (same page-level modal as the course card).
  const openModal = useModalStore((st) => st.open);
  const setInfoMeter = useCutoffMeterInfoStore((st) => st.setMeter);
  const openInfo = () => {
    setInfoMeter(m, "gauge");
    openModal("cutoff-meter-info");
  };

  // Score dropped / went up: the studio's delta chip (+ wobble on a drop) once the needle has settled.
  useEffect(() => {
    if (!change) return;
    const id = setTimeout(() => {
      ref.current?.delta(change);
      if (change < 0) ref.current?.wobble();
    }, 1400);
    return () => clearTimeout(id);
  }, [change]);

  return (
    <section
      role="button"
      tabIndex={0}
      onClick={openInfo}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          openInfo();
        }
      }}
      className={clsx(CARD, "cursor-pointer px-4 pt-4 pb-3.5 outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-brand)]")}
      style={cooling ? { background: "linear-gradient(180deg, var(--color-background-gray-subtle), white)" } : undefined}
      aria-label={t("myCourses.meterInfo.title")}
    >
      {/* Studio gauge, scaled to the card like the reference (≈ 300px). */}
      <div className="mx-auto w-full max-w-[300px]">
        <Meter
          ref={ref}
          fluid
          variant="gauge"
          lang={locale === "hi" ? "hi" : "en"}
          scale={{ max: m.max_marks, cutoff: pass }}
          locked={locked}
          value={locked ? undefined : value}
          band={m.band ?? 0}
          cooling={cooling}
          hideCoolChip
          pill={meterPill(m, (k) => tc(k))}
          caption={t("target.predictedCaption", { max: m.max_marks })}
          cutoffLabel={tc("meterCutoff", { pass })}
        />
      </div>
      <div className="mt-2.5 text-center">
        <p className="text-[17px] leading-6 font-bold text-surface-gray-normal">
          {locked
            ? tc("meterUnlock", { count: toUnlock })
            : cooling
              ? tc("meterCooled", { marks: Math.round(m.cooling.decay) })
              : gap > 0
                ? tc("meterGap", { marks: Math.ceil(gap) })
                : tc("meterAbove", { marks: Math.round(-gap) })}
        </p>
        {!locked && !!m.band && (
          <p className="mt-0.5 text-[14px] leading-5 text-surface-gray-muted">
            {m.tests_count
              ? tc("meterRangeTests", { band: m.band, tests: m.tests_count })
              : tc("meterRange", { band: m.band })}
          </p>
        )}
      </div>
      <div className="mt-3 flex items-center justify-between border-t border-dashed border-[var(--color-border-gray-subtle)] pt-3 text-[13px] text-surface-gray-muted">
        {trend.length > 1 ? (
          <>
            <span>{t("target.last5Weeks")}</span>
            <span className="flex items-center gap-1.5">
              <Sparkline trend={trend} zone={zone} />
              <b className="tabular-nums text-surface-gray-normal">
                {trend[trend.length - 1] - trend[0] >= 0 ? "+" : "−"}
                {Math.abs(trend[trend.length - 1] - trend[0])}
              </b>
            </span>
          </>
        ) : (
          <>
            <span>{t("target.accuracyTarget")}</span>
            <b className="text-surface-gray-normal">{t("target.accuracyValue")}</b>
          </>
        )}
      </div>
    </section>
  );
}

/* ───────────────────────── Today's plan ───────────────────────── */

/**
 * Row title = the topic / section name (DB content). The backend title is
 * "{name} · Topic test" in English; keep only the name, the type is in the meta line.
 */
function actionTitle(a: CutoffMeterAction, t: ReturnType<typeof useTranslations>): string {
  const p = a.params ?? {};
  if (a.action_type === "TOPIC_TEST" || a.action_type === "LEARN" || a.action_type === "SECTIONAL_TEST") {
    const name = p.topic ?? (a.title ? a.title.split(" · ")[0] : "") ?? p.section;
    if (name && String(name).trim()) return String(name).trim();
    if (p.section) return String(p.section);
  }
  return t(`target.types.${a.action_type}`);
}

function shorten(text: string, max: number): string {
  return text.length > max ? `${text.slice(0, max - 1).trimEnd()}…` : text;
}

function TodayPlan({ m, courseId }: { m: CutoffMeterDetail; courseId: string }) {
  const t = useTranslations();
  const router = useRouter();
  const plan = m.plan?.length ? m.plan : m.actions;
  const done = plan.filter((a) => a.completed).length;
  // Next: the first open row of today's plan, else the newest generated action.
  const next = plan.find((a) => !a.completed) ?? m.actions.find((a) => !a.completed && !plan.some((p) => p.id === a.id));
  const [going, setGoing] = useState<string | null>(null);

  const go = (a: CutoffMeterAction) => {
    if (going) return; // double tap
    setGoing(a.id);
    markCutoffMeterActionClicked(a.id).catch(() => {});
    router.push(actionHref(a, courseId));
  };

  if (!plan.length) return null;

  return (
    <section className={CARD}>
      <div className="flex items-start justify-between gap-2">
        <div>
          <h2 className="heading-medium !font-bold text-surface-gray-normal">{t("target.todayPlan")}</h2>
          <p className="body-small !font-medium text-surface-gray-muted">{t("target.pickedBy")}</p>
        </div>
        <span className="shrink-0 rounded-full px-2.5 py-0.5 body-small !font-bold tabular-nums bg-[var(--color-primary-bg-soft)] text-[var(--color-brand-dark)]">
          {done}/{plan.length}
        </span>
      </div>
      <div className="mt-3">
        <ProgressBar
          showLabel={false}
          completed={done}
          total={plan.length}
          height={3}
          color="var(--color-brand)"
          backgroundColor="var(--color-background-gray-subtle)"
        />
      </div>

      <ul className="mt-1 divide-y divide-[var(--color-border-gray-subtle)]">
        {plan.map((a) => (
          <li key={a.id}>
            <button
              type="button"
              onClick={() => go(a)}
              disabled={!!going}
              className="flex w-full items-center gap-3 py-3 text-left cursor-pointer disabled:cursor-default"
            >
              <span
                aria-hidden="true"
                className={clsx(
                  "grid h-[26px] w-[26px] shrink-0 place-items-center rounded-full border-2 text-white body-small !font-bold",
                  a.completed
                    ? "border-[var(--color-success)] bg-[var(--color-success)]"
                    : "border-[var(--color-border-gray-subtle)]",
                )}
              >
                {a.completed ? "✓" : ""}
              </span>
              <span className="min-w-0 flex-1">
                <span
                  className={clsx(
                    "block truncate heading-small !font-bold leading-6",
                    a.completed ? "text-surface-gray-muted line-through" : "text-surface-gray-normal",
                  )}
                >
                  {actionTitle(a, t)}
                </span>
                <span className="block body-small !font-medium text-surface-gray-muted">
                  {t("target.meta", { type: t(`target.types.${a.action_type}`), min: a.est_time_min })}
                </span>
              </span>
              {a.action_type === "ONBOARDING_TEST" && (m.locked || m.meter === null) ? (
                <span className="inline-flex h-6 shrink-0 items-center rounded-full px-2 body-small !font-bold bg-[var(--color-primary-bg-soft)] text-[var(--color-brand-dark)]">
                  {t("target.unlocksMeter")}
                </span>
              ) : a.expected_gain ? (
                <span className="inline-flex h-6 shrink-0 items-center rounded-full px-2 body-small !font-bold bg-[var(--color-success-bg-soft)] text-[var(--color-success-strong)]">
                  {t("target.gain", { marks: a.expected_gain })}
                </span>
              ) : null}
            </button>
          </li>
        ))}
      </ul>

      {next ? (
        <MainButton
          className="mt-3 min-h-[50px]"
          fullWidth
          size="lg"
          rounded="14px"
          pY="py-[15px]"
          loading={going === next.id}
          showIcon={false}
          onClick={() => go(next)}
          // MainButton centres its text without shrinking it, so a long topic name is
          // shortened here (≈ 26 chars fit a 390px screen); the "›" always shows.
          text={`${t(plan.includes(next) ? "target.start" : "target.keepGoing", { title: shorten(actionTitle(next, t), 26) })} ›`}
        />
      ) : (
        <p className="mt-3 text-center heading-small !font-semibold text-[var(--color-success-strong)]">{t("target.allDone")}</p>
      )}
    </section>
  );
}

/* ───────────────────────── Marks breakdown ───────────────────────── */

function MarksBreakdown({ m }: { m: CutoffMeterDetail }) {
  const t = useTranslations();
  const locked = m.locked || m.meter === null;
  const [grown, setGrown] = useState(false);
  useEffect(() => {
    // Studio: subject bars grow in after the needle (≈ 1.1 s).
    const id = setTimeout(() => setGrown(true), 1100);
    return () => clearTimeout(id);
  }, []);

  const rows = useMemo(() => (m.sections ?? []).filter((s) => s.total_marks > 0), [m.sections]);

  return (
    <section className={CARD}>
      <h2 className="heading-medium !font-bold text-surface-gray-normal">{t("target.marksFrom")}</h2>
      {locked || !rows.length ? (
        <p className="mt-2 body-medium text-surface-gray-muted">{t("target.breakdownLocked")}</p>
      ) : (
        <ul className="mt-3 space-y-2.5">
          {rows.map((s) => {
            const pct = Math.min(Math.max(s.section_marks / s.total_marks, 0), 1);
            const c = pct < 0.5 ? ZONES.need.c : pct < 0.6 ? ZONES.almost.c : ZONES.clear.c;
            return (
              <li key={s.section_id} className="grid grid-cols-[minmax(0,1fr)_46%_3rem] items-center gap-3">
                <span className="line-clamp-2 leading-tight body-medium !font-normal text-surface-gray-normal" title={s.name}>
                  {s.name}
                </span>
                <span className="h-2 overflow-hidden rounded-full bg-[var(--color-background-gray-subtle)]">
                  <i
                    className="block h-full rounded-full motion-safe:transition-[width] motion-safe:duration-[900ms] motion-safe:ease-[cubic-bezier(0.22,1,0.36,1)]"
                    style={{ width: grown ? `${pct * 100}%` : 0, background: c }}
                  />
                </span>
                <b className="text-right body-medium !font-bold tabular-nums text-surface-gray-normal">
                  {Math.round(s.section_marks)}/{s.total_marks}
                </b>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}

/* ───────────────────────── Page ───────────────────────── */

function TargetSkeleton() {
  return (
    <div className="space-y-3" aria-hidden="true">
      <Skeleton variant="rectangular" height={150} borderRadius={16} />
      <Skeleton variant="rectangular" height={300} borderRadius={16} />
      <Skeleton variant="rectangular" height={180} borderRadius={16} />
    </div>
  );
}

export default function TargetPage({ courseId }: { courseId: string }) {
  const t = useTranslations();
  const router = useRouter();
  useGetCurrentCourse({ courseId }); // topbar title
  const { caps, ready } = useProgressCapabilities();
  const { data, isLoading, isError, error, refetch, isFetching } = useCutoffMeter(courseId, caps.cutoff_meter);

  // Meter off, or not this user's course → back to the Course tab.
  const notFound = isError && isApiError(error) && error.status === 404;
  useEffect(() => {
    if ((ready && !caps.cutoff_meter) || notFound) router.replace(`/preparation/${courseId}`);
  }, [ready, caps.cutoff_meter, notFound, courseId, router]);

  const { isOpen, stack } = useModalStore();
  const activeModal = stack[stack.length - 1];

  return (
    <div className="mx-auto w-full max-w-[560px] space-y-3 px-4 py-4">
      {/* Page-level modal, same pattern as LearnPage / the profile page. */}
      {isOpen && activeModal === "cutoff-meter-info" && <CutoffMeterInfoModal />}
      {!data && (isLoading || !ready || notFound) ? (
        <TargetSkeleton />
      ) : isError || !data ? (
        <div className={clsx(CARD, "text-center")}>
          <p className="body-medium text-surface-gray-normal">{t("target.error")}</p>
          <MainButton className="mx-auto mt-3 max-w-[200px]" loading={isFetching} onClick={() => refetch()} text={t("target.retry")} />
        </div>
      ) : (
        <>
          <MeterCard m={data} />
          <TodayPlan m={data} courseId={courseId} />
          <MarksBreakdown m={data} />
        </>
      )}
    </div>
  );
}

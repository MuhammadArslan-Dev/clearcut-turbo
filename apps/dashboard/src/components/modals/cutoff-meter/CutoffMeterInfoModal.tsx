"use client";

import { AnimatePresence } from "framer-motion";
import { useLocale, useTranslations } from "next-intl";
import { useIsMobile } from "@/hooks/useIsMobile";
import { BottomSheet } from "@/components/features/Sheets/BottomSheet";
import { Modal } from "@/components/features/Sheets/Modal";
import { CrossIcon } from "@/components/ui/icons";
import { Meter } from "@clearcut/motion/meters/meter";
import { Nib } from "@clearcut/motion/meters/nib";
import {
  ZONES,
  riderPose,
  trackColour,
  zoneOf,
  zoneWidths,
} from "@clearcut/motion/meters/zones";
import type { CutoffMeterSummary } from "@/lib/dashboard/cutoffMeter";
import { meterPill } from "@/lib/dashboard/meterPill";
import { useModalStore } from "@/store/modal/useModalStore";
import { useCutoffMeterInfoStore } from "./useCutoffMeterInfoStore";

/**
 * "How your Cutoff Meter works" — opened by tapping the meter on a My Courses
 * card (phase 99). Page-level like the profile page's Language / Help modals:
 * LearnPage renders it while `active === "cutoff-meter-info"`, the card only
 * calls `open("cutoff-meter-info")`. Mobile = bottom sheet, desktop = modal.
 *
 * Layout in the Cutoff Meter Studio style: the student's own mini meter, three
 * "how it's calculated" tiles, the range, a zone strip with this exam's own
 * numbers, and the cooling tip. Every number is the student's / this exam's;
 * the rules mirror the backend (CutoffMeterService, config/cutoff_meter.php).
 */
export default function CutoffMeterInfoModal() {
  const { closeModal } = useModalStore();
  const meter = useCutoffMeterInfoStore((st) => st.meter);
  const variant = useCutoffMeterInfoStore((st) => st.variant);
  if (!meter) return null;
  return (
    <AnimatePresence>
      <MeterInfoBody
        meter={meter}
        variant={variant}
        onClose={() => closeModal("cutoff-meter-info")}
      />
    </AnimatePresence>
  );
}

const TILE =
  "rounded-2xl border border-[var(--color-border-gray-subtle)] bg-white p-3";

function MeterInfoBody({
  meter,
  variant,
  onClose,
}: {
  meter: CutoffMeterSummary;
  variant: "bar" | "gauge";
  onClose: () => void;
}) {
  const t = useTranslations("myCourses.meterInfo");
  const tc = useTranslations("myCourses");
  const locale = useLocale();
  const isMobile = useIsMobile();
  const Container = isMobile ? BottomSheet : Modal;

  const locked = meter.locked || meter.meter === null;
  const max = meter.max_marks;
  const pass = Math.round(meter.pass_mark);
  const value = Math.round(meter.display_meter ?? meter.meter ?? 0);
  const scale = { max, cutoff: pass };
  const w = zoneWidths(scale);
  const almostFrom = Math.max(0, Math.round(pass - w.almost));
  const safeFrom = Math.min(max, Math.round(pass + w.clear));
  const [mood, accessory] = riderPose(locked ? "locked" : zoneOf(value, scale));
  const band = meter.band ?? 15;

  // Zone strip: widths are this exam's own ranges.
  const strip = [
    {
      k: "need",
      from: 0,
      to: almostFrom,
      name: t("zoneNeed"),
      rule: t("ruleBelow", { marks: almostFrom }),
    },
    {
      k: "almost",
      from: almostFrom,
      to: pass,
      name: t("zoneAlmost"),
      rule: t("ruleBetween", { from: almostFrom, to: pass }),
    },
    {
      k: "clear",
      from: pass,
      to: safeFrom,
      name: t("zoneClear"),
      rule: t("ruleBetween", { from: pass, to: safeFrom }),
    },
    {
      k: "safe",
      from: safeFrom,
      to: max,
      name: t("zoneSafe"),
      rule: t("ruleAbove", { marks: safeFrom }),
    },
  ] as const;

  const tiles = [
    {
      icon: "📝",
      title: t("s1Title"),
      body: t("s1Body", {
        answers: meter.counted_answers,
        tests: meter.tests_count ?? 0,
      }),
    },
    { icon: "🧮", title: t("s2Title"), body: t("s2Body", { max }) },
    { icon: "🎯", title: t("s3Title"), body: t("s3Body", { pass, max }) },
  ];

  return (
    <Container
      isOpen
      onClose={onClose}
      isHeader={false}
      title={t("title")}
      maxWidth="md:max-w-[460px]"
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={t("title")}
        className="flex max-h-[88dvh] flex-col"
      >
        {/* Header */}
        <div className="flex items-center gap-3 px-4 pt-4 pb-3">
          <div className="w-9 shrink-0" aria-hidden="true">
            <Nib mood={mood} accessory={accessory} bob />
          </div>
          <h2 className="flex-1 heading-medium !font-bold text-surface-gray-normal">
            {t("title")}
          </h2>
          <button
            type="button"
            aria-label={t("close")}
            onClick={onClose}
            className="shrink-0 cursor-pointer rounded-full p-1.5 hover:bg-[var(--color-background-gray-subtle)]"
          >
            <CrossIcon />
          </button>
        </div>

        <div className="space-y-4 overflow-y-auto px-4 pb-6">
          {/* 1. The student's own meter */}
          <section className="rounded-2xl bg-[var(--color-background-gray-subtle)] px-4 pt-4 pb-3">
            {/* Same shape as where it was opened: bar (course card) or gauge (Target tab). */}
            <div
              className={variant === "gauge" ? "mx-auto w-[200px]" : undefined}
            >
              <Meter
                variant={variant}
                size="sm"
                fluid
                lang={locale === "hi" ? "hi" : "en"}
                scale={scale}
                locked={locked}
                value={locked ? undefined : value}
                band={meter.band ?? 0}
                pill={meterPill(meter, (k) => tc(k))}
                cutoffLabel={tc("meterCutoff", { pass })}
                caption={
                  variant === "gauge"
                    ? tc("meterInfo.gaugeCaption", { max })
                    : undefined
                }
                hideCoolChip
              />
            </div>
            <p className="mt-2 text-center body-medium !font-semibold text-surface-gray-normal">
              {locked
                ? t("youLocked", {
                    count: Math.max(
                      meter.unlock_answers - meter.counted_answers,
                      1,
                    ),
                    pass,
                    max,
                  })
                : t("youSummary", { value, max, pass })}
            </p>
          </section>

          {/* 2. How it's calculated */}
          <section>
            <h3 className="mb-2 heading-small !font-bold text-surface-gray-normal">
              {t("howTitle")}
            </h3>
            <ol className="space-y-2">
              {tiles.map((s, i) => (
                <li key={i} className={`${TILE} flex gap-3`}>
                  <span
                    aria-hidden="true"
                    className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-[var(--color-primary-bg-soft)] text-[18px]"
                  >
                    {s.icon}
                  </span>
                  <div className="min-w-0">
                    <p className="heading-small !font-bold text-surface-gray-normal">
                      {s.title}
                    </p>
                    <p className="mt-0.5 body-small text-surface-gray-muted">
                      {s.body}
                    </p>
                  </div>
                </li>
              ))}
            </ol>
          </section>

          {/* 3. Range */}
          <section className={TILE}>
            <div className="flex items-center justify-between gap-2">
              <p className="heading-small !font-bold text-surface-gray-normal">
                {t("s4Title", { band })}
              </p>
              <div
                className="flex items-center gap-1 body-small !font-bold"
                aria-hidden="true"
              >
                {[15, 6, 4].map((b, i) => (
                  <span key={b} className="flex items-center gap-1">
                    {i > 0 && (
                      <span className="text-surface-gray-muted">→</span>
                    )}
                    <span
                      className={
                        b === band
                          ? "rounded-full bg-[var(--color-primary-bg-soft)] px-2 py-0.5 text-[var(--color-brand-dark)]"
                          : "px-1 text-surface-gray-muted"
                      }
                    >
                      ±{b}
                    </span>
                  </span>
                ))}
              </div>
            </div>
            <p className="mt-1 body-small text-surface-gray-muted">
              {t("s4Body", { band })}
            </p>
          </section>

          {/* 4. Zones — this exam's own numbers */}
          <section>
            <h3 className="mb-2 heading-small !font-bold text-surface-gray-normal">
              {t("zonesTitle")}
            </h3>
            <div
              className="flex h-3 overflow-hidden rounded-full"
              aria-hidden="true"
            >
              {strip.map((z) => (
                <i
                  key={z.k}
                  style={{
                    flexGrow: Math.max(z.to - z.from, 0.001),
                    // Same rule as the meter: full colour once the score reached this range, light before.
                    background: trackColour(z.k, locked ? "locked" : zoneOf(value, scale)),
                  }}
                />
              ))}
            </div>
            <ul className="mt-3 grid grid-cols-2 gap-2">
              {strip.map((z) => (
                <li
                  key={z.k}
                  className="rounded-xl px-3 py-2"
                  style={{ background: ZONES[z.k].s }}
                >
                  <p
                    className="body-small !font-bold"
                    style={{ color: ZONES[z.k].ink }}
                  >
                    {z.name}
                  </p>
                  <p className="body-small text-surface-gray-normal">
                    {z.rule}
                  </p>
                </li>
              ))}
            </ul>
          </section>

          {/* 5. Updates + cooling */}
          <section className="flex gap-3 rounded-2xl bg-[var(--color-primary-bg-soft)] p-3">
            <span aria-hidden="true" className="text-[20px] leading-none">
              ❄
            </span>
            <div>
              <p className="heading-small !font-bold text-surface-gray-normal">
                {t("s5Title")}
              </p>
              <p className="mt-0.5 body-small text-surface-gray-muted">
                {t("s5Body")}
              </p>
            </div>
          </section>

          <p className="text-center body-small text-surface-gray-muted">
            {t("note")}
          </p>
        </div>
      </div>
    </Container>
  );
}

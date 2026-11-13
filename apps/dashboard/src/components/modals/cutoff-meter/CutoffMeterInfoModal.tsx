"use client";

import Image from "next/image";
import { useEffect, useRef } from "react";
import { useAuth } from "@/providers/AuthProvider";
import { trackMeterInfoViewed } from "@/lib/analytics/cutoffMeter";
import { AnimatePresence } from "framer-motion";
import { useLocale, useTranslations } from "next-intl";
import { useIsMobile } from "@/hooks/useIsMobile";
import { BottomSheet } from "@/components/features/Sheets/BottomSheet";
import { Modal } from "@/components/features/Sheets/Modal";
import { CrossIcon } from "@/components/ui/icons";
import { Meter } from "@clearcut/motion/meters/meter";
import { ZONES, zoneWidths } from "@clearcut/motion/meters/zones";
import {
  unlockMinQuestions,
  type CutoffMeterSummary,
} from "@/lib/dashboard/cutoffMeter";
import { meterPill } from "@/lib/dashboard/meterPill";
import { useModalStore } from "@/store/modal/useModalStore";
import { useCutoffMeterInfoStore } from "./useCutoffMeterInfoStore";

/**
 * "How your Cutoff Meter works" — opened by tapping the meter on a My Courses
 * card (phase 99). Page-level like the profile page's Language / Help modals:
 * LearnPage renders it while `active === "cutoff-meter-info"`, the card only
 * calls `open("cutoff-meter-info")`. Mobile = bottom sheet, desktop = modal.
 *
 * Layout from the approved "Cutoff Meter Progress Modal" design: header with the
 * shield, the student's own meter (unchanged), four zone cards with this exam's
 * own numbers, "How it works" in three numbered cards and the "Keep attempting"
 * card. Illustrations are the design's own artwork, extracted as WebP into
 * `public/images/cutoff-meter/`. Every number is the student's / this exam's.
 */
export default function CutoffMeterInfoModal() {
  const { closeModal } = useModalStore();
  const meter = useCutoffMeterInfoStore((st) => st.meter);
  const variant = useCutoffMeterInfoStore((st) => st.variant);
  const ctx = useCutoffMeterInfoStore((st) => st.ctx);
  const { user } = useAuth() as { user?: { uuid?: string } | null };
  // Once per opening (the sheet mounts only while open). The ref also stops React StrictMode's
  // dev-only double mount-effect from sending it twice.
  const sent = useRef(false);
  useEffect(() => {
    if (!meter || sent.current) return;
    sent.current = true;
    trackMeterInfoViewed(
      meter,
      { surface: "info_sheet", ...ctx, userId: user?.uuid ?? null },
      variant === "gauge" ? "target_page" : "learn_card",
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
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

const IMG = "/images/cutoff-meter";

/** The four zone cards: this exam's own ranges, the design's icons. */
const ZONE_ICON = {
  need: { src: `${IMG}/zone-needs.webp`, w: 41, h: 41 },
  almost: { src: `${IMG}/zone-almost.webp`, w: 38, h: 31 },
  clear: { src: `${IMG}/zone-good.webp`, w: 40, h: 41 },
  safe: { src: `${IMG}/zone-target.webp`, w: 43, h: 41 },
} as const;

/** The three "How it works" steps. */
const STEPS = [
  { n: 1, key: "r1", src: `${IMG}/step-target.webp` },
  { n: 2, key: "r2", src: `${IMG}/step-chart.webp` },
  { n: 3, key: "r3", src: `${IMG}/step-trophy.webp` },
] as const;

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

  // Zone cards: this exam's own ranges, in the design's compact form ("< 60", "60 – 89", "120+").
  const zones = [
    { k: "need", name: t("zoneNeed"), rule: `< ${almostFrom}` },
    { k: "almost", name: t("zoneAlmost"), rule: `${almostFrom} – ${pass}` },
    { k: "clear", name: t("zoneClear"), rule: `${pass} – ${safeFrom}` },
    { k: "safe", name: t("zoneSafe"), rule: `${safeFrom}+` },
  ] as const;

  return (
    <Container
      isOpen
      onClose={onClose}
      isHeader={false}
      title={t("title")}
      maxWidth="md:max-w-[880px]"
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={t("title")}
        className="flex max-h-[88dvh] flex-col"
      >
        {/* Header */}
        <div className="flex items-center gap-3 px-4 pt-4 pb-3">
          <Image
            src={`${IMG}/shield.webp`}
            alt=""
            width={67}
            height={74}
            aria-hidden="true"
            className="h-[34px] w-auto shrink-0"
          />
          <h2 className="flex-1 text-[17px] leading-6 font-extrabold text-[var(--color-primary-stronger)] md:text-[19px]">
            {t("title")}
          </h2>
          <button
            type="button"
            aria-label={t("close")}
            onClick={onClose}
            className="grid h-9 w-9 shrink-0 cursor-pointer place-items-center rounded-full border border-[var(--color-border-gray-subtle)] bg-white shadow-sm hover:bg-[var(--color-background-gray-subtle)]"
          >
            <CrossIcon />
          </button>
        </div>

        {/* Phone: one column, exactly as before. Desktop (md+): two columns — the student's meter + zones on
            the left, "How it works" + "Keep attempting" on the right — so the sheet fits the viewport
            instead of a 460px column that needed a long scroll (phase 109). */}
        <div className="space-y-4 overflow-y-auto px-4 pb-6 md:grid md:grid-cols-2 md:items-start md:gap-x-6 md:space-y-0 md:px-6 md:pb-6">
          <div className="space-y-4">
            {/* 1. The student's own meter (unchanged) */}
            <section className="rounded-2xl bg-[var(--color-background-gray-subtle)] px-4 pt-4 pb-3">
              {/* Same shape as where it was opened: bar (course card) or gauge (Target tab). */}
              <div
                className={
                  variant === "gauge" ? "mx-auto w-[200px]" : undefined
                }
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
                      count: unlockMinQuestions(meter),
                      pass,
                      max,
                    })
                  : t("youSummary", { value, max, pass })}
              </p>
            </section>

            {/* 2. Zones — this exam's own numbers */}
            <ul
              className="grid grid-cols-4 gap-1.5 md:grid-cols-2 md:gap-2"
              aria-label={t("zonesTitle")}
            >
              {zones.map((z) => {
                const icon = ZONE_ICON[z.k];
                return (
                  <li
                    key={z.k}
                    className="min-w-0 rounded-2xl px-1.5 py-2.5 md:px-2.5"
                    style={{ background: ZONES[z.k].s }}
                  >
                    {/* Phone: icon ABOVE the label in all four cards (same structure, so the rows line up). It used to wrap
                        beside the label only when the label was short (Safe Zone). md+: icon beside label, as before. */}
                    <div className="flex flex-col items-start gap-1 md:flex-row md:flex-wrap md:items-center md:gap-x-1 md:gap-y-0.5">
                      <Image
                        src={icon.src}
                        alt=""
                        width={icon.w}
                        height={icon.h}
                        aria-hidden="true"
                        className="h-4 w-auto shrink-0 md:h-5"
                      />
                      <p
                        className="min-h-[26px] text-[10px] leading-[13px] font-extrabold md:min-h-0 md:text-xs"
                        style={{ color: ZONES[z.k].ink }}
                      >
                        {z.name}
                      </p>
                    </div>
                    <p className="mt-1.5 text-[13px] leading-4 font-medium text-surface-gray-normal md:text-sm">
                      {z.rule}
                    </p>
                  </li>
                );
              })}
            </ul>
          </div>

          <div className="space-y-4">
            {/* 3. How it works */}
            <section className="-mx-4 border-t border-[var(--color-border-gray-subtle)] px-4 pt-4 md:mx-0 md:border-t-0 md:px-0 md:pt-0">
              <h3 className="mb-3 flex items-center gap-2.5 text-[16px] leading-6 font-extrabold text-[var(--color-primary-stronger)]">
                <Image
                  src={`${IMG}/layers.webp`}
                  alt=""
                  width={48}
                  height={51}
                  aria-hidden="true"
                  className="h-[22px] w-auto shrink-0"
                />
                {t("howWorks")}
              </h3>
              <ol className="space-y-2.5">
                {STEPS.map((s) => (
                  <li
                    key={s.n}
                    className="flex items-center gap-3 rounded-[20px] border border-[var(--color-primary-bg-soft)] bg-white py-2.5 pr-3 pl-2.5 shadow-sm"
                  >
                    <Image
                      src={s.src}
                      alt=""
                      width={108}
                      height={106}
                      aria-hidden="true"
                      className="h-11 w-11 shrink-0 md:h-12 md:w-12"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="text-[15px] leading-5 font-extrabold text-[var(--color-primary-stronger)]">
                        {t(`${s.key}Title`)}
                      </p>
                      <p className="mt-0.5 text-[13px] leading-[18px] text-surface-gray-muted md:text-sm">
                        {t(`${s.key}Body`)}
                      </p>
                    </div>
                    <span
                      aria-hidden="true"
                      className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-[var(--color-primary-bg-soft)] text-[14px] font-bold text-[var(--color-brand)]"
                    >
                      {s.n}
                    </span>
                  </li>
                ))}
              </ol>
            </section>

            {/* 4. Keep attempting */}
            <section className="flex items-center gap-3 rounded-[20px] bg-[var(--color-primary-bg-soft)] px-4 py-3.5">
              <Image
                src={`${IMG}/bolt.webp`}
                alt=""
                width={84}
                height={114}
                aria-hidden="true"
                className="h-[52px] w-auto shrink-0"
              />
              <div className="min-w-0">
                <p className="text-[17px] leading-6 font-extrabold text-[var(--color-brand)]">
                  {t("keepTitle")}
                </p>
                <p className="mt-0.5 text-[13px] leading-[18px] text-surface-gray-normal md:text-sm">
                  {t("keepBody")}
                </p>
              </div>
            </section>
          </div>
        </div>
      </div>
    </Container>
  );
}

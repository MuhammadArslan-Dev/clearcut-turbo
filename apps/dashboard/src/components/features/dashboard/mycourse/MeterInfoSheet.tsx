"use client";

import { AnimatePresence } from "framer-motion";
import { useTranslations } from "next-intl";
import { useIsMobile } from "@/hooks/useIsMobile";
import { BottomSheet } from "@/components/features/Sheets/BottomSheet";
import { Modal } from "@/components/features/Sheets/Modal";
import { CrossIcon } from "@/components/ui/icons";
import { ZONES, zoneWidths } from "@clearcut/motion/meters/zones";
import type { CutoffMeterSummary } from "@/lib/dashboard/cutoffMeter";

/**
 * "How is my Cutoff Meter calculated?" — opened by tapping the meter on a My
 * Courses card (phase 99). Mobile: bottom sheet, desktop: modal (the project's
 * `features/Sheets` pair, same as ContactUsModal). Every number is the
 * student's own, from the same summary the card shows; the rules mirror the
 * backend (`CutoffMeterService`, config/cutoff_meter.php) and the spec.
 */
export default function MeterInfoSheet({
  meter,
  open,
  onClose,
}: {
  meter: CutoffMeterSummary;
  open: boolean;
  onClose: () => void;
}) {
  const t = useTranslations("myCourses.meterInfo");
  const isMobile = useIsMobile();
  const Container = isMobile ? BottomSheet : Modal;

  const locked = meter.locked || meter.meter === null;
  const max = meter.max_marks;
  const pass = Math.round(meter.pass_mark);
  const value = Math.round(meter.display_meter ?? meter.meter ?? 0);
  const w = zoneWidths({ max, cutoff: pass });
  const almostFrom = Math.max(0, Math.round(pass - w.almost));
  const safeFrom = Math.min(max, Math.round(pass + w.clear));

  const zones = [
    { c: ZONES.need.c, name: t("zoneNeed"), rule: t("ruleBelow", { marks: almostFrom }) },
    { c: ZONES.almost.c, name: t("zoneAlmost"), rule: t("ruleBetween", { from: almostFrom, to: pass }) },
    { c: ZONES.clear.c, name: t("zoneClear"), rule: t("ruleBetween", { from: pass, to: safeFrom }) },
    { c: ZONES.safe.c, name: t("zoneSafe"), rule: t("ruleAbove", { marks: safeFrom }) },
  ];

  const steps = [
    { title: t("s1Title"), body: t("s1Body", { answers: meter.counted_answers, tests: meter.tests_count ?? 0 }) },
    { title: t("s2Title"), body: t("s2Body", { max }) },
    { title: t("s3Title"), body: t("s3Body", { pass, max }) },
    { title: t("s4Title"), body: t("s4Body", { band: meter.band ?? 15 }) },
    { title: t("s5Title"), body: t("s5Body") },
  ];

  return (
    <AnimatePresence>
      {open && (
        <Container isOpen={open} onClose={onClose} isHeader={false} title={t("title")} maxWidth="md:max-w-[440px]">
          <div className="flex max-h-[85dvh] flex-col">
            <div className="flex items-start justify-between gap-3 px-4 pt-5 pb-3">
              <h2 className="heading-medium !font-bold text-surface-gray-normal">{t("title")}</h2>
              <button type="button" aria-label={t("close")} onClick={onClose} className="shrink-0 cursor-pointer p-1">
                <CrossIcon />
              </button>
            </div>

            <div className="overflow-y-auto px-4 pb-6 space-y-4">
              {/* Your numbers */}
              <div className="rounded-xl bg-[var(--color-background-gray-subtle)] p-3">
                <p className="body-medium text-surface-gray-normal">
                  {locked
                    ? t("youLocked", { count: Math.max(meter.unlock_answers - meter.counted_answers, 1), pass, max })
                    : t("youSummary", { value, max, pass })}
                </p>
              </div>

              {/* How it works */}
              <ol className="space-y-3">
                {steps.map((s, i) => (
                  <li key={i} className="flex gap-3">
                    <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-[var(--color-primary-bg-soft)] body-small !font-bold text-[var(--color-brand-dark)]">
                      {i + 1}
                    </span>
                    <div>
                      <p className="heading-small !font-bold text-surface-gray-normal">{s.title}</p>
                      <p className="body-small text-surface-gray-muted">{s.body}</p>
                    </div>
                  </li>
                ))}
              </ol>

              {/* Zones, with this exam's own numbers */}
              <div>
                <p className="heading-small !font-bold text-surface-gray-normal">{t("zonesTitle")}</p>
                <ul className="mt-2 space-y-1.5">
                  {zones.map((z) => (
                    <li key={z.name} className="flex items-center gap-2 body-small">
                      <i aria-hidden="true" className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: z.c }} />
                      <span className="!font-semibold text-surface-gray-normal">{z.name}</span>
                      <span className="text-surface-gray-muted">· {z.rule}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <p className="body-small text-surface-gray-muted">{t("note")}</p>
            </div>
          </div>
        </Container>
      )}
    </AnimatePresence>
  );
}

import { EARLY_ESTIMATE, ZONES } from "@clearcut/motion/meters/zones";
import type { CutoffMeterSummary } from "./cutoffMeter";

const ZONE: Record<NonNullable<CutoffMeterSummary["zone"]>, { studio: keyof typeof ZONES; key: string }> = {
  needs_work: { studio: "need", key: "needsWork" },
  almost_there: { studio: "almost", key: "almostThere" },
  clear_zone: { studio: "clear", key: "clearZone" },
  safe_zone: { studio: "safe", key: "safeZone" },
};

/**
 * The zone pill exactly as Cutoff Meter Studio draws it (approved colours),
 * with our translated text (en / hi / mr). Shared by the My Courses card and
 * the Target tab (phase 99). `t` = a translator scoped to `myCourses`.
 */
export function meterPill(m: CutoffMeterSummary, t: (key: string) => string) {
  const locked = m.locked || m.meter === null;
  if (locked) return { text: t("meterZone.locked"), background: ZONES.locked.s, color: ZONES.locked.ink };
  if (m.cooling?.active) return { text: `❄ ${t("meterZone.cooling")}`, background: EARLY_ESTIMATE.s, color: EARLY_ESTIMATE.ink };
  if (m.early) return { text: t("meterZone.earlyEstimate"), background: EARLY_ESTIMATE.s, color: EARLY_ESTIMATE.ink };
  const z = ZONE[m.zone ?? "needs_work"];
  return {
    text: t(`meterZone.${z.key}`) + (m.zone === "safe_zone" ? " ★" : ""),
    background: ZONES[z.studio].s,
    color: ZONES[z.studio].ink,
  };
}

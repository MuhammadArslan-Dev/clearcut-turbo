import { create } from "zustand";
import type { CutoffMeterSummary } from "@/lib/dashboard/cutoffMeter";
import type { MeterCtx } from "@/lib/analytics/cutoffMeter";

/**
 * Which course's meter the "how it works" sheet explains. The sheet itself is
 * opened through the global modal stack (`useModalStore`, mode
 * "cutoff-meter-info") and mounted once at page level (LearnPage), like
 * ContactUsModal — never inside a card (the carousel's transform would trap a
 * fixed sheet inside the slide).
 */
export const useCutoffMeterInfoStore = create<{
  meter: CutoffMeterSummary | null;
  /** How the sheet draws the student's meter: like where it was opened from
   * (course card = bar, Target tab = gauge). */
  variant: "bar" | "gauge";
  /** Course context for analytics (phase 108). */
  ctx: Omit<MeterCtx, "surface" | "userId"> | null;
  setMeter: (m: CutoffMeterSummary, variant?: "bar" | "gauge", ctx?: Omit<MeterCtx, "surface" | "userId">) => void;
}>((set) => ({
  meter: null,
  variant: "bar",
  ctx: null,
  setMeter: (meter, variant = "bar", ctx) => set({ meter, variant, ctx: ctx ?? null }),
}));

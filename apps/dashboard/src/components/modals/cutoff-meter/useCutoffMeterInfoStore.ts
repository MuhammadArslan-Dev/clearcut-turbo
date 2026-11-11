import { create } from "zustand";
import type { CutoffMeterSummary } from "@/lib/dashboard/cutoffMeter";

/**
 * Which course's meter the "how it works" sheet explains. The sheet itself is
 * opened through the global modal stack (`useModalStore`, mode
 * "cutoff-meter-info") and mounted once at page level (LearnPage), like
 * ContactUsModal — never inside a card (the carousel's transform would trap a
 * fixed sheet inside the slide).
 */
export const useCutoffMeterInfoStore = create<{
  meter: CutoffMeterSummary | null;
  setMeter: (m: CutoffMeterSummary) => void;
}>((set) => ({
  meter: null,
  setMeter: (meter) => set({ meter }),
}));

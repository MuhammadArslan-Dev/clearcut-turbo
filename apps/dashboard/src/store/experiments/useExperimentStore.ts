import { create } from "zustand";
import type { OfferAssignment } from "@/lib/experiments/autopayPrice";

// Client-only state of the Experiment layer (phase 66). The network and the
// SDK live in `lib/experiments/runtime.ts`; components only read this store.
// Nothing here is persisted: an answer lives for this page load only, so a
// user who is removed in Amplitude can never see a stale offer.

export type ExperimentStatus =
  /** The provider has not looked at the user yet. */
  | "idle"
  /** Experiments are off here (no key, analytics off, host not allowed). */
  | "disabled"
  /** Waiting for Amplitude. */
  | "loading"
  /** Amplitude answered for this user on this page load. */
  | "ready"
  /** Amplitude did not answer in time / errored: callers use the default price. */
  | "failed";

type ExperimentState = {
  status: ExperimentStatus;
  userId: string | null;
  /** flag key -> what Amplitude answered (this page load only). */
  assignments: Record<string, OfferAssignment>;

  begin: (userId: string) => void;
  resolve: (userId: string, assignments: Record<string, OfferAssignment>) => void;
  fail: (userId: string) => void;
  disable: () => void;
  reset: () => void;
};

const INITIAL = {
  status: "idle" as ExperimentStatus,
  userId: null as string | null,
  assignments: {} as Record<string, OfferAssignment>,
};

export const useExperimentStore = create<ExperimentState>()((set, get) => ({
  ...INITIAL,

  begin: (userId) => set({ ...INITIAL, userId, status: "loading" }),

  resolve: (userId, assignments) => {
    if (get().userId !== userId) return;
    set({ assignments, status: "ready" });
  },

  fail: (userId) => {
    if (get().userId !== userId) return;
    set({ assignments: {}, status: "failed" });
  },

  disable: () => set({ ...INITIAL, status: "disabled" }),

  reset: () => set({ ...INITIAL }),
}));

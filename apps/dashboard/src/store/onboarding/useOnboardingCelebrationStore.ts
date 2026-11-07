"use client";

import { create } from "zustand";

/** What the user chose in onboarding, for the completion animation's cards. */
export type OnboardingCelebration = {
  /** "hi" | "en" | "mr" (the language card the user picked). */
  languageCode: string;
  examShortName: string;
  examState?: string;
  examType?: string;
};

type State = {
  celebration: OnboardingCelebration | null;
  start: (c: OnboardingCelebration) => void;
  finish: () => void;
};

/**
 * Hand-off between the exam step (which enrolls and navigates to the dashboard) and `OnboardingCelebrationHost`, which is
 * mounted in the locale layout so the animation survives the route change and lifts away over the real dashboard.
 * In memory only: a reload simply skips the animation.
 */
export const useOnboardingCelebrationStore = create<State>()((set) => ({
  celebration: null,
  start: (celebration) => set({ celebration }),
  finish: () => set({ celebration: null }),
}));

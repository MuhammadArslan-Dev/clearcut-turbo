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
  /** The enrolment request succeeded. Until then the animation plays but never finishes. */
  enrolled: boolean;
  /** Starts the animation at once, while the enrolment request is still in flight. */
  start: (c: OnboardingCelebration) => void;
  markEnrolled: () => void;
  /** The request failed: remove the animation so the exam step (with its error) is visible again. */
  cancel: () => void;
  finish: () => void;
};

/**
 * Hand-off between the exam step (which enrolls and navigates to the dashboard) and `OnboardingCelebrationHost`, which is
 * mounted in the locale layout so the animation survives the route change and lifts away over the real dashboard.
 * The exam step calls `start` the moment Continue is tapped (optimistic: the learner sees progress immediately) and
 * `markEnrolled` / `cancel` when the request settles. In memory only: a reload simply skips the animation.
 */
export const useOnboardingCelebrationStore = create<State>()((set) => ({
  celebration: null,
  enrolled: false,
  start: (celebration) => set({ celebration, enrolled: false }),
  markEnrolled: () => set({ enrolled: true }),
  cancel: () => set({ celebration: null, enrolled: false }),
  finish: () => set({ celebration: null, enrolled: false }),
}));

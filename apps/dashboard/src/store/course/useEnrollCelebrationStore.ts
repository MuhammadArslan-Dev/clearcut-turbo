"use client";

import { create } from "zustand";

export type EnrollCelebration = {
  /** e.g. "HTET Exam" */
  exam: string;
  /** The paper, then each chosen option (what the learner picked in the enrolment sheet). */
  selection: { title: string; subtitle?: string }[];
};

type State = {
  celebration: EnrollCelebration | null;
  /** The enrolment request succeeded. Until then the animation plays but never finishes. */
  enrolled: boolean;
  /** Pathname prefix the learner is being taken to (e.g. "/preparation"); the animation waits for that page. Undefined = stay on this page. */
  awaitPath?: string;
  /** Starts the animation at once, while the enrolment request is still in flight. */
  start: (c: EnrollCelebration) => void;
  markEnrolled: (awaitPath?: string) => void;
  /** The request failed: remove the animation so the sheet (with its error) is visible again. */
  cancel: () => void;
  finish: () => void;
};

/**
 * Hand-off between the enrolment modal and `EnrollCelebrationHost` (mounted in the locale layout, so the animation survives
 * the route change to the Preparation page and lifts away over it). Same idea as the onboarding celebration store.
 */
export const useEnrollCelebrationStore = create<State>()((set) => ({
  celebration: null,
  enrolled: false,
  awaitPath: undefined,
  start: (celebration) => set({ celebration, enrolled: false, awaitPath: undefined }),
  markEnrolled: (awaitPath) => set({ enrolled: true, awaitPath }),
  cancel: () => set({ celebration: null, enrolled: false, awaitPath: undefined }),
  finish: () => set({ celebration: null, enrolled: false, awaitPath: undefined }),
}));

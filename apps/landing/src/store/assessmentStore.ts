// /store/assessmentStore.ts
import { createStore } from "@clearcut/state/create-store";

type Store = {
  step: number;
  answers: Record<string, number>;
  setAnswer: (id: string, value: number) => void;
  next: () => void;
  prev: () => void;
  reset: () => void;
};

export const useAssessmentStore = createStore<Store>("assessmentStore", (set) => ({
  step: 0,
  answers: {},

  setAnswer: (id, value) =>
    set((s) => ({
      answers: { ...s.answers, [id]: value },
    })),

  next: () => set((s) => ({ step: s.step + 1 })),
  prev: () => set((s) => ({ step: s.step - 1 })),
  reset: () => set({ step: 0, answers: {} }),
}));
"use client";

import { OnboardingData } from "@/types/onboarding/onboarding";
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";


type OnboardingState = {
    stepIndex: number;
    data: OnboardingData;
    setStepIndex: (index: number) => void;
    nextStep: (maxIndex: number) => void;
    prevStep: () => void;
    updateData: (patch: Partial<OnboardingData>) => void;
    reset: () => void;
};

export const useOnboardingStore = create<OnboardingState>()(
    persist(
        (set) => ({
            stepIndex: 0,
            data: {},

            setStepIndex: (index) => set({ stepIndex: index }),

            nextStep: (maxIndex) =>
                set((state) => ({
                    stepIndex:
                        state.stepIndex < maxIndex ? state.stepIndex + 1 : state.stepIndex,
                })),

            prevStep: () =>
                set((state) => ({
                    stepIndex: state.stepIndex > 0 ? state.stepIndex - 1 : 0,
                })),

            updateData: (patch) =>
                set((state) => ({ data: { ...state.data, ...patch } })),

            reset: () => set({ stepIndex: 0, data: {} }),
        }),
        {
            name: "onboarding-storage",
            storage: createJSONStorage(() => localStorage),
        }
    )
);
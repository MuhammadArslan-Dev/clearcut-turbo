"use client";

import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import LanguageStep from "./steps/LanguageStep";
import ExamStep from "./steps/ExamStep";
import LevelStep from "./steps/LevelStep";
import { useOnboardingStore } from "@/store/onboarding/useOnboardingStore";
import MainContainer from "@/components/ui/main-container";
import { OnboardingStep } from "@/types/onboarding/onboarding";
import { trackEvent } from "@/lib/analytics/browser";

const STEPS: OnboardingStep[] = [
    {
        id: "language",
        title: "Choose Language",
        highlightText: "Language",
        description: "You can change this anytime",
        Component: LanguageStep
    },
    {
        id: "exam",
        title: "Select Exam",
        highlightText: "Exam",
        description: "You can update this later",
        Component: ExamStep
    },
    // {
    //     id: "level",
    //     title: "Select Subjects",
    //     highlightText: "Subjects",
    //     description: "You can update this later",
    //     Component: LevelStep
    // },
];

export default function OnboardingWizard() {
    const {
        stepIndex,
        data,
        nextStep,
        prevStep,
        updateData,
        reset,
    } = useOnboardingStore();

    useEffect(() => {
        trackEvent('Onboarding Started', {
            entry_step_number: 1,
            entry_step_name: 'language_selection',
        });
        if (localStorage.getItem('ONBOARDING_START') === 'true') return;
        localStorage.setItem('ONBOARDING_START', 'true');
    }, [])


    const [direction, setDirection] = useState(1); // ← NEW

    const safeIndex =
        stepIndex >= 0 && stepIndex < STEPS.length ? stepIndex : 0;

    const step = STEPS[safeIndex];
    const isFirst = safeIndex === 0;
    const isLast = safeIndex === STEPS.length - 1;

    const goNext = () => {
        if (isLast) {
            handleFinish();
        } else {
            setDirection(1);      // → swipe left→right
            nextStep(STEPS.length - 1);
        }
        
        // reset();
    };

    const goBack = () => {
        if (!isFirst) {
            setDirection(-1);     // ← swipe right→left
            prevStep();
        }
        // reset();

    };

    const handleFinish = () => {
        // console.log("Onboarding completed with data:", data);
        reset();
    };

    const StepComponent = step.Component;

    // Swipe animation variants
    const variants = {
        enter: (dir: number) => ({
            x: dir > 0 ? 300 : -300,
            opacity: 0,
        }),
        center: {
            x: 0,
            opacity: 1,
        },
        exit: (dir: number) => ({
            x: dir > 0 ? -300 : 300,
            opacity: 0,
        }),
    };

    return (
        <>
            {isFirst ? (
                <StepComponent
                    data={data}
                    currentStep={safeIndex}
                    steps={STEPS}
                    updateData={updateData}
                    goNext={goNext}
                    goBack={goBack}
                    isFirst={isFirst}
                    isLast={isLast}
                />
            ) : (
                <AnimatePresence custom={direction} mode="wait">
                    <motion.div
                        key={safeIndex}
                        custom={direction}
                        variants={variants}
                        initial="enter"
                        animate="center"
                        exit="exit"
                        transition={{ duration: 0.3 }}
                        className="w-full h-full"
                    >
                        <StepComponent
                            data={data}
                            currentStep={safeIndex}
                            steps={STEPS}
                            updateData={updateData}
                            goNext={goNext}
                            goBack={goBack}
                            isFirst={isFirst}
                            isLast={isLast}
                        />
                    </motion.div>
                </AnimatePresence>

            )}
        </>

    );
}

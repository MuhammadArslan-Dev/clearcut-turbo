"use client";

import React, { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useSearchParams } from "next/navigation";
import LanguageStep from "./steps/LanguageStep";
import ExamStep from "./steps/ExamStep";
import LevelStep from "./steps/LevelStep";
import { useOnboardingStore } from "@/store/onboarding/useOnboardingStore";
import MainContainer from "@/components/ui/main-container";
import { OnboardingStep } from "@/types/onboarding/onboarding";
import { trackEvent } from "@/lib/analytics/browser";
import useLanguageSwitch from "@/hooks/useLanguageSwitch";
import type { AppLocale } from "@/types/components/language";

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

    const searchParams = useSearchParams();
    const { switchLanguage } = useLanguageSwitch();

    // The exam landing page (e.g. HTET) that sent the user into signup
    // already knows both the exam and the locale the user was reading in —
    // buildPostVerifyRedirectUrl (packages/auth) threads them here as
    // `?course=` and `?lang=`. When `lang` is present, preselect that
    // language's card on the Choose Language step — but the user still has
    // to tap Continue themselves to move on; this only pre-fills the
    // selection, it never auto-advances the step. `course` is stashed for
    // ExamStep's "UPCOMING_COURSE" restore effect to preselect once the
    // exams list loads (see ExamStep.tsx).
    const landingLang = searchParams.get("lang");
    const hasKnownLandingLang = landingLang === "en" || landingLang === "hi";

    const appliedLandingContextRef = useRef(false);
    useEffect(() => {
        if (appliedLandingContextRef.current) return;
        appliedLandingContextRef.current = true;

        const course = searchParams.get("course");
        if (course) {
            localStorage.setItem("UPCOMING_COURSE", course);
        }

        if (hasKnownLandingLang) {
            updateData({ language: landingLang as AppLocale });
            // No-op if this URL already loaded under the matching locale
            // route (it should — redirect.ts sends /hi/onboarding for
            // lang=hi) — only redirects as a fallback if it didn't.
            switchLanguage(landingLang as AppLocale);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

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

    // Computed inline (not just via the effect above) so the language card
    // already shows as selected on the very first render — otherwise it
    // would flash unselected before the effect updates the store a tick
    // later. Purely a display pre-fill: it doesn't change which step shows.
    const effectiveData =
        hasKnownLandingLang && !data.language
            ? { ...data, language: landingLang as AppLocale }
            : data;

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
                    data={effectiveData}
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
                            data={effectiveData}
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

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

const EXAM_STEP_INDEX = STEPS.findIndex((s) => s.id === "exam");

export default function OnboardingWizard() {
    const {
        stepIndex,
        data,
        nextStep,
        prevStep,
        updateData,
        reset,
        setStepIndex,
    } = useOnboardingStore();

    const searchParams = useSearchParams();
    const { switchLanguage } = useLanguageSwitch();

    // The exam landing page (e.g. HTET) that sent the user into signup
    // already knows both the exam and the locale the user was reading in —
    // buildPostVerifyRedirectUrl (packages/auth) threads them here as
    // `?course=` and `?lang=`. When `lang` is present, skip the language
    // step entirely (it would just be asking the user to confirm something
    // we already know) and land directly on the exam/course-list step with
    // that language applied. `course` is stashed for ExamStep's existing
    // "UPCOMING_COURSE" restore effect to preselect once the exams list
    // loads (see ExamStep.tsx).
    const landingLang = searchParams.get("lang");
    const hasKnownLandingLang =
        (landingLang === "en" || landingLang === "hi") && EXAM_STEP_INDEX !== -1;

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
            setStepIndex(EXAM_STEP_INDEX);
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

    // Computed inline (not just via the effect above) so the very first
    // render already skips straight past the language step — otherwise it
    // would flash before the effect flips stepIndex a tick later.
    const safeIndex = hasKnownLandingLang
        ? EXAM_STEP_INDEX
        : stepIndex >= 0 && stepIndex < STEPS.length ? stepIndex : 0;

    // Same reasoning: ExamStep reads data.language to fetch the exam list —
    // fall back to the landing locale for this first render so it doesn't
    // fire one request with no language before the effect above sets it.
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

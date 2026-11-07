"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { useQueryClient } from "@tanstack/react-query";
import { OnboardingComplete } from "@clearcut/motion/onboarding";
import EnLangCirlcIcon from "@/components/ui/icons/en-lang-circle-icon";
import HindiLangCirclIcon from "@/components/ui/icons/hindi-lang-circle-icon";
import MarathiLangCircleIcon from "@/components/ui/icons/marathi-lang-circle-icon";
import { useMotionLang } from "@/components/features/test-motion/TestStartIntro";
import { MY_COURSES_KEY, useMyActiveCourses } from "@/hooks/course/useMyActiveCourses";
import { useOnboardingCelebrationStore } from "@/store/onboarding/useOnboardingCelebrationStore";

// Same cards as the language step.
const LANGUAGES: Record<string, { title: string; icon: React.ReactNode }> = {
  hi: { title: "हिंदी", icon: <HindiLangCirclIcon /> },
  en: { title: "English", icon: <EnLangCirlcIcon /> },
  mr: { title: "मराठी", icon: <MarathiLangCircleIcon /> },
};

// Never keep the learner behind the animation if the dashboard data is slow or failed.
const MAX_WAIT_MS = 15000;

/**
 * Completion animation after the exam step: the user's language + exam as the app's selected cards, then three honest
 * steps while the dashboard loads UNDER this layer (the exam step already navigated), then the curtain lifts onto the
 * real dashboard. `ready` = the my-courses data (what the Learn page needs) has finished loading.
 */
export default function OnboardingCelebration() {
  const celebration = useOnboardingCelebrationStore((s) => s.celebration);
  const finish = useOnboardingCelebrationStore((s) => s.finish);
  const lang = useMotionLang();
  const queryClient = useQueryClient();
  const { isFetching } = useMyActiveCourses();
  const [started, setStarted] = useState(false);
  const [timedOut, setTimedOut] = useState(false);

  // The user was just enrolled: make sure the courses are fetched fresh, then wait for that fetch.
  useEffect(() => {
    void queryClient.invalidateQueries({ queryKey: MY_COURSES_KEY }).finally(() => setStarted(true));
    const t = setTimeout(() => setTimedOut(true), MAX_WAIT_MS);
    return () => clearTimeout(t);
  }, [queryClient]);

  if (!celebration) return null;
  const language = LANGUAGES[celebration.languageCode];
  const examLine = [celebration.examState, celebration.examType ? `(${celebration.examType})` : ""].filter(Boolean).join(" ");

  return (
    <OnboardingComplete
      lang={lang}
      ready={timedOut || (started && !isFetching)}
      onDone={finish}
      logo={<Image src="/logos/clear_cutoff_logo.png" width={239} height={48} alt="Clear Cutoff" className="h-[34px] w-auto" unoptimized />}
      summary={[
        ...(language ? [{ title: language.title, icon: language.icon }] : []),
        { title: `${celebration.examShortName} Exam`, subtitle: examLine || undefined },
      ]}
    />
  );
}

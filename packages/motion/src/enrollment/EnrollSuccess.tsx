"use client";

import type { ReactNode } from "react";
import { OnboardingComplete } from "../onboarding";

type Lang = "en" | "hi";

/** One step of the user's selection (the real flow is a path: Paper -> one option per group). */
export type SelectionItem = { title: string; subtitle?: string };

export type EnrollSuccessProps = {
  /** e.g. "HTET Exam" */
  exam: string;
  /** What the user picked in the enrolment sheet, in order: the paper, then each chosen option. Drawn as the app's selected option cards. */
  selection: (string | SelectionItem)[];
  /** The exam's logo above the mascot (optional). */
  logo?: ReactNode;
  /** Flip to true when the Preparation page data is ready. The last step never completes before this. */
  ready: boolean;
  /** Called after the curtain lifts: navigate to the Preparation page here. */
  onDone: () => void;
  lang?: Lang;
  /** "screen" (default) covers the viewport; "parent" fills the nearest positioned parent (inside the sheet / modal). */
  fit?: "screen" | "parent";
};

const T = {
  title: { en: (e: string) => `You're enrolled in ${e}!`, hi: (e: string) => `${e} में आपका नामांकन हो गया!` },
  highlight: { en: "enrolled", hi: "नामांकन" },
  sub: { en: "You can change or add anytime", hi: "आप कभी भी बदल या जोड़ सकते हैं" },
  building: { en: "Setting up your Preparation page", hi: "आपका प्रिपरेशन पेज तैयार हो रहा है" },
  buildingSub: { en: "This takes a few seconds", hi: "बस कुछ सेकंड" },
  steps: {
    en: ["Adding your subjects", "Building your syllabus", "Opening your Preparation page"],
    hi: ["आपके विषय जोड़े जा रहे हैं", "आपका सिलेबस बन रहा है", "प्रिपरेशन पेज खुल रहा है"],
  },
};

/**
 * Shown after "Start Learning" in the exam-enrolment sheet, until the Preparation page is ready. It is the onboarding
 * completion animation (same mascot, motion, timing and curtain, see ../onboarding) with the enrolment copy and the
 * user's real selection path (the paper, then one option per group) drawn as the app's selected option cards.
 */
export function EnrollSuccess({ exam, selection, logo, ready, onDone, lang = "en", fit = "screen" }: EnrollSuccessProps) {
  return (
    <OnboardingComplete
      lang={lang}
      fit={fit}
      ready={ready}
      onDone={onDone}
      logo={logo}
      summary={selection}
      title={T.title[lang](exam)}
      highlight={T.highlight[lang]}
      subtitle={T.sub[lang]}
      buildingTitle={T.building[lang]}
      buildingSubtitle={T.buildingSub[lang]}
      steps={T.steps[lang]}
    />
  );
}

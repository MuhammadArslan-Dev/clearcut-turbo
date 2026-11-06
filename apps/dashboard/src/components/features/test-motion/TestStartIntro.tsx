"use client";

import { useLocale } from "next-intl";
import { TestIntro } from "@clearcut/motion/test/flow";

/** The motion library has en + hi copy; Marathi (and anything else) falls back to Hindi, like the Topic Test. */
export function useMotionLang(): "en" | "hi" {
  return useLocale() === "en" ? "en" : "hi";
}

/**
 * The 3-2-1-Go start screen (@clearcut/motion TestIntro) for the Daily Test and the Practice Test. It is a
 * full-screen overlay: render it INSTEAD OF (Daily) or ON TOP OF (Practice) the attempt screen, and start the
 * test's timer / analytics only from `onStart`, so the countdown never eats the learner's time.
 */
export default function TestStartIntro({
  type,
  label,
  title,
  questions,
  minutes,
  streakDays,
  onStart,
}: {
  type: "topic" | "daily" | "full";
  /** Badge text override (the Practice Test reuses the "topic" visual with its own name). */
  label?: string;
  title: string;
  questions: number;
  minutes?: number;
  streakDays?: number;
  onStart: () => void;
}) {
  const lang = useMotionLang();
  return (
    <TestIntro
      type={type}
      label={label}
      title={title}
      questions={questions}
      minutes={minutes}
      streakDays={streakDays}
      lang={lang}
      size="large"
      onStart={onStart}
    />
  );
}

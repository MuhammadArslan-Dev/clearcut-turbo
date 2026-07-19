'use client'
import React from "react";
import LanguageStep from "../components/language-step";
import { calculateScore, getScoreColor } from "@/lib/scoring";
import QuestionStep from "../components/question-step";
import ResultStep from "../components/result-step";
import { useRouter } from "next/navigation";
import { QUESTIONS } from "@/constants/onboardingQuestions";
import { useAssessmentStore } from "@/store/assessmentStore";
export default function OnboardingPage({ course_name }: { course_name?: string }) {
  const { step, answers } = useAssessmentStore();
  const router = useRouter();

  if (step === 0) return <LanguageStep />;

  if (step >= 1 && step <= QUESTIONS.length) {
    return <QuestionStep question={QUESTIONS[step - 1]} />;
  }

  if (step === QUESTIONS.length + 1) {
    const score = calculateScore(answers);
    const color = getScoreColor(score);

    return (
      <ResultStep
        course_name={course_name}
        score={score}
        color={color}
        onContinue={() => {
          router.push(`/login?source=htet&score=${score}`);
        }}
      />
    );
  }

  return null;
}

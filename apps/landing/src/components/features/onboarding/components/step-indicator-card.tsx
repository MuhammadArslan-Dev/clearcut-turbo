'use client'
import { ChevronLeftIcon } from "@heroicons/react/24/outline";
import Button from "@clearcut/ui/button";
import React from "react";
import { highlightTextUtil } from "@clearcut/utils/highlight-text";
import StepsIndicator from "./steps-indicator";
import { QUESTIONS } from "@/constants/onboardingQuestions";

export default function StepIndicatorCard({
  data,
  title,
  titleHeightLight,
  description,
  currentStep,
  goBack,
}: {
  data: any;
  title: string;
  titleHeightLight: string;
  description: string;
  currentStep: number;
  goBack: () => void;
}) {
  return (
    <div className="w-full bg-white">
      <div className="flex gap-3 px-3 py-2 items-center">
        <div>
          <Button
            sx={{ paddingX: "8px" }}
            onClick={goBack}
            className="!bg-black/5 !text-[var(--color-surface-gray-normal)] !font-bold !rounded-full"
            size="sm"
            variant="soft"
          >
            <ChevronLeftIcon strokeWidth={3} width={16} />
          </Button>
        </div>
        <div className="w-full">
          <StepsIndicator data={data} currentStep={currentStep} />
        </div>
      </div>
    </div>
  );
}

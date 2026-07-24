import React from "react";
import Chip from '@mui/joy/Chip';
import { StepIndicatorProps } from "@/types/onboarding/onboarding";


export default function StepsIndicator({
    data,
    currentStep = 0,
}: StepIndicatorProps) {
    return (
        <div className="flex gap-2 items-center w-full">

            {/* Top counter */}
            <div>
                <Chip
                    size="md"
                    color="success"
                    className="!bg-[var(--color-primary-soft)] !text-[var(--color-brand)] body-small !font-semibold"
                >
                    {currentStep + 1}/{data.length}
                </Chip>
            </div>

            {/* Step bar */}
            <div className="flex gap-3 w-full">
                {data.map((step, index) => {
                    const isActive = index === currentStep;
                    const isCompleted = index < currentStep;

                    return (
                        <div
                            key={step.id}
                            className={`
                        h-[3px] flex-1 rounded-full  
                        ${isCompleted ? "bg-brand"
                                    : "bg-gray-200"}
                    `}
                        ></div>
                    );
                })}
            </div>
        </div>
    );
}

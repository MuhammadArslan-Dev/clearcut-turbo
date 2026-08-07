import { ChevronLeftIcon } from '@heroicons/react/24/outline'
import { Button } from "@clearcut/ui/button";
import React from 'react'
import StepsIndicator from './StepsIndicator'
import { highlightTextUtil } from '@/utils/text/highlightTextUtil'
import { StepIndicatorCardProps } from '@/types/onboarding/onboarding'
import { trackEvent } from '@/lib/analytics/browser'
import { OnboardingStepNumber } from '@/lib/analytics/events/onboarding'

export default function StepIndicatorCard(
    {
        data,
        title,
        titleHeightLight,
        description,
        currentStep,
        goBack,
    }: StepIndicatorCardProps
) {
    return (
        <div className='w-full bg-white'>
            <div className='flex gap-3 px-3 py-2 items-center'>
                <div>
                    <Button
                    sx={{paddingX: "8px"}}
                     onClick={() => {
                        if (currentStep > 0) {
                            const fromStep = (currentStep + 1) as OnboardingStepNumber; // 1..4
                            const toStep = currentStep as OnboardingStepNumber;         // 1..3 when index>0

                            trackEvent('Onboarding Step Reversed', {
                                from_step_number: fromStep,
                                to_step_number: toStep,
                            });
                        }
                        goBack()
                    }} className='!bg-[var(--background-gray)] !text-[var(--color-surface-gray-normal)] !font-bold !rounded-full'
                     size='sm' variant='soft'><ChevronLeftIcon strokeWidth={3} width={16} />
                     </Button>
                </div>
                <div className='w-full'>
                    <StepsIndicator data={data} currentStep={currentStep} />
                </div>
            </div>
            <div className='px-4 py-2 md:pb-3 md:pt-1 flex flex-col gap-1'>
                <div className="heading-xlarge !font-semibold text-surface-gray-normal text-center">{highlightTextUtil(title, titleHeightLight)}</div>
                <div className="body-medium !font-normal text-surface-gray-muted text-center">{description}</div>
            </div>
        </div>
    )
}

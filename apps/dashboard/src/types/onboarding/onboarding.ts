import { Level } from "@/lib/api/onboarding";
import { Exam } from "../Exam";

export type OnboardingStep = {
    id: string;
    title: string;
    highlightText: string;
    description: string;
    Component?: React.FC<StepProps>;
};


export type StepProps = {
    data: OnboardingData;
    steps: OnboardingStep[];
    currentStep: number;
    updateData: (patch: Partial<OnboardingData>) => void;
    goNext: () => void;
    goBack: () => void;
    isFirst: boolean;
    isLast: boolean;
};

export type OnboardingData = {
    language?: string;
    exam?: Exam;
    level?: Level;
};

export type StepIndicatorProps = {
    data: OnboardingStep[],
    currentStep: number,
}

export type StepIndicatorCardProps = {
    data: OnboardingStep[],
    currentStep: number,
    goBack: () => void | undefined,
    title: string,
    titleHeightLight: string,
    description: string
}
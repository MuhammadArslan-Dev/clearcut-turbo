'use client'
import React, { useEffect } from "react";
import StepIndicatorCard from "../indicator/StepIndicatorCard";
import Button from "@mui/joy/Button";
import { ChevronDoubleRightIcon, ChevronRightIcon } from "@heroicons/react/24/outline";
import { Card } from "@clearcut/ui/card";
import CheckIcon from "@/components/ui/icons/check-icon";
import { useSearchParams } from "next/navigation";
import { usePathname, useRouter } from "@/i18n/navigation";
import LevelSelectionCard from "../LevelSelectionCard";
import FullExamSelection from "../full-exam-selection";
import SingleLevelSelection from "../single-level-selection";
import MainContainer from "@/components/ui/main-container";
import { StepProps } from "@/types/onboarding/onboarding";
import { useLevels } from "@/hooks/onboarding/useLevels";
import { Level } from "@/lib/api/onboarding";
import Skeleton from "@mui/joy/Skeleton";
import FullExamSelectionCtet from "../full-exam-selection-ctet";
import { motion, AnimatePresence } from "framer-motion";
import { useTranslations } from "next-intl";
import { trackEvent } from "@/lib/analytics/browser";
import useButtonArrowAnimation from "@/hooks/useButtonArrowAnimation";
import ShimmerButton from "@/components/ui/button/shimmer-button";


export default function LevelStep({
    data,
    steps,
    currentStep,
    updateData,
    goNext,
    goBack,
    isFirst,
    isLast,
}: StepProps) {
    const t = useTranslations("");

    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();

    const level = searchParams.get("level");
    const { levels: levelsRaw, loading, error } = useLevels(data?.exam?.id);

    const selectLevel = (level: Level) => {
        updateData({ level });
    };

    const formatLevels = (levels: number[]) => {
        if (levels.length <= 1) return `${levels[0]}`;
        const last = levels.pop();
        return `${levels.join(", ")} and ${last}`;
    };

    const rootLevels = levelsRaw?.filter(
        (item) => item.parent_id === null
    ).length || 0;


    const LEVELS = [
        ...(levelsRaw?.filter((item) => item.parent_id === null) || []),
        {
            id: "full-exam",
            name: `${levelsRaw[0]?.group} ${formatLevels(
                Array.from({ length: rootLevels }, (_, i) => i + 1)
            )}`,
            group: "Full Exam",
            parent_id: null,
        },
    ];

    const setLevel = () => {
        setLevelInUrl();
    };

    useEffect(() => {
        if (data?.level) {
            setLevel();
        }
    }, [data?.level]);

    const setLevelInUrl = () => {
        const params = new URLSearchParams(searchParams.toString());
        params.set("level", data?.level?.id?.toString() || "");

        router.replace(`${pathname}?${params.toString()}`, { scroll: false });
    };

    const removeLevel = () => {
        const params = new URLSearchParams(searchParams.toString());
        params.delete("level");

        router.replace(`${pathname}?${params.toString()}`, { scroll: false });
    };

    const step = steps[currentStep];
    const { buttonPhase } = useButtonArrowAnimation({ data: !!data.level || null })

    return (
        <MainContainer maxWidth={'max-w-[850px]'} padding="md:pt-20">
            <div className="flex flex-col gap-2">
                <StepIndicatorCard
                    data={steps}
                    currentStep={currentStep}
                    title={t("Onboarding.subject.select_subject")}
                    titleHeightLight={t("Onboarding.subject.highlight_text")}
                    description={t("Onboarding.subject.description")}
                    goBack={goBack}
                />
                {!level ? (
                    <>
                        <div className="p-4 bg-white space-y-4">
                            <div>
                                <p className="heading-medium !font-semibold">{t("Onboarding.subject.levels_steps.select_level_for",
                                    { subject: `${data?.exam?.short_name}  Exam` || "CTET" })}</p>
                                <p className="body-xsmall !font-normal text-surface-gray-muted">{t("Onboarding.subject.levels_steps.description")}</p>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">

                                {loading ? (
                                    <>
                                        {Array.from({ length: 3 }).map((_, index) => (
                                            <Skeleton key={index} variant="rectangular" width="100%" height={48} />
                                        ))}
                                    </>
                                ) : (
                                    <>
                                        {LEVELS.map((level, index) => (
                                            <motion.div key={index}
                                                initial={{ opacity: 0, y: -40, }}
                                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                                exit={{ opacity: 0, y: 40, }}
                                                transition={{ duration: 0.25 }}
                                            >

                                                <Card padding={'12px 20px'} borderRadius={4} cursor="pointer" bgcolor={`${data.level?.id === level.id ? "var(--color-primary-subtle)" : "white"}`} bordercolor={`${data.level?.id === level.id
                                                    ? "var(--color-brand)"
                                                    : "#ccc"}`} key={level.id}
                                                    onClick={() => selectLevel(level)}
                                                >
                                                    <div className="flex justify-between items-center w-full">
                                                        <div className="flex flex-col">
                                                            <p className="body-medium !font-normal text-surface-gray-normal">{level.name}</p>
                                                        </div>

                                                        {data.level?.id === level.id ? (<CheckIcon size={16} />
                                                        ) : (
                                                            <div className="border border-gray-400 w-4 h-4 rounded-full"></div>
                                                        )}
                                                    </div>
                                                </Card>
                                            </motion.div>
                                        ))}
                                    </>
                                )}

                            </div>
                        </div>
                    </>
                ) : (
                    <>
                        <motion.div className="flex flex-col gap-2 py-2 bg-white"
                            initial={{ opacity: 0, y: 40, scale: 0.9 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 20, scale: 0.95 }}
                            transition={{ type: "spring", stiffness: 200, damping: 22 }}>
                            <LevelSelectionCard onClick={removeLevel} bg="var(--color-primary-subtle)" title={data?.level?.group} subtitle={data?.level?.name} />
                        </motion.div>
                        {level === 'full-exam' ? (
                            data?.exam?.short_name.toLowerCase() === 'ctet' || data?.exam?.short_name.toLowerCase() === 'reet' ? (
                                <FullExamSelectionCtet data={data} />
                            ) : (
                                <FullExamSelection data={data} />
                            )
                        ) : (
                            <SingleLevelSelection data={data} />
                        )}
                    </>
                )}


            </div>
        </MainContainer >
    );
}
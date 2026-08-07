"use client";

import React, { useEffect, useMemo, useState, useCallback } from "react";
import clsx from "clsx";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronDoubleRightIcon } from "@heroicons/react/24/outline";
import { useTranslations } from "next-intl";

import { useIsMobile } from "@/hooks/useIsMobile";
import { useCourseStore } from "@/store/course/useCourseStore";
import { CustomModal } from "../../modals-bottom-sheet";
import StepIndicatorCard from "@/components/features/onboarding/indicator/StepIndicatorCard";
import OptionSelectionCard from "@/components/ui/cards/option-selection-card";
import DotsLoader from "@/components/ui/loader/DotsLoader";
import ShimmerButton from "@/components/ui/button/shimmer-button";

import { useLevels } from "@/hooks/onboarding/useLevels";
import useButtonArrowAnimation from "@/hooks/useButtonArrowAnimation";

import { OnboardingStep } from "@/types/onboarding/onboarding";
import { Level, LevelTranslation, purchaseLevels } from "@/lib/api/onboarding";
import { trackEvent } from "@/lib/analytics/browser";
import { DrawerSheet } from "@/components/features/Sheets/DrawerSheet";
import { Modal } from "@/components/features/Sheets/Modal";
import { token } from "@/lib/auth-token-client";
import { parseTranslation } from "@/utils/text/translation";
import useLanguageSwitch from "@/hooks/useLanguageSwitch";
import { useDrawerBackHandler } from "@/hooks/Global/useDrawerBackHandler";
import { useRouter } from "@/i18n/navigation";
import { useInvalidateQuery } from "@/hooks/useInvalidateQuery";
import { MY_COURSES_KEY } from "@/hooks/course/useMyActiveCourses";

export default function BuySigleCourseModal() {
  const { isOpen, close, mode, data } = useCourseStore();
  const isMobile = useIsMobile();
  const modalT = useTranslations("modals.buySingleCourseModal");
  const { locale } = useLanguageSwitch();
  useDrawerBackHandler();
  const changeP = useTranslations("modals.changePaper");
  const invalidateMyCourses = useInvalidateQuery(MY_COURSES_KEY);

  const { levels: levelsRaw = [], loading, error } = useLevels(data?.id);

  const router = useRouter();

  /* ---------------------------------- state ---------------------------------- */
  const [step, setStep] = useState(0);
  const [paper, setPaper] = useState<Level | null>(null);
  const [selectedPath, setSelectedPath] = useState<Level[]>([]);
  const [finalSelection, setFinalSelection] = useState<Level | null>(null);
  const [currentParent, setCurrentParent] = useState<number | string | null>(
    null,
  );
  const [submitting, setSubmitting] = useState(false);

  /* ---------------------------------- container (STABLE) ---------------------------------- */
  const Container = useMemo(() => (isMobile ? DrawerSheet : Modal), [isMobile]);
  const transCache = useMemo(
    () =>
      new Map(
        levelsRaw.map((c) => [
          c.id,
          parseTranslation<LevelTranslation>(c.translation),
        ]),
      ),
    [levelsRaw],
  );

  /* ---------------------------------- memoized data ---------------------------------- */
  const parent = useMemo(
    () => levelsRaw.filter((item) => item.parent_id === null),
    [levelsRaw],
  );

  const childs = useMemo(
    () => levelsRaw.filter((item) => item.parent_id !== null),
    [levelsRaw],
  );

  const currentChildren = useMemo(() => {
    if (currentParent == null) return [];
    return levelsRaw.filter((item) => item.parent_id === currentParent);
  }, [levelsRaw, currentParent]);

  const STEPS: OnboardingStep[] = useMemo(
    () => [
      {
        id: "exam",
        title: modalT("paperSelection.title"),
        highlightText: modalT("paperSelection.highlight_text"),
        description: `${data?.short_name ?? ""} Exam`,
      },
      {
        id: "level",
        title: modalT("subjectSelection.title"),
        highlightText: modalT("subjectSelection.highlight_text"),
        description: `${data?.short_name ?? ""} Exam ${selectedPath[0]?.name ?? ""}`,
      },
    ],
    [data, modalT, selectedPath],
  );

  /* ---------------------------------- reset on close ---------------------------------- */
  const resetModalState = useCallback(() => {
    setStep(0);
    setPaper(null);
    setSelectedPath([]);
    setFinalSelection(null);
    setCurrentParent(null);
    setSubmitting(false);
  }, []);

  useEffect(() => {
    if (!isOpen) {
      resetModalState();
    }
  }, [isOpen, resetModalState]);

  /* ---------------------------------- handlers ---------------------------------- */
  const handleEdit = useCallback(
    (replaceAtId: number | string, newItem: Level) => {
      setSelectedPath((prev) => {
        const index = prev.findIndex((p) => p.id === replaceAtId);
        if (index === -1) return prev;
        return [...prev.slice(0, index), newItem];
      });

      setCurrentParent(newItem.id);
      setFinalSelection(null);
    },
    [],
  );

  const handleSelect = useCallback(
    (item: Level) => {
      if (item.parent_id === null) {
        setSelectedPath([item]);
      } else {
        setSelectedPath((prev) =>
          prev.some((p) => p.id === item.id) ? prev : [...prev, item],
        );
      }

      setCurrentParent(item.id);

      const nextChildren = levelsRaw.filter((d) => d.parent_id === item.id);
      setFinalSelection(nextChildren.length === 0 ? item : null);
    },
    [levelsRaw],
  );

  const handlePurchase = useCallback(async () => {
    if (!data?.id || !selectedPath.length || submitting) return;

    const selections = {
      [Number(selectedPath[0].id)]: selectedPath.map((item) => Number(item.id)),
    };

    const selectionNames = selectedPath.map((item) => item.name);

    setSubmitting(true);
    try {
      const req = await purchaseLevels({
        exam_id: data.id,
        selections,
      });

      if (req?.status === "success") {
        await trackEvent("New Exam Added", {
          exam_name: data.short_name!,
          source: "my_courses_dropdown",
          selected_paper_ids: [selectedPath[0].id],
          selected_paper_names: [selectedPath[0].name],
          selected_navigation_ids: selections[Number(selectedPath[0].id)],
          selected_navigation_names: selectionNames,
        });
        await invalidateMyCourses();
        router.push(`/preparation/${req.data.group_code}?subject_selected=1`);
      }
    } finally {
      setSubmitting(false);
    }
  }, [data?.id, selectedPath, submitting]);

  const { buttonPhase } = useButtonArrowAnimation({
    data: currentChildren.length === 0,
  });

  const { buttonPhase: nextButtonPhase } = useButtonArrowAnimation({
    data: paper !== null,
  });

  /* ---------------------------------- render ---------------------------------- */
  const mainContent = () => {
    return (
      <div className="flex flex-col gap-3 h-full bg-gray-100 ">
        <div className="sticky top-0 z-50 bg-white">
          <StepIndicatorCard
            data={STEPS}
            currentStep={step}
            title={STEPS[step].title}
            titleHeightLight={STEPS[step].highlightText}
            description={STEPS[step].description}
            goBack={step === 0 ? close : () => setStep(step - 1)}
          />
        </div>

        {step === 0 && (
          <motion.div
            className=" md:px-4"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            transition={{ delay: 0.1 }}
          >
            <div className="flex-1 overflow-y-auto p-4 bg-white space-y-4 md:rounded-md">
              <div>
                <p className="heading-medium !font-semibold">
                  {modalT("paperSelection.selectPaperTitle", {
                    exam: data?.short_name + " Exam",
                  })}
                </p>
                <p className="body-xsmall !font-normal text-surface-gray-muted">
                  {modalT("paperSelection.selectPaperSubtitle")}
                </p>
              </div>

              {error && <p>Sorry something went wrong</p>}

              {loading ? (
                <div className="p-4 flex justify-center">
                  <DotsLoader />
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {parent.map((item) => {
                    const trans = transCache.get(item?.id)?.[locale];

                    return (
                      <OptionSelectionCard
                        key={item.id}
                        padding="12px 20px"
                        borderRadius={8}
                        selected={paper?.id === item.id}
                        showIcon
                        onClick={() => {
                          setPaper(item);
                          setSelectedPath([item]);
                          setCurrentParent(item.id);
                        }}
                        content={
                          <span className="flex flex-col items-start">
                            <h6 className="heading-small !font-semibold text-surface-gray-normal">
                              {trans?.name}
                            </h6>
                            <p className="body-small !font-normal text-surface-gray-muted">
                              {trans?.detail}
                            </p>
                          </span>
                        }
                      />
                    );
                  })}
                </div>
              )}
            </div>
          </motion.div>
        )}

        {step === 1 && (
          <motion.div
            className="md:px-4 pb-[92px] md:pb-0"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            transition={{ delay: 0.1 }}
          >
            {" "}
            {selectedPath.map((item, index) => {
              const levels = childs.filter((l) => l.parent_id === item.id);
              const nextSelected = selectedPath[index + 1];

              if (!nextSelected || !levels.length) return null;

              const data = transCache.get(levels[0].id)?.[locale];

              return (
                <div
                  key={item.id}
                  className="flex-1 p-4 bg-white space-y-4  md:rounded-md"
                >
                  <div>
                    <p className="heading-medium !font-semibold">
                      {data?.group}
                    </p>
                    <p className="body-medium !font-normal text-surface-gray-muted">
                      {modalT("paperSelection.selectAnyOneOption")}
                    </p>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    {levels.map((level) => {
                      const data = transCache.get(level?.id)?.[locale];

                      return (
                        <OptionSelectionCard
                          key={level.id}
                          borderRadius={8}
                          selected={level.id === nextSelected.id}
                          showIcon
                          onClick={() => handleEdit(nextSelected.id, level)}
                          content={<p>{data?.name}</p>}
                        />
                      );
                    })}
                  </div>
                </div>
              );
            })}
            {currentChildren.length > 0 && (
              <div className="flex-1 p-4 bg-white space-y-4  md:rounded-md">
                <div>
                  <p className="heading-medium !font-semibold">
                    {transCache.get(currentChildren[0]?.id)?.[locale]?.group}
                  </p>
                  <p className="body-medium !font-normal text-surface-gray-muted">
                    {modalT("paperSelection.selectAnyOneOption")}
                  </p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {currentChildren.map((level) => {
                    const data = transCache.get(level.id)?.[locale];

                    return (
                      <OptionSelectionCard
                        key={level.id}
                        borderRadius={8}
                        showIcon
                        onClick={() => handleSelect(level)}
                        content={<p>{data?.name}</p>}
                      />
                    );
                  })}
                </div>
              </div>
            )}
          </motion.div>
        )}

        <div className="p-4 fixed md:sticky bottom-0 w-full right-0 bg-white flex justify-center ">
          {step === 0 ? (
            <div className="w-full max-w-[400px]">
              <ShimmerButton
                text={
                  currentChildren.length > 0
                    ? modalT("paperSelection.continue")
                    : modalT("subjectSelection.startLearning")
                }
                disabled={!paper}
                loading={submitting}
                shimmer={nextButtonPhase === "shimmer"}
                onClick={() => {
                  currentChildren.length > 0 ? setStep(1) : handlePurchase();
                }}
                icon={
                  <motion.span
                    animate={nextButtonPhase === "icon" ? { x: 6 } : { x: 0 }}
                    transition={{
                      duration: 0.8,
                      repeat: Infinity,
                      repeatType: "reverse",
                    }}
                  >
                    <ChevronDoubleRightIcon strokeWidth={3} width={16} />
                  </motion.span>
                }
                iconPosition="right"
              />
            </div>
          ) : (
            <div className="w-full max-w-[400px]">
              <ShimmerButton
                text={modalT("subjectSelection.startLearning")}
                disabled={currentChildren.length > 0}
                shimmer={buttonPhase === "shimmer"}
                loading={submitting}
                onClick={handlePurchase}
                icon={
                  <motion.span
                    animate={buttonPhase === "icon" ? { x: 6 } : { x: 0 }}
                    transition={{
                      duration: 0.8,
                      repeat: Infinity,
                      repeatType: "reverse",
                    }}
                  >
                    <ChevronDoubleRightIcon strokeWidth={3} width={16} />
                  </motion.span>
                }
                iconPosition="right"
              />
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <AnimatePresence>
      {isOpen && mode === "single" && (
        <Container
          maxWidth="max-w-[720px] rounded-md"
          isHeader={false}
          isOpen={isOpen}
          onClose={close}
        >
          {mainContent()}
        </Container>
      )}
    </AnimatePresence>
  );
}

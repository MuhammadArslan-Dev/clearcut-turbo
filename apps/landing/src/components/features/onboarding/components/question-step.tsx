"use client";

import { useAssessmentStore } from "@/store/assessmentStore";
import { Option, Question } from "@/utils/assessment";
import StepIndicatorCard from "./step-indicator-card";
import { QUESTIONS } from "@/constants/onboardingQuestions";
import { useState, useEffect } from "react";
import Text from "@clearcut/ui/text";
import OptionSelectionCard from "@/components/shared/option-selection-card";
import { motion } from "framer-motion";
import ContinueFreeButton from "@/components/ui/buttons/ContinueFreeButton";
import { logAmplitudeEvent } from "@/services/analytics";

export default function QuestionStep({ question }: { question: Question }) {
  const { setAnswer, next, prev, answers } = useAssessmentStore();
  const [selected, setSelected] = useState<number | null>(null);

  useEffect(() => {
    if (answers[question.id] !== undefined) {
      setSelected(answers[question.id]);
    } else {
      setSelected(null);
    }
  }, [question.id, answers]);

  const handleNext = async () => {
    if (selected === null) return;

    await logAmplitudeEvent("Onboarding Questions", {
      source: "onboarding",
      qNo: question.no,
      question: question?.title,
      selected_option: question?.options.find((value: Option) => value.value === selected)?.label,
    });

    setAnswer(question.id, selected);
    setSelected(null);
    next();
  };

  const isFirstStep = question.no === 1;
  const isNextDisabled = selected === null;

  return (
    <motion.div
      key={question.id}
      initial={{ opacity: 0, x: 40 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -40 }}
      transition={{ duration: 0.3 }}
      className="w-full h-[calc(100vh-2px)] sm:h-screen flex justify-center sm:items-center bg-background-gray-subtle"
    >
      <div className="sm:max-w-[850px] h-full sm:h-auto w-full flex flex-col justify-between gap-4">
        <div className="w-full flex flex-col gap-4">
          <StepIndicatorCard
            data={QUESTIONS}
            title=""
            titleHeightLight=""
            description=""
            currentStep={question?.no}
            goBack={prev}
          />

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white p-4"
          >
            <div className="text-center flex justify-center">
              <Text as="p" variant="heading-medium" weight="semibold" color="gray-normal">
                Step {question?.no}
              </Text>
              <Text as="p" variant="heading-medium" color="gray-normal">
                {" of "}{QUESTIONS?.length}
              </Text>
            </div>
            <h2 className="body-large font-normal sm:text-center">{question?.title}</h2>
          </motion.div>

          <div className="space-y-3 bg-white py-4 px-3">
            <div className="grid md:grid-cols-2 grid-cols-1 gap-3">
              {question?.options?.map((opt: any, i: number) => {
                const isSelected = selected === opt?.value;
                return (
                  <OptionSelectionCard
                    key={opt?.id}
                    padding="10px 20px"
                    content={
                      <motion.div
                        initial={{ opacity: 0, y: 15 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.05 }}
                        whileTap={{ scale: 0.97 }}
                        whileHover={{ scale: 1.01 }}
                      >
                        <span className="flex flex-col gap-0">
                          <Text
                            as="h6"
                            variant={opt?.subtitle ? "heading-medium" : "body-large"}
                            weight={opt?.subtitle ? "semibold" : "normal"}
                          >
                            {opt?.label}
                          </Text>
                          {opt?.subtitle && (
                            <Text as="p" variant="body-small" color="gray-muted">
                              {opt?.subtitle}
                            </Text>
                          )}
                        </span>
                      </motion.div>
                    }
                    selected={isSelected}
                    showIcon={true}
                    borderRadius={8}
                    onClick={() => setSelected(opt?.value)}
                  />
                );
              })}
            </div>
          </div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="fixed sm:static bottom-0 left-0 px-3 sm:flex w-full justify-center sm:mb-0 mb-3"
        >
          <Text as="p" variant="body-small" color="gray-muted" className="mx-4 mb-1">
            This helps us understand your preparation better
          </Text>
          <div className="w-full">
            <ContinueFreeButton
              fullWidth
              text="Continue"
              onClick={() => handleNext()}
              disabled={isNextDisabled}
            />
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}

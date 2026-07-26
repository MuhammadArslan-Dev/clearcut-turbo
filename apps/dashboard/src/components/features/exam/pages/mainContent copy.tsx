"use client";

import React, { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

import WarningCirleIcon from "@/components/ui/icons/warning-circle-icon";
import MainContainer from "@/components/ui/main-container";
import Text from "@clearcut/ui/text";
import Math from "../../mathjax/Math";
import TextMarkDown from "@/components/ui/widgets/TextMarkDown";
import { Button } from "@clearcut/ui/button";
import QOption from "@/components/ui/cards/QuestionMaterial/Qoption/QOption";

import { useGetCurrentCourse } from "@/hooks/course/useGetCurrentCourse";
import { useGetExam } from "../hooks/useGetExam";
import { useExamStore } from "../store/useExamStore";
import { useSingleTab } from "../hooks/useSingleTab";
import { submitAnswer } from "@/lib/exam";

// ===============================
// SLIDE ANIMATION
// ===============================

const slideVariants = {
  enter: (direction: number) => ({
    x: direction > 0 ? 300 : -300,
    opacity: 0,
  }),

  center: {
    x: 0,
    opacity: 1,
  },

  exit: (direction: number) => ({
    x: direction > 0 ? -300 : 300,
    opacity: 0,
  }),
};

export default function MainContent({ examId }: { examId: string }) {
    // ===============================
  // STATE
  // ===============================

  const [draftAnswer, setDraftAnswer] = useState<string | null>(null);
  const [direction, setDirection] = useState(0);

  const isFirstRender = useRef(true);

  // ===============================
  // CUSTOM HOOKS (ALWAYS TOP)
  // ===============================

  const useSingle = useSingleTab(examId);

  useGetExam({ examId });
  useGetCurrentCourse({ courseId: examId });

  // ===============================
  // STORE
  // ===============================

  const {
    exam,
    next,
    prev,
    clear,
    answer,
    toggleReview,
    setTime,
    getStats,
    getExamContext,
  } = useExamStore();

  // ===============================
  // EFFECTS (ALL BEFORE RETURNS)
  // ===============================

  // Tab blur detection
  useEffect(() => {
    const onBlur = () => {
      console.warn("User left tab");
    };

    window.addEventListener("blur", onBlur);

    return () => window.removeEventListener("blur", onBlur);
  }, []);

  // First render flag
  useEffect(() => {
    isFirstRender.current = false;
  }, []);

  // Context (safe even if exam is null)
  const ctx = getExamContext();

  const question = ctx.currentQuestion;
  const section = ctx.currentSection;
  const translation = ctx.translation;
  const selectedOption = question?.user_option;

  // Sync draft answer
  useEffect(() => {
    setDraftAnswer(question?.user_option ?? null);
  }, [
    ctx.sectionIndex,
    ctx.questionIndex,
    question?.user_option,
  ]);

  // ===============================
  // NOW SAFE TO RETURN
  // ===============================

  if (!exam) {
    return <p>Loading exam...</p>;
  }

  if (!question || !section || !translation) {
    return <p>Loading question...</p>;
  }

  // ===============================
  // NAV
  // ===============================

  const goNext = () => {
    setDirection(1);
    next();
  };

  const goPrev = () => {
    setDirection(-1);
    prev();
  };

  // ===============================
  // ANSWER
  // ===============================

  const handleSaveAndNext = async () => {
    if (!draftAnswer) return;

    const option = String(
      Number(draftAnswer) + 1
    ) as "1" | "2" | "3" | "4";

    // Save to store
    answer(draftAnswer);

    // API call
    submitAnswer({
      exam_id: exam.uuid,
      question_id: question.id,
      user_option: option,
    });

    // console.log("Answer saved", getStats());

    // Move
    setDirection(1);
    next();
  };

  // ===============================
  // SECTION INFO
  // ===============================

  const currentQNo = ctx.questionIndex + 1;
  const totalInSection = section.questions.length;

  const isLastInSection = currentQNo === totalInSection;
  const isFirstInSection = currentQNo === 1;

  // ===============================
  // RENDER
  // ===============================

  return (
    <div className="py-3 overflow-hidden">
      <MainContainer maxWidth="max-w-[800px]" padding="p-0 md:p-4">
        <div className="flex flex-col gap-3">
          {/* ===============================
              QUESTIONS CONTAINER
          =============================== */}

          <div className="bg-white min-h-[calc(100vh-200px)] flex flex-col gap-4 py-5 relative overflow-hidden">
            {/* ===============================
                PROGRESS
            =============================== */}

            <div className="flex justify-between bg-brand/9 items-center gap-4 px-3 py-2 border-l-4 border-brand">
              <div className="space-y-0.5">
                <Text
                  as="p"
                  variant="heading-medium"
                  weight="semibold"
                  color="gray-normal"
                >
                  Question {currentQNo} /{" "}
                  <Text variant="body-medium" color="gray-subtle">
                    {totalInSection}
                  </Text>
                </Text>

                <Text variant="body-small" color="gray-subtle">
                  Section: {section.name ?? `Section ${ctx.sectionIndex + 1}`}
                </Text>

                <div className="flex items-center gap-1">
                  <WarningCirleIcon size={16} />

                  <Text as="p" variant="body-small">
                    Suggested Speed: 1 min / question
                  </Text>
                </div>
              </div>
            </div>

            {/* ===============================
                ANIMATED AREA
            =============================== */}

            <div className="relative flex-1 overflow-hidden">
              <AnimatePresence mode="wait" custom={direction}>
                <motion.div
                  key={`${ctx.sectionIndex}-${ctx.questionIndex}`}
                  custom={direction}
                  variants={slideVariants}
                  initial={isFirstRender.current ? false : "enter"}
                  animate="center"
                  exit="exit"
                  transition={{
                    x: { type: "spring", stiffness: 1200, damping: 90 },
                    opacity: { duration: 0.15 },
                  }}
                  drag="x"
                  dragConstraints={{ left: 0, right: 0 }}
                  dragElastic={0.15}
                  onDragEnd={(e, info) => {
                    if (info.offset.x < -80) goNext();
                    if (info.offset.x > 80) goPrev();
                  }}
                  className="absolute w-full"
                >
                  {/* ===============================
                      QUESTION CONTENT
                  =============================== */}

                  <div className="flex flex-col gap-3 px-4">
                    {/* Question */}
                    <div>
                      <Math>
                        <Text
                          as="div"
                          variant="body-large"
                          weight="normal"
                          color="gray-normal"
                        >
                          <TextMarkDown>{translation.text ?? ""}</TextMarkDown>
                        </Text>
                      </Math>
                    </div>

                    {/* Options */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {translation.options.map((opt: any, index: number) => {
                        const optionValue = String(index);

                        const isSelected = draftAnswer === optionValue;

                        return (
                          <QOption
                            key={index}
                            value={{
                              text: opt.text,
                              index,
                              image: opt.image,
                            }}
                            mainContainer={{
                              borderwidth: 2,
                              bgcolor: isSelected ? "!bg-brand/9" : "",
                              bordercolor: isSelected ? "!border-brand" : "",
                            }}
                            counter={{
                              backgroundColor: isSelected ? "!bg-brand/9" : "",
                              borderColor: isSelected ? "!border-brand" : "",
                            }}
                            // 🔥 Only local select
                            onClick={() => {
                              setDraftAnswer(optionValue);
                            }}
                          />
                        );
                      })}
                    </div>
                  </div>
                </motion.div>
              </AnimatePresence>
            </div>
          </div>

          {/* ===============================
              ACTIONS
          =============================== */}

          {/* QUICK ACTIONS */}
          <div className="flex gap-3">
            {/* BACK */}
            <button onClick={goPrev}>Back</button>

            {/* CLEAR */}
            <button disabled={!selectedOption} onClick={clear}>
              Clear Response
            </button>

            {/* REVIEW + NEXT */}
            <button
              onClick={() => {
                toggleReview();
                goNext();
              }}
            >
              Mark for Review & Next
            </button>

            {/* NEXT */}
            <button onClick={goNext}>Next</button>
          </div>

          <div className="md:sticky flex justify-center w-full bottom-0 h-[140px] bg-white">
            <div className="max-w-[600px] flex flex-col gap-3 w-full py-2 px-3">
              {/* NAV */}
              <div className="flex items-center justify-between">
                <Button
                  sx={{ borderRadius: "50px" }}
                  variant="soft"
                  color="gray"
                  disabled={isFirstInSection && ctx.sectionIndex === 0}
                  onClick={goPrev}
                >
                  Back
                </Button>

                <Button
                  sx={{ borderRadius: "50px" }}
                  disabled={!draftAnswer}
                  onClick={handleSaveAndNext}
                >
                  Save and Next
                </Button>

                <Button
                  sx={{ borderRadius: "50px" }}
                  variant="soft"
                  color="gray"
                  disabled={
                    isLastInSection &&
                    ctx.sectionIndex === ctx.sections.length - 1
                  }
                  onClick={goNext}
                >
                  Next
                </Button>
              </div>

              {/* QUICK ACTIONS */}
              <div className="flex gap-3">
                <button onClick={goPrev}>Back</button>

                <button onClick={clear}>Clear</button>

                <button onClick={toggleReview}>Review</button>

                <button onClick={goNext}>Next</button>
              </div>

              {/* INFO */}
              <div className="flex gap-2 items-center justify-center w-full">
                <WarningCirleIcon />

                <Text as="p" variant="body-small">
                  To clear answer, tap the selected option again
                </Text>
              </div>
            </div>
          </div>
        </div>
      </MainContainer>
    </div>
  );
}

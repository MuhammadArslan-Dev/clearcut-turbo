"use client";

import React, { memo, useEffect, useRef, useState } from "react";
import { motion, AnimatePresence, m } from "framer-motion";

import WarningCirleIcon from "@/components/ui/icons/warning-circle-icon";
import MainContainer from "@/components/ui/main-container";
import Text from "@clearcut/ui/text";
import MathJax from "../../mathjax/Math";
import TextMarkDown from "@/components/ui/widgets/TextMarkDown";
import { Button } from "@mui/joy";
import QOption from "@/components/ui/cards/QuestionMaterial/Qoption/QOption";

import { useGetCurrentCourse } from "@/hooks/course/useGetCurrentCourse";
import { useGetExam } from "../hooks/useGetExam";
import { useExamStore } from "../store/useExamStore";
import { useSingleTab } from "../hooks/useSingleTab";
import { submitAnswer } from "@/lib/exam";
import CounterCard from "@/components/ui/cards/CounterCard";
import { ChartSuccessBarIcon, ChevronIcon } from "@/components/ui/icons";
import { useExamModalStore } from "../store/useExamModalStore";

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
  const [timeLeft, setTimeLeft] = useState(60); // 60 seconds
  const { isOpen, closeModal, stack, open } = useExamModalStore();

  const isFirstRender = useRef(true);

  // ===============================
  // CUSTOM HOOKS (ALWAYS TOP)
  // ===============================

  const useSingle = useSingleTab(examId);

  useGetExam({ examId });
  // useGetCurrentCourse({ courseId: examId });

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
    isFinished,
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

  // Context (safe even if exam is null)
  const ctx = getExamContext();

  const question = ctx.currentQuestion;
  const section = ctx.currentSection;
  const translation = ctx.translation;
  const selectedOption = question?.user_option;

  // Sync draft answer
  useEffect(() => {
    setDraftAnswer(question?.user_option ?? null);
    setTimeLeft(60); // reset timer for new question
  }, [ctx.sectionIndex, ctx.questionIndex, question?.user_option]);

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

    const option = String(Number(draftAnswer) + 1) as "1" | "2" | "3" | "4";

    // Save to store
    answer(draftAnswer);

    // API call
    submitAnswer({
      exam_id: exam.uuid,
      question_id: question.id,
      user_option: option,
    });

    // Move
    setDirection(1);
    next();
  };
  const handleSaveAndEndTest = async () => {
    if (!draftAnswer) return;

    const option = String(Number(draftAnswer) + 1) as "1" | "2" | "3" | "4";

    // Save to store
    answer(draftAnswer);

    // API call
    submitAnswer({
      exam_id: exam.uuid,
      question_id: question.id,
      user_option: option,
    });

    open("end-exam");
    // Move
    setDirection(1);
    next();
  };

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Enter" && draftAnswer) {
        handleSaveAndNext();
      } else if (event.key === "ArrowLeft") {
        goPrev();
      } else if (event.key === "ArrowRight") {
        goNext();
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [draftAnswer, exam, question]);

  // First render flag
  useEffect(() => {
    isFirstRender.current = false;
  }, []);

  useEffect(() => {
    if (!question) return;

    if (timeLeft <= 0) {
      // Auto move when time ends
      handleSaveAndNext();
      return;
    }

    const timer = setInterval(() => {
      setTimeLeft((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft, question]);

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
    <div className="max-h-screen mt-2 lg:mt-0">
      <MainContainer maxWidth="max-w-[800px]" padding="p-0 lg:p-4">
        <div className="flex flex-col gap-3">
          {/* ===============================
              QUESTIONS CONTAINER
          =============================== */}

          <div
            className="
                 bg-white
              lg:h-[calc(100vh-240px)]
              h-[calc(100vh-205px)]
              flex flex-col
              gap-4
              py-5
              relative
              overflow-y-auto
              "
          >
            {/* ===============================
                ANIMATED AREA
            =============================== */}

            <div className="w-full flex flex-col gap-4">
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
                  className="w-full flex flex-col gap-4"
                >
                  {/* ===============================
                   PROGRESS
                  =============================== */}
                  <ProgressBlock
                    total={totalInSection}
                    current={currentQNo}
                    timeLeft={timeLeft}
                  />
                  {/* ===============================
                      QUESTION CONTENT
                  =============================== */}

                  <div className="flex flex-col gap-3 px-4">
                    {/* Question */}
                    <div>
                      <MathJax>
                        <Text
                          as="div"
                          variant="body-large"
                          weight="normal"
                          color="gray-normal"
                        >
                          <TextMarkDown>{translation.text ?? ""}</TextMarkDown>
                        </Text>
                      </MathJax>
                    </div>

                    {/* Options */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
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

          <div className="fixed md:sticky flex justify-center w-full bottom-0 lg:h-[140px] h-[80px] bg-white">
            <ExamAction
              goPrev={goPrev}
              goNext={goNext}
              draftAnswer={draftAnswer}
              isFirstInSection={isFirstInSection}
              ctx={ctx}
              handleSaveAndNext={handleSaveAndNext}
              handleSaveAndEndTest={handleSaveAndEndTest}
              isLastInSection={isLastInSection}
              selectedOption={selectedOption!}
              clear={clear}
              toggleReview={toggleReview}
            />
          </div>
        </div>
      </MainContainer>
    </div>
  );
}
interface ProgressBlockProps {
  current: number;
  total: number;
  timeLeft?: string | number;
}
const ProgressBlock = memo(
  ({ current, total, timeLeft }: ProgressBlockProps) => {
    const formatTime = (seconds: number) => {
      const m = Math.floor(seconds / 60);
      const s = seconds % 60;

      const minutes = String(m).padStart(2, "0");
      const secs = String(s).padStart(2, "0");

      return `${minutes}:${secs}`;
    };

    return (
      <div className="flex justify-between  items-center gap-4 px-3 py-2">
        <div className="w-full flex  justify-between items-center">
          <Text
            as="p"
            variant="heading-medium"
            weight="semibold"
            color="gray-normal"
          >
            Question {current} /{" "}
            <Text variant="body-medium" color="gray-subtle">
              {total}
            </Text>
          </Text>

          <div className="flex gap-1 items-center">
            <div></div>
            <Text as="p" variant="body-small" color="primary-normal">
              {formatTime(timeLeft as number)}
            </Text>
          </div>

          <div className="flex items-center gap-1">
            <CounterCard
              textClass="!text-[var(--icon-positive-normal)] !font-semibold"
              value="+ 1"
              fontFamily="body-medium"
              rounded="rounded-sm"
              border="border-none"
              bgColor="!bg-[var(--icon-positive-subtle)]/12"
              width="w-9"
              height="h-6"
            />
            <CounterCard
              textClass="!text-[var(--icon-negative-normal)] !font-semibold"
              value="- 0"
              fontFamily="body-medium"
              rounded="rounded-sm"
              border="border-none"
              bgColor="!bg-[var(--icon-negative-normal)]/12"
              width="w-9"
              height="h-6"
            />
          </div>
        </div>
      </div>
    );
  },
);

interface ExamActionProps {
  goPrev: () => void;
  goNext: () => void;

  draftAnswer: string | null;

  isFirstInSection: boolean;
  isLastInSection: boolean;

  ctx: {
    sectionIndex: number;
    sections: any[];
  };

  handleSaveAndNext: () => void;
  handleSaveAndEndTest: () => void;

  selectedOption: string | null;

  clear: () => void;
  toggleReview: () => void;
}

const ExamAction = memo(
  ({
    goPrev,
    goNext,
    draftAnswer,
    isFirstInSection,
    ctx,
    handleSaveAndNext,
    handleSaveAndEndTest,
    isLastInSection,
    selectedOption,
    clear,
    toggleReview,
  }: ExamActionProps) => {
    return (
      <div className="max-w-[600px] flex flex-col gap-3 w-full py-2 px-3">
        {/* NAV */}
        <div className=" items-center justify-between gap-12 lg:flex hidden">
          <Button
            sx={{ borderRadius: "50px", paddingX: "30px" }}
            size="lg"
            variant="soft"
            color="gray"
            disabled={isFirstInSection && ctx.sectionIndex === 0}
            onClick={goPrev}
          >
            <div className="flex items-center gap-2">
              <ChevronIcon
                size={20}
                type="double"
                variant="left"
                color={
                  isFirstInSection && ctx?.sectionIndex === 0
                    ? "rgb(107 114 128 / 50%)"
                    : "black"
                }
              />{" "}
              <span className="">Back</span>
            </div>{" "}
          </Button>

          <div className="w-full">
            {isLastInSection && ctx?.sectionIndex === ctx?.sections.length - 1 ? (
              <Button
                size="lg"
                sx={{ borderRadius: "50px" }}
                disabled={!draftAnswer}
                onClick={handleSaveAndNext}
                fullWidth
              >
                Save and End Test
              </Button>
            ) : (
              <Button
                size="lg"
                sx={{ borderRadius: "50px" }}
                disabled={!draftAnswer}
                onClick={handleSaveAndNext}
                fullWidth
              >
                Save and Next
              </Button>
            )}
          </div>

          <Button
            sx={{ borderRadius: "50px", paddingX: "30px" }}
            size="lg"
            variant="soft"
            color="gray"
            disabled={
              isLastInSection && ctx?.sectionIndex === ctx?.sections.length - 1
            }
            onClick={goNext}
          >
            <div className="flex items-center gap-2">
              <span className="">Next</span>
              <ChevronIcon
                size={20}
                type="double"
                variant="right"
                color={
                  isLastInSection &&
                  ctx?.sectionIndex === ctx?.sections.length - 1
                    ? "rgb(107 114 128 / 50%)"
                    : "black"
                }
              />{" "}
            </div>{" "}
          </Button>
        </div>

        <div className="flex flex-col gap-2">
          <div className=" items-center gap-6 lg:flex hidden">
            <Button
              sx={{ borderRadius: "50px", paddingX: "40px" }}
              variant="soft"
              color="gray"
              disabled={!selectedOption}
              onClick={clear}
            >
              <div className="flex items-center gap-2">
                <ChevronIcon
                  size={20}
                  type="double"
                  variant="left"
                  color={!selectedOption ? "rgb(107 114 128 / 50%)" : "black"}
                />{" "}
                <span className=""> Clear Response</span>
              </div>{" "}
            </Button>
            <Button
              sx={{ borderRadius: "50px", paddingX: "40px" }}
              variant="soft"
              color="gray"
              onClick={() => {
                toggleReview();
                goNext();
              }}
            >
              <div className="flex items-center gap-2">
                <span className=""> Mark this for review and next</span>
                <ChevronIcon
                  size={20}
                  type="double"
                  variant="right"
                  color={"black"}
                />{" "}
              </div>{" "}
            </Button>
          </div>
          <div className=" items-center justify-between flex  lg:hidden">
            <Button
              sx={{ borderRadius: "50px", paddingX: "12px" }}
              variant="soft"
              color="gray"
              disabled={!selectedOption}
              onClick={clear}
            >
              <div className="flex items-center gap-1">
                <ChevronIcon
                  size={20}
                  type="double"
                  variant="left"
                  color={!selectedOption ? "rgb(107 114 128 / 50%)" : "black"}
                />{" "}
                <span className="body-small"> Clear</span>
              </div>{" "}
            </Button>
            <Button
              sx={{ borderRadius: "50px", paddingX: "11px" }}
              variant="soft"
              color="gray"
              onClick={() => {
                toggleReview();
                goNext();
              }}
            >
              <div className="flex items-center gap-1">
                <span className="body-small">Mark and next</span>
                <ChevronIcon
                  size={20}
                  type="double"
                  variant="right"
                  color={"black"}
                />{" "}
              </div>{" "}
            </Button>
            {isLastInSection && ctx?.sectionIndex === ctx?.sections?.length - 1 ? (
              <Button
                sx={{ borderRadius: "50px" }}
                disabled={!draftAnswer}
                onClick={handleSaveAndEndTest}
              >
                <span className="body-small"> Save & End Test</span>
              </Button>
            ) : (
              <Button
                sx={{ borderRadius: "50px" }}
                disabled={!draftAnswer}
                onClick={handleSaveAndNext}
              >
                <span className="body-small"> Save and Next</span>
              </Button>
            )}
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
    );
  },
);

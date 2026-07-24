"use client";

import React, { memo, useEffect, useRef, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";

import WarningCirleIcon from "@/components/ui/icons/warning-circle-icon";
import MainContainer from "@/components/ui/main-container";
import Text from "@clearcut/ui/text";
import MathJax from "../../mathjax/Math";
import TextMarkDown from "@/components/ui/widgets/TextMarkDown";
import { Button } from "@mui/joy";
import QOption from "@/components/ui/cards/QuestionMaterial/Qoption/QOption";

import { useGetExam } from "../hooks/useGetExam";
import { useExamStore } from "../store/useExamStore";
import { useSingleTab } from "../hooks/useSingleTab";
import { submitAnswer } from "@/lib/exam";
import { apiFetch } from "@/lib/api/client";
import { useRouter } from "@/i18n/navigation";
import CounterCard from "@/components/ui/cards/CounterCard";
import { ChevronIcon } from "@/components/ui/icons";
import { useExamModalStore } from "../store/useExamModalStore";
import ExamSkeleton from "./ExamSkeleton";
import useExamTimer from "../hooks/useExamTimer";
import Image from "next/image";

// ===============================
// SLIDE ANIMATION
// ===============================

const slideVariants = {
  enter: (direction: number) => ({
    x: direction > 0 ? 300 : -300,
    opacity: 0,
  }),
  center: { x: 0, opacity: 1 },
  exit: (direction: number) => ({
    x: direction > 0 ? -300 : 300,
    opacity: 0,
  }),
};

export default function MainContent({ examId }: { examId: string }) {
  const [draftAnswer, setDraftAnswer] = useState<string | null>(null);
  const [direction, setDirection] = useState(0);
  const [elapsed, setElapsed] = useState(0);

  const timerRef          = useRef<NodeJS.Timeout | null>(null);
  const isFirstRender     = useRef(true);
  // Stable ref so callbacks always read the latest elapsed without stale closures
  const elapsedRef        = useRef(0);
  useEffect(() => { elapsedRef.current = elapsed; }, [elapsed]);
  // Per-question elapsed map: question.id → seconds spent (pause/resume across navigation)
  const elapsedMapRef     = useRef<Map<number, number>>(new Map());
  const prevQuestionIdRef = useRef<number | null>(null);

  const router = useRouter();

  useSingleTab(examId);
  const { isLoading } = useGetExam({ examId });

  // ===============================
  // ZUSTAND SELECTORS (IMPORTANT)
  // ===============================

  const exam = useExamStore((s) => s.exam);
  const next = useExamStore((s) => s.next);
  const prev = useExamStore((s) => s.prev);
  const clear = useExamStore((s) => s.clear);
  const answer = useExamStore((s) => s.answer);
  const toggleReview = useExamStore((s) => s.toggleReview);
  const getExamContext = useExamStore((s) => s.getExamContext);

  const { open } = useExamModalStore();

  // ===============================
  // ALREADY ATTEMPTED GUARD
  // ===============================

  useEffect(() => {
    if (!exam) return;
    if (exam.status === "submitted" || exam.status === "expired") {
      const testTypeParam =
        exam.type === "chapter"   ? "chapter-tests"    :
        exam.type === "sectional" ? "sectional-tests"  :
        "full-length-papers";
      router.replace(
        `/test-series/${exam.course?.group_code}?showReport=true&examId=${exam.uuid}&testType=${testTypeParam}`
      );
    }
  }, [exam?.status]);

  // ===============================
  // EXAM TIMER AUTO-SUBMIT
  // ===============================

  const handleAutoExpire = useCallback(() => {
    if (!exam) return;
    apiFetch(`/v2/exam/end-exam/${exam.uuid}`, {
      method: "GET",
      cache: "no-store",
    }).catch(console.error);
    const testTypeParam =
      exam.type === "chapter"   ? "chapter-tests"    :
      exam.type === "sectional" ? "sectional-tests"  :
      "full-length-papers";
    router.replace(
      `/test-series/${exam.course?.group_code}?showReport=true&examId=${exam.uuid}&testType=${testTypeParam}`
    );
  }, [exam, router]);

  const remaining = useExamTimer({ examId, initialRemaining: 0, onExpire: handleAutoExpire });

  // ===============================
  // CONTEXT (safe — recalculates only when exam changes)
  // ===============================

  const ctx = getExamContext();
  const question = ctx.currentQuestion;
  const section = ctx.currentSection;
  const translation = ctx.translation;
  const selectedOption = question?.user_option ?? null;

  // ===============================
  // SYNC DRAFT ANSWER + PAUSE/RESUME QUESTION TIMER
  // ===============================

  useEffect(() => {
    const prevId = prevQuestionIdRef.current;
    const newId  = question?.id ?? null;

    // Save elapsed for the question we're leaving
    if (prevId !== null && prevId !== newId) {
      elapsedMapRef.current.set(prevId, elapsedRef.current);
    }

    // Track current question
    prevQuestionIdRef.current = newId;

    // Restore elapsed for the question we're entering (0 on first visit)
    const saved = newId != null ? (elapsedMapRef.current.get(newId) ?? 0) : 0;
    setElapsed(saved);

    setDraftAnswer(question?.user_option ?? null);
  }, [ctx.sectionIndex, ctx.questionIndex]);

  // ===============================
  // TIMER (PRODUCTION SAFE)
  // ===============================

  const handleSaveAndNext = useCallback(() => {
    if (!draftAnswer || !question || !exam) return;

    const option     = String(Number(draftAnswer) + 1);
    const timeSpent  = elapsedRef.current;

    answer(draftAnswer);

    const answerPayload = { exam_id: exam.uuid, question_id: question.id, user_option: option as any, time_spent: timeSpent };

    submitAnswer(answerPayload).catch((err) => {
      console.error("[submit-answer] FAILED:", err);
    });

    setDirection(1);
    next();
  }, [draftAnswer, question, exam, answer, next]);

  useEffect(() => {
    if (!question) return;
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setElapsed((prev) => prev + 1);
    }, 1000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [question]);

  // ===============================
  // NAVIGATION
  // ===============================

  const goNext = useCallback(() => {
    setDirection(1);
    next();
  }, [next]);

  const goPrev = useCallback(() => {
    setDirection(-1);
    prev();
  }, [prev]);

  // ===============================
  // SAVE & END
  // ===============================

  const handleSaveAndEndTest = useCallback(() => {
    if (!draftAnswer || !question || !exam) return;

    const option    = String(Number(draftAnswer) + 1);
    const timeSpent = elapsedRef.current;

    answer(draftAnswer);

    submitAnswer({
      exam_id:     exam.uuid,
      question_id: question.id,
      user_option: option as any,
      time_spent:  timeSpent,
    });

    open("end-exam");
  }, [draftAnswer, question, exam, answer, open]);

  // ===============================
  // CLEAR RESPONSE
  // ===============================

  const handleClearResponse = useCallback(() => {
    if (!question || !exam) return;

    const wasSaved = !!question.user_option;

    setDraftAnswer(null);
    clear();

    if (wasSaved) {
      apiFetch("/v2/exam/clear-answer", {
        method: "POST",
        body: JSON.stringify({
          exam_id: exam.uuid,
          question_id: question.id,
        }),
      }).catch(console.error);
    }
  }, [question, exam, clear]);

  // ===============================
  // MARK FOR REVIEW AND NEXT
  // ===============================

  const handleMarkForReviewAndNext = useCallback(() => {
    if (!question || !exam) return;

    if (draftAnswer) {
      answer(draftAnswer);
    }

    toggleReview();

    const option    = draftAnswer ? String(Number(draftAnswer) + 1) : null;
    const timeSpent = elapsedRef.current;

    const payload = {
      exam_id:     exam.uuid,
      question_id: question.id,
      user_option: option,
      time_spent:  timeSpent,
    };
    apiFetch("/v2/exam/mark-review", {
      method: "POST",
      body: JSON.stringify(payload),
    }).catch((err) => {
      console.error("[mark-review] FAILED:", err);
    });

    setDirection(1);
    next();
  }, [draftAnswer, question, exam, answer, toggleReview, next]);

  // ===============================
  // KEYBOARD (STABLE)
  // ===============================

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Enter") handleSaveAndNext();
      if (e.key === "ArrowLeft") goPrev();
      if (e.key === "ArrowRight") goNext();
    };

    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [handleSaveAndNext, goPrev, goNext]);

  useEffect(() => {
    isFirstRender.current = false;
  }, []);

  // ===============================
  // GUARDS
  // ===============================

  if (isLoading || !exam || !question || !section || !translation) {
    return <ExamSkeleton />;
  }
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
          <div className="bg-white lg:h-[calc(100vh-240px)] h-[calc(100vh-205px)] flex flex-col gap-4 py-5 relative overflow-y-auto">
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
                className="w-full flex flex-col gap-4 px-4"
              >
                <ProgressBlock
                  total={totalInSection}
                  current={currentQNo}
                  timeLeft={elapsed}
                />

                <MathJax content={translation?.text}>
                  <Text as="div" variant="body-large">
                    <TextMarkDown>{translation?.text ?? ""}</TextMarkDown>
                  </Text>
                </MathJax>
                {translation?.image && (
                  <div className="w-full flex justify-center">
                    <div className="relative h-[160px] w-[160px] aspect-video overflow-hidden rounded-md">
                      <Image src={translation.image} alt="" fill />
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                  {translation?.options?.map((opt: any, index: number) => {
                    const value = String(index);
                    const isSelected = draftAnswer === value;

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
                        onClick={() => setDraftAnswer(value)}
                      />
                    );
                  })}
                </div>
              </motion.div>
            </AnimatePresence>
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
              isLastInSection={isLastInSection}
              ctx={ctx}
              handleSaveAndNext={handleSaveAndNext}
              handleSaveAndEndTest={handleSaveAndEndTest}
              selectedOption={selectedOption}
              onClear={handleClearResponse}
              onMarkForReview={handleMarkForReviewAndNext}
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

  onClear: () => void;
  onMarkForReview: () => void;
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
    onClear,
    onMarkForReview,
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
            disabled={isFirstInSection && ctx?.sectionIndex === 0}
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
            {isLastInSection &&
            ctx?.sectionIndex === ctx?.sections.length - 1 ? (
              <Button
                size="lg"
                sx={{ borderRadius: "50px" }}
                disabled={!draftAnswer}
                onClick={handleSaveAndEndTest}
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
              disabled={!selectedOption && !draftAnswer}
              onClick={onClear}
            >
              <div className="flex items-center gap-2">
                <ChevronIcon
                  size={20}
                  type="double"
                  variant="left"
                  color={!selectedOption && !draftAnswer ? "rgb(107 114 128 / 50%)" : "black"}
                />{" "}
                <span className=""> Clear Response</span>
              </div>{" "}
            </Button>
            <Button
              sx={{ borderRadius: "50px", paddingX: "40px" }}
              variant="soft"
              color="gray"
              onClick={onMarkForReview}
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
              disabled={!selectedOption && !draftAnswer}
              onClick={onClear}
            >
              <div className="flex items-center gap-1">
                <ChevronIcon
                  size={20}
                  type="double"
                  variant="left"
                  color={!selectedOption && !draftAnswer ? "rgb(107 114 128 / 50%)" : "black"}
                />{" "}
                <span className="body-small"> Clear</span>
              </div>{" "}
            </Button>
            <Button
              sx={{ borderRadius: "50px", paddingX: "11px" }}
              variant="soft"
              color="gray"
              onClick={onMarkForReview}
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
            {isLastInSection &&
            ctx?.sectionIndex === ctx?.sections?.length - 1 ? (
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

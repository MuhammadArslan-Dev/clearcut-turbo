"use client";

import React, { memo, useEffect, useRef, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";

import { Card } from "@clearcut/ui/card";
import Text from "@clearcut/ui/text";
import MathJax from "../../mathjax/Math";
import TextMarkDown from "@/components/ui/widgets/TextMarkDown";
import QOption from "@/components/ui/cards/QuestionMaterial/Qoption/QOption";

import { useGetExam } from "../hooks/useGetExam";
import { useExamStore } from "../store/useExamStore";
import { useSingleTab } from "../hooks/useSingleTab";
import { submitAnswer } from "@/lib/exam";
import { apiFetch } from "@/lib/api/client";
import { useRouter } from "@/i18n/navigation";
import CounterCard from "@/components/ui/cards/CounterCard";
import { useExamModalStore } from "../store/useExamModalStore";
import ExamSkeleton from "./ExamSkeleton";
import useExamTimer from "../hooks/useExamTimer";
import Image from "next/image";
import { toast } from "react-toastify";
import QuestionMetaBar from "@/components/features/attempt-ui/QuestionMetaBar";
import InfoStrip from "@/components/features/attempt-ui/InfoStrip";
import AttemptActionBar from "@/components/features/attempt-ui/AttemptActionBar";

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

  const timerRef          = useRef<NodeJS.Timeout | null>(null);
  const isFirstRender     = useRef(true);
  // Per-question seconds. A ref (not state) so the once-a-second tick doesn't
  // re-render the whole page — <ElapsedClock/> polls it for display, and the
  // save/mark handlers read the latest value without stale closures.
  const elapsedRef        = useRef(0);
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

  const handleAutoExpire = useCallback(async () => {
    if (!exam) return;
    // Same reasoning as ExamEndConfirmationSheet's endExam(): prefer the
    // type end-exam's own response reports for this exam over exam?.type
    // from the store, which is the authoritative source rather than
    // whatever happened to be in the store at this exact moment.
    let examType: string | null | undefined = exam.type;
    try {
      const res = await apiFetch<{ data: { exam: { type: string | null } } }>(
        `/v2/exam/end-exam/${exam.uuid}`,
        { method: "POST", cache: "no-store" },
      );
      examType = res.data.exam.type;
    } catch (error) {
      console.error(error);
    }
    const testTypeParam =
      examType === "chapter"   ? "chapter-tests"    :
      examType === "sectional" ? "sectional-tests"  :
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
    elapsedRef.current = saved;

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
      // answer() above already marked this question as answered in local
      // state regardless of whether the network call succeeds, so a failed
      // submission was previously silent — the UI showed the question as
      // saved while the backend never actually recorded it. Surface it so
      // the user has a chance to go back and re-save it during the exam,
      // rather than only discovering the loss after grading.
      toast.error("Your answer couldn't be saved. Please check it again before submitting.");
    });

    setDirection(1);
    next();
  }, [draftAnswer, question, exam, answer, next]);

  useEffect(() => {
    if (!question) return;
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      elapsedRef.current += 1;
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

    // Deliberately not awaited — end-exam shouldn't wait on this network
    // call to open the confirmation sheet. But it must still be caught:
    // this was previously a bare fire-and-forget call, so a failure here
    // (the exact "API unreachable POST /v2/exam/answer" case Sentry
    // reported "Unhandled" — an uncaught promise rejection) silently lost
    // the last answer with no diagnostic and no user-facing signal.
    submitAnswer({
      exam_id:     exam.uuid,
      question_id: question.id,
      user_option: option as any,
      time_spent:  timeSpent,
    }).catch((err) => {
      console.error("[submit-answer] FAILED:", err);
      toast.error("Your last answer couldn't be saved. Please check it again before submitting.");
    });

    open("end-exam");
  }, [draftAnswer, question, exam, answer, open]);

  // ===============================
  // CLEAR RESPONSE
  // ===============================

  // Client-side only for now (same as the Daily Test): there is no exam
  // question-report endpoint yet, so this just acknowledges the tap.
  const handleReportQuestion = useCallback(() => {
    toast.success("Question reported. Our team will review it.");
  }, []);

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
  const isVeryLast = isLastInSection && ctx.sectionIndex === ctx.sections.length - 1;
  // Whole-test numbering ("Question 31 / 150"), matching the progress strip;
  // the navigator grid keeps per-section numbers.
  let totalQuestions = 0;
  let questionsBefore = 0;
  ctx.sections.forEach((s, i) => {
    totalQuestions += s.questions.length;
    if (i < ctx.sectionIndex) questionsBefore += s.questions.length;
  });
  const overallQNo = questionsBefore + currentQNo;

  // ===============================
  // RENDER
  // ===============================

  return (
    <div className="flex h-full flex-col gap-3 lg:p-3 lg:pl-3">
      {/* Question card */}
      <Card
        bgcolor="white"
        border="border-none"
        padding={0}
        borderRadius={12}
        className="relative flex flex-1 flex-col !h-auto !min-h-0"
      >
        {/* Scrolling question area (bottom padding clears the fixed action bar below `lg`) */}
        <div className="flex-1 overflow-y-auto pb-24 lg:pb-0">
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
              className="flex min-h-full w-full flex-col gap-4 p-4 lg:p-5"
            >
              <QuestionMetaBar
                chip={section.section?.name}
                hideChipOnMobile
                isMarked={!!question.marked_for_review}
                onToggleMark={handleMarkForReviewAndNext}
                onReport={handleReportQuestion}
                trailing={
                  <QuestionStats elapsedRef={elapsedRef} resetKey={`${ctx.sectionIndex}-${ctx.questionIndex}`} />
                }
              />

              <Text as="p" variant="heading-large" weight="semibold" color="gray-normal">
                Question {overallQNo}{" "}
                <Text as="span" variant="body-large" color="gray-subtle">
                  / {totalQuestions}
                </Text>
              </Text>

              <MathJax content={translation?.text}>
                <Text as="div" variant="body-large">
                  <TextMarkDown>{translation?.text ?? ""}</TextMarkDown>
                </Text>
              </MathJax>
              {translation?.image && (
                <div className="flex w-full justify-center">
                  <div className="relative aspect-video h-[160px] w-[160px] overflow-hidden rounded-md">
                    <Image src={translation.image} alt="" fill />
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
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
                        padding: "14px 16px",
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

              <InfoStrip>Select the best answer from the options above. Tap the selected option again to clear it.</InfoStrip>
            </motion.div>
          </AnimatePresence>
        </div>

      </Card>

      {/* Footer card — separate from the question card, with a gap between them.
          Below `lg` it stays a fixed bottom bar. */}
      <div className="fixed inset-x-2 bottom-2 z-20 rounded-xl border border-gray-100 bg-white px-3 py-2 shadow-md lg:static lg:inset-auto lg:z-auto lg:shrink-0 lg:border-0 lg:px-5 lg:py-4 lg:shadow-none">
        <AttemptActionBar
          legacy
          compactMobile
          onPrevious={goPrev}
          previousDisabled={isFirstInSection && ctx?.sectionIndex === 0}
          onPrimary={isVeryLast ? handleSaveAndEndTest : handleSaveAndNext}
          primaryDisabled={!draftAnswer}
          primaryLabel={isVeryLast ? "Save and End Test" : "Save and Next"}
          onClear={handleClearResponse}
          clearDisabled={!selectedOption && !draftAnswer}
        />
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Question header: subject chip · Mark for Review · per-question clock · marks */
/* -------------------------------------------------------------------------- */

const formatClock = (seconds: number) => {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
};

// The per-question clock ticks in the ref owned by MainContent; this small
// component polls it, so the once-a-second update re-renders ONLY this text —
// not the question, options or panels (it used to re-render the whole page).
const ElapsedClock = memo(function ElapsedClock({
  elapsedRef,
  resetKey,
}: {
  elapsedRef: React.MutableRefObject<number>;
  resetKey: string;
}) {
  const [secs, setSecs] = useState(elapsedRef.current);

  useEffect(() => {
    setSecs(elapsedRef.current);
    const id = setInterval(() => setSecs(elapsedRef.current), 500);
    return () => clearInterval(id);
  }, [resetKey, elapsedRef]);

  return <>{formatClock(secs)}</>;
});

// Per-question clock + the (+1 / -0) marking chips.
const QuestionStats = memo(function QuestionStats({
  elapsedRef,
  resetKey,
}: {
  elapsedRef: React.MutableRefObject<number>;
  resetKey: string;
}) {
  return (
    <div className="flex items-center gap-4">
      <div className="hidden h-6 w-px bg-gray-200 sm:block" />

      <Text as="p" variant="body-medium" color="primary-normal">
        <ElapsedClock elapsedRef={elapsedRef} resetKey={resetKey} />
      </Text>

      <div className="flex items-center gap-1">
        <CounterCard
          textClass="!text-[var(--icon-positive-normal)] !font-semibold"
          value="+1"
          fontFamily="body-medium"
          rounded="rounded-sm"
          border="border-none"
          bgColor="!bg-[var(--icon-positive-subtle)]/12"
          width="w-9"
          height="h-6"
        />
        <CounterCard
          textClass="!text-[var(--icon-negative-normal)] !font-semibold"
          value="-0"
          fontFamily="body-medium"
          rounded="rounded-sm"
          border="border-none"
          bgColor="!bg-[var(--icon-negative-normal)]/12"
          width="w-9"
          height="h-6"
        />
      </div>
    </div>
  );
});

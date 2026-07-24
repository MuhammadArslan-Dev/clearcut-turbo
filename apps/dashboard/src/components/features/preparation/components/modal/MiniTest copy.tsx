"use client";

import React, { useMemo, useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";

import { useIsMobile } from "@/hooks/useIsMobile";
import { useBackHandler } from "@/hooks/Global/useBackHandler";
import { usePreparationModalStore } from "@/components/features/preparation/store/usePreparationModalStore";

import {
  CheckIcon,
  ChevronIcon,
  CrossIcon,
  StarBadge,
} from "@/components/ui/icons";

import { Modal } from "@/components/features/Sheets/Modal";
import { Button } from "@mui/joy";
import { Skeleton } from "@/components/ui/skeleton";

import { useMiniTestQuestions } from "../../hooks/useMiniTestQuestions";
import { useMiniTestStore } from "../../store/useMiniTestStore";
import { QuestionOption } from "../../types/question";
import { usePreparationStore } from "../../store/usePreparationDataStore";
import { useTranslations } from "next-intl";
import { BottomSheet } from "@/components/features/Sheets/BottomSheet";

import Text from "@clearcut/ui/text";
import WarningCirleIcon from "@/components/ui/icons/warning-circle-icon";
import TickIcon from "@/components/ui/icons/tick-icon";
import QOption from "@/components/ui/cards/QuestionMaterial/Qoption/QOption";
import QuestionText from "@/components/ui/cards/QuestionMaterial/Question/QuestionText";
import Exaplanation from "@/components/ui/cards/QuestionMaterial/Explanation/Exaplanation";
import ExplanationTitle from "@/components/ui/cards/QuestionMaterial/Explanation/ExplanationTitle";

import { updateLearningProgress } from "@/lib/dashboard/userInteractions";
import { trackEvent } from "@/lib/analytics/browser";

/* -------------------------------------------------------------------------- */
/*                                  MAIN                                      */
/* -------------------------------------------------------------------------- */

export default function MiniTest() {
  const isMobile = useIsMobile();
  const miniTestT = useTranslations("modals.miniTest");

  const { isOpen, closeModal, stack, open } = usePreparationModalStore();
  const active = stack[stack.length - 1];

  const {
    selectedTopic,
    course,
    selectedChapter,
    selectedPaperId,
    sectionsByPaperId,
    selectedSectionId,
    markTopicFieldDone,
  } = usePreparationStore();

  const { loading } = useMiniTestQuestions(
    isOpen ? selectedTopic?.id : undefined,
    course?.group_code!
  );

  const sections = selectedPaperId
    ? sectionsByPaperId[selectedPaperId] ?? []
    : [];

  const selectSection = useMemo(() => {
    return sections.find((s) => Number(s.id) === Number(selectedSectionId));
  }, [selectedSectionId, sections]);

  const { course: courseData } = usePreparationStore();

  const {
    questions,
    currentIndex,
    answers,
    checked,
    selectOption,
    checkAnswer,
    next,
    prev,
    getResult,
    locale,
    setLocale,
  } = useMiniTestStore();

  useEffect(() => {
    setLocale(courseData?.language === "english" ? "en" : "hi");
  }, [courseData]);

  useEffect(() => {
    updateLearningProgress({
      course_id: course?.group_code!,
      section_id: selectedSectionId!,
      chapter_id: selectedChapter?.id!,
      topic_id: selectedTopic?.id.toString()!,
      mini_quizzes_taken: true,
    });

    trackEvent("Topic Status Changed", {
      topic_name: selectedTopic?.name!,
      new_status: "miniTestDone",
      change_source: "manual_user_action",
    });

    markTopicFieldDone(Number(selectedTopic?.id), "miniTestDone");
  }, []);

  const Container = useMemo(() => (isMobile ? BottomSheet : Modal), [isMobile]);

  const question = questions[currentIndex];
  const selected = answers[currentIndex];
  const hasSelected = selected !== undefined;
  const hasChecked = checked[currentIndex] === true;

  const translate =
    selectSection?.type === "subject"
      ? question?.translations.find((t: any) => t.locale === locale)
      : question?.translations[0];

  const correctKey = translate
    ? Number(translate?.answer?.correct_option)
    : null;

  const isLast = currentIndex === questions.length - 1;
  const result = getResult();

  useBackHandler({
    isOpen: isOpen && active === "mini-test",
    onClose: () => closeModal("mini-test"),
  });

  if (!isOpen || active !== "mini-test") return null;

  return (
    <AnimatePresence>
      <Container
        isHeader={false}
        isOpen={isOpen}
        maxWidth="md:max-w-[680px]"
        onClose={() => closeModal("mini-test")}
      >
        <div className="bg-white min-h-[50vh] max-h-[90vh] flex flex-col justify-between">
          <Header onClose={() => closeModal("mini-test")} />

          {loading || !question ? (
            <SekeletonMiniTest />
          ) : (
            <Content
              question={translate}
              questions={questions}
              currentIndex={currentIndex}
              answers={answers}
              checked={checked}
              selected={selected}
              hasChecked={hasChecked}
              correctKey={correctKey}
              selectOption={selectOption}
              result={result}
              locale={locale}
              selectedSection={selectSection}
            />
          )}

          <Footer
            currentIndex={currentIndex}
            hasSelected={hasSelected}
            hasChecked={hasChecked}
            isLast={isLast}
            onPrev={prev}
            onCheck={() => checkAnswer(currentIndex)}
            onNext={next}
            onResult={() => {
              closeModal("mini-test");
              open("mini-test-result", {}, false);
            }}
          />
        </div>
      </Container>
    </AnimatePresence>
  );
}

/* -------------------------------------------------------------------------- */
/*                                  HEADER                                    */
/* -------------------------------------------------------------------------- */

const Header = ({ onClose }: { onClose: () => void }) => {
  const miniTestT = useTranslations("modals.miniTest");

  return (
    <div className="sticky top-0 z-10 flex px-3 py-4 bg-white justify-between">
      <Text variant="heading-large" weight="semibold">
        {miniTestT("title")}
      </Text>

      <button onClick={onClose}>
        <CrossIcon />
      </button>
    </div>
  );
};

/* -------------------------------------------------------------------------- */
/*                                 CONTENT                                    */
/* -------------------------------------------------------------------------- */

const Content = ({
  question,
  questions,
  currentIndex,
  answers,
  checked,
  selected,
  hasChecked,
  correctKey,
  selectOption,
  result,
  locale,
  selectedSection,
}: any) => {

  const getCorrectAnswer = (q: any) => {
    const t =
      selectedSection?.type === "subject"
        ? q.translations.find((tr: any) => tr.locale === locale)
        : q.translations[0];

    return t ? Number(t.answer.correct_option) : null;
  };

  return (
    <div className="w-full flex justify-center min-h-[30vh] max-h-[90vh] overflow-y-auto py-2">
      <div className="w-full flex flex-col gap-5 bg-white md:p-5">

        {/* Progress */}
        <div className="flex justify-between bg-brand/9 items-center gap-4 px-3 py-2 border-l-4 border-brand">
          <div className="space-y-0.5">
            <Text variant="heading-medium" weight="semibold">
              Questions {currentIndex + 1}/{questions.length}
            </Text>

            <div className="flex items-center gap-1">
              <StarBadge size={20} />
              <Text variant="body-small" weight="bold" className="!text-[#00a251]">
                Easy
              </Text>
            </div>
          </div>

          {/* FIXED PROGRESS */}
          <div className="grid grid-cols-5 gap-2">
            {questions.map((q: any, i: number) => {
              const selected = answers[i];
              const isAnswered = selected != null;
              const isChecked = checked[i];

              if (!isChecked || !isAnswered) {
                return (
                  <div
                    key={i}
                    className="w-6 h-6 rounded-full bg-white border border-[var(--border-gray-subtle)]"
                  />
                );
              }

              const correct = getCorrectAnswer(q);

              if (selected === correct) {
                return (
                  <CheckIcon key={i} size={24} variant="simple" color="#00a251" />
                );
              }

              return (
                <CrossIcon
                  key={i}
                  size={24}
                  padding={4}
                  radius={24}
                  variant="filled"
                  mode="danger"
                />
              );
            })}
          </div>
        </div>

        {/* Question */}
        <div className="px-3">
          <QuestionText
            question={question?.content?.question}
            image={question?.content?.question_image}
          />
        </div>

        {/* Options */}
        <div className="grid md:grid-cols-2 gap-3 px-3">
          {question?.options?.map((option: QuestionOption) => {
            const isSelected = selected === option.option;
            const isCorrect = option.option === correctKey;

            const showCorrect = hasChecked && isCorrect;
            const showWrong = hasChecked && isSelected && !isCorrect;

            return (
              <motion.div key={option.option}>
                <QOption
                  value={{
                    index: option.option - 1,
                    text: option.text!,
                    image: option.image!,
                  }}
                  onClick={() =>
                    !hasChecked && selectOption(currentIndex, option.option)
                  }
                  mainContainer={{
                    borderwidth: 2,
                    className: hasChecked && "pointer-events-none",
                    bgcolor: showCorrect
                      ? "!bg-green-100"
                      : showWrong
                      ? "!bg-red-100"
                      : isSelected
                      ? "!bg-brand/9"
                      : "",
                  }}
                />
              </motion.div>
            );
          })}
        </div>

        {/* Explanation */}
        {hasChecked && (
          <div className="space-y-2 px-3">
            <ExplanationTitle title="Answer & Explanation" index={correctKey - 1} />
            <Exaplanation explanation={question?.answer?.explanation} />
          </div>
        )}
      </div>
    </div>
  );
};

/* -------------------------------------------------------------------------- */
/*                                  FOOTER                                    */
/* -------------------------------------------------------------------------- */

const Footer = ({
  currentIndex,
  hasSelected,
  hasChecked,
  isLast,
  onPrev,
  onCheck,
  onNext,
  onResult,
}: any) => {
  return (
    <div className="sticky bottom-0 px-3 py-2 bg-white">
      <div className="flex gap-3 max-w-[420px] mx-auto">

        {!hasChecked && (
          <Button disabled={!hasSelected} onClick={onCheck} fullWidth>
            Check My Answer
          </Button>
        )}

        {hasChecked && !isLast && (
          <Button onClick={onNext} fullWidth>
            Next Question
          </Button>
        )}

        {hasChecked && isLast && (
          <Button onClick={onResult} fullWidth>
            Finish Mini Test
          </Button>
        )}
      </div>
    </div>
  );
};

/* -------------------------------------------------------------------------- */
/*                                SKELETON                                    */
/* -------------------------------------------------------------------------- */

export const SekeletonMiniTest = () => {
  return (
    <div className="w-full flex justify-center">
      <div className="w-full flex flex-col gap-5 bg-white p-5">
        <div className="flex justify-between items-center gap-4">
          <Skeleton rounded="rounded-full" className="h-6 w-30" />

          <div className="grid grid-cols-5 gap-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} rounded="rounded-full" className="h-5 w-5" />
            ))}
          </div>
        </div>

        <Skeleton className="h-8 w-[80%]" />

        <div className="grid md:grid-cols-2 gap-3">
          {Array.from({ length: 4 }).map((_, index) => (
            <Skeleton className="h-10 w-full" key={index} />
          ))}
        </div>
      </div>
    </div>
  );
};
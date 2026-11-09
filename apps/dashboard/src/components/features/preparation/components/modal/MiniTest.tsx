"use client";

import React, { useMemo, useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { TestIntro } from "@clearcut/motion/test/flow";
import {
  AnswerFeedback,
  OptionMotion,
  QuestionSlide,
  StreakCombo,
  type OptionMotionState,
} from "@clearcut/motion/test/mini-test";

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
import { Button } from "@clearcut/ui/button";

import { Skeleton } from "@/components/ui/skeleton";

import { useMiniTestQuestions } from "../../hooks/useMiniTestQuestions";
import { useMiniTestStore } from "../../store/useMiniTestStore";
import { QuestionOption } from "../../types/question";
import { usePreparationStore } from "../../store/usePreparationDataStore";
import { useTranslations } from "next-intl";
import { getLocalizedName } from "@/components/features/preparation/util/getLocalizedName";
import { BottomSheet } from "@/components/features/Sheets/BottomSheet";
import Text from "@clearcut/ui/text";
import WarningCirleIcon from "@/components/ui/icons/warning-circle-icon";
import TickIcon from "@/components/ui/icons/tick-icon";
import QOption from "@/components/ui/cards/QuestionMaterial/Qoption/QOption";
import QuestionText from "@/components/ui/cards/QuestionMaterial/Question/QuestionText";
import Exaplanation from "@/components/ui/cards/QuestionMaterial/Explanation/Exaplanation";
import ExplanationTitle from "@/components/ui/cards/QuestionMaterial/Explanation/ExplanationTitle";
import { updateLearningProgress } from "@/lib/dashboard/userInteractions";
import { createLearningInteraction } from "@/lib/dashboard/todayGoals";
import { useQueryClient } from "@tanstack/react-query";
import { trackEvent } from "@/lib/analytics/browser";
import { logger } from "@/lib/sentry/sentry-logger";
import { isNetworkFailure } from "@/lib/api/api-error";
import { courseLanguageToLocale, toContentLocale } from "@/utils/text/contentLocale";

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

  const { loading, error, refetchData } = useMiniTestQuestions(
    isOpen ? selectedTopic?.id : undefined,
    course?.group_code!,
  );
  const sections = selectedPaperId
    ? (sectionsByPaperId[selectedPaperId] ?? [])
    : [];

  const selectSection = useMemo(() => {
    return sections.find((s) => Number(s.id) === Number(selectedSectionId));
  }, [selectedSectionId, sections]);
  const { course: courseData } = usePreparationStore();

  const queryClient = useQueryClient();

  // "Start test" animation (@clearcut/motion TestIntro: topic title, 3-2-1-Go, Skip). It plays INSIDE the
  // modal (under its header) while the questions load. This modal is mounted fresh on every open, so it replays each time.
  const [introDone, setIntroDone] = useState(false);

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

  // setting language for test — the course's own content language, not the
  // site's UI locale (see courseLanguageToLocale()'s docblock). Only "en"/
  // "hi" question translations exist, so anything else (incl. Marathi)
  // must fall back to "hi", never silently to "en".
  useEffect(() => {
    setLocale(toContentLocale(courseLanguageToLocale(course?.language)));
  }, [courseData]);

  useEffect(() => {
    // These are fire-and-forget progress pings. If the backend is down or slow
    // the rejected promise used to go unhandled and take the whole page down,
    // so every call swallows its own failure — the test itself keeps working.
    updateLearningProgress({
      course_id: course?.group_code!,
      section_id: selectedSectionId!,
      chapter_id: selectedChapter?.id!,
      topic_id: selectedTopic?.id.toString()!,
      mini_quizzes_taken: true,
    }).catch((err) => {
      if (isNetworkFailure(err)) {
        logger.breadcrumb("updateLearningProgress hit a network blip", {
          tags: { type: "background_sync", module: "mini-test" },
          extra: {
            action: "updateLearningProgress",
            topicId: selectedTopic?.id,
            courseId: course?.group_code,
          },
        });
        return;
      }
      logger.error(err, {
        tags: { type: "background_sync", module: "mini-test" },
        extra: {
          action: "updateLearningProgress",
          topicId: selectedTopic?.id,
          courseId: course?.group_code,
        },
      });
    });

    createLearningInteraction({
      topic_id: Number(selectedTopic?.id),
      interaction_type: "mini_quiz_taken",
    })
      .then(() => queryClient.invalidateQueries({ queryKey: ["today-goals"] }))
      .catch((err) => {
        if (isNetworkFailure(err)) {
          logger.breadcrumb("createLearningInteraction hit a network blip", {
            tags: { type: "background_sync", module: "mini-test" },
            extra: { action: "createLearningInteraction", topicId: selectedTopic?.id },
          });
          return;
        }
        logger.error(err, {
          tags: { type: "background_sync", module: "mini-test" },
          extra: {
            action: "createLearningInteraction",
            topicId: selectedTopic?.id,
          },
        });
      });

    trackEvent("Topic Status Changed", {
      topic_name: selectedTopic?.name!,
      new_status: "miniTestDone",
      change_source: "manual_user_action",
    });

    markTopicFieldDone(Number(selectedTopic?.id), "miniTestDone");
  }, []);

  const language = toContentLocale(courseLanguageToLocale(course?.language));

  const Container = useMemo(() => (isMobile ? BottomSheet : Modal), [isMobile]);

  const question = questions[currentIndex];
  const selected = answers[currentIndex];
  const hasSelected = selected !== undefined;
  const hasChecked = checked[currentIndex] === true;

  // A partial/failed response can leave a question without translations —
  // optional-chain everything so it renders empty instead of throwing.
  const translate =
    selectSection?.type === "subject"
      ? question?.translations?.find((t: any) => t.locale === language)
      : question?.translations?.[0];

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
        <motion.div
          layout
          className="bg-white min-h-[50dvh] max-h-[90dvh] flex flex-col justify-between"
          transition={{ duration: 0.3 }}
        >
          <Header onClose={() => closeModal("mini-test")} />

          {!introDone ? (
            // TestIntro's overlay is position: fixed; the transform makes this pane its containing block,
            // so it fills only the modal body (header stays visible) instead of the whole screen.
            <div className="relative min-h-[max(50dvh,380px)] flex-1 overflow-hidden" style={{ transform: "translateZ(0)" }}>
              <TestIntro
                type="topic"
                title={selectedTopic ? getLocalizedName(selectedTopic, language) : ""}
                questions={questions.length || undefined}
                lang={language === "hi" ? "hi" : "en"}
                onStart={() => setIntroDone(true)}
              />
            </div>
          ) : loading ? (
            <SekeletonMiniTest />
          ) : !question ? (
            // Server unreachable or empty/partial payload — show a recoverable
            // message instead of an endless skeleton or a crash.
            <LoadFailed onRetry={refetchData} isError={!!error} />
          ) : (
            <Content
              question={translate}
              questions={questions}
              currentIndex={currentIndex}
              answers={answers}
              selected={selected}
              hasChecked={hasChecked}
              checked={checked}
              correctKey={correctKey}
              selectOption={selectOption}
              result={result}
              locale={locale}
              selectedSection={selectSection}
              lang={language === "hi" ? "hi" : "en"}
            />
          )}

          {introDone && question && (
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
          )}
        </motion.div>
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
  lang,
}: any) => {
  const extractImgSrc = (html: string) => {
    const match = html.match(/src\s*=\s*["']?([^"'>\s]+)/i);
    return match ? match[1] : null;
  };
  const [correct, setCorrect] = useState(0);
  const [incorrect, setIncorrect] = useState(0);

  useEffect(() => {
    if (result && hasChecked) {
      setCorrect(result.correct);
      setIncorrect(result.incorrect);
    }
  }, [result, hasChecked]);

  // "3 in a row!" toast (@clearcut/motion StreakCombo): consecutive correct checked answers ending here.
  const correctOf = (q: any) => {
    const t =
      selectedSection?.type === "subject"
        ? q?.translations?.find((tr: any) => tr.locale === locale)
        : q?.translations?.[0];
    return t?.answer?.correct_option ? Number(t.answer.correct_option) : null;
  };
  let streak = 0;
  if (hasChecked && selected === correctKey) {
    for (let k = currentIndex; k >= 0; k--) {
      if (checked[k] && answers[k] != null && answers[k] === correctOf(questions[k])) streak++;
      else break;
    }
  }
  const [combo, setCombo] = useState<number | null>(null);
  // Toast once per question: going Previous/Next back onto an already-checked question must not replay it.
  const toasted = React.useRef<Set<number>>(new Set());
  useEffect(() => {
    if (!hasChecked || (streak !== 3 && streak !== 5 && streak !== 10)) return;
    if (toasted.current.has(currentIndex)) return;
    toasted.current.add(currentIndex);
    setCombo(streak);
    const t = setTimeout(() => setCombo(null), 1800);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasChecked, currentIndex]);

  return (
    <div className="relative w-full">
    {combo !== null && <StreakCombo count={combo} lang={lang} top={64} />}
    <div className="w-full flex justify-center min-h-[30dvh] max-h-[90dvh] overflow-y-auto py-2">
      <div className="w-full flex flex-col gap-5 bg-white md:p-5">
        {/* Progress */}
        <div className="flex justify-between bg-brand/9 items-center gap-4 px-3 py-2 border-l-4 border-brand">
          <div className="space-y-0.5">
            <Text
              as="p"
              variant="heading-medium"
              weight="semibold"
              color="gray-normal"
            >
              Questions {currentIndex + 1}/{questions.length}
            </Text>
            <div className="flex items-center gap-1">
              <StarBadge size={20} />
              <Text
                as="p"
                variant="body-small"
                weight="bold"
                className="whitespace-nowrap !text-[#00a251]"
              >
                {question?.ai_metadata?.difficulty_level || "Easy"}
              </Text>
            </div>
          </div>
          <div className=" px-3">
            <div className="grid grid-cols-5 md:grid-cols-5 gap-2">
              {questions.map((q: any, i: number) => {
                const selected = answers[i];
                const isAnswered = selected != null;
                const isChecked = checked[i];

                // not checked yet
                if (!isChecked) {
                  return (
                    <div
                      key={i}
                      className="w-6 h-6 rounded-full bg-white border border-[var(--border-gray-subtle)]"
                    />
                  );
                }

                // checked but not answered
                if (!isAnswered) {
                  return (
                    <div
                      key={i}
                      className="w-6 h-6 rounded-full bg-white border border-[var(--border-gray-subtle)]"
                    />
                  );
                }

                const t =
                  selectedSection?.type === "subject"
                    ? q?.translations?.find((tr: any) => tr.locale === locale)
                    : q?.translations?.[0];

                const correct = t?.answer?.correct_option
                  ? Number(t.answer.correct_option)
                  : null;

                // correct answer
                if (selected === correct) {
                  return (
                    <CheckIcon
                      key={i}
                      size={24}
                      variant="simple"
                      color="#00a251"
                    />
                  );
                }

                // wrong answer
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
            {(correct > 0 || incorrect > 0) && (
              <div className="w-full text-center">
                <Text variant="body-medium" weight="normal" color="gray-normal">
                  {correct} correct • {incorrect} wrong
                </Text>
              </div>
            )}
          </div>
        </div>

        {/* Question + options slide in per question (@clearcut/motion QuestionSlide) */}
        <QuestionSlide key={currentIndex}>
        <div className="flex flex-col gap-5">
        <div className="px-3">
          <QuestionText
            question={question?.content?.question}
            image={question?.content?.question_image}
          />
        </div>

        {/* Options */}
        <div className="grid md:grid-cols-2 gap-3 px-3">
          {question?.options?.map((option: QuestionOption, index: number) => {
            const isSelected = selected === option.option;
            const isCorrect = option.option === correctKey;

            const showCorrect = hasChecked && isCorrect;
            const showWrong = hasChecked && isSelected && !isCorrect;

            return (
              <OptionMotion
                key={option.option}
                index={index}
                state={
                  (showCorrect
                    ? "right"
                    : showWrong
                      ? "wrong"
                      : isSelected
                        ? "picked"
                        : "idle") as OptionMotionState
                }
              >
                <QOption
                  value={{
                    index: option?.option - 1,
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
                      ? "!bg-[var(--icon-positive-subtle)]/12"
                      : showWrong
                        ? "!bg-red-100"
                        : isSelected
                          ? "!bg-brand/9"
                          : "",

                    bordercolor: showCorrect
                      ? "!border-[var(--icon-positive-subtle)]"
                      : showWrong
                        ? "!border-red-500"
                        : isSelected
                          ? "!border-brand"
                          : "",
                  }}
                  counter={{
                    borderColor: showCorrect
                      ? "!border-[var(--icon-positive-subtle)]"
                      : showWrong
                        ? "!border-red-500"
                        : isSelected
                          ? "!border-brand"
                          : "",
                    backgroundColor: showCorrect
                      ? "!bg-[var(--icon-positive-subtle)]/2"
                      : showWrong
                        ? "!bg-red-100"
                        : isSelected
                          ? "!bg-brand/9"
                          : "",
                    color: showCorrect
                      ? "!text-[var(--icon-positive-subtle)]"
                      : showWrong
                        ? "!text-red-500"
                        : isSelected
                          ? "!text-brand"
                          : "",
                  }}
                />
              </OptionMotion>
            );
          })}
        </div>

        </div>
        </QuestionSlide>

        {/* Explanation */}
        {hasChecked && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-2 px-3"
          >
            <AnswerFeedback
              right={selected === correctKey}
              lang={lang}
              detail={
                selected === correctKey
                  ? undefined
                  : (() => {
                      const o = question?.options?.find((x: QuestionOption) => x.option === correctKey);
                      return o ? `${String.fromCharCode(64 + o.option)}. ${o.text}` : undefined;
                    })()
              }
            />
            <ExplanationTitle
              title=" Answer & Explanation"
              index={Number.isFinite(correctKey) ? correctKey - 1 : 0}
            />

            <Exaplanation explanation={question?.answer?.explanation} />
          </motion.div>
        )}
      </div>
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
        {currentIndex > 0 && (
          <Button
            variant="soft"
            color="gray"
            onClick={onPrev}
            fullWidth
            sx={{
              borderRadius: "50px",
            }}
          >
            <div className="flex items-center gap-2">
              <ChevronIcon variant="left" color="black" type="double" />
              <p>Previous</p>
            </div>
          </Button>
        )}

        {!hasChecked && (
          <div className="w-full flex items-center flex-col gap-2">
            <div className="w-[200px]">
              <Button
                disabled={!hasSelected}
                onClick={onCheck}
                color="primary"
                fullWidth
                sx={{
                  borderRadius: "50px",
                }}
              >
                <div className="flex items-center gap-2">
                  <p>Check My Answer</p>
                  {/* Keep the tick visible in the disabled (nothing selected)
                      state too — it used to be #006bd130, which is ~19% alpha
                      and invisible against the button's light blue fill. */}
                  <TickIcon color="white" />
                </div>
              </Button>
            </div>
            {currentIndex === 0 && (
              <div className="flex items-center gap-1">
                <WarningCirleIcon size={20} />
                <Text
                  as="p"
                  variant="body-small"
                  weight="normal"
                  color="gray-subtle"
                >
                  Select an option to continue
                </Text>
              </div>
            )}
          </div>
        )}

        {hasChecked && !isLast && (
          <div className="w-full flex items-center flex-col gap-2">
            <div className="w-[200px]">
              <Button
                onClick={onNext}
                variant="soft"
                color="gray"
                fullWidth
                sx={{
                  borderRadius: "50px",
                }}
              >
                <div className="flex items-center gap-2">
                  <p>Next Question </p>
                  <ChevronIcon variant="right" color="black" type="double" />
                </div>
              </Button>
            </div>
          </div>
        )}

        {hasChecked && isLast && (
          <Button
            onClick={onResult}
            color="primary"
            fullWidth
            sx={{
              borderRadius: "50px",
            }}
          >
            <div className="flex items-center gap-2">
              <p>Finish Topic Test</p>
              <ChevronIcon variant="right" color="white" type="double" />
            </div>
          </Button>
        )}
      </div>
    </div>
  );
};

/* -------------------------------------------------------------------------- */
/*                               LOAD FAILED                                  */
/* -------------------------------------------------------------------------- */

/**
 * Shown when the questions request failed (server down / timed out) or came
 * back empty. Keeps the modal usable — the user can retry or close — instead
 * of sitting on a skeleton that never resolves.
 */
const LoadFailed = ({
  onRetry,
  isError,
}: {
  onRetry: () => void;
  isError: boolean;
}) => {
  return (
    <div className="w-full flex flex-col items-center justify-center gap-4 px-6 py-12 text-center">
      <WarningCirleIcon size={40} />

      <div className="space-y-1">
        <Text as="p" variant="heading-medium" weight="semibold" color="gray-normal">
          {isError ? "Couldn't load the test" : "No questions available"}
        </Text>
        <Text as="p" variant="body-medium" weight="normal" color="gray-muted">
          {isError
            ? "We couldn't reach the server. Check your connection and try again."
            : "There are no questions for this topic yet. Please try another topic."}
        </Text>
      </div>

      {isError && (
        <div className="w-[200px]">
          <Button
            onClick={onRetry}
            color="primary"
            fullWidth
            sx={{ borderRadius: "50px" }}
          >
            Try Again
          </Button>
        </div>
      )}
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

          <div className="grid grid-cols-5 md:grid-cols-10 gap-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} rounded="rounded-full" className="h-5 w-5" />
            ))}
          </div>
        </div>

        <div>
          <Skeleton className="h-8 w-[80%]" />
        </div>

        <div className="grid md:grid-cols-2 gap-3">
          {Array.from({ length: 4 }).map((_, index) => (
            <Skeleton className="h-10 w-full" key={index} />
          ))}
        </div>
      </div>
    </div>
  );
};

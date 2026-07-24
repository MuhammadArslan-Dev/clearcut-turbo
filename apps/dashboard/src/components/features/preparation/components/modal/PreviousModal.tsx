"use client";

import React, { useMemo, useCallback, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

import { useIsMobile } from "@/hooks/useIsMobile";
import { usePreparationModalStore } from "@/components/features/preparation/store/usePreparationModalStore";
import { useBackHandler } from "@/hooks/Global/useBackHandler";

import Text from "@clearcut/ui/text";
import { Card } from "@clearcut/ui/card";
import Math from "@/components/features/mathjax/Math";
import ReactMarkdown from "react-markdown";

import { BottomSheet } from "@/components/features/Sheets/BottomSheet";
import { Modal } from "@/components/features/Sheets/Modal";

import {
  CalendarIcon,
  ChevronIcon,
  CrossIcon,
  NumberCountIcon,
  StarBadge,
} from "@/components/ui/icons";

import { Button } from "@mui/joy";
import { usePreviousQuestions } from "../../hooks/usePreviousQuestions";
import { usePreparationStore } from "../../store/usePreparationDataStore";
import {
  QuestionNew,
  QuestionOption,
  QuestionTranslation,
} from "../../types/question";
import { Skeleton } from "@/components/ui/skeleton";
import clsx from "clsx";
import Image from "next/image";

const extractImgSrc = (value?: string | null) => {
  if (!value) return null;
  const trimmed = value.trim();
  // Value may be a plain URL or an HTML <img> fragment.
  if (/^https?:\/\//i.test(trimmed)) return trimmed.split(/\s+/)[0];
  const match = trimmed.match(/src\s*=\s*["']?([^"'>\s]+)/i);
  return match ? match[1] : null;
};

/** Map course language ("english"/"hindi") to a translation locale. */
const langToLocale = (language?: string | null) =>
  language?.toLowerCase() === "hindi" ? "hi" : "en";

/** Pick the translation matching the course language, falling back to the first. */
const pickTranslation = (
  translations?: QuestionTranslation[] | null,
  language?: string | null,
): QuestionTranslation | null => {
  if (!translations?.length) return null;
  const locale = langToLocale(language);
  return translations.find((t) => t.locale === locale) ?? translations[0];
};

/* -------------------------------------------------------------------------- */
/*                                  MAIN                                      */
/* -------------------------------------------------------------------------- */

export default function PreviousModal() {
  const isMobile = useIsMobile();

  const { isOpen, stack, closeModal, open } = usePreparationModalStore();
  const { selectedTopic, course } = usePreparationStore();

  const activeModal = useMemo(
    () => (stack.length ? stack[stack.length - 1] : null),
    [stack],
  );

  const Container = useMemo(() => (isMobile ? BottomSheet : Modal), [isMobile]);

  const { questions, loading } = usePreviousQuestions(
    isOpen ? selectedTopic?.id : undefined,
    course?.group_code!,
  );

  const handleClose = useCallback(() => {
    closeModal("previous-modal");
  }, [closeModal]);

  const handleStartLearning = useCallback(() => {
    open("mini-test");
  }, [open]);

  useBackHandler({
    isOpen,
    onClose: handleClose,
  });

  return (
    <AnimatePresence>
      {isOpen && activeModal === "previous-modal" && (
        <Container
          isHeader={false}
          titleClass="heading-medium !font-semibold"
          isOpen
          maxWidth="md:max-w-[720px]"
          onClose={handleClose}
        >
          <div className=" h-full flex flex-col max-h-[90vh] overflow-y-auto justify-between">
            {/* Header */}
            <Header
              courseName={course?.exam?.short_name!}
              questions={questions?.length!}
              onClose={handleClose}
            />

            <div className="w-full flex justify-center py-2">
              {loading && (
                <div className="md:max-w-[80%] w-full flex flex-col gap-5 bg-white">
                  <div className="flex flex-col gap-2">
                    {" "}
                    {Array.from({ length: 5 }, (_, i) => (
                      <ContentSekeleton key={i} />
                    ))}
                  </div>
                </div>
              )}
              {/* Content */}
              {!loading && (
                <div className="md:max-w-[80%] w-full flex flex-col gap-5 bg-white">
                  <div className="flex flex-col gap-2">
                    {questions?.map((q: QuestionNew, index: number) => (
                      <QuestionItem
                        key={q.id}
                        index={index}
                        total={questions.length}
                        data={q}
                        language={course?.language}
                        onStartLearning={handleStartLearning}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </Container>
      )}
    </AnimatePresence>
  );
}

/* -------------------------------------------------------------------------- */
/*                                  HEADER                                    */
/* -------------------------------------------------------------------------- */

const Header = React.memo(function Header({
  onClose,
  courseName,
  questions,
}: {
  onClose: () => void;
  courseName: string;
  questions: string | number;
}) {
  return (
    <div className="sticky top-0 z-10 flex justify-between gap-4 px-4 py-3 bg-white">
      <div>
        <Text
          as="h6"
          variant="heading-medium"
          weight="semibold"
          color="gray-normal"
        >
          Previous {courseName} Questions {questions}
        </Text>
        <Text as="p" variant="body-medium" weight="normal" color="gray-muted">
          These are actual {courseName} questions from previous exams
        </Text>
      </div>
      <button
        type="button"
        className="cursor-pointer"
        onClick={onClose}
        aria-label="Go back"
      >
        <CrossIcon />
      </button>
    </div>
  );
});

/* -------------------------------------------------------------------------- */
/*                               QUESTION ITEM                                */
/* -------------------------------------------------------------------------- */

const QuestionItem = React.memo(function QuestionItem({
  index,
  total,
  data,
  language,
  onStartLearning,
}: {
  index: number;
  total: number;
  data: QuestionNew;
  language?: string | null;
  onStartLearning: () => void;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [isExplanation, setIsExplanation] = useState(false);

  const translation = useMemo(
    () => pickTranslation(data?.translations, language),
    [data, language],
  );

  const source =
    data?.exam_context_b?.exam_instance_id ||
    data?.exam_context_a?.exam_instance_id ||
    "";
  const difficulty = translation?.ai_metadata?.difficulty_level ?? "";
  const questionText = translation?.content?.question ?? "";
  const questionImage = translation?.content?.question_image ?? null;
  const options = translation?.options ?? [];
  const explanation = translation?.answer?.explanation ?? "";

  // correct_option is 1-based ("1".."4"); map to A/B/C/D.
  const correctNum = Number(translation?.answer?.correct_option);
  const correctLabel =
    Number.isFinite(correctNum) && correctNum >= 1
      ? String.fromCharCode(64 + correctNum)
      : "-";

  const toggle = useCallback(() => {
    setIsOpen((prev) => !prev);
  }, []);

  const toggleExplanation = useCallback(() => {
    setIsExplanation((prev) => !prev);
  }, []);

  return (
    <div className={clsx("flex flex-col  w-full justify-between gap-2")}>
      {/* Question Header */}
      <div
        onClick={toggle}
        className={clsx(
          "flex justify-between items-center gap-2 px-3 py-2 bg-[#006bd1]/9 cursor-pointer",
          isOpen && "border-l-4 border-brand",
        )}
      >
        <div className="flex flex-col gap-0.5">
          <Text
            as="p"
            variant="heading-medium"
            weight="semibold"
            color="gray-normal"
          >
            Question {index + 1}/{total}
          </Text>

          <div className="flex items-center gap-1">
            <CalendarIcon />
            <Text
              as="p"
              variant="body-small"
              weight="normal"
              color="gray-muted"
            >
              Source:{" "}
              <Text variant="body-small" weight="normal" color="gray-normal">
                {source}
              </Text>
            </Text>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex gap-2 items-center">
            <StarBadge />
            <Text
              as="p"
              variant="body-medium"
              weight="semibold"
              color="gray-muted"
              className="!text-[#00A251]"
            >
              {difficulty}
            </Text>
          </div>

          <div className="bg-[#6c849d]/12 w-9 h-9 flex items-center justify-center rounded-full">
            <motion.div
              animate={{ rotate: isOpen ? 180 : 0 }}
              transition={{ duration: 0.25, ease: "easeInOut" }}
            >
              <ChevronIcon size={16} variant="down" color="#192839" />
            </motion.div>
          </div>
        </div>
      </div>

      {/* Toggle Content */}
      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="overflow-hidden"
          >
            <div className="px-3 flex flex-col gap-3">
              {/* Question */}
              <div className="px-3">
                <Math content={questionText}>
                  <Text
                    as="p"
                    variant="body-large"
                    weight="normal"
                    color="gray-normal"
                  >
                    <ReactMarkdown>{questionText}</ReactMarkdown>
                  </Text>
                </Math>
                {questionImage &&
                  (() => {
                    const imgSrc = extractImgSrc(questionImage);
                    if (!imgSrc) return null;
                    return (
                      <div className="w-full  flex justify-center">
                        <div className="relative h-[160px] w-[160px] aspect-video overflow-hidden  rounded-md">
                          <Image src={imgSrc} alt="" fill />
                        </div>
                      </div>
                    );
                  })()}
              </div>

              {/* Options */}
              <div className="grid md:grid-cols-2 gap-3">
                {options.map((opt: QuestionOption, i: number) => (
                  <OptionCard key={i} index={i} value={opt} />
                ))}
              </div>

              {/* Explanation */}
              <AnimatePresence mode="wait" initial={false}>
                {isExplanation && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3, ease: "easeInOut" }}
                    className="flex flex-col gap-4 py-3"
                  >
                    <div className="flex justify-between items-center ">
                      <Text
                        as="p"
                        variant="heading-medium"
                        weight="semibold"
                        color="gray-normal"
                      >
                        Answer & Explanation 
                      </Text>

                      <div className="flex gap-1 items-center">
                        <Text
                          as="p"
                          variant="body-small"
                          weight="normal"
                          color="gray-subtle"
                        >
                          Correct Answer
                        </Text>
                        <NumberCountIcon
                          value={correctLabel as any}
                          radius={6}
                          size={24}
                          background="#006bd115"
                          color="#0083ff"
                        />
                      </div>
                    </div>
                    <div className="flex flex-col justify-center items-start gap-4 bg-[#006bd108] p-3 rounded-lg">
                      <Text as="p" variant="heading-small" weight="semibold">
                        Explanation
                      </Text>
                      <Math content={explanation}>
                        <Text
                          as="p"
                          variant="body-large"
                          weight="normal"
                          color="gray-normal"
                        >
                          <ReactMarkdown>{explanation}</ReactMarkdown>
                        </Text>
                      </Math>
                    </div>
                  
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Button */}
              <div className="pb-2">
                <Button
                  onClick={toggleExplanation}
                  sx={{ borderRadius: "50px" }}
                  fullWidth
                  variant="outlined"
                  size="md"
                >
                  <div className="flex gap-2 items-center">
                    <p>
                      {" "}
                      {isExplanation ? "Hide" : "Show"} Correct Answer and
                      Explanation
                    </p>
                    <motion.div
                      animate={{ rotate: isExplanation ? 180 : 0 }}
                      transition={{ duration: 0.25, ease: "easeInOut" }}
                    >
                      <ChevronIcon size={16} variant="down" color="#0083ff" />
                    </motion.div>
                  </div>
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
});

/* -------------------------------------------------------------------------- */
/*                                OPTION CARD                                 */
/* -------------------------------------------------------------------------- */

const OptionCard = React.memo(function OptionCard({
  index,
  value,
}: {
  index: number;
  value: QuestionOption;
}) {
  // Convert 0,1,2,3 -> A,B,C,D
  const label = String.fromCharCode(65 + index);

  return (
    <Card padding={0} className="cursor-pointer transition">
      <div className="min-h-12 flex px-2 items-center gap-2">
        <div className="w-[38px]">
          {/* A, B, C, D instead of 1, 2, 3, 4 */}
          <NumberCountIcon value={label as any} size={36} radius={50} />
        </div>

        <div className="flex-1">
          <div className="flex flex-col py-2 gap-2">
            <Math content={value.text}>
              <Text
                as="p"
                variant="body-large"
                weight="normal"
                color="gray-normal"
              >
                <ReactMarkdown>{value.text}</ReactMarkdown>
              </Text>
            </Math>
            {value?.image &&
              (() => {
                const imgSrc = extractImgSrc(value.image);
                if (!imgSrc) return null;

                return (
                  <div className="w-full flex justify-center">
                    <div className="relative  h-[160px] w-[160px] aspect-video overflow-hidden rounded-md">
                      <Image src={imgSrc} alt="" fill />
                    </div>
                  </div>
                );
              })()}
          </div>
        </div>
      </div>
    </Card>
  );
});

const ContentSekeleton = React.memo(function ContentSekeleton() {
  return (
    <div className="flex flex-col w-full justify-between gap-2">
      {/* Question Header */}
      <div className="flex justify-between items-center gap-2 px-3 py-2 bg-[#006bd1]/9 cursor-pointer">
        <div className="flex flex-col gap-0.5">
          <Skeleton className="w-20 h-5" />

          <div className="flex items-center gap-1">
            <Skeleton className="w-5 h-5 rounded-full" />
            <Skeleton className="w-20 h-5" />
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex gap-2 items-center">
            <StarBadge />
            <Skeleton className="w-20 h-5" />
          </div>

          <div className="bg-[#6c849d]/12 w-9 h-9 flex items-center justify-center rounded-full">
            <Skeleton className="w-6 h-6" />
          </div>
        </div>
      </div>
    </div>
  );
});

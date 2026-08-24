import MathRender from "../mathjax/Math";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useExamModalStore } from "../exam/store/useExamModalStore";
import { useIsMobile } from "@/hooks/useIsMobile";
import { Modal } from "@/components/features/Sheets/Modal";
import { AnimatePresence } from "framer-motion";
import { Button } from "@clearcut/ui/button";
import {
  ArrowIcon,
  ChevronIcon,
  CrossIcon,
  FireIcon,
  LanguageIcon,
  NumberCountIcon,
  StarBadge,
} from "@/components/ui/icons";
import ReactMarkdown from "react-markdown";
import WarningCirleIcon from "@/components/ui/icons/warning-circle-icon";

import { motion } from "framer-motion";
import Text from "@clearcut/ui/text";
import TabSwitchInExamReport from "./TabSwitchInExamReport";
import SectionSwitchInExamReport from "./SectionSwitchInExamReport";
import { Card } from "@clearcut/ui/card";
import Image from "next/image";
import clsx from "clsx";
import { useGetExamReport } from "./hook/useGetExamReport";
import { useExamReportStore } from "./store/useExamReportStore";
import { AttemptQuestion } from "../exam/types/exam";
import QuestionText from "@/components/ui/cards/QuestionMaterial/Question/QuestionText";
import StatusChip from "@/components/ui/cards/preparation/chapter-list/StatusChip";
import { DrawerSheet } from "../Sheets/DrawerSheet";
import { useBackHandler } from "@/hooks/Global/useBackHandler";
import AnswerDistributionChart from "./AnswerDistributionChart";
import { useTranslations } from "next-intl";
import { DotLottieReact } from "@lottiefiles/dotlottie-react";
import { useGetCurrentCourseStore } from "@/store/course/useGetCurrentCourseStore";
import OptionCard from "./OptionCard";

type QuestionFilter = "all" | "correct" | "incorrect" | "skipped";

/**
 * Why a given filter has nothing to show. Tapping an empty filter keeps the
 * current list in place and surfaces one of these instead of blanking the page.
 */
const EMPTY_FILTER_MESSAGES: Record<QuestionFilter, string> = {
  all: "There are no questions in this section.",
  correct: "You didn't answer any question correctly in this test.",
  incorrect: "No incorrect answers — nothing to review here.",
  skipped: "You attempted every question, so nothing was skipped.",
};

export default function ExamReportSheet() {
  const { isOpen, examId, closeModal, stack } = useExamModalStore();
  const [activeTab, setActiveTab] = useState("summary");
  const [language, setLanguage] = useState("hi");
  const [questionFilter, setQuestionFilter] = useState<QuestionFilter>("all");
  // Set when a filter with zero questions is tapped; clears itself after a moment.
  const [emptyFilterNotice, setEmptyFilterNotice] = useState<string | null>(null);

  useEffect(() => {
    if (!emptyFilterNotice) return;
    const timer = setTimeout(() => setEmptyFilterNotice(null), 4000);
    return () => clearTimeout(timer);
  }, [emptyFilterNotice]);

  const isMobile = useIsMobile();
  const t = useTranslations("modals.performanceReport");

  const tabNames = useMemo(() => {
    return [
      {
        id: "summary",
        label: (
          <div className="flex flex-col">
            <span className="heading-small ">{t("tabs.summary")}</span>
            <span className="body-xsmall !font-normal">
              {t("tabs.summarySubtitle")}
            </span>
          </div>
        ),
      },
      {
        id: "analysis",
        label: (
          <div className="flex flex-col">
            <span className="heading-small ">{t("tabs.analysis")}</span>
            <span className="body-xsmall !font-normal">
              {t("tabs.analysisSubtitle")}
            </span>
          </div>
        ),
      },
    ];
  }, [t]);

  const { isLoading, isError } = useGetExamReport({
    examId: examId!,
  });

  if (isError) {
    return <div>Something went wrong</div>;
  }

  const { exam, getExamContext } = useExamReportStore();

  const result = useMemo(() => exam?.result || {}, [exam]);

  const { currentSection, sections } = getExamContext();

  const questions = useMemo(
    () => currentSection?.questions ?? [],
    [currentSection],
  );


  const filterCounts = useMemo(() => ({
    all: questions.length,
    correct: questions.filter((q: any) => Number(q?.is_correct) === 1).length,
    incorrect: questions.filter((q: any) => q?.user_option !== null && q?.user_option !== undefined && Number(q?.is_correct) === 0).length,
    skipped: questions.filter((q: any) => q?.user_option === null || q?.user_option === undefined).length,
  }), [questions]);

  const filteredQuestions = useMemo(() => {
    if (questionFilter === "correct") return questions.filter((q: any) => Number(q?.is_correct) === 1);
    if (questionFilter === "incorrect") return questions.filter((q: any) => q?.user_option !== null && q?.user_option !== undefined && Number(q?.is_correct) === 0);
    if (questionFilter === "skipped") return questions.filter((q: any) => q?.user_option === null || q?.user_option === undefined);
    return questions;
  }, [questions, questionFilter]);

  const hasMultipleTranslations = useMemo(
    () => questions.some((q: any) => (q?.question?.translations?.length ?? 0) > 1),
    [questions],
  );

  const active = stack[stack.length - 1];

  const Container = useMemo(() => (isMobile ? DrawerSheet : Modal), [isMobile]);

  const handleClose = useCallback(() => {
    closeModal("exam-report");
  }, [closeModal]);

  useBackHandler({
    isOpen: isOpen && active === "exam-report",
    onClose: () => closeModal("exam-report"),
  });

  const cardsData = useMemo(() => {
    return [
      {
        id: "score",
        title: t("stats.score"),
        value: `${result?.correct || 0}/${result?.total_questions || 0}`,
        image: "/images/grading-a+.png",
      },
      {
        id: "timing",
        title: t("stats.timing"),
        value: t("stats.minutes", { time: result?.time }),
        image: "/images/timer-clock.png",
      },
      {
        id: "incorrect",
        title: t("stats.incorrect"),
        value: result?.wrong || 0,
        image: "/images/cross-image.png",
      },
      {
        id: "correct",
        title: t("stats.correct"),
        value: result?.correct || 0,
        image: "/images/tick-image-green.png",
      },
    ];
  }, [result]);




  return (
    <AnimatePresence>
      {isOpen && active === "exam-report" && (
        <Container
          isHeader={false}
          isOpen={isOpen}
          maxWidth="md:max-w-[720px]"
          maxHeight="md:max-h-[97vh]"
          onClose={() => handleClose()}
        >

          {isLoading ? (
            <div className="flex justify-center items-center">
              <DotLottieReact
                style={{
                  width: 300,
                  height: 300,
                }}
                src="/lotifiles/search-processing.lottie"
                loop
                autoplay
              />
            </div>
          ) : (
            <div className="bg-white  flex flex-col justify-between">
              {/* Header */}
              <div className="sticky w-full top-0 z-10 flex px-3 py-4 bg-white justify-between">
                <div className="w-full">
                  <div className="w-full flex items-center justify-between">
                    <div className="flex gap-5" >
                      <Text variant="heading-medium" weight="semibold">
                        {t("title")}
                      </Text>
                      {hasMultipleTranslations && (
                        <button
                          onClick={() => setLanguage((prev) => (prev === "en" ? "hi" : "en"))}
                          className="flex items-center gap-1 px-2 py-1 rounded-full border border-[var(--color-brand-dark)] text-[var(--color-brand-dark)] hover:bg-[var(--color-brand-dark)]/10 transition-colors cursor-pointer"
                        >
                          <LanguageIcon size={20} />
                          <span className="body-small font-semibold uppercase">{language}</span>
                        </button>
                      )}
                    </div>

                    <button className="cursor-pointer" onClick={handleClose}>
                      <CrossIcon />
                    </button>
                  </div>

                </div>
              </div>

              {/* main content  */}
              <div className="py-3 min-h-[20vh] max-h-[90vh] md:max-h-[68vh] overflow-scroll flex flex-col gap-2">
                <div className="flex flex-col">
                  <div className="px-3 ">
                    <TabSwitchInExamReport
                      list={tabNames!}
                      activeTab={activeTab}
                      onChange={setActiveTab}
                    />
                  </div>

                  {activeTab === "analysis" && sections.length > 1 ? (
                    <SectionSwitchInExamReport />
                  ) : (
                    <div className="w-full h-1 bg-[var(--color-brand-dark)]" />
                  )}
                </div>
                <div className="w-full"></div>
                <div>
                  {activeTab === "summary" && (
                    <div className="py-2 flex flex-col gap-2">
                      <div className="flex justify-center">
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                          {cardsData.map((tab, index) => (
                            <Card
                              key={tab.id}
                              width={"144px"}
                              height={"60px"}
                              padding={0}
                            >
                              <div className="flex items-center gap-2 px-4 w-full h-full">
                                <div className="relative w-10 h-10">
                                  <Image
                                    src={tab.image}
                                    alt={tab.title}
                                    fill
                                    className="object-contain"
                                  />
                                </div>
                                <div className="">
                                  <Text
                                    as="p"
                                    variant="body-medium"
                                    color="gray-muted"
                                  >
                                    {tab.title}
                                  </Text>
                                  <Text
                                    as="p"
                                    variant="body-large"
                                    weight="semibold"
                                    color="gray-normal"
                                  >
                                    {tab.value}
                                  </Text>
                                </div>
                              </div>
                            </Card>
                          ))}{" "}
                        </div>
                      </div>

                      <div>
                        {" "}
                        <AnswerDistributionChart data={exam} />
                      </div>
                    </div>
                  )}

                  {activeTab === "analysis" && (
                    <div className="w-full flex flex-col gap-3 bg-white">
                      {/* Filter chips */}
                      <div className="px-3 pb-1 flex flex-col gap-3">
                        <Text as="p" variant="body-large" weight="medium" color="gray-subtle">Filter Questions</Text>
                        <div className="flex flex-wrap gap-2">
                          {(["all", "correct", "incorrect", "skipped"] as const).map((f) => {
                            const count = filterCounts[f];
                            const isEmpty = count === 0;
                            const isActive = questionFilter === f;

                            return (
                              <button
                                key={f}
                                type="button"
                                aria-disabled={isEmpty}
                                // Native tooltip on hover; the inline notice below covers touch.
                                title={isEmpty ? EMPTY_FILTER_MESSAGES[f] : undefined}
                                onClick={() => {
                                  if (isEmpty) {
                                    setEmptyFilterNotice(EMPTY_FILTER_MESSAGES[f]);
                                    return;
                                  }
                                  setEmptyFilterNotice(null);
                                  setQuestionFilter(f);
                                }}
                                className={clsx(
                                  "px-3 py-1 cursor-pointer rounded-full body-small !font-bold capitalize transition-colors",
                                  isEmpty
                                    ? "text-gray-400 border-2 border-gray-200 bg-gray-50"
                                    : isActive
                                      ? "border-2 border-blue-400 text-[var(--color-brand-dark)] bg-blue-100"
                                      : "text-gray-500 border-2 border-gray-300"
                                )}
                              >
                                {f === "all" ? "All" : f.charAt(0).toUpperCase() + f.slice(1)} ({count})
                              </button>
                            );
                          })}
                        </div>

                        <AnimatePresence>
                          {emptyFilterNotice && (
                            <motion.div
                              initial={{ opacity: 0, y: -4 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, y: -4 }}
                              transition={{ duration: 0.2 }}
                              className="flex items-center gap-1.5 rounded-md bg-[#006bd1]/8 px-2.5 py-1.5"
                            >
                              <WarningCirleIcon size={16} />
                              <Text
                                as="p"
                                variant="body-small"
                                weight="normal"
                                color="gray-muted"
                              >
                                {emptyFilterNotice}
                              </Text>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>

                      {/* Question list */}
                      <div className="flex flex-col gap-2">
                        {filteredQuestions?.map((q: any, index: number) => (
                          <QuestionItem
                            key={q.id}
                            language={language}
                            index={index}
                            total={filteredQuestions.length || 0}
                            data={q}
                            onStartLearning={() => { }}
                          />
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Footer  */}
              <Footer
                retakeTest={() => {
                  closeModal("end-exam");
                }}
                close={() => handleClose()}
              />
            </div>
          )}
        </Container>
      )
      }
    </AnimatePresence >
  );
}

const Footer = ({
  retakeTest,
  close,
}: {
  retakeTest: () => void;
  close: () => void;
}) => {
  const t = useTranslations("modals.performanceReport");

  return (
    <div className="sticky bottom-0 px-3 py-3 bg-white">
      <div className="flex flex-col gap-2 max-w-[336px] mx-auto">
        <div className="flex flex-col gap-1 items-center">
          <div className="max-w-[336px] w-full">
            <Button
              onClick={() => close()}
              fullWidth
              size="lg"
              sx={{ borderRadius: "50px" }}
            >
              <div className="flex items-center gap-2">
                <span className="">{t("buttons.continueSeries")}</span>
                <ChevronIcon size={20} type="double" variant="right" />{" "}
              </div>
            </Button>
          </div>

          <div className="flex items-center gap-1">
            <FireIcon
              color="var(--icon-gray-muted)"
              variant="outline"
              size={20}
            />

            <Text
              as="p"
              variant="body-small"
              weight="normal"
              color="gray-muted"
            >
              {t("info.coverage", { exam: "CTET" })}
            </Text>
          </div>
        </div>

        {/* "Go back" — temporarily hidden. It did the same thing as
            "Continue Test Series" above. Uncomment to restore.

        <div>
          <Button
            variant="soft"
            color="gray"
            fullWidth
            onClick={() => close()}
            sx={{ borderRadius: "50px" }}
          >
            <div className="flex items-center gap-1">
              <ArrowIcon size={20} variant="left" />{" "}
              <span className="">{t("buttons.goBack")}</span>
            </div>
          </Button>
        </div>
        */}
      </div>
    </div>
  );
};

/* -------------------------------------------------------------------------- */
/*                               QUESTION ITEM                                */
/* -------------------------------------------------------------------------- */

const QuestionItem = React.memo(function QuestionItem({
  index,
  total,
  data,
  onStartLearning,
  language,
}: {
  index: number;
  total: number;
  data: AttemptQuestion;
  onStartLearning: () => void;
  language: string;
}) {
  const t2 = useTranslations("");
  const t = useTranslations("modals.performanceReport");

  const [isOpen, setIsOpen] = useState(() => index === 0);
  const [isExplanation, setIsExplanation] = useState(false);

  const toggle = useCallback(() => {
    setIsOpen((prev) => !prev);
  }, []);

  const toggleExplanation = useCallback(() => {
    setIsExplanation((prev) => !prev);
  }, []);
  const { getExamContext } = useExamReportStore();

  const { course } = useGetCurrentCourseStore();

  // const language = course?.language === "english" ? "en" : "hi";
  const lang = language ?? "en";

  const { currentSection } = getExamContext();


  const question = useMemo(() => data?.question, [data]);

  const translation = useMemo(
    () =>
      currentSection?.section?.type === "subject"
        ? question?.translations.find((t: any) => t.locale === lang)
        : question?.translations[0],
    [data, lang, currentSection],
  );
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
            {t2("common.questions")} {index + 1}/{total}
          </Text>

          <div className="flex gap-3 items-center">
            <div className="flex gap-1 items-center">
              <StarBadge size={20} />
              <Text
                as="p"
                variant="body-small"
                weight="semibold"
                color="gray-muted"
                className="!text-[#00A251]"
              >
                Easy
              </Text>
            </div>
            {data?.time_spent != null && data.time_spent > 0 && (
              <div className="flex gap-1 items-center">
                <Image src="/images/timer-clock.png" alt="time spent" width={16} height={16} />
                <Text as="p" variant="body-small" color="gray-muted">
                  {(() => {
                    const m = Math.floor(data.time_spent / 60);
                    const s = data.time_spent % 60;
                    if (m === 0) return `${s} sec`;
                    if (s === 0) return `${m} min`;
                    return `${m} min ${s} sec`;
                  })()}
                </Text>
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex gap-2 items-center flex-wrap justify-end">
            {data?.marked_for_review && (
              <StatusChip
                variant="outline"
                tone="success"
                className="!text-white !bg-orange-400 !border-orange-400 body-small !font-semibold"
                label="Reviewed"
              />
            )}
            {Number(data?.is_correct) === 1 ? (
              <StatusChip
                variant="outline"
                tone="success"
                className="!text-white !bg-[var(--icon-positive-subtle)] !border-[var(--icon-positive-subtle)] body-small !font-semibold"
                label={t("legend.correct")}
              />
            ) : data?.user_option !== null && data?.user_option !== undefined && Number(data?.is_correct) === 0 ? (
              <StatusChip
                variant="outline"
                tone="success"
                className="!text-white !bg-[var(--icon-negative-normal)] !border-[var(--icon-negative-normal)] body-small !font-semibold"
                label={t("legend.incorrect")}
              />
            ) : (
              <StatusChip
                variant="outline"
                tone="success"
                className="!text-white !bg-[var(--icon-gray-muted)] !border-[var(--icon-gray-muted)] body-small !font-semibold"
                label={t("legend.skipped")}
              />
            )}
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
                <QuestionText
                  question={translation?.text!}
                  image={translation?.image!}
                />
              </div>

              {/* Options */}
              <div className="grid md:grid-cols-2 gap-3">
                {translation?.options.map((opt: any, i: number) => (
                  <OptionCard
                    key={i}
                    index={i}
                    value={opt}
                    correctOption={translation?.correct_option != null ? Number(translation.correct_option) - 1 : -1}
                    userOption={data?.user_option !== null && data?.user_option !== undefined ? Number(data.user_option) - 1 : null}
                    isQuestionAnswered={data?.is_correct !== null && data?.is_correct !== undefined}
                  />
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
                          value={
                            translation?.correct_option != null
                              ? (String.fromCharCode(65 + Number(translation.correct_option) - 1) as any)
                              : "-"
                          }
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
                      <MathRender content={translation?.explanation}>
                        <Text
                          as="p"
                          variant="body-large"
                          weight="normal"
                          color="gray-normal"
                        >
                          <ReactMarkdown>
                            {translation?.explanation}
                          </ReactMarkdown>
                        </Text>
                      </MathRender>
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

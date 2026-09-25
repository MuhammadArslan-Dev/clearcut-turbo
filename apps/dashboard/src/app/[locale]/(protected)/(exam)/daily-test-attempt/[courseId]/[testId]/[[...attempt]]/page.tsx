"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import Image from "next/image";
import { toast } from "react-toastify";
import {
  ArrowLeft,
  BarChart3,
  BookOpen,
  Bookmark,
  CheckCircle2,
  Crown,
  FileText,
  Lightbulb,
  ListChecks,
  Maximize,
  Trophy,
  XCircle,
} from "lucide-react";
import dynamic from "next/dynamic";
import { useLocale, useTranslations } from "next-intl";
import { usePaywallsStore } from "@/components/features/PayWalls/usePaywallsStore";
import { useEnrollmentForCourse } from "@/components/features/daily-tests/hooks/useEnrollmentForCourse";
import { motion, AnimatePresence } from "framer-motion";
import ReactMarkdown from "react-markdown";
import MathRender from "@/components/features/mathjax/Math";
import OptionCard from "@/components/features/exam-report/OptionCard";
import QuestionText from "@/components/ui/cards/QuestionMaterial/Question/QuestionText";
import StatusChip from "@/components/ui/cards/preparation/chapter-list/StatusChip";
import { useDailyTestFlowNavigation } from "@/components/features/daily-tests/hooks/useDailyTestFlowNavigation";
import Text from "@clearcut/ui/text";
import { Button } from "@clearcut/ui/button";
import { Card } from "@clearcut/ui/card";
import CounterCard from "@/components/ui/cards/CounterCard";
import QOption from "@/components/ui/cards/QuestionMaterial/Qoption/QOption";
import QuestionMath from "@/components/features/mathjax/Math";
import TextMarkDown from "@/components/ui/widgets/TextMarkDown";
import AttemptTopbar from "@/components/features/attempt-ui/AttemptTopbar";
import AttemptSummaryStrip from "@/components/features/attempt-ui/AttemptSummaryStrip";
import LiveTimeLeft from "@/components/features/attempt-ui/LiveTimeLeft";
import AttemptProgress from "@/components/features/attempt-ui/AttemptProgress";
import TipCard from "@/components/features/attempt-ui/TipCard";
import QuestionMetaBar from "@/components/features/attempt-ui/QuestionMetaBar";
import InfoStrip from "@/components/features/attempt-ui/InfoStrip";
import InfoRow from "@/components/features/daily-tests/InfoRow";
import AttemptActionBar from "@/components/features/attempt-ui/AttemptActionBar";
import QuestionsDock from "@/components/features/attempt-ui/QuestionsDock";
import FullscreenButton from "@/components/features/attempt-ui/FullscreenButton";
import { BottomSheet } from "@/components/features/Sheets/BottomSheet";
import ModalHeader from "@/components/features/test-series/components/ModalHeader";
import BottomNavWrap from "@/components/features/navigation/bottom-bar/dashboard-bar/BottomNavWrap";
import DashboardShell from "@/components/layout/dasbboard/DashboardShell";
import ContactUsModal from "@/components/modals/contact-us/ContactUsModal";
import { useModalStore } from "@/store/modal/useModalStore";
import {
  ChevronIcon,
  LogoutDoorIcon,
  ClockIcon,
  LanguageIcon,
  ChartSuccessBarIcon,
  WarningCircleIcon,
  CrossIcon,
  NumberCountIcon,
} from "@/components/ui/icons";
import { Skeleton } from "@/components/ui/skeleton";
import {
  startDailyTest,
  submitDailyTest,
  DailyTestQuestion,
  DailyTestResult,
  DailyTestResultQuestion,
} from "@/lib/api/dailyTests";
import { isApiError } from "@/lib/api/api-error";
import { useInvalidateDailyTestExams } from "@/components/features/daily-tests/hooks/useDailyTestExams";
import { useInvalidateDailyTestHistory, useDailyTestHistory } from "@/components/features/daily-tests/hooks/useDailyTestHistory";
import { useInvalidateDailyTestAttempts } from "@/components/features/daily-tests/hooks/useDailyTestAttempts";
import { useDailyTestResult, useSetDailyTestResult } from "@/components/features/daily-tests/hooks/useDailyTestResult";
import { SECONDS_PER_QUESTION } from "@/components/features/daily-tests/constants";

// Its own full-screen chrome (topbar, timer/progress/tip strip, Test
// Information + Quick Tips sidebar, question navigator) — a purpose-built
// layout for the "Daily Test" mockup rather than the multi-section
// real-exam ExamShell/Topbar (components/layout/exam/*), which assumes
// sections and a different sidebar shape this single flat question list
// doesn't have. "Mark for review" and "Report Question" are local-only
// (never sent to the backend): Daily Test has no per-question review or
// report endpoint, and neither affects scoring, so keeping them client-side
// (report just toasts a confirmation) matches the visual behavior without
// inventing backend support nothing else needs yet.

// Intl locale per app locale, so dates render in the user's language.
const DATE_LOCALES: Record<string, string> = { en: "en-GB", hi: "hi-IN", mr: "mr-IN" };

type QuestionStatus = "notVisited" | "answered" | "notAnswered" | "review";

type ViewState =
  | { phase: "loading" }
  | { phase: "locked" }
  | { phase: "attempting"; attemptId: string; testDate: string; sectionName: string | null; questions: DailyTestQuestion[] }
  | { phase: "result"; result: DailyTestResult }
  | { phase: "error"; message: "loadFailed" | "submitFailed" };

export default function DailyTestAttemptPage() {
  const flow = useDailyTestFlowNavigation();
  const t = useTranslations("DailyTests");
  const locale = useLocale();
  const params = useParams<{ courseId: string; testId: string; attempt?: string[] }>();
  const { courseId, testId } = params;
  // Optional third segment: /new → start a new numbered attempt of this same
  // test; /<attemptId> → show that specific past attempt's result; absent →
  // resume/start (or the latest result of a completed test).
  const attemptSegment = params.attempt?.[0];
  const retake = attemptSegment === "new";
  const attemptParam = attemptSegment && !retake ? attemptSegment : null;
  const invalidateDailyTestAttempts = useInvalidateDailyTestAttempts();
  const invalidateDailyTestExams = useInvalidateDailyTestExams();
  const invalidateDailyTestHistory = useInvalidateDailyTestHistory();
  const openGlobalModal = useModalStore((s) => s.open);
  // Already fetched (and cached — see useDailyTestHistory) by the history
  // page the user just came from; reused here only for the exam's display
  // name/type, so this never triggers its own extra loading state on a
  // normal click-through.
  const { history, isLoading: historyLoading } = useDailyTestHistory(courseId);
  const setCachedResult = useSetDailyTestResult();

  // A test the history already says is completed is read through the cached
  // result query instead of POSTing /start again — so re-opening it is
  // instant after the first load, and never re-creates/touches the attempt.
  const attemptedItem = history?.tests.find(
    (t) => String(t.test_id) === String(testId) && t.attempted && t.attempt_id != null,
  );
  const completedAttemptId = retake ? null : (attemptParam ?? attemptedItem?.attempt_id ?? null);
  const { result: cachedResult, isError: resultError } = useDailyTestResult(courseId, testId, completedAttemptId);

  const [state, setState] = useState<ViewState>({ phase: "loading" });
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [visited, setVisited] = useState<Set<number>>(new Set());
  const [markedForReview, setMarkedForReview] = useState<Set<number>>(new Set());
  const [currentIndex, setCurrentIndex] = useState(0);
  const [draftOption, setDraftOption] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [navSheetOpen, setNavSheetOpen] = useState(false);
  const [dismissedSavedBanners, setDismissedSavedBanners] = useState<Set<number>>(new Set());
  // null = whatever locale the question came back in first; set once the
  // user taps the language button.
  const [language, setLanguage] = useState<string | null>(null);

  useEffect(() => {
    // Wait for history so a completed test isn't started (POST) needlessly;
    // it's read via the result query above instead. If the result query
    // fails, fall through to start(), which also returns a completed result.
    if (historyLoading) return;
    if (completedAttemptId != null && !resultError) return;
    startDailyTest(courseId, testId, { retake })
      .then((res) => {
        const data = res.data;
        if (data.status === "completed") {
          setState({ phase: "result", result: data });
        } else {
          setState({
            phase: "attempting",
            attemptId: data.attempt_id,
            testDate: data.test_date,
            sectionName: data.topic_meta?.section_name ?? null,
            questions: data.questions,
          });
          const first = data.questions[0];
          if (first) setVisited(new Set([first.question_id]));
        }
      })
      .catch((err) => {
        if (isApiError(err) && err.status === 403) {
          setState({ phase: "locked" });
        } else {
          setState({ phase: "error", message: "loadFailed" });
        }
      });
  }, [courseId, testId, historyLoading, completedAttemptId, resultError, retake]);

  const questions = state.phase === "attempting" ? state.questions : [];
  const currentQuestion = questions[currentIndex] ?? null;

  // Toggle between English and the test's other language — derived from the
  // translations the questions actually carry, so it never offers a locale
  // that doesn't exist (same failure the full-test button had with a
  // hardcoded "hi").
  const otherLocale = useMemo(() => {
    for (const q of questions) {
      const found = q.translations?.find((t) => t.locale !== "en");
      if (found) return found.locale;
    }
    return null;
  }, [questions]);
  const hasMultipleTranslations =
    otherLocale != null && questions.some((q) => q.translations?.some((t) => t.locale === "en"));
  const activeLocale = language ?? currentQuestion?.translations?.[0]?.locale ?? "en";
  const toggleLocale = activeLocale === "en" ? otherLocale : "en";

  // The current question in the selected language; a question missing that
  // locale falls back to its default (first) translation.
  const displayQuestion = useMemo(() => {
    if (!currentQuestion) return null;
    const t = currentQuestion.translations?.find((tr) => tr.locale === activeLocale);
    return t
      ? { question: t.question, question_image: t.question_image, options: t.options }
      : currentQuestion;
  }, [currentQuestion, activeLocale]);

  useEffect(() => {
    setDraftOption(currentQuestion ? (answers[currentQuestion.question_id] ?? null) : null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentQuestion?.question_id]);

  const handleSubmit = useCallback(
    async (finalAnswers?: Record<number, number>) => {
      if (state.phase !== "attempting") return;
      setSubmitting(true);
      try {
        const res = await submitDailyTest(courseId, testId, state.attemptId, finalAnswers ?? answers);
        setCachedResult(state.attemptId, res.data);
        invalidateDailyTestAttempts(courseId, testId);
        // The course list's "Attempted"/streak/avg-score, and this exam's
        // own history (score/best-score/avg-time), are now stale.
        invalidateDailyTestExams();
        invalidateDailyTestHistory(courseId);
        // Submit lands on this test's Attempt History (View Result there).
        // goUp pops back to it when the attempt was opened from there
        // ("Attempt again"), else swaps the attempt entry — never stacks a
        // second History entry.
        flow.goUp(`/daily-tests/${courseId}/${testId}`);
      } catch {
        setState({ phase: "error", message: "submitFailed" });
      } finally {
        setSubmitting(false);
      }
    },
    [state, answers, invalidateDailyTestExams, invalidateDailyTestHistory, invalidateDailyTestAttempts, setCachedResult, flow, courseId, testId],
  );

  const goToIndex = useCallback(
    (index: number) => {
      if (index < 0 || index >= questions.length) return;
      setCurrentIndex(index);
      const q = questions[index];
      if (q) setVisited((prev) => new Set(prev).add(q.question_id));
    },
    [questions],
  );

  const handleSaveAndNext = useCallback(() => {
    if (!currentQuestion || draftOption == null) return;
    const nextAnswers = { ...answers, [currentQuestion.question_id]: draftOption };
    setAnswers(nextAnswers);
    if (currentIndex === questions.length - 1) {
      handleSubmit(nextAnswers);
    } else {
      goToIndex(currentIndex + 1);
    }
  }, [currentQuestion, draftOption, currentIndex, questions.length, answers, goToIndex, handleSubmit]);

  const handleClear = useCallback(() => {
    setDraftOption(null);
    if (!currentQuestion) return;
    setAnswers((prev) => {
      const next = { ...prev };
      delete next[currentQuestion.question_id];
      return next;
    });
  }, [currentQuestion]);

  // A plain toggle — the mockup shows it as a "Mark for Review" pill beside
  // the question, not a bottom action-bar button, so it doesn't advance to
  // the next question the way the old "mark for review & next" button did.
  const handleToggleMarkForReview = useCallback(() => {
    if (!currentQuestion) return;
    if (draftOption != null) {
      setAnswers((prev) => ({ ...prev, [currentQuestion.question_id]: draftOption }));
    }
    setMarkedForReview((prev) => {
      const next = new Set(prev);
      if (next.has(currentQuestion.question_id)) next.delete(currentQuestion.question_id);
      else next.add(currentQuestion.question_id);
      return next;
    });
  }, [currentQuestion, draftOption]);

  const handleReportQuestion = useCallback(() => {
    toast.success(t("attempt.reported"));
  }, [t]);

  const handleEndTest = useCallback(() => {
    if (
      typeof window !== "undefined" &&
      !window.confirm(t("attempt.endConfirm"))
    ) {
      return;
    }
    handleSubmit();
  }, [handleSubmit, t]);

  const handleToggleFullscreen = useCallback(() => {
    if (typeof document === "undefined") return;
    if (document.fullscreenElement) {
      document.exitFullscreen();
    } else {
      document.documentElement.requestFullscreen().catch(() => {});
    }
  }, []);

  // "Press F to toggle fullscreen" (footer hint) — wired for real rather
  // than left as decorative copy.
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() === "f") handleToggleFullscreen();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [handleToggleFullscreen]);

  const getStatus = useCallback(
    (q: DailyTestQuestion): QuestionStatus => {
      if (markedForReview.has(q.question_id)) return "review";
      if (answers[q.question_id] != null) return "answered";
      if (visited.has(q.question_id)) return "notAnswered";
      return "notVisited";
    },
    [markedForReview, answers, visited],
  );

  const counts = useMemo(() => {
    const c = { notVisited: 0, answered: 0, notAnswered: 0, review: 0 };
    questions.forEach((q) => {
      c[getStatus(q)]++;
    });
    return c;
  }, [questions, getStatus]);

  const handleReviewLater = useCallback(() => {
    const firstMarkedIndex = questions.findIndex((q) => markedForReview.has(q.question_id));
    if (firstMarkedIndex !== -1) goToIndex(firstMarkedIndex);
  }, [questions, markedForReview, goToIndex]);

  const totalDuration = questions.length * SECONDS_PER_QUESTION;
  const totalMinutes = Math.round(totalDuration / 60);

  const testDateLabel = useMemo(() => {
    if (state.phase !== "attempting") return "";
    return new Intl.DateTimeFormat(DATE_LOCALES[locale] ?? "en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }).format(new Date(state.testDate));
  }, [state, locale]);

  if (state.phase === "loading") {
    // Cached result (from a previous visit or a just-finished submit) renders
    // straight away — no skeleton at all.
    if (cachedResult) {
      return <DailyTestResultView result={cachedResult} courseId={courseId} testId={testId} />;
    }
    // Already-attempted test: show the result page's own skeleton (inside the
    // sidebar shell) rather than the full-screen attempt one.
    return completedAttemptId != null ? <ResultPageSkeleton /> : <AttemptPageSkeleton />;
  }

  if (state.phase === "locked") {
    return (
      <div className="max-w-2xl mx-auto p-4 text-center flex flex-col items-center gap-4 py-12">
        <h2 className="heading-medium !font-semibold">{t("attempt.lockedTitle")}</h2>
        <p className="body-medium text-surface-gray-muted">
          {t("attempt.lockedDesc")}
        </p>
        <Button onClick={() => flow.goUp(`/daily-tests/${courseId}`)}>{t("attempt.backToHistory")}</Button>
      </div>
    );
  }

  if (state.phase === "error") {
    return (
      <div className="max-w-2xl mx-auto p-4 text-center py-12">
        <p className="body-medium text-red-500">{t(`attempt.${state.message}`)}</p>
      </div>
    );
  }

  if (state.phase === "result") {
    return <DailyTestResultView result={state.result} courseId={courseId} testId={testId} />;
  }

  // phase === "attempting"
  if (!currentQuestion) return null;

  const currentQNo = currentIndex + 1;
  const percentComplete = Math.round((currentQNo / questions.length) * 100);
  const isMarked = markedForReview.has(currentQuestion.question_id);
  const answeredCount = counts.answered;
  const showSavedBanner =
    answers[currentQuestion.question_id] != null && !dismissedSavedBanners.has(currentQuestion.question_id);

  const questionGrid = (variant: "sidebar" | "sheet") => (
    <div className={variant === "sidebar" ? "grid grid-cols-5 gap-2" : "grid grid-cols-5 gap-3"}>
      {questions.map((q, index) => {
        const status = getStatus(q);
        const isActive = index === currentIndex;

        let bg = "!bg-white";
        let border = "!border-gray-200";
        let text: string | null = null;

        if (isActive) {
          bg = "!bg-brand";
          border = "!border-brand";
          text = "!text-white";
        } else if (status === "review") {
          bg = "!bg-[var(--icon-notice-subtle)]";
          border = "!border-[var(--icon-notice-subtle)]";
          text = "!text-white";
        } else if (status === "answered") {
          bg = "!bg-[var(--icon-positive-subtle)]";
          border = "!border-[var(--icon-positive-subtle)]";
          text = "!text-white";
        } else if (status === "notAnswered") {
          bg = "!bg-[var(--icon-negative-normal)]";
          border = "!border-[var(--icon-negative-normal)]";
          text = "!text-white";
        }

        return (
          <div
            key={q.question_id}
            onClick={() => {
              goToIndex(index);
              if (variant === "sheet") setNavSheetOpen(false);
            }}
            className="cursor-pointer"
          >
            <CounterCard
              value={String(index + 1)}
              border={`border-2 ${border}`}
              fontFamily="body-large"
              bgColor={bg}
              rounded="rounded-md"
              textClass={`!font-semibold ${text ?? ""}`}
            />
          </div>
        );
      })}
    </div>
  );

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-[var(--background-gray-subtle)]">
      <AttemptTopbar
        title={t("attempt.headerTitle", { exam: history?.exam.short_name ?? t("list.defaultExam"), date: testDateLabel })}
        meta={t("attempt.headerMeta", { count: questions.length, minutes: totalMinutes, exam: history?.exam.short_name ?? "…" })}
        quote={t("attempt.quote")}
        actions={
          <>
            {hasMultipleTranslations && toggleLocale && (
              <button
                onClick={() => setLanguage(toggleLocale)}
                aria-label={t("attempt.changeLanguage")}
                className="cursor-pointer"
              >
                <LanguageIcon size={30} />
              </button>
            )}
            <Button sx={{ borderRadius: "10px" }} variant="soft" color="gray" size="sm" onClick={handleEndTest}>
              <div className="flex items-center gap-[6px]">
                <span>{t("attempt.endTest")}</span>
                <LogoutDoorIcon size={16} />
              </div>
            </Button>
            <FullscreenButton onClick={handleToggleFullscreen} label={t("attempt.toggleFullscreen")} />
          </>
        }
      />

      <div className="flex-1 overflow-y-auto">
        {/* Mobile: full width, flush against the screen edges (no side
            padding, square-cornered cards) — matching the full exam page.
            Desktop: unchanged, the inset centered column. */}
        <div className="mx-auto flex max-w-[1280px] flex-col gap-4 py-4 lg:px-4">
          {/* Time left / progress / focus-tip strip — shared with the full exam page */}
          <AttemptSummaryStrip
            className="max-lg:!rounded-none"
            time={
              <LiveTimeLeft
                duration={totalDuration}
                onComplete={() => handleSubmit()}
                labels={{
                  timeLeft: t("attempt.timeLeft"),
                  hours: t("attempt.hours"),
                  minutes: t("attempt.minutes"),
                  seconds: t("attempt.seconds"),
                }}
              />
            }
            progress={<AttemptProgress position={currentQNo} total={questions.length} percent={percentComplete} />}
            tip={
              <TipCard
                icon={
                  answeredCount > 0 ? <Lightbulb size={24} className="text-[var(--color-warning-strong)]" /> : undefined
                }
                title={answeredCount > 0 ? t("attempt.doingGreat") : t("attempt.stayFocused")}
                body={answeredCount > 0 ? t("attempt.keepGoing") : t("attempt.completeTest")}
              />
            }
          />

          {/* Test Information + question + navigator, 3-column on desktop */}
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start">
            {/* Left sidebar — desktop only */}
            <aside className="hidden w-[260px] shrink-0 flex-col gap-4 lg:flex">
              <Card bgcolor="white" border="border-none" padding="16px" borderRadius={12}>
                <div className="mb-3 flex items-center gap-2">
                  <FileText size={18} className="text-brand" />
                  <Text as="p" variant="body-medium" weight="semibold" color="gray-normal">
                    {t("attempt.testInformation")}
                  </Text>
                </div>
                <div className="flex flex-col gap-3">
                  <InfoRow compact icon={<FileText size={16} className="text-[var(--color-surface-gray-muted)]" />} label={t("attempt.exam")} value={history?.exam.short_name ?? "…"} />
                  <InfoRow compact icon={<ClockIcon size={16} color="var(--color-surface-gray-muted)" />} label={t("attempt.section")} value={state.sectionName ?? "—"} />
                  <InfoRow compact icon={<FileText size={16} className="text-[var(--color-surface-gray-muted)]" />} label={t("attempt.totalQuestions")} value={String(questions.length)} />
                  <InfoRow compact icon={<ChartSuccessBarIcon width={16} height={16} />} label={t("attempt.totalMarks")} value={String(questions.length)} />
                  <InfoRow compact icon={<ClockIcon size={16} color="var(--color-surface-gray-muted)" />} label={t("attempt.timeDuration")} value={t("attempt.minutesValue", { count: totalMinutes })} />
                </div>
              </Card>
            </aside>

            {/* Center column */}
            <div className="flex flex-1 flex-col gap-4">
              <Card bgcolor="white" border="border-none" padding="16px" borderRadius={12} className="max-lg:!rounded-none">
                <div className="mb-3">
                  <QuestionMetaBar
                    chip={`${history?.exam.short_name ?? t("list.defaultExam")} \u2022 ${t("list.defaultExam")}`}
                    isMarked={isMarked}
                    onToggleMark={handleToggleMarkForReview}
                    markLabel={t("attempt.markForReview")}
                    onReport={handleReportQuestion}
                    reportLabel={t("attempt.reportQuestion")}
                  />
                </div>

                <Text as="p" variant="heading-medium" weight="semibold" color="gray-normal" className="mb-2">
                  Question {currentQNo} /{" "}
                  <Text variant="body-medium" color="gray-subtle">
                    {questions.length}
                  </Text>
                </Text>

                <QuestionMath content={displayQuestion?.question ?? ""}>
                  <Text as="div" variant="body-large">
                    <TextMarkDown>{displayQuestion?.question ?? ""}</TextMarkDown>
                  </Text>
                </QuestionMath>
                {displayQuestion?.question_image && (
                  <div className="mt-3 flex justify-center">
                    <div className="relative h-[160px] w-[160px] overflow-hidden rounded-md">
                      <Image src={displayQuestion.question_image} alt="" fill />
                    </div>
                  </div>
                )}

                <div className="mt-4 grid grid-cols-1 gap-3 lg:grid-cols-2">
                  {(["1", "2", "3", "4"] as const).map((key) => {
                    const text = displayQuestion?.options[key];
                    if (!text) return null;
                    const optionIndex = Number(key) - 1;
                    const isSelected = draftOption === Number(key);
                    return (
                      <QOption
                        key={key}
                        value={{ text, index: optionIndex }}
                        mainContainer={{
                          borderwidth: 2,
                          bgcolor: isSelected ? "!bg-brand/9" : "",
                          bordercolor: isSelected ? "!border-brand" : "",
                        }}
                        counter={{
                          backgroundColor: isSelected ? "!bg-brand/9" : "",
                          borderColor: isSelected ? "!border-brand" : "",
                        }}
                        onClick={() =>
                          setDraftOption((prev) => (prev === Number(key) ? null : Number(key)))
                        }
                      />
                    );
                  })}
                </div>

                {showSavedBanner && (
                  <div className="mt-4 flex items-center justify-between gap-2 rounded-lg bg-[var(--color-success-bg-soft)] p-3">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 size={16} className="text-[var(--icon-positive-normal)]" />
                      <Text as="p" variant="body-small" weight="semibold" className="text-[var(--icon-positive-normal)]">
                        {t("attempt.answerSaved")}
                      </Text>
                    </div>
                    <button
                      onClick={() =>
                        setDismissedSavedBanners((prev) => new Set(prev).add(currentQuestion.question_id))
                      }
                      aria-label={t("attempt.dismiss")}
                      className="text-surface-gray-muted"
                    >
                      <CrossIcon size={14} />
                    </button>
                  </div>
                )}

                <div className="mt-4">
                  <InfoStrip>{t("attempt.selectBest")}</InfoStrip>
                </div>
              </Card>

              {/* Collapsed questions summary — mobile only, opens the same
                  navigator content in a bottom sheet instead of a sidebar.
                  Placed before the sticky action bar below so it scrolls
                  normally instead of ending up underneath the pinned bar. */}
              <button
                onClick={() => setNavSheetOpen(true)}
                className="flex items-center justify-between gap-2 rounded-xl border border-gray-200 bg-white px-4 py-3 lg:hidden"
              >
                <div className="flex items-center gap-2">
                  <Bookmark size={16} className="text-brand" />
                  <div className="text-left">
                    <Text as="p" variant="body-medium" weight="semibold" color="gray-normal">
                      {t("attempt.questions")}
                    </Text>
                    <Text as="p" variant="body-small" color="gray-muted">
                      {t("attempt.answeredOf", { answered: answeredCount, total: questions.length })}
                    </Text>
                  </div>
                </div>
                <ChevronIcon size={16} variant="up" />
              </button>

              {/* Bottom action bar (shared with the full exam page) — same
                  legacy/compactMobile button styling as that page too. Below
                  `lg` it's a flush bar, `sticky` (not `fixed`) to the bottom
                  of this scroll container — since the "Need help?" bar below
                  is a real sibling OUTSIDE this scroll container, sticky
                  naturally stops flush against it with zero gap, however
                  tall either bar ends up, without a hardcoded pixel offset
                  or extra scroll-clearance padding. */}
              <div className="sticky bottom-0 z-20 border-t border-gray-200 bg-white px-3 py-2 shadow-[0_-4px_10px_rgba(0,0,0,0.06)] lg:static lg:z-auto lg:rounded-xl lg:border-0 lg:p-3 lg:shadow-none">
                <AttemptActionBar
                  legacy
                  compactMobile
                  onPrevious={() => goToIndex(currentIndex - 1)}
                  previousDisabled={currentIndex === 0}
                  onPrimary={handleSaveAndNext}
                  primaryDisabled={draftOption == null || submitting}
                  primaryLabel={currentIndex === questions.length - 1 ? t("attempt.saveAndSubmit") : t("attempt.saveAndNext")}
                  onClear={handleClear}
                  clearDisabled={draftOption == null}
                  previousLabel={t("attempt.previous")}
                  clearLabel={t("attempt.clearResponse")}
                />
              </div>
            </div>

            {/* Right sidebar — desktop only */}
            <aside className="hidden w-[260px] shrink-0 flex-col gap-4 lg:flex">
              <Card bgcolor="white" border="border-none" padding="16px" borderRadius={12}>
                <Text as="p" variant="body-medium" weight="semibold" color="gray-normal" className="mb-3">
                  {t("attempt.questions")}
                </Text>

                <div className="mb-3 flex flex-col gap-2">
                  <CountRow label={t("attempt.notVisited")} count={counts.notVisited} color="bg-gray-300" textColor="text-surface-gray-muted" />
                  <CountRow label={t("attempt.answered")} count={counts.answered} color="bg-[var(--icon-positive-subtle)]" textColor="text-[var(--icon-positive-normal)]" />
                  <CountRow label={t("attempt.notAnswered")} count={counts.notAnswered} color="bg-[var(--icon-negative-normal)]" textColor="text-[var(--icon-negative-normal)]" />
                  <CountRow label={t("attempt.markedForReview")} count={counts.review} color="bg-[var(--icon-notice-subtle)]" textColor="text-[var(--icon-notice-normal)]" />
                </div>

                {questionGrid("sidebar")}

                <div className="mt-4">
                  <Button
                    variant="soft"
                    color="gray"
                    fullWidth
                    sx={{ borderRadius: "50px" }}
                    disabled={counts.review === 0}
                    onClick={handleReviewLater}
                  >
                    <div className="flex items-center gap-2">
                      <Bookmark size={16} />
                      <span>{t("attempt.reviewLater", { count: counts.review })}</span>
                    </div>
                  </Button>
                </div>
              </Card>
            </aside>
          </div>
        </div>
      </div>

      {/* Collapsible questions dock — a real flex child (not sticky/inside
          the scroll area), placed between the sticky action bar above and
          the "Need help?" bar below so the sticky bar naturally stops flush
          against its top with no gap, same as it does against "Need help?"
          when this is collapsed. */}
      <div className="shrink-0 border-t border-gray-200 bg-white lg:hidden">
        <QuestionsDock
          questions={questions.map((q, index) => ({ status: getStatus(q), isActive: index === currentIndex }))}
          onSelect={(index) => goToIndex(index)}
        />
      </div>

      {/* Footer — a normal flex child after the scrollable area (not inside
          it), so it stays pinned to the bottom of the viewport like the
          topbar is pinned to the top, instead of scrolling away with the
          question content. */}
      <div className="shrink-0 border-t border-gray-200 bg-white px-4 py-2">
        <div className="mx-auto flex max-w-[1280px] flex-col items-center justify-between gap-2 sm:flex-row">
          <button
            onClick={() => openGlobalModal("helpsport")}
            className="body-small flex items-center gap-1.5 text-surface-gray-muted"
          >
            <WarningCircleIcon variant="help" size={16} />
            <span>
              {t("attempt.needHelp")} <span className="!font-semibold text-brand">{t("attempt.contactSupport")}</span>
            </span>
          </button>
          <div className="hidden items-center gap-1.5 body-small text-surface-gray-muted sm:flex">
            <Maximize size={14} />
            <span>{t("attempt.pressF")}</span>
          </div>
        </div>
      </div>

      {/* Mobile question palette — same BottomSheet used elsewhere
          (see QuestionNavigatorSheet.tsx), not a new modal. */}
      <BottomSheet isOpen={navSheetOpen} onClose={() => setNavSheetOpen(false)} isHeader={false}>
        <ModalHeader title={t("attempt.questions")} onClose={() => setNavSheetOpen(false)} />
        <div className="flex flex-col gap-4 px-4 pb-4">
          <div className="grid grid-cols-2 gap-2">
            <LegendItem label={t("attempt.notVisited")} color="bg-gray-300" />
            <LegendItem label={t("attempt.answered")} color="bg-[var(--icon-positive-subtle)]" />
            <LegendItem label={t("attempt.notAnswered")} color="bg-[var(--icon-negative-normal)]" />
            <LegendItem label={t("attempt.markedForReview")} color="bg-[var(--icon-notice-subtle)]" />
          </div>

          {questionGrid("sheet")}

          <Button
            variant="soft"
            color="gray"
            fullWidth
            sx={{ borderRadius: "50px" }}
            onClick={() => setNavSheetOpen(false)}
          >
            {t("attempt.close")}
          </Button>
        </div>
      </BottomSheet>

      {/* Global "Need help?" modal — already used for payment-failed/profile
          support; renders nothing until openGlobalModal("helpsport") above
          is called. */}
      <ContactUsModal />
    </div>
  );
}

// Mirrors the real "attempting" layout's shape (topbar, stats strip, 3-column
// Test Information / question / Questions sidebars, bottom action bar) so the
// page doesn't visibly jump/reflow once real data arrives — a generic 3-box
// skeleton was left over from an earlier, simpler version of this page.
const AttemptPageSkeleton = () => (
  <div className="flex h-screen flex-col overflow-hidden bg-[var(--background-gray-subtle)]">
    <header className="border-b border-slate-200 bg-white">
      <div className="flex items-center justify-between gap-4 px-6 py-2 lg:px-10">
        <div className="flex items-center gap-4">
          <Skeleton className="hidden h-8 w-[130px] sm:block" />
          <div className="flex flex-col gap-1.5">
            <Skeleton className="h-4 w-48" />
            <Skeleton className="h-3 w-36" />
          </div>
        </div>
        <div className="hidden flex-1 justify-center lg:flex">
          <Skeleton className="h-4 w-72" />
        </div>
        <div className="flex items-center gap-2">
          <Skeleton className="h-9 w-24 rounded-full" />
          <Skeleton className="hidden h-9 w-9 rounded-md sm:block" />
        </div>
      </div>
    </header>

    <div className="flex-1 overflow-y-auto">
      <div className="mx-auto flex max-w-[1280px] flex-col gap-4 p-4">
        <Card bgcolor="white" border="border-none" padding="16px" borderRadius={12}>
          <div className="flex flex-col items-stretch gap-4 lg:flex-row lg:items-center">
            <div className="flex items-center gap-3">
              <Skeleton className="h-11 w-11 rounded-full" />
              <div className="flex flex-col gap-1.5">
                <Skeleton className="h-3 w-16" />
                <Skeleton className="h-7 w-40" />
              </div>
            </div>
            <div className="hidden h-10 w-px bg-gray-200 lg:block" />
            <div className="flex-1">
              <Skeleton className="mb-2 h-4 w-32" />
              <Skeleton className="h-2 w-full rounded-full" />
            </div>
            <div className="hidden h-10 w-px bg-gray-200 lg:block" />
            <Skeleton className="h-14 w-full rounded-lg lg:w-[340px]" />
          </div>
        </Card>

        <div className="flex flex-col gap-4 lg:flex-row lg:items-start">
          <aside className="hidden w-[260px] shrink-0 flex-col gap-4 lg:flex">
            <Card bgcolor="white" border="border-none" padding="16px" borderRadius={12}>
              <Skeleton className="mb-3 h-4 w-32" />
              <div className="flex flex-col gap-3">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <Skeleton className="h-4 w-4 rounded" />
                    <div className="flex-1">
                      <Skeleton className="mb-1 h-3 w-16" />
                      <Skeleton className="h-3 w-20" />
                    </div>
                  </div>
                ))}
              </div>
            </Card>
            <Card bgcolor="var(--color-primary-soft)" padding="16px" borderRadius={12}>
              <Skeleton className="mb-2 h-4 w-24" />
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="mb-1.5 h-3 w-full" />
              ))}
            </Card>
          </aside>

          <div className="flex flex-1 flex-col gap-4">
            <Card bgcolor="white" border="border-none" padding="16px" borderRadius={12}>
              <div className="mb-4 flex items-center justify-between">
                <Skeleton className="h-6 w-40 rounded-md" />
                <div className="flex gap-4">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-4 w-24" />
                </div>
              </div>
              <Skeleton className="mb-2 h-5 w-24" />
              <Skeleton className="mb-4 h-5 w-full" />
              <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
                {Array.from({ length: 4 }).map((_, i) => (
                  <Skeleton key={i} className="h-16 w-full rounded-lg" />
                ))}
              </div>
            </Card>

            <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-white p-3">
              <Skeleton className="h-11 w-28 rounded-full" />
              <Skeleton className="h-11 flex-1 rounded-full lg:max-w-[400px]" />
              <Skeleton className="h-11 w-36 rounded-full" />
            </div>
          </div>

          <aside className="hidden w-[260px] shrink-0 flex-col gap-4 lg:flex">
            <Card bgcolor="white" border="border-none" padding="16px" borderRadius={12}>
              <Skeleton className="mb-3 h-4 w-20" />
              <div className="mb-3 flex flex-col gap-2">
                {Array.from({ length: 4 }).map((_, i) => (
                  <Skeleton key={i} className="h-3 w-full" />
                ))}
              </div>
              <div className="grid grid-cols-5 gap-2">
                {Array.from({ length: 10 }).map((_, i) => (
                  <Skeleton key={i} className="h-9 w-9 rounded-md" />
                ))}
              </div>
              <Skeleton className="mt-4 h-9 w-full rounded-full" />
            </Card>
          </aside>
        </div>
      </div>
    </div>
  </div>
);

// Mirrors DailyTestResultView's shape (header, score card, review list) inside
// the same DashboardShell so the sidebar doesn't pop in after loading.
const ResultPageSkeleton = () => (
  <DashboardShell>
    <main className="flex-1 overflow-y-auto bg-[var(--background-gray-subtle)] pb-20 md:pb-0">
      <div className="mx-auto flex max-w-[1000px] flex-col gap-4 p-4">
        <div className="flex items-center gap-3">
          <Skeleton className="h-14 w-14 rounded-full" />
          <div className="flex flex-col gap-1.5">
            <Skeleton className="h-6 w-56" />
            <Skeleton className="h-4 w-32" />
          </div>
        </div>
        <Card bgcolor="white" border="border-gray-200" padding="20px" borderRadius={12}>
          <Skeleton className="mb-2 h-6 w-40" />
          <Skeleton className="mb-4 h-4 w-72" />
          <div className="flex flex-col items-center gap-4 sm:flex-row">
            <Skeleton className="h-[150px] w-[150px] shrink-0 rounded-full" />
            <div className="grid w-full flex-1 grid-cols-3 gap-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          </div>
        </Card>
        <Card bgcolor="white" border="border-gray-200" padding="20px" borderRadius={12}>
          <Skeleton className="mb-4 h-6 w-40" />
          <div className="flex flex-col gap-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-14 w-full rounded-xl" />
            ))}
          </div>
        </Card>
      </div>
    </main>
  </DashboardShell>
);

const CountRow = ({
  label,
  count,
  color,
  textColor,
}: {
  label: string;
  count: number;
  color: string;
  textColor: string;
}) => (
  <div className="flex items-center justify-between gap-2">
    <div className="flex items-center gap-2">
      <span className={`h-2.5 w-2.5 rounded-full ${color}`} aria-hidden />
      <Text as="p" variant="body-small" color="gray-muted">
        {label}
      </Text>
    </div>
    <Text as="p" variant="body-small" weight="semibold" className={textColor}>
      {count}
    </Text>
  </div>
);

const LegendItem = ({ label, color }: { label: string; color: string }) => (
  <div className="flex items-center gap-1.5">
    <span className={`h-2.5 w-2.5 rounded-full ${color}`} aria-hidden />
    <Text as="p" variant="body-small" color="gray-muted" className="whitespace-nowrap">
      {label}
    </Text>
  </div>
);

type ReviewFilter = "all" | "correct" | "incorrect" | "skipped";
type ReviewStatus = "correct" | "incorrect" | "skipped";

function ScoreRing({ percent, score, total }: { percent: number; score: number; total: number }) {
  const t = useTranslations("DailyTests");
  const r = 52;
  const circumference = 2 * Math.PI * r;
  return (
    <div className="relative h-[150px] w-[150px] shrink-0">
      <svg viewBox="0 0 120 120" className="h-full w-full -rotate-90" aria-hidden="true">
        <circle cx="60" cy="60" r={r} fill="none" strokeWidth="9" className="stroke-gray-200" />
        <circle
          cx="60"
          cy="60"
          r={r}
          fill="none"
          strokeWidth="9"
          strokeLinecap="round"
          stroke="var(--color-brand)"
          strokeDasharray={circumference}
          strokeDashoffset={circumference * (1 - percent / 100)}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="heading-medium !font-bold">
          {score} / {total}
        </span>
        <span className="body-medium !font-semibold">{percent}%</span>
        <span className="body-small text-surface-gray-muted">{t("result.yourScore")}</span>
      </div>
    </div>
  );
}

const StatBlock = ({ icon, value, label }: { icon: React.ReactNode; value: number; label: string }) => (
  <div className="flex flex-1 items-center justify-center gap-3 px-2 py-2">
    {icon}
    <div>
      <Text as="p" variant="heading-medium" weight="semibold" color="gray-normal" className="leading-tight">
        {value}
      </Text>
      <Text as="p" variant="body-small" color="gray-muted">
        {label}
      </Text>
    </div>
  </div>
);

// Same look and behaviour as the full-length test's Performance Report
// (exam-report/ExamReportSheet.tsx → QuestionItem): tinted header with the
// status chip and a round chevron, question + OptionCard grid, and an
// outlined "Show Correct Answer and Explanation" toggle. Easy/time-spent are
// omitted — daily tests don't record either.
function ReviewRow({
  index,
  total,
  q,
  status,
}: {
  index: number;
  total: number;
  q: DailyTestResultQuestion;
  status: ReviewStatus;
}) {
  const t = useTranslations("modals.performanceReport");
  const tCommon = useTranslations("");
  const [isOpen, setIsOpen] = useState(() => index === 0);
  const [isExplanation, setIsExplanation] = useState(false);

  const options = (["1", "2", "3", "4"] as const)
    .map((key) => ({ text: q.options[key] }))
    .filter((o) => o.text);
  const isAnswered = q.selected_option != null;
  const chipTone = {
    correct: "!bg-[var(--icon-positive-subtle)] !border-[var(--icon-positive-subtle)]",
    incorrect: "!bg-[var(--icon-negative-normal)] !border-[var(--icon-negative-normal)]",
    skipped: "!bg-[var(--icon-gray-muted)] !border-[var(--icon-gray-muted)]",
  }[status];

  return (
    <div className="flex w-full flex-col justify-between gap-2">
      <div
        onClick={() => setIsOpen((v) => !v)}
        className={`flex cursor-pointer items-center justify-between gap-2 bg-brand/9 px-3 py-2 ${
          isOpen ? "border-l-4 border-brand" : ""
        }`}
      >
        <Text as="p" variant="heading-medium" weight="semibold" color="gray-normal">
          {tCommon("common.questions")} {index + 1}/{total}
        </Text>

        <div className="flex items-center gap-4">
          <StatusChip
            variant="outline"
            tone="success"
            className={`body-small !font-semibold !text-white ${chipTone}`}
            label={t(`legend.${status}`)}
          />
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gray-200/60">
            <motion.div animate={{ rotate: isOpen ? 180 : 0 }} transition={{ duration: 0.25, ease: "easeInOut" }}>
              <ChevronIcon size={16} variant="down" />
            </motion.div>
          </div>
        </div>
      </div>

      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="overflow-hidden"
          >
            <div className="flex flex-col gap-3 px-3">
              <div className="px-3">
                <QuestionText question={q.question ?? ""} image={q.question_image ?? undefined} />
              </div>

              <div className="grid gap-3 md:grid-cols-2">
                {options.map((opt, i) => (
                  <OptionCard
                    key={i}
                    index={i}
                    value={opt}
                    correctOption={q.correct_option - 1}
                    userOption={q.selected_option != null ? q.selected_option - 1 : null}
                    isQuestionAnswered={isAnswered}
                  />
                ))}
              </div>

              <AnimatePresence mode="wait" initial={false}>
                {isExplanation && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3, ease: "easeInOut" }}
                    className="flex flex-col gap-4 py-3"
                  >
                    <div className="flex items-center justify-between">
                      <Text as="p" variant="heading-medium" weight="semibold" color="gray-normal">
                        {t("explanation.heading")}
                      </Text>
                      <div className="flex items-center gap-1">
                        <Text as="p" variant="body-small" weight="normal" color="gray-subtle">
                          {t("explanation.correctAnswer")}
                        </Text>
                        <NumberCountIcon
                          value={String.fromCharCode(65 + q.correct_option - 1) as React.ComponentProps<typeof NumberCountIcon>["value"]}
                          radius={6}
                          size={24}
                          background="var(--color-primary-bg-soft)"
                          color="var(--color-brand)"
                        />
                      </div>
                    </div>
                    <div className="flex flex-col items-start justify-center gap-4 rounded-lg bg-[var(--color-primary-bg-soft)] p-3">
                      <Text as="p" variant="heading-small" weight="semibold">
                        {t("explanation.title")}
                      </Text>
                      <MathRender content={q.explanation ?? ""}>
                        <Text as="div" variant="body-large" weight="normal" color="gray-normal">
                          <ReactMarkdown>{q.explanation ?? ""}</ReactMarkdown>
                        </Text>
                      </MathRender>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="pb-2">
                <Button
                  onClick={() => setIsExplanation((v) => !v)}
                  sx={{ borderRadius: "50px" }}
                  fullWidth
                  variant="outlined"
                  size="md"
                >
                  <div className="flex items-center gap-2">
                    <p>{isExplanation ? t("explanation.hide") : t("explanation.show")}</p>
                    <motion.div
                      animate={{ rotate: isExplanation ? 180 : 0 }}
                      transition={{ duration: 0.25, ease: "easeInOut" }}
                    >
                      <ChevronIcon size={16} variant="down" color="var(--color-brand)" />
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
}

// Same lazy-loaded interstitial the preparation/test-series shells mount.
const LockedContentModal = dynamic(() => import("@/components/features/PayWalls/LockedContentModal"), { ssr: false });

function DailyTestResultView({
  result,
  courseId,
  testId,
}: {
  result: DailyTestResult;
  courseId: string;
  testId: string;
}) {
  const flow = useDailyTestFlowNavigation();
  const { history } = useDailyTestHistory(courseId);
  const [filter, setFilter] = useState<ReviewFilter>("all");

  const t = useTranslations("DailyTests");
  const locale = useLocale();
  const course = useEnrollmentForCourse(courseId);
  const openPaywall = usePaywallsStore((s) => s.open);
  const openUnlockModal = () => {
    if (!course?.exam) return;
    openPaywall("daily-test-locked-modal", course.exam, "daily_test_result_clicked", course);
  };

  const total = result.total_questions;
  const correct = result.score;
  const percent = total > 0 ? Math.round((correct / total) * 100) : 0;

  const reviewed = useMemo(
    () =>
      (result.questions ?? []).map((q) => ({
        q,
        status: (q.selected_option == null ? "skipped" : q.is_correct ? "correct" : "incorrect") as ReviewStatus,
      })),
    [result.questions],
  );
  const skipped = reviewed.filter((r) => r.status === "skipped").length;
  // Free users get score only, so skipped questions can't be told apart
  // from wrong ones — everything not correct counts as incorrect there.
  const incorrect = result.is_paid ? total - correct - skipped : total - correct;

  const testDate = history?.tests.find((t) => String(t.test_id) === String(testId))?.test_date;
  const dateLabel = testDate
    ? new Intl.DateTimeFormat(DATE_LOCALES[locale] ?? "en-GB", { day: "2-digit", month: "long", year: "numeric" }).format(
        new Date(testDate),
      )
    : "";
  const examName = history?.exam.short_name ?? t("list.defaultExam");

  const filters: { key: ReviewFilter; label: string; count: number; icon?: React.ReactNode }[] = [
    { key: "all", label: t("result.all"), count: total },
    {
      key: "correct",
      label: t("result.correct"),
      count: correct,
      icon: <CheckCircle2 size={14} className="text-[var(--icon-positive-normal)]" />,
    },
    {
      key: "incorrect",
      label: t("result.incorrect"),
      count: incorrect,
      icon: <XCircle size={14} className="text-[var(--icon-negative-normal)]" />,
    },
    { key: "skipped", label: t("result.skipped"), count: skipped },
  ];

  const bannerTitle =
    percent >= 70 ? t("result.greatJob") : percent >= 40 ? t("result.goodEffort") : t("result.keepPracticing");

  return (
    <DashboardShell>
    <main className="flex-1 overflow-y-auto bg-[var(--background-gray-subtle)] pb-20 md:pb-0">
      <div className="mx-auto flex max-w-[1000px] flex-col gap-4 p-4">
        <div className="flex items-center gap-3">
          {history?.exam.logo_url && (
            <Image
              src={history.exam.logo_url}
              alt=""
              width={56}
              height={56}
              unoptimized
              className="h-14 w-14 rounded-full object-cover"
            />
          )}
          <div>
            <h1 className="heading-medium !font-semibold">{examName} • {t("list.defaultExam")}</h1>
            {(dateLabel || result.attempt_number) && (
              <p className="body-medium text-surface-gray-muted">
                {[dateLabel, result.attempt_number ? t("result.attemptNumber", { number: result.attempt_number }) : ""]
                  .filter(Boolean)
                  .join(" • ")}
              </p>
            )}
          </div>
        </div>

        <Card bgcolor="white" border="border-gray-200" padding="20px" borderRadius={12}>
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <h2 className="heading-small !font-semibold">{t("result.title")}</h2>
              <p className="body-medium text-surface-gray-muted">
                {result.is_paid ? t("result.paidDesc") : t("result.freeDesc")}
              </p>
            </div>
            {result.is_paid ? (
              <div className="flex items-center gap-3 rounded-lg bg-[var(--color-success-bg-soft)] px-4 py-3">
                <Trophy size={22} className="text-[var(--icon-positive-normal)]" />
                <div>
                  <Text as="p" variant="body-medium" weight="semibold" className="text-[var(--icon-positive-normal)]">
                    {bannerTitle}
                  </Text>
                  <Text as="p" variant="body-small" className="text-[var(--icon-positive-normal)]">
                    {t("result.rightTrack")}
                  </Text>
                </div>
              </div>
            ) : (
              <div
                onClick={openUnlockModal}
                className="flex cursor-pointer items-center gap-3 rounded-lg bg-[var(--color-primary-bg-soft)] px-4 py-3"
              >
                <Crown size={22} className="text-[var(--color-warning-strong)]" />
                <div>
                  <Text as="p" variant="body-medium" weight="semibold" color="gray-normal">
                    {t("result.lockedTitle")}
                  </Text>
                  <Text as="p" variant="body-small" color="gray-muted">
                    {t("result.lockedDesc")}
                  </Text>
                </div>
              </div>
            )}
          </div>

          <div className="mt-4 flex flex-col items-center gap-4 sm:flex-row">
            <ScoreRing percent={percent} score={correct} total={total} />
            <div className="grid w-full flex-1 grid-cols-3 divide-x divide-gray-200">
              <StatBlock icon={<FileText size={24} className="text-surface-gray-muted" />} value={total} label={t("result.questions")} />
              <StatBlock
                icon={<CheckCircle2 size={26} className="text-[var(--icon-positive-normal)]" />}
                value={correct}
                label={t("result.correct")}
              />
              <StatBlock
                icon={<XCircle size={26} className="text-[var(--icon-negative-normal)]" />}
                value={incorrect}
                label={t("result.incorrect")}
              />
            </div>
          </div>
        </Card>

        {!result.is_paid && (
          <Card
            padding="24px"
            borderRadius={12}
            className="flex flex-col items-center gap-4 text-center !border-amber-200 !bg-amber-50"
          >
            <Crown size={22} className="text-[var(--color-warning-strong)]" />
            <div>
              <p className="heading-small !font-semibold">{t("result.wantToSee")}</p>
              <p className="body-medium text-surface-gray-muted">
                {t("result.wantToSeeDesc")}
              </p>
            </div>
            <div className="grid w-full max-w-[720px] grid-cols-1 gap-4 text-left sm:grid-cols-3">
              {[
                { icon: <ListChecks size={20} />, title: t("result.feature1Title"), body: t("result.feature1Body") },
                { icon: <BookOpen size={20} />, title: t("result.feature2Title"), body: t("result.feature2Body") },
                { icon: <BarChart3 size={20} />, title: t("result.feature3Title"), body: t("result.feature3Body") },
              ].map((f) => (
                <div key={f.title} className="flex items-start gap-3">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-amber-100 text-[var(--color-warning-strong)]">
                    {f.icon}
                  </span>
                  <div>
                    <Text as="p" variant="body-medium" weight="semibold" color="gray-normal">
                      {f.title}
                    </Text>
                    <Text as="p" variant="body-small" color="gray-muted">
                      {f.body}
                    </Text>
                  </div>
                </div>
              ))}
            </div>
            <Button
              size="lg"
              sx={{ borderRadius: "50px", paddingX: "32px" }}
              rightIcon={<ChevronIcon size={16} variant="right" color="white" />}
              disabled={!course?.exam}
              onClick={openUnlockModal}
            >
              {t("result.upgrade")}
            </Button>
          </Card>
        )}

        {result.is_paid && result.questions && (
          <Card bgcolor="white" border="border-gray-200" padding="20px" borderRadius={12}>
            <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <h2 className="heading-small !font-semibold">{t("result.reviewTitle")}</h2>
                <p className="body-medium text-surface-gray-muted">{t("result.reviewDesc")}</p>
              </div>
              <div className="flex flex-wrap gap-2">
                {filters.map((f) => (
                  <button
                    key={f.key}
                    onClick={() => setFilter(f.key)}
                    disabled={f.count === 0}
                    className={`body-small flex items-center gap-1.5 rounded-full px-4 py-2 !font-medium ${
                      f.count === 0
                        ? "cursor-not-allowed bg-gray-100 text-surface-gray-muted opacity-50"
                        : filter === f.key
                          ? "cursor-pointer bg-brand text-white"
                          : "cursor-pointer bg-gray-100 text-surface-gray-normal"
                    }`}
                  >
                    {filter !== f.key && f.icon}
                    {f.label} ({f.count})
                  </button>
                ))}
              </div>
            </div>

            <div className="flex flex-col gap-2">
              {reviewed.map(({ q, status }, index) =>
                filter === "all" || filter === status ? (
                  <ReviewRow key={q.question_id} index={index} total={total} q={q} status={status} />
                ) : null,
              )}
            </div>
          </Card>
        )}

        <Button
          size="lg"
          variant={result.is_paid ? undefined : "soft"}
          color={result.is_paid ? undefined : "gray"}
          sx={{ borderRadius: "50px" }}
          fullWidth
          onClick={() => flow.goUp(`/daily-tests/${courseId}/${testId}`)}
        >
          <div className="flex items-center gap-2">
            <ArrowLeft size={16} />
            <span>{t("result.backToHistory")}</span>
          </div>
        </Button>
      </div>
      <BottomNavWrap />
    </main>
      <LockedContentModal />
    </DashboardShell>
  );
}

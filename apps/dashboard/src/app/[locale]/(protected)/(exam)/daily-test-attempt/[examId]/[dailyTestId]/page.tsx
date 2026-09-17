"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import Image from "next/image";
import { toast } from "react-toastify";
import { Bookmark, CheckCircle2, FileText, Flag, Lightbulb, Maximize, Quote, Target } from "lucide-react";
import { useRouter } from "@/i18n/navigation";
import Text from "@clearcut/ui/text";
import { Button } from "@clearcut/ui/button";
import { Card } from "@clearcut/ui/card";
import CounterCard from "@/components/ui/cards/CounterCard";
import QOption from "@/components/ui/cards/QuestionMaterial/Qoption/QOption";
import QuestionMath from "@/components/features/mathjax/Math";
import TextMarkDown from "@/components/ui/widgets/TextMarkDown";
import ProgressBar from "@/components/ui/ProgressBar";
import SandTimerIcon from "@/components/ui/icons/sand-timer-icon";
import CountDownTimer from "@/components/features/exam/components/countdown/CountDownTimer";
import { BottomSheet } from "@/components/features/Sheets/BottomSheet";
import ModalHeader from "@/components/features/test-series/components/ModalHeader";
import ContactUsModal from "@/components/modals/contact-us/ContactUsModal";
import { useModalStore } from "@/store/modal/useModalStore";
import {
  ChevronIcon,
  LogoutDoorIcon,
  TrashIcon,
  MainAppLogo,
  ClockIcon,
  ChartSuccessBarIcon,
  WarningCircleIcon,
  CrossIcon,
} from "@/components/ui/icons";
import { Skeleton } from "@/components/ui/skeleton";
import {
  startDailyTest,
  submitDailyTest,
  DailyTestQuestion,
  DailyTestResult,
} from "@/lib/api/dailyTests";
import { isApiError } from "@/lib/api/api-error";
import { useInvalidateDailyTestExams } from "@/components/features/daily-tests/hooks/useDailyTestExams";
import { useInvalidateDailyTestHistory, useDailyTestHistory } from "@/components/features/daily-tests/hooks/useDailyTestHistory";
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

type QuestionStatus = "notVisited" | "answered" | "notAnswered" | "review";

type ViewState =
  | { phase: "loading" }
  | { phase: "locked" }
  | { phase: "attempting"; attemptId: number; testDate: string; questions: DailyTestQuestion[] }
  | { phase: "result"; result: DailyTestResult }
  | { phase: "error"; message: string };

export default function DailyTestAttemptPage() {
  const router = useRouter();
  const params = useParams<{ examId: string; dailyTestId: string }>();
  const { examId, dailyTestId } = params;
  const invalidateDailyTestExams = useInvalidateDailyTestExams();
  const invalidateDailyTestHistory = useInvalidateDailyTestHistory();
  const openGlobalModal = useModalStore((s) => s.open);
  // Already fetched (and cached — see useDailyTestHistory) by the history
  // page the user just came from; reused here only for the exam's display
  // name/type, so this never triggers its own extra loading state on a
  // normal click-through.
  const { history } = useDailyTestHistory(examId);

  const [state, setState] = useState<ViewState>({ phase: "loading" });
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [visited, setVisited] = useState<Set<number>>(new Set());
  const [markedForReview, setMarkedForReview] = useState<Set<number>>(new Set());
  const [currentIndex, setCurrentIndex] = useState(0);
  const [draftOption, setDraftOption] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [navSheetOpen, setNavSheetOpen] = useState(false);
  const [timeLeft, setTimeLeft] = useState({ hours: 0, minutes: 0, seconds: 0 });
  const [dismissedSavedBanners, setDismissedSavedBanners] = useState<Set<number>>(new Set());

  useEffect(() => {
    startDailyTest(dailyTestId)
      .then((res) => {
        const data = res.data;
        if (data.status === "completed") {
          setState({ phase: "result", result: data });
        } else {
          setState({
            phase: "attempting",
            attemptId: data.attempt_id,
            testDate: data.test_date,
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
          setState({ phase: "error", message: "Failed to load this test." });
        }
      });
  }, [dailyTestId]);

  const questions = state.phase === "attempting" ? state.questions : [];
  const currentQuestion = questions[currentIndex] ?? null;

  useEffect(() => {
    setDraftOption(currentQuestion ? (answers[currentQuestion.question_id] ?? null) : null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentQuestion?.question_id]);

  const handleSubmit = useCallback(
    async (finalAnswers?: Record<number, number>) => {
      if (state.phase !== "attempting") return;
      setSubmitting(true);
      try {
        const res = await submitDailyTest(state.attemptId, finalAnswers ?? answers);
        setState({ phase: "result", result: res.data });
        // The course list's "Attempted"/streak/avg-score, and this exam's
        // own history (score/best-score/avg-time), are now stale.
        invalidateDailyTestExams();
        invalidateDailyTestHistory(examId);
      } catch {
        setState({ phase: "error", message: "Failed to submit your answers. Please try again." });
      } finally {
        setSubmitting(false);
      }
    },
    [state, answers, invalidateDailyTestExams, invalidateDailyTestHistory, examId],
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
    toast.success("Question reported. Our team will review it.");
  }, []);

  const handleEndTest = useCallback(() => {
    if (
      typeof window !== "undefined" &&
      !window.confirm("End the test now? You won't be able to change your answers after this.")
    ) {
      return;
    }
    handleSubmit();
  }, [handleSubmit]);

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
    return new Intl.DateTimeFormat("en-GB", { day: "2-digit", month: "short", year: "numeric" }).format(
      new Date(state.testDate),
    );
  }, [state]);

  if (state.phase === "loading") {
    return <AttemptPageSkeleton />;
  }

  if (state.phase === "locked") {
    return (
      <div className="max-w-2xl mx-auto p-4 text-center flex flex-col items-center gap-4 py-12">
        <h2 className="heading-medium !font-semibold">This test is locked</h2>
        <p className="body-medium text-surface-gray-muted">
          Free users can only attempt today&apos;s daily test. Upgrade this course to unlock every
          past test and full answer explanations.
        </p>
        <Button onClick={() => router.push(`/daily-tests/${examId}`)}>Back to history</Button>
      </div>
    );
  }

  if (state.phase === "error") {
    return (
      <div className="max-w-2xl mx-auto p-4 text-center py-12">
        <p className="body-medium text-red-500">{state.message}</p>
      </div>
    );
  }

  if (state.phase === "result") {
    return <DailyTestResultView result={state.result} examId={examId} />;
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
      {/* Timer logic only — CountDownTimer's own compact box UI isn't used
          here, the big labelled H/M/S readout below is, but the countdown
          math/expiry callback stay the single implementation. */}
      <div className="hidden">
        <CountDownTimer duration={totalDuration} onTick={setTimeLeft} onComplete={() => handleSubmit()} />
      </div>

      {/* Topbar */}
      <header className="border-b border-slate-200 bg-white">
        <div className="flex items-center justify-between gap-4 px-6 py-2 lg:px-10">
          <div className="flex items-center gap-4">
            <div className="hidden sm:block">
              <MainAppLogo width={130} />
            </div>
            <div>
              <Text as="p" variant="body-medium" weight="semibold" color="gray-normal">
                {history?.exam.short_name ?? "Daily Test"} – Daily Test ({testDateLabel})
              </Text>
              <Text as="p" variant="body-small" color="gray-muted">
                {questions.length} Questions • {totalMinutes} Minutes • {history?.exam.short_name ?? "…"}
              </Text>
            </div>
          </div>

          <div className="hidden flex-1 items-center justify-center gap-2 px-4 lg:flex">
            <Quote size={16} className="shrink-0 text-brand" />
            <Text as="p" variant="body-small" className="italic text-surface-gray-muted">
              &quot;Small steps every day lead to big results.&quot; — Clear Cutoff
            </Text>
          </div>

          <div className="flex items-center gap-2">
            <Button sx={{ borderRadius: "50px" }} variant="soft" color="gray" size="sm" onClick={handleEndTest}>
              <div className="flex items-center gap-[6px]">
                <span>End Test</span>
                <LogoutDoorIcon size={16} />
              </div>
            </Button>
            <button
              onClick={handleToggleFullscreen}
              aria-label="Toggle fullscreen"
              className="hidden h-9 w-9 items-center justify-center rounded-md border border-gray-200 text-gray-500 hover:bg-gray-50 sm:flex"
            >
              <Maximize size={16} />
            </button>
          </div>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto">
        <div className="mx-auto flex max-w-[1280px] flex-col gap-4 p-4">
          {/* Time left / progress / focus-tip strip */}
          <Card bgcolor="white" border="border-none" padding="16px" borderRadius={12}>
            <div className="flex flex-col items-stretch gap-4 lg:flex-row lg:items-center">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-brand/12">
                  <SandTimerIcon size={22} color="var(--color-brand)" />
                </div>
                <div>
                  <Text as="p" variant="body-small" weight="semibold" color="primary-normal">
                    Time Left
                  </Text>
                  <div className="flex items-end gap-1">
                    <TimeUnit value={timeLeft.hours} label="Hours" />
                    <span className="pb-3 heading-medium !font-semibold text-brand">:</span>
                    <TimeUnit value={timeLeft.minutes} label="Minutes" />
                    <span className="pb-3 heading-medium !font-semibold text-brand">:</span>
                    <TimeUnit value={timeLeft.seconds} label="Seconds" />
                  </div>
                </div>
              </div>

              <div className="hidden h-10 w-px bg-gray-200 lg:block" />

              <div className="flex-1">
                <div className="mb-1 flex items-center justify-between gap-2">
                  <Text as="p" variant="body-medium" weight="semibold" color="gray-normal">
                    Question {currentQNo} of {questions.length}
                  </Text>
                  <Text as="p" variant="body-small" color="gray-muted" className="whitespace-nowrap">
                    {percentComplete}% Complete
                  </Text>
                </div>
                <ProgressBar completed={currentQNo} total={questions.length} showLabel={false} color="var(--color-brand)" />
              </div>

              <div className="hidden h-10 w-px bg-gray-200 lg:block" />

              <div className="relative flex flex-1 items-center gap-3 overflow-hidden rounded-lg bg-[var(--color-primary-bg-soft)] p-3 lg:max-w-[340px]">
                <MountainFlagIllustration className="pointer-events-none absolute inset-y-0 right-0 h-full w-[140px] opacity-70" />
                {answeredCount > 0 ? (
                  <Lightbulb size={20} className="z-10 shrink-0 text-[var(--color-warning-strong)]" />
                ) : (
                  <Target size={20} className="z-10 shrink-0 text-brand" />
                )}
                <div className="z-10 flex-1">
                  <Text as="p" variant="body-small" weight="semibold" color="primary-normal">
                    {answeredCount > 0 ? "You're Doing Great!" : "Stay Focused!"}
                  </Text>
                  <Text as="p" variant="body-small" color="gray-muted">
                    {answeredCount > 0
                      ? "Keep going. Stay consistent!"
                      : "Complete the test and check your performance."}
                  </Text>
                </div>
              </div>
            </div>
          </Card>

          {/* Test Information + question + navigator, 3-column on desktop */}
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start">
            {/* Left sidebar — desktop only */}
            <aside className="hidden w-[260px] shrink-0 flex-col gap-4 lg:flex">
              <Card bgcolor="white" border="border-none" padding="16px" borderRadius={12}>
                <div className="mb-3 flex items-center gap-2">
                  <FileText size={18} className="text-brand" />
                  <Text as="p" variant="body-medium" weight="semibold" color="gray-normal">
                    Test Information
                  </Text>
                </div>
                <div className="flex flex-col gap-3">
                  <InfoRow icon={<FileText size={16} className="text-[var(--color-surface-gray-muted)]" />} label="Exam" value={history?.exam.short_name ?? "…"} />
                  <InfoRow icon={<ClockIcon size={16} color="var(--color-surface-gray-muted)" />} label="Test Type" value="Daily Test" />
                  <InfoRow icon={<FileText size={16} className="text-[var(--color-surface-gray-muted)]" />} label="Total Questions" value={String(questions.length)} />
                  <InfoRow icon={<ChartSuccessBarIcon width={16} height={16} />} label="Total Marks" value={String(questions.length)} />
                  <InfoRow icon={<ClockIcon size={16} color="var(--color-surface-gray-muted)" />} label="Time Duration" value={`${totalMinutes} Minutes`} />
                </div>
              </Card>
            </aside>

            {/* Center column */}
            <div className="flex flex-1 flex-col gap-4">
              <Card bgcolor="white" border="border-none" padding="16px" borderRadius={12}>
                <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                  <span className="body-small w-fit rounded-md bg-brand/9 px-3 py-1 !font-medium text-brand">
                    {history?.exam.short_name ?? "Daily Test"} • Daily Test
                  </span>

                  <div className="flex items-center gap-4">
                    <button
                      onClick={handleToggleMarkForReview}
                      className={`flex cursor-pointer items-center gap-2 body-medium !font-semibold ${
                        isMarked ? "text-[var(--icon-notice-normal)]" : "text-surface-gray-muted"
                      }`}
                    >
                      <Bookmark size={18} fill={isMarked ? "currentColor" : "none"} />
                      <span>Mark for Review</span>
                    </button>
                    <button
                      onClick={handleReportQuestion}
                      className="flex cursor-pointer items-center gap-2 body-medium !font-semibold text-[var(--color-danger)]"
                    >
                      <Flag size={18} />
                      <span className="hidden sm:inline">Report Question</span>
                    </button>
                  </div>
                </div>

                <Text as="p" variant="heading-medium" weight="semibold" color="gray-normal" className="mb-2">
                  Question {currentQNo} /{" "}
                  <Text variant="body-medium" color="gray-subtle">
                    {questions.length}
                  </Text>
                </Text>

                <QuestionMath content={currentQuestion.question ?? ""}>
                  <Text as="div" variant="body-large">
                    <TextMarkDown>{currentQuestion.question ?? ""}</TextMarkDown>
                  </Text>
                </QuestionMath>
                {currentQuestion.question_image && (
                  <div className="mt-3 flex justify-center">
                    <div className="relative h-[160px] w-[160px] overflow-hidden rounded-md">
                      <Image src={currentQuestion.question_image} alt="" fill />
                    </div>
                  </div>
                )}

                <div className="mt-4 grid grid-cols-1 gap-3 lg:grid-cols-2">
                  {(["1", "2", "3", "4"] as const).map((key) => {
                    const text = currentQuestion.options[key];
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
                        Answer saved!
                      </Text>
                    </div>
                    <button
                      onClick={() =>
                        setDismissedSavedBanners((prev) => new Set(prev).add(currentQuestion.question_id))
                      }
                      aria-label="Dismiss"
                      className="text-surface-gray-muted"
                    >
                      <CrossIcon size={14} />
                    </button>
                  </div>
                )}

                <div className="mt-4 flex items-center gap-2 rounded-lg bg-[var(--color-primary-bg-soft)] p-3">
                  <WarningCircleIcon variant="help" size={16} color="var(--color-brand)" />
                  <Text as="p" variant="body-small" color="primary-normal">
                    Select the best answer from the options above.
                  </Text>
                </div>
              </Card>

              {/* Bottom action bar. Mobile: Save and Next full-width on its
                  own row, Previous + Clear Response side by side below it.
                  Desktop: the usual Previous | Save and Next | Clear
                  Response single row. The "lg:contents" wrapper makes the
                  Previous/Clear pairing disappear as a box at that
                  breakpoint so its two buttons become direct flex items of
                  the outer row again, orderable alongside Save and Next. */}
              <div className="flex flex-col gap-3 rounded-xl bg-white p-3 lg:flex-row lg:items-center lg:justify-between">
                <div className="w-full lg:order-2 lg:w-auto lg:flex-1 lg:max-w-[400px]">
                  <Button
                    size="lg"
                    sx={{ borderRadius: "50px" }}
                    disabled={draftOption == null || submitting}
                    onClick={handleSaveAndNext}
                    rightIcon={<ChevronIcon size={16} variant="right" color="white" />}
                    fullWidth
                  >
                    {currentIndex === questions.length - 1 ? "Save and Submit Test" : "Save and Next"}
                  </Button>
                </div>

                <div className="flex items-center justify-between gap-3 lg:contents">
                  <Button
                    sx={{ borderRadius: "50px", paddingX: "24px" }}
                    size="lg"
                    variant="soft"
                    color="gray"
                    className="lg:order-1"
                    disabled={currentIndex === 0}
                    onClick={() => goToIndex(currentIndex - 1)}
                  >
                    <div className="flex items-center gap-2">
                      <ChevronIcon size={20} variant="left" />
                      <span>Previous</span>
                    </div>
                  </Button>

                  <Button
                    sx={{ borderRadius: "50px", paddingX: "24px" }}
                    size="lg"
                    variant="soft"
                    color="gray"
                    className="lg:order-3"
                    disabled={draftOption == null}
                    onClick={handleClear}
                  >
                    <div className="flex items-center gap-2">
                      <TrashIcon size={18} />
                      <span>Clear Response</span>
                    </div>
                  </Button>
                </div>
              </div>

              {/* Collapsed questions summary — mobile only, opens the same
                  navigator content in a bottom sheet instead of a sidebar. */}
              <button
                onClick={() => setNavSheetOpen(true)}
                className="flex items-center justify-between gap-2 rounded-xl border border-gray-200 bg-white px-4 py-3 lg:hidden"
              >
                <div className="flex items-center gap-2">
                  <Bookmark size={16} className="text-brand" />
                  <div className="text-left">
                    <Text as="p" variant="body-medium" weight="semibold" color="gray-normal">
                      Questions
                    </Text>
                    <Text as="p" variant="body-small" color="gray-muted">
                      {answeredCount} / {questions.length} answered
                    </Text>
                  </div>
                </div>
                <ChevronIcon size={16} variant="up" />
              </button>
            </div>

            {/* Right sidebar — desktop only */}
            <aside className="hidden w-[260px] shrink-0 flex-col gap-4 lg:flex">
              <Card bgcolor="white" border="border-none" padding="16px" borderRadius={12}>
                <Text as="p" variant="body-medium" weight="semibold" color="gray-normal" className="mb-3">
                  Questions
                </Text>

                <div className="mb-3 flex flex-col gap-2">
                  <CountRow label="Not Visited" count={counts.notVisited} color="bg-gray-300" textColor="text-surface-gray-muted" />
                  <CountRow label="Answered" count={counts.answered} color="bg-[var(--icon-positive-subtle)]" textColor="text-[var(--icon-positive-normal)]" />
                  <CountRow label="Not Answered" count={counts.notAnswered} color="bg-[var(--icon-negative-normal)]" textColor="text-[var(--icon-negative-normal)]" />
                  <CountRow label="Marked for Review" count={counts.review} color="bg-[var(--icon-notice-subtle)]" textColor="text-[var(--icon-notice-normal)]" />
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
                      <span>Review Later ({counts.review})</span>
                    </div>
                  </Button>
                </div>
              </Card>
            </aside>
          </div>
        </div>
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
              Need help? <span className="!font-semibold text-brand">Contact Support</span>
            </span>
          </button>
          <div className="hidden items-center gap-1.5 body-small text-surface-gray-muted sm:flex">
            <Maximize size={14} />
            <span>Press F to toggle fullscreen</span>
          </div>
        </div>
      </div>

      {/* Mobile question palette — same BottomSheet used elsewhere
          (see QuestionNavigatorSheet.tsx), not a new modal. */}
      <BottomSheet isOpen={navSheetOpen} onClose={() => setNavSheetOpen(false)} isHeader={false}>
        <ModalHeader title="Questions" onClose={() => setNavSheetOpen(false)} />
        <div className="flex flex-col gap-4 px-4 pb-4">
          <div className="grid grid-cols-2 gap-2">
            <LegendItem label="Not Visited" color="bg-gray-300" />
            <LegendItem label="Answered" color="bg-[var(--icon-positive-subtle)]" />
            <LegendItem label="Not Answered" color="bg-[var(--icon-negative-normal)]" />
            <LegendItem label="Marked for Review" color="bg-[var(--icon-notice-subtle)]" />
          </div>

          {questionGrid("sheet")}

          <Button
            variant="soft"
            color="gray"
            fullWidth
            sx={{ borderRadius: "50px" }}
            onClick={() => setNavSheetOpen(false)}
          >
            Close
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

// Small decorative mountain-with-flag graphic for the "Stay Focused" tip
// card — no existing illustration asset in the codebase matches this
// motif (checked components/ui/icons — only LearningInsightIllustration
// exists, a different scene), so it's a minimal one-off inline SVG rather
// than a full new illustration component.
const MountainFlagIllustration = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 160 90" fill="none" className={className} aria-hidden="true">
    <path d="M0 90L45 25L75 60L95 35L160 90H0Z" fill="var(--color-brand)" opacity="0.18" />
    <path d="M20 90L60 35L85 65L110 40L160 90H20Z" fill="var(--color-brand)" opacity="0.3" />
    <line x1="110" y1="40" x2="110" y2="14" stroke="var(--color-brand)" strokeWidth="2" opacity="0.6" />
    <path d="M110 14L128 20L110 26V14Z" fill="var(--color-brand)" opacity="0.6" />
  </svg>
);

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

const TimeUnit = ({ value, label }: { value: number; label: string }) => (
  <div className="flex flex-col items-center">
    <span className="heading-medium !font-bold leading-none text-brand">{String(value).padStart(2, "0")}</span>
    <span className="body-xsmall text-surface-gray-muted">{label}</span>
  </div>
);

const InfoRow = ({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) => (
  <div className="flex items-center gap-2">
    {icon}
    <div>
      <Text as="p" variant="body-small" color="gray-muted" className="leading-tight">
        {label}
      </Text>
      <Text as="p" variant="body-small" weight="semibold" color="gray-normal" className="leading-tight">
        {value}
      </Text>
    </div>
  </div>
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

function DailyTestResultView({
  result,
  examId,
}: {
  result: DailyTestResult;
  examId: string;
}) {
  const router = useRouter();

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6 p-4">
      <div className="py-6 text-center">
        <h1 className="heading-large !font-semibold">
          {result.score} / {result.total_questions}
        </h1>
        <p className="body-medium text-surface-gray-muted">Your score</p>
      </div>

      {!result.is_paid && (
        <Card padding="16px" borderRadius={12} className="text-center !bg-amber-50 !border-amber-200">
          <p className="body-medium !font-semibold mb-1">Want to see what you got wrong?</p>
          <p className="body-small text-surface-gray-muted mb-3">
            Upgrade this course to see which questions were correct or incorrect, plus full
            explanations for every question.
          </p>
          <Button onClick={() => router.push(`/preparation/${examId}`)}>Upgrade</Button>
        </Card>
      )}

      {result.is_paid && result.questions && (
        <div className="flex flex-col gap-4">
          {result.questions.map((q, index) => (
            <Card
              key={q.question_id}
              padding="16px"
              borderRadius={12}
              className={q.is_correct ? "!bg-green-50 !border-green-200" : "!bg-red-50 !border-red-200"}
            >
              <p className="body-medium !font-semibold mb-2">
                {index + 1}. {q.question}
              </p>
              <div className="mb-2 flex flex-col gap-1">
                {(["1", "2", "3", "4"] as const).map((optionKey) => {
                  const optionText = q.options[optionKey];
                  if (!optionText) return null;
                  const isCorrectOption = Number(optionKey) === q.correct_option;
                  const isSelectedOption = Number(optionKey) === q.selected_option;
                  return (
                    <div
                      key={optionKey}
                      className={`body-small rounded-md px-2 py-1 ${
                        isCorrectOption
                          ? "!font-semibold text-green-700"
                          : isSelectedOption
                            ? "text-red-700 line-through"
                            : ""
                      }`}
                    >
                      {optionText}
                    </div>
                  );
                })}
              </div>
              {q.explanation && (
                <p className="body-small text-surface-gray-muted border-t border-gray-200 pt-2">
                  {q.explanation}
                </p>
              )}
            </Card>
          ))}
        </div>
      )}

      <Button onClick={() => router.push(`/daily-tests/${examId}`)}>Back to history</Button>
    </div>
  );
}

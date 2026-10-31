"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useParams } from "next/navigation";
import Image from "next/image";
import { useLocale, useTranslations } from "next-intl";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-toastify";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Bookmark, Check, Lightbulb } from "lucide-react";
import Text from "@clearcut/ui/text";
import { Button } from "@clearcut/ui/button";
import { Card } from "@clearcut/ui/card";
import { useRouter } from "@/i18n/navigation";
import { useAuth } from "@/providers/AuthProvider";
import { useMyActiveCourses } from "@/hooks/course/useMyActiveCourses";
import { getPracticeExplanation, getPracticeTestQuestions, submitPracticeTest, type PracticeQuestion } from "@/lib/api/firstPracticeTest";
import { getCourseState } from "@/lib/api/userState";
import { trackLiteTestAbandoned, trackLiteTestStarted, trackLiteTestSubmitted, watchTestAbandoned } from "@/lib/analytics/testFunnel";
import AttemptTopbar from "@/components/features/attempt-ui/AttemptTopbar";
import AttemptSummaryStrip from "@/components/features/attempt-ui/AttemptSummaryStrip";
import AttemptProgress from "@/components/features/attempt-ui/AttemptProgress";
import TipCard from "@/components/features/attempt-ui/TipCard";
import QuestionMetaBar from "@/components/features/attempt-ui/QuestionMetaBar";
import QuestionsDock, { ACTIVE_STYLE, STATUS_STYLE, type QuestionDockStatus } from "@/components/features/attempt-ui/QuestionsDock";
import StatusCountRow from "@/components/features/attempt-ui/StatusCountRow";
import CounterCard from "@/components/ui/cards/CounterCard";
import QOption from "@/components/ui/cards/QuestionMaterial/Qoption/QOption";
import TextMarkDown from "@/components/ui/widgets/TextMarkDown";
import QuestionMath from "@/components/features/mathjax/Math";
import { ChevronIcon, LanguageIcon } from "@/components/ui/icons";
import QuestionExplanation from "@/components/features/exam-report/QuestionExplanation";
import PracticeTestResult from "./PracticeTestResult";
import PracticeFooter from "./PracticeFooter";
import { ExplanationSkeleton, PracticeTestResultSkeleton, PracticeTestSkeleton } from "./PracticeTestSkeletons";
import { usePracticeElapsed } from "./usePracticeElapsed";
import { practiceQuestionsKey as QUESTIONS_KEY } from "./practiceTestQuery";
import {
  clearPracticeSession,
  loadPracticeSession,
  localizeExplanation,
  localizeQuestion,
  newPracticeSession,
  savePracticeSession,
  type PracticeSession,
} from "./practiceTestSession";


// Next question enters from the right and the previous one from the left (the
// outgoing one leaves the opposite way). `custom` is the direction: 1 forward, -1 back.
const SLIDE_PX = 32;
const questionSlide = {
  enter: (d: number) => ({ x: d * SLIDE_PX, opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit: (d: number) => ({ x: -d * SLIDE_PX, opacity: 0 }),
};
const fadeOnly = { enter: { opacity: 0 }, center: { opacity: 1 }, exit: { opacity: 0 } };

/**
 * The one-time practice test shown between "subjects selected" and the
 * Preparation page. `courseId` in the URL is the enrolment's group_code (the
 * id /preparation/[courseId] uses). Built from the Daily Test attempt
 * components (topbar, timer + progress strip, tip card, question meta bar,
 * option cards, status legend, questions dock) so both read as one pattern;
 * unlike the Daily Test it keeps nothing on the server. A pick is only saved:
 * correct answers and explanations are revealed on the result screen, after
 * the whole test is submitted.
 */
export default function PracticeTestPage() {
  const t = useTranslations("PracticeTest");
  const appLocale = useLocale();
  const td = useTranslations("DailyTests");
  const router = useRouter();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { courseId } = useParams<{ courseId: string }>();
  const { courses } = useMyActiveCourses();
  const reduceMotion = useReducedMotion();
  // Subtle staggered entrance for the attempt screen (none for reduced motion).
  const enter = (delay: number) =>
    reduceMotion
      ? {}
      : {
          initial: { opacity: 0, y: 10 },
          animate: { opacity: 1, y: 0 },
          transition: { duration: 0.35, delay, ease: "easeOut" as const },
        };

  const course = [courses?.active_course, ...(courses?.courses ?? [])].find((c) => c?.group_code === courseId);
  const examName = course?.exam?.short_name ?? "";
  const firstName = user?.full_name?.trim().split(/\s+/)[0] || null;

  const [session, setSession] = useState<PracticeSession | null>(null);
  const [restored, setRestored] = useState(false);
  const [finishing, setFinishing] = useState(false);
  // The app has no toast container mounted, so a failed submit is shown inline.
  const [submitFailed, setSubmitFailed] = useState(false);
  const [language, setLanguage] = useState<string | null>(null);

  useEffect(() => {
    setSession(loadPracticeSession(courseId));
    setRestored(true);
  }, [courseId]);

  // Opening the page afresh (no test in progress in this tab) after the test was
  // already completed for this course - typed URL, old link, another device -
  // goes on to Preparation instead of starting over. A test in progress or a
  // retake from the result screen is unaffected. If the state can't be read the
  // test simply opens.
  const [gateOpen, setGateOpen] = useState(false);
  useEffect(() => {
    if (!restored || gateOpen) return;
    if (session) {
      setGateOpen(true);
      return;
    }
    let alive = true;
    getCourseState(courseId)
      .then((state) => {
        if (!alive) return;
        if (state.practice_test_status === "completed") {
          clearPracticeSession(courseId);
          router.replace(`/preparation/${courseId}`);
        } else {
          setGateOpen(true);
        }
      })
      .catch(() => alive && setGateOpen(true));
    return () => {
      alive = false;
    };
  }, [restored, gateOpen, session, courseId, router]);

  const goToPreparation = useCallback(() => {
    clearPracticeSession(courseId);
    router.replace(`/preparation/${courseId}`);
  }, [courseId, router]);

  const {
    data: fetched,
    isError,
    isFetching,
  } = useQuery({
    queryKey: QUESTIONS_KEY(courseId),
    queryFn: () => getPracticeTestQuestions(courseId),
    // Loads while the already-completed check runs (one round trip less); the test only
    // opens once that check has passed (see the effect below), so a completed course
    // still goes straight to Preparation.
    enabled: restored && !session,
    staleTime: Infinity,
    gcTime: 0,
    retry: 1,
    refetchOnWindowFocus: false,
  });

  useEffect(() => {
    if (!fetched || session || !gateOpen) return;
    // Nothing in the question bank for these subjects: don't strand the
    // learner on an empty test, send them on to Preparation.
    if (fetched.length === 0) {
      goToPreparation();
      return;
    }
    setSession(newPracticeSession(fetched));
  }, [fetched, session, gateOpen, goToPreparation]);

  // ---- elapsed time: silent, no limit, shown on the result ----
  const sessionRef = useRef(session);
  sessionRef.current = session;
  const readElapsedRef = useRef<() => number>(() => 0);
  // Saved whenever the stopwatch pauses (tab hidden, page left) so a refresh resumes it.
  const persistElapsed = useCallback(() => {
    const s = sessionRef.current;
    if (!s) return;
    savePracticeSession(courseId, { ...s, elapsedMs: s.finishedAt ? s.elapsedMs : readElapsedRef.current() });
  }, [courseId]);
  const readElapsed = usePracticeElapsed(!!session && !session.finishedAt, session?.startedAt ?? null, session?.elapsedMs ?? 0, persistElapsed);
  readElapsedRef.current = readElapsed;

  useEffect(() => {
    if (session) savePracticeSession(courseId, { ...session, elapsedMs: session.finishedAt ? session.elapsedMs : readElapsed() });
  }, [courseId, session, readElapsed]);

  const retryLoad = useCallback(async () => {
    // A retry while the first request is still in flight does nothing unless
    // that request is cancelled first (DEVELOPMENT_RULES 2.2).
    await queryClient.cancelQueries({ queryKey: QUESTIONS_KEY(courseId) });
    await queryClient.refetchQueries({ queryKey: QUESTIONS_KEY(courseId) });
  }, [queryClient, courseId]);

  const questions = useMemo(() => session?.questions ?? [], [session?.questions]);
  const index = session?.index ?? 0;
  const q: PracticeQuestion | undefined = questions[index];

  const otherLocale = useMemo(() => {
    for (const item of questions) {
      const found = item.translations?.find((tr) => tr.locale !== "en");
      if (found) return found.locale;
    }
    return null;
  }, [questions]);
  const hasMultipleTranslations =
    otherLocale != null && questions.some((item) => item.translations?.some((tr) => tr.locale === "en"));
  // The learner's own choice, else the app language when the question has it,
  // else the question's first translation.
  const preferred = language ?? appLocale;
  const activeLocale = q?.translations?.some((tr) => tr.locale === preferred)
    ? preferred
    : (q?.translations?.[0]?.locale ?? "en");
  const toggleLocale = activeLocale === "en" ? otherLocale : "en";

  const update = useCallback((fn: (s: PracticeSession) => PracticeSession) => {
    setSession((s) => (s ? fn(s) : s));
  }, []);

  // Slide direction of the next question change: forward (right -> left) or back.
  const directionRef = useRef(1);

  const goToIndex = useCallback(
    (next: number) => {
      directionRef.current = next >= (sessionRef.current?.index ?? 0) ? 1 : -1;
      update((s) => {
        const target = s.questions[next];
        if (!target) return s;
        return { ...s, index: next, visited: s.visited.includes(target.question_id) ? s.visited : [...s.visited, target.question_id] };
      });
    },
    [update],
  );

  // Picking only saves the answer (tap the chosen option again to clear it);
  // nothing about right/wrong is shown until the test is submitted.
  const selectOption = useCallback(
    (question: PracticeQuestion, option: number) => {
      update((s) => {
        const answers = { ...s.answers };
        if (answers[question.question_id] === option) delete answers[question.question_id];
        else answers[question.question_id] = option;
        return { ...s, answers };
      });
    },
    [update],
  );

  // Test Started / Submitted / Abandoned: the test-series events with test_type "practice_test".
  const analyticsBase = useCallback(
    (s: PracticeSession) => ({
      kind: "practice_test" as const,
      testId: `practice_test:${courseId}`,
      sessionId: `practice_test:${courseId}:${s.startedAt}`,
      courseId,
      exam: examName || undefined,
      totalQuestions: s.questions.length,
    }),
    [courseId, examName],
  );

  const startedAt = session?.startedAt;
  const inProgress = !!session && !session.finishedAt;
  useEffect(() => {
    const s = sessionRef.current;
    if (s && inProgress) trackLiteTestStarted(analyticsBase(s));
  }, [startedAt, inProgress, analyticsBase]);

  useEffect(() => {
    if (!inProgress) return;
    return watchTestAbandoned((reason) => {
      const s = sessionRef.current;
      if (s && !s.finishedAt) trackLiteTestAbandoned(analyticsBase(s), reason, Object.keys(s.answers).length);
    });
  }, [startedAt, inProgress, analyticsBase]);

  const finish = useCallback(async () => {
    if (!session || finishing || session.finishedAt) return;
    // Time stops at the tap, not when the server answers.
    const elapsedMs = readElapsed();
    setFinishing(true);
    setSubmitFailed(false);
    try {
      const results = await submitPracticeTest(
        courseId,
        session.questions.map((item) => ({
          question_id: item.question_id,
          selected_option: session.answers[item.question_id] ?? null,
        })),
      );
      const checks = Object.fromEntries(results.map((r) => [r.question_id, r]));
      // Same "Test Submitted" as a test-series exam (test_type practice_test); after the save succeeded.
      const unattempted = session.questions.filter((item) => session.answers[item.question_id] == null).length;
      trackLiteTestSubmitted(analyticsBase(session), {
        correct: results.filter((r) => r.is_correct).length,
        unattempted,
        timeTakenSeconds: elapsedMs / 1000,
        reason: "manual",
        language: activeLocale,
      });
      update((s) => ({ ...s, checks, finishedAt: Date.now(), elapsedMs }));
    } catch {
      // Stay on the test so nothing is lost; Finish can be tapped again.
      setSubmitFailed(true);
    } finally {
      setFinishing(false);
    }
  }, [session, finishing, courseId, update, readElapsed, analyticsBase, activeLocale]);

  const toggleMark = useCallback(() => {
    if (!q) return;
    update((s) => ({
      ...s,
      marked: s.marked.includes(q.question_id) ? s.marked.filter((id) => id !== q.question_id) : [...s.marked, q.question_id],
    }));
  }, [q, update]);

  // "Show Explanation": fetched once per question (cached in the session), then only toggled.
  // Picking an answer reveals nothing by itself.
  const [explainBusy, setExplainBusy] = useState<number | null>(null);
  const [explainFailed, setExplainFailed] = useState<number | null>(null);
  const toggleExplanation = useCallback(
    async (questionId: number) => {
      const s = sessionRef.current;
      if (!s) return;
      if (s.shown?.includes(questionId)) {
        update((cur) => ({ ...cur, shown: (cur.shown ?? []).filter((id) => id !== questionId) }));
        return;
      }
      if (s.explained?.[questionId]) {
        update((cur) => ({ ...cur, shown: [...(cur.shown ?? []), questionId] }));
        return;
      }
      setExplainBusy(questionId);
      setExplainFailed(null);
      try {
        const explanation = await getPracticeExplanation(courseId, questionId);
        update((cur) => ({
          ...cur,
          explained: { ...(cur.explained ?? {}), [questionId]: explanation },
          shown: (cur.shown ?? []).includes(questionId) ? cur.shown : [...(cur.shown ?? []), questionId],
        }));
      } catch {
        setExplainFailed(questionId);
      } finally {
        setExplainBusy(null);
      }
    },
    [courseId, update],
  );

  const getStatus = useCallback(
    (item: PracticeQuestion): QuestionDockStatus => {
      if (!session) return "notVisited";
      if (session.marked.includes(item.question_id)) return "review";
      if (session.answers[item.question_id] != null) return "answered";
      if (session.visited.includes(item.question_id)) return "notAnswered";
      return "notVisited";
    },
    [session],
  );

  const counts = useMemo(() => {
    const c = { notVisited: 0, answered: 0, notAnswered: 0, review: 0 };
    questions.forEach((item) => {
      c[getStatus(item)]++;
    });
    return c;
  }, [questions, getStatus]);

  const total = questions.length;

  // ---------- states ----------

  if (!restored || (!session && (!isError || !gateOpen))) {
    return <PracticeTestSkeleton />;
  }

  // The final submit is in flight: show the result's own skeleton (a failed submit comes back to the test).
  if (finishing) {
    return <PracticeTestResultSkeleton />;
  }

  if (!session) {
    return (
      <div className="mx-auto flex max-w-md flex-col items-center gap-4 px-4 py-16 text-center">
        <p className="body-medium text-[var(--icon-negative-normal)]">{t("loadFailed")}</p>
        <div className="flex w-full flex-col gap-3 sm:flex-row">
          <Button fullWidth sx={{ borderRadius: "50px" }} disabled={isFetching} onClick={retryLoad}>
            {t("retry")}
          </Button>
          <Button fullWidth variant="outlined" color="gray" sx={{ borderRadius: "50px" }} onClick={goToPreparation}>
            {t("goToPreparation")}
          </Button>
        </div>
      </div>
    );
  }

  if (session.finishedAt) {
    return (
      <PracticeTestResult
        session={session}
        examName={examName}
        userName={firstName}
        language={language ?? appLocale}
        onContinue={goToPreparation}
        onToggleLanguage={hasMultipleTranslations && toggleLocale ? () => setLanguage(toggleLocale) : null}
      />
    );
  }

  if (!q) return null;

  // ---------- attempt ----------

  const display = localizeQuestion(q, activeLocale);
  const selected = session.answers[q.question_id] ?? null;
  const isLast = index === total - 1;
  const isMarked = session.marked.includes(q.question_id);
  const explained = session.explained?.[q.question_id];
  const explanationOpen = selected != null && !!explained && !!session.shown?.includes(q.question_id);
  const percent = Math.round(((index + 1) / total) * 100);
  const options = (["1", "2", "3", "4"] as const)
    .map((key) => ({ key, text: display.options[key] }))
    .filter((o): o is { key: "1" | "2" | "3" | "4"; text: string } => !!o.text);

  // Topbar: the full "Skip Test & Go to Preparation" (short label on phones).
  const skipButton = () => (
    <Button
      color="danger"
      size="md"
      sx={{ borderRadius: "50px" }}
      leftIcon={<ChevronIcon size={16} type="double" variant="right" color="white" />}
      rightIcon={<ChevronIcon size={14} variant="right" color="white" />}
      onClick={goToPreparation}
    >
      <span className="max-sm:hidden">{t("skipCta")}</span>
      <span className="sm:hidden">{t("skipShort")}</span>
    </Button>
  );

  // Sidebar card (240-260 px wide): the card already says "Skip Practice Test", so the
  // button is just "Go to Preparation" - one line, one chevron, never wrapped or clipped.
  const skipCardButton = (
    <Button
      color="danger"
      size="md"
      fullWidth
      sx={{ borderRadius: "50px" }}
      rightIcon={<ChevronIcon size={14} variant="right" color="white" />}
      onClick={goToPreparation}
    >
      {t("goToPreparation")}
    </Button>
  );

  const questionGrid = (
    <div className="grid grid-cols-5 gap-2">
      {questions.map((item, i) => {
        const style = i === index ? ACTIVE_STYLE : STATUS_STYLE[getStatus(item)];
        return (
          <motion.div
            key={item.question_id}
            onClick={() => goToIndex(i)}
            className="cursor-pointer"
            initial={false}
            whileTap={reduceMotion ? undefined : { scale: 0.92 }}
            animate={i === index && !reduceMotion ? { scale: [1, 1.12, 1] } : { scale: 1 }}
            transition={{ duration: 0.25 }}
          >
            <CounterCard
              value={String(i + 1)}
              border={`border-2 ${style.border}`}
              fontFamily="body-large"
              bgColor={style.bg}
              rounded="rounded-md"
              textClass={`!font-semibold ${style.text}`}
            />
          </motion.div>
        );
      })}
    </div>
  );

  return (
    <motion.div
      className="flex h-screen flex-col overflow-hidden bg-[var(--background-gray-subtle)]"
      initial={reduceMotion ? false : { opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      <AttemptTopbar
        title={t("headerTitle", { exam: examName || td("list.defaultExam") })}
        meta={t("headerMeta", { count: total })}
        quote={t("quote")}
        actions={
          <>
            {hasMultipleTranslations && toggleLocale && (
              <button
                onClick={() => setLanguage(toggleLocale)}
                aria-label={td("attempt.changeLanguage")}
                className="cursor-pointer"
              >
                <LanguageIcon size={30} />
              </button>
            )}
            {skipButton()}
          </>
        }
      />

      <div className="flex-1 overflow-y-auto">
        <div className="mx-auto flex min-h-full max-w-[1280px] flex-col gap-4 py-4 lg:px-4">
          <motion.div {...enter(0.05)}>
          <AttemptSummaryStrip
            className="max-lg:!rounded-none"
            progress={
              <AttemptProgress
                position={index + 1}
                total={total}
                percent={percent}
                positionLabel={t("progressPosition", { position: index + 1, total })}
                percentLabel={t("progressPercent", { percent })}
              />
            }
            tip={
              <TipCard
                icon={<Lightbulb size={24} className="text-[var(--color-warning-strong)]" />}
                title={t("keepGoingTitle")}
                body={t("keepGoingBody")}
              />
            }
          />
          </motion.div>

          <div className="flex flex-col gap-4 lg:flex-1 lg:flex-row lg:items-start">
            {/* Left: question navigator. Sticky, so it stays in view while a long question scrolls. */}
            <motion.aside className="hidden w-[240px] shrink-0 flex-col gap-4 lg:sticky lg:top-0 lg:flex xl:w-[260px]" {...enter(0.1)}>
              <Card bgcolor="white" border="border-none" padding="16px" borderRadius={12} className="!h-auto">
                <Text as="p" variant="body-large" weight="semibold" color="gray-normal" className="mb-3">
                  {td("attempt.questions")}
                </Text>
                <div className="mb-3 flex flex-col gap-2">
                  <StatusCountRow label={td("attempt.notVisited")} count={counts.notVisited} color="bg-gray-300" textColor="text-surface-gray-muted" />
                  <StatusCountRow label={td("attempt.answered")} count={counts.answered} color="bg-[var(--icon-positive-subtle)]" textColor="text-[var(--icon-positive-normal)]" />
                  <StatusCountRow label={td("attempt.notAnswered")} count={counts.notAnswered} color="bg-[var(--icon-negative-normal)]" textColor="text-[var(--icon-negative-normal)]" />
                  <StatusCountRow label={td("attempt.markedForReview")} count={counts.review} color="bg-[var(--icon-notice-subtle)]" textColor="text-[var(--icon-notice-normal)]" />
                </div>
                {questionGrid}
                <div className="mt-4">
                  <Button
                    variant="soft"
                    color="gray"
                    fullWidth
                    sx={{ borderRadius: "50px" }}
                    disabled={counts.review === 0}
                    onClick={() => {
                      const first = questions.findIndex((item) => session.marked.includes(item.question_id));
                      if (first !== -1) goToIndex(first);
                    }}
                  >
                    <div className="flex items-center gap-2">
                      <Bookmark size={16} />
                      <span>{td("attempt.reviewLater", { count: counts.review })}</span>
                    </div>
                  </Button>
                </div>
              </Card>
            </motion.aside>

            <motion.div className="flex min-w-0 flex-1 flex-col gap-4 lg:self-stretch" {...enter(0.12)}>
              <Card bgcolor="white" border="border-none" padding="16px" borderRadius={12} className="!h-auto overflow-x-clip max-lg:!rounded-none lg:flex-1">
                <AnimatePresence mode="wait" initial={false} custom={directionRef.current}>
                <motion.div
                  key={q.question_id}
                  custom={directionRef.current}
                  variants={reduceMotion ? fadeOnly : questionSlide}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  transition={{ duration: 0.2, ease: "easeOut" }}
                >
                <div className="mb-3">
                  <QuestionMetaBar
                    chip={q.subject ?? undefined}
                    isMarked={isMarked}
                    onToggleMark={toggleMark}
                    markLabel={td("attempt.markForReview")}
                    onReport={() => toast.success(td("attempt.reported"))}
                    reportLabel={td("attempt.reportQuestion")}
                  />
                </div>

                <Text as="p" variant="heading-medium" weight="semibold" color="gray-normal" className="mb-2">
                  {t("questionHeading", { number: index + 1 })}{" "}
                  <Text variant="body-medium" color="gray-subtle">
                    / {total}
                  </Text>
                </Text>

                <QuestionMath content={display.question ?? ""}>
                  <Text as="div" variant="body-large">
                    <TextMarkDown>{display.question ?? ""}</TextMarkDown>
                  </Text>
                </QuestionMath>
                {display.question_image && (
                  <div className="mt-3 flex justify-center">
                    <div className="relative h-[160px] w-[160px] overflow-hidden rounded-md">
                      <Image src={display.question_image} alt="" fill />
                    </div>
                  </div>
                )}

                <div className="mt-4 grid grid-cols-1 gap-3 xl:grid-cols-2">
                  {options.map(({ key, text }) => {
                    const number = Number(key);
                    const isSelected = selected === number;
                    // Tap = a small press; becoming selected = one soft pop (not replayed when a question is revisited).
                    return (
                      <motion.div
                        key={key}
                        initial={false}
                        whileTap={reduceMotion ? undefined : { scale: 0.98 }}
                        animate={isSelected && !reduceMotion ? { scale: [1, 1.025, 1] } : { scale: 1 }}
                        transition={{ duration: 0.25, ease: "easeOut" }}
                      >
                        <QOption
                          value={{ text, index: number - 1 }}
                          mainContainer={{
                            borderwidth: 2,
                            bgcolor: isSelected ? "!bg-brand/9" : "",
                            bordercolor: isSelected ? "!border-brand" : "",
                          }}
                          counter={{
                            backgroundColor: isSelected ? "!bg-brand/9" : "",
                            borderColor: isSelected ? "!border-brand" : "",
                          }}
                          onClick={() => selectOption(q, number)}
                        />
                      </motion.div>
                    );
                  })}
                </div>

                {/* Answering reveals nothing. Once an answer is picked, this question's explanation can be opened on demand. */}
                {selected != null && (
                  <div className="mt-4">
                    <div className="flex justify-center">
                    <Button
                      variant="outlined"
                      size="sm"
                      sx={{ borderRadius: "50px" }}
                      leftIcon={<Lightbulb size={14} />}
                      rightIcon={<ChevronIcon size={14} variant={explanationOpen ? "up" : "down"} color="currentColor" />}
                      disabled={explainBusy === q.question_id}
                      aria-expanded={explanationOpen}
                      onClick={() => toggleExplanation(q.question_id)}
                    >
                      {explanationOpen ? t("hideExplanation") : t("showExplanation")}
                    </Button>
                    </div>
                    {explainFailed === q.question_id && (
                      <p role="alert" className="body-small mt-2 text-[var(--icon-negative-normal)]">
                        {t("explanationFailed")}
                      </p>
                    )}
                    <AnimatePresence initial={false}>
                      {explainBusy === q.question_id && <ExplanationSkeleton key="explanation-loading" />}
                      {explanationOpen && explained && (
                        <QuestionExplanation
                          key={`explanation-${q.question_id}`}
                          correctOption={explained.correct_option}
                          explanation={localizeExplanation(explained, activeLocale) ?? t("noExplanation")}
                        />
                      )}
                    </AnimatePresence>
                  </div>
                )}
                </motion.div>
                </AnimatePresence>
              </Card>
            </motion.div>

            {/* Right: skip. */}
            <motion.aside className="hidden w-[240px] shrink-0 flex-col gap-4 lg:sticky lg:top-0 lg:flex xl:w-[260px]" {...enter(0.2)}>
              <Card bgcolor="var(--color-danger-bg-soft)" border="border-none" padding="16px" borderRadius={12} className="!h-auto">
                <Text as="p" variant="body-large" weight="semibold" color="gray-normal">
                  {t("skipCardTitle")}
                </Text>
                <Text as="p" variant="body-small" color="gray-muted" className="mb-3">
                  {t("skipCardBody")}
                </Text>
                {skipCardButton}
              </Card>
            </motion.aside>
          </div>
        </div>
      </div>

      {/* Pinned footer, same wrapper as the Daily Test attempt's action bar. */}
      <PracticeFooter withSidebarGutter>
        {submitFailed && (
          <p role="alert" className="body-medium pb-2 text-center text-[var(--icon-negative-normal)]">
            {t("submitFailed")}
          </p>
        )}
        <div className="flex items-center justify-between gap-3">
          <motion.div whileTap={reduceMotion || index === 0 ? undefined : { scale: 0.96 }}>
          {/* Icons use currentColor so they follow the variant (outlined = brand text, filled = white) and the disabled dimming. */}
          <Button
            size="lg"
            variant="outlined"
            sx={{ borderRadius: "50px", paddingX: "24px" }}
            disabled={index === 0}
            leftIcon={<ChevronIcon size={18} variant="left" color="currentColor" />}
            onClick={() => goToIndex(index - 1)}
          >
            <span className="max-sm:hidden">{t("previous")}</span>
            <span className="sm:hidden">{t("previousShort")}</span>
          </Button>
          </motion.div>
          <motion.div whileTap={reduceMotion || finishing ? undefined : { scale: 0.96 }}>
          <Button
            size="lg"
            sx={{ borderRadius: "50px", paddingX: "32px" }}
            disabled={finishing}
            rightIcon={isLast ? <Check size={18} /> : <ChevronIcon size={18} variant="right" color="currentColor" />}
            onClick={isLast ? finish : () => goToIndex(index + 1)}
          >
            {isLast ? t("finish") : t("next")}
          </Button>
          </motion.div>
        </div>
      </PracticeFooter>

      <div className="shrink-0 border-t border-gray-200 bg-white lg:hidden">
        <QuestionsDock
          title={td("attempt.questions")}
          questions={questions.map((item, i) => ({ status: getStatus(item), isActive: i === index }))}
          onSelect={goToIndex}
        />
      </div>
    </motion.div>
  );
}

"use client";

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import Image from "next/image";
import { BookOpen, Check, CheckCircle2, FileText, Target, Timer, Trophy, X, XCircle } from "lucide-react";
import Text from "@clearcut/ui/text";
import { Button } from "@clearcut/ui/button";
import { Card } from "@clearcut/ui/card";
import ShimmerButton from "@/components/ui/button/shimmer-button";
import MathRender from "@/components/features/mathjax/Math";
import TextMarkDown from "@/components/ui/widgets/TextMarkDown";
import AttemptTopbar from "@/components/features/attempt-ui/AttemptTopbar";
import { ChevronIcon, LanguageIcon } from "@/components/ui/icons";
import MountainFlagIllustration from "@/components/ui/illustrations/MountainFlagIllustration";
import OptionCard from "@/components/features/exam-report/OptionCard";
import QuestionExplanation from "@/components/features/exam-report/QuestionExplanation";
import AnimatedScoreRing from "./AnimatedScoreRing";
import PracticeFooter from "./PracticeFooter";
import {
  localizeExplanation,
  localizeQuestion,
  type PracticeSession,
} from "./practiceTestSession";

type RowStatus = "correct" | "incorrect" | "notAttempted";

const StatCard = ({
  icon,
  tone,
  value,
  label,
  className = "",
}: {
  icon: React.ReactNode;
  tone: string;
  value: string;
  label: string;
  className?: string;
}) => (
  <Card bgcolor="white" border="border-none" padding="16px" borderRadius={14} className={`!h-auto !min-h-0 shadow-sm max-md:!rounded-none ${className}`}>
    <div className="flex flex-col items-center gap-2 text-center md:flex-row md:gap-4 md:text-left">
      <span className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full md:h-[52px] md:w-[52px] ${tone}`}>{icon}</span>
      <div className="min-w-0">
        <Text as="p" variant="heading-medium" weight="bold" color="gray-normal" className="whitespace-nowrap leading-tight">
          {value}
        </Text>
        <Text as="p" variant="body-medium" color="gray-muted" className="whitespace-nowrap">
          {label}
        </Text>
      </div>
    </div>
  </Card>
);

const LegendDot = ({ color, label }: { color: string; label: string }) => (
  <span className="flex items-center gap-1.5">
    <span className={`h-2.5 w-2.5 rounded-full ${color}`} aria-hidden />
    <Text as="span" variant="body-small" color="gray-muted" className="whitespace-nowrap">
      {label}
    </Text>
  </span>
);

const letter = (n: number | null | undefined) => (n ? String.fromCharCode(64 + n) : "—");

export default function PracticeTestResult({
  session,
  examName,
  userName,
  language,
  onContinue,
  onToggleLanguage,
}: {
  session: PracticeSession;
  examName: string;
  userName: string | null;
  language: string | null;
  onContinue: () => void;
  /** Present only when the questions exist in 2+ languages: shows the same toggle as the attempt screen. */
  onToggleLanguage?: (() => void) | null;
}) {
  const t = useTranslations("PracticeTest");
  const td = useTranslations("DailyTests");
  const [openId, setOpenId] = useState<number | null>(null);
  const reduceMotion = useReducedMotion();
  // One quiet fade-up per block, staggered top to bottom (none for reduced motion).
  const rise = (delay: number) =>
    reduceMotion
      ? {}
      : {
          initial: { opacity: 0, y: 10 },
          animate: { opacity: 1, y: 0 },
          transition: { duration: 0.4, delay, ease: "easeOut" as const },
        };

  const total = session.questions.length;

  const rows = useMemo(
    () =>
      session.questions.map((q, i) => {
        const selected = session.answers[q.question_id] ?? null;
        const check = session.checks[q.question_id];
        const status: RowStatus = selected == null ? "notAttempted" : check?.is_correct ? "correct" : "incorrect";
        return { q, i, selected, check, status };
      }),
    [session],
  );

  const correct = rows.filter((r) => r.status === "correct").length;
  const incorrect = rows.filter((r) => r.status === "incorrect").length;
  const attempted = correct + incorrect;
  const accuracy = attempted > 0 ? Math.round((correct / attempted) * 100) : 0;
  const percent = total > 0 ? Math.round((correct / total) * 100) : 0;

  // Active time measured while the test was open (no limit); tests stored before that fall back to start -> finish.
  const seconds = Math.max(0, Math.round((session.elapsedMs ?? (session.finishedAt ?? Date.now()) - session.startedAt) / 1000));
  const timeTaken =
    seconds >= 60
      ? t("result.timeValue", { min: Math.floor(seconds / 60), sec: seconds % 60 })
      : t("result.timeValueShort", { sec: seconds });

  const tier = percent >= 70 ? "Good" : percent >= 40 ? "Ok" : "Keep";
  const tierTone =
    tier === "Good"
      ? "bg-[var(--color-success-bg-soft)] text-[var(--icon-positive-normal)]"
      : tier === "Ok"
        ? "bg-[var(--color-primary-bg-soft)] text-brand"
        : "bg-[var(--color-danger-bg-soft)] text-[var(--icon-negative-normal)]";

  const rawStatusIcon = (s: RowStatus) =>
    s === "correct" ? (
      <CheckCircle2 size={22} className="text-[var(--icon-positive-normal)]" />
    ) : s === "incorrect" ? (
      <XCircle size={22} className="text-[var(--icon-negative-normal)]" />
    ) : (
      <span className="block h-[18px] w-[18px] rounded-full bg-[var(--icon-gray-muted)]" aria-hidden />
    );
  // Each row's mark springs in after the blocks above have settled, top to bottom;
  // a correct answer gets the livelier spring. Not-attempted marks and reduced motion stay still.
  const statusIcon = (s: RowStatus, i: number) =>
    reduceMotion || s === "notAttempted" ? (
      rawStatusIcon(s)
    ) : (
      <motion.span
        className="inline-flex"
        initial={{ scale: 0, rotate: s === "correct" ? -25 : 0 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ type: "spring", stiffness: s === "correct" ? 420 : 300, damping: s === "correct" ? 12 : 16, delay: 0.7 + i * 0.07 }}
      >
        {rawStatusIcon(s)}
      </motion.span>
    );
  const statusLabel = (s: RowStatus) =>
    s === "correct" ? t("result.correct") : s === "incorrect" ? t("result.incorrect") : t("result.notAttempted");
  const statusText = (s: RowStatus) =>
    s === "correct"
      ? "text-[var(--icon-positive-normal)]"
      : s === "incorrect"
        ? "text-[var(--icon-negative-normal)]"
        : "text-surface-gray-muted";

  return (
    <div className="relative flex h-screen flex-col overflow-hidden bg-white">
      {/* Soft blue wash + faint hills behind the content (decorative, token colours only). Solid blue on phones so the white cards stand out; fades to white from md. */}
      <div
        className="pointer-events-none absolute inset-0 bg-[var(--color-primary-bg-soft)]/40 md:bg-gradient-to-b md:from-[var(--color-primary-bg-soft)] md:via-white md:to-white"
        aria-hidden="true"
      />
      <svg
        viewBox="0 0 1440 360"
        preserveAspectRatio="none"
        className="pointer-events-none absolute inset-x-0 bottom-0 hidden h-[34%] w-full lg:block"
        aria-hidden="true"
      >
        <path d="M0 360V210C90 150 190 120 300 170C380 205 430 250 520 360H0Z" fill="var(--color-brand)" opacity="0.05" />
        <path d="M1440 360V190C1350 120 1250 100 1150 160C1080 200 1030 260 960 360H1440Z" fill="var(--color-brand)" opacity="0.05" />
      </svg>

      <div className="relative z-10 flex min-h-0 flex-1 flex-col">
        <AttemptTopbar
          title={t("headerTitle", { exam: examName })}
          meta={t("headerMeta", { count: total })}
          quote={t("quote")}
          actions={
            onToggleLanguage ? (
              <button onClick={onToggleLanguage} aria-label={td("attempt.changeLanguage")} className="cursor-pointer">
                <LanguageIcon size={30} />
              </button>
            ) : null
          }
        />

        <div className="flex-1 overflow-y-auto">
          <div className="mx-auto flex w-full max-w-[1405px] flex-col gap-4 px-0 py-4 md:p-4 md:py-4 lg:w-[84%] lg:min-w-[980px] lg:px-0">
            <motion.div {...rise(0)} className="grid items-center gap-2 px-4 text-left md:px-0 md:text-center lg:grid-cols-[1fr_auto_1fr]">
              <span className="hidden lg:block" aria-hidden="true" />
              <div>
                <h1 className="text-2xl !font-bold leading-tight md:text-5xl">
                  {userName ? (
                    <>
                      {t("result.greatJobPrefix")} <span className="text-brand">{t("result.greatJobName", { name: userName })}</span>
                    </>
                  ) : (
                    t("result.greatJobNoName")
                  )}
                </h1>
                <p className="body-large mt-2 !font-medium">{t("result.completed")}</p>
              </div>
              <div className="pointer-events-none hidden justify-self-start pl-6 lg:block">
                <Image src="/images/practice-test-trophy.webp" alt="" width={170} height={142} priority className="h-auto w-[170px]" />
              </div>
            </motion.div>

            <motion.div {...rise(0.1)} className="relative z-10 grid items-stretch gap-4 lg:grid-cols-[1.36fr_1fr]">
              <Card bgcolor="white" border="border-none" padding="14px 24px" borderRadius={16} className="!h-auto !min-h-0 shadow-sm max-md:!rounded-none">
                <div className="flex h-full flex-col items-center gap-6 sm:flex-row">
                  <AnimatedScoreRing score={correct} total={total} label={t("result.score")} />
                  <div className="flex flex-col items-start gap-3">
                    <span className={`body-medium inline-flex items-center gap-2 rounded-lg px-3 py-1.5 !font-semibold ${tierTone}`}>
                      <Trophy size={18} />
                      {t(`result.perf${tier}`)}
                    </span>
                    <Text as="p" variant="heading-medium" weight="semibold" color="gray-normal">
                      {t("result.answeredSummary", { correct, total })}
                    </Text>
                    <Text as="p" variant="body-large" color="gray-muted">
                      {t(`result.perf${tier}Body`)}
                    </Text>
                  </div>
                </div>
              </Card>

              {/* A white card holding a pale-blue panel, as in the design. */}
              <Card bgcolor="white" border="border-none" padding="12px" borderRadius={16} className="!h-auto !min-h-0 shadow-sm max-md:!rounded-none">
                <div className="relative flex h-full flex-col justify-center overflow-hidden rounded-xl bg-[var(--color-primary-bg-soft)] p-4">
                  <MountainFlagIllustration className="pointer-events-none absolute bottom-0 right-0 hidden h-[96px] w-[170px] opacity-80 sm:block" />
                  <div className="relative flex items-start gap-4">
                    <span className="flex h-[60px] w-[60px] shrink-0 items-center justify-center rounded-full bg-white text-brand shadow-sm">
                      <BookOpen size={30} />
                    </span>
                    <div className="min-w-0 sm:max-w-[64%]">
                      <Text as="p" variant="heading-medium" weight="semibold" color="primary-normal">
                        {t("result.nextStep")}
                      </Text>
                      <Text as="p" variant="body-medium" color="gray-muted">
                        {t("result.nextStepBody")}
                      </Text>
                    </div>
                  </div>
                </div>
              </Card>
            </motion.div>

            <motion.div {...rise(0.25)} className="grid grid-cols-2 gap-px md:grid-cols-5 md:gap-3">
              <StatCard icon={<FileText size={24} />} tone="bg-[var(--color-primary-bg-soft)] text-brand" value={String(total)} label={t("result.totalQuestions")} />
              <StatCard
                icon={<Check size={26} strokeWidth={3} />}
                tone="bg-[var(--icon-positive-normal)] text-white"
                value={String(correct)}
                label={t("result.correctAnswers")}
              />
              <StatCard
                icon={<X size={26} strokeWidth={3} />}
                tone="bg-[var(--icon-negative-normal)] text-white"
                value={String(incorrect)}
                label={t("result.incorrectAnswers")}
              />
              <StatCard icon={<Timer size={24} />} tone="bg-[var(--color-primary-bg-soft)] text-brand" value={timeTaken} label={t("result.timeTaken")} />
              <StatCard
                icon={<Target size={24} />}
                tone="bg-[var(--color-warning-bg-soft)] text-[var(--color-warning-subtle)]"
                value={`${accuracy}%`}
                label={t("result.accuracy")}
                className="max-md:hidden"
              />
            </motion.div>

            <motion.div {...rise(0.4)}>
          <Card bgcolor="white" border="border-none" padding="20px 24px" borderRadius={16} className="!h-auto !min-h-0 shadow-sm max-md:!rounded-none">
            <div className="mb-4 flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
              <div>
                <h2 className="heading-medium !font-semibold">{t("result.performanceTitle")}</h2>
                <p className="body-medium text-surface-gray-muted">{t("result.performanceDesc")}</p>
              </div>
              <div className="flex flex-wrap items-center gap-x-6 gap-y-1">
                <LegendDot color="bg-[var(--icon-positive-subtle)]" label={t("result.correct")} />
                <LegendDot color="bg-[var(--icon-negative-normal)]" label={t("result.incorrect")} />
                <LegendDot color="bg-[var(--icon-gray-muted)]" label={t("result.notAttempted")} />
              </div>
            </div>

            <div className="hidden grid-cols-[56px_1fr_110px_130px_190px_190px] items-center gap-3 rounded-lg bg-[var(--background-gray-subtle)] px-3 py-2.5 md:grid">
              {(["colNumber", "colQuestion", "colYourAnswer", "colCorrectAnswer", "colResult", "colAction"] as const).map((k) => (
                <Text key={k} as="span" variant="body-medium" weight="medium" color="gray-muted">
                  {t(`result.${k}`)}
                </Text>
              ))}
            </div>

            <div className="flex flex-col divide-y divide-gray-200">
              {rows.map((r) => {
                const display = localizeQuestion(r.q, language);
                const explanation = localizeExplanation(r.check, language);
                const open = openId === r.q.question_id;
                return (
                  <div key={r.q.question_id}>
                    <div className="grid grid-cols-[28px_1fr_auto_auto] items-center gap-3 px-1 py-2.5 md:grid-cols-[56px_1fr_110px_130px_190px_190px] md:px-3">
                      <Text as="span" variant="body-medium" weight="semibold" color="gray-normal">
                        {r.i + 1}
                      </Text>
                      <div className="min-w-0 overflow-hidden">
                        <MathRender content={display.question ?? ""}>
                          <Text as="div" variant="body-medium" color="gray-normal" className="truncate">
                            {display.question}
                          </Text>
                        </MathRender>
                      </div>
                      <Text as="span" variant="body-medium" color="gray-normal" className="hidden md:block">
                        {letter(r.selected)}
                      </Text>
                      <Text as="span" variant="body-medium" color="gray-normal" className="hidden md:block">
                        {letter(r.check?.correct_option)}
                      </Text>
                      <span className="flex items-center gap-2 max-md:hidden">
                        {statusIcon(r.status, r.i)}
                        <Text as="span" variant="body-medium" className={statusText(r.status)}>
                          {statusLabel(r.status)}
                        </Text>
                      </span>
                      <span className="flex items-center justify-end gap-3">
                        <span className="md:hidden" role="img" aria-label={statusLabel(r.status)}>
                          {statusIcon(r.status, r.i)}
                        </span>
                        <Button
                          size="sm"
                          variant="outlined"
                          sx={{ borderRadius: "50px" }}
                          aria-expanded={open}
                          onClick={() => setOpenId(open ? null : r.q.question_id)}
                        >
                          <span className="flex items-center gap-1.5">
                            <span className="max-md:hidden">{open ? t("result.hide") : t("result.viewExplanation")}</span>
                            <span className="md:hidden">{open ? t("result.hide") : t("result.view")}</span>
                            <ChevronIcon size={14} variant={open ? "up" : "right"} color="var(--color-brand)" />
                          </span>
                        </Button>
                      </span>
                    </div>

                    <AnimatePresence initial={false}>
                      {open && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.25 }}
                          className="overflow-hidden"
                        >
                          <div className="mb-3 flex flex-col gap-3 pt-1">
                            <MathRender content={display.question ?? ""}>
                              <Text as="div" variant="body-large" color="gray-normal">
                                <TextMarkDown>{display.question ?? ""}</TextMarkDown>
                              </Text>
                            </MathRender>
                            {r.check && (
                              <div className="grid gap-3 md:grid-cols-2">
                                {(["1", "2", "3", "4"] as const)
                                  .map((key) => ({ key, text: display.options[key] }))
                                  .filter((o) => o.text)
                                  .map((o) => (
                                    <OptionCard
                                      key={o.key}
                                      index={Number(o.key) - 1}
                                      value={{ text: o.text }}
                                      correctOption={r.check!.correct_option - 1}
                                      userOption={r.selected != null ? r.selected - 1 : null}
                                      isQuestionAnswered
                                    />
                                  ))}
                              </div>
                            )}
                            <QuestionExplanation
                              correctOption={r.check?.correct_option}
                              explanation={explanation ?? t("noExplanation")}
                            />
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                );
              })}
            </div>
          </Card>
            </motion.div>
          </div>
        </div>

        {/* Pinned footer (same wrapper as the Daily Test attempt): never scrolls with the page. */}
        <PracticeFooter maxWidth="max-w-[1405px]" align="center">
          <div className="flex flex-col md:flex-row md:justify-center">
            <div className="w-full md:w-[424px]">
              <ShimmerButton
                size="lg"
                shimmer={!reduceMotion}
                text={t("result.continue")}
                iconPosition="right"
                icon={<ChevronIcon size={16} variant="right" color="white" />}
                onClick={onContinue}
              />
            </div>
          </div>
        </PracticeFooter>
      </div>
    </div>
  );
}

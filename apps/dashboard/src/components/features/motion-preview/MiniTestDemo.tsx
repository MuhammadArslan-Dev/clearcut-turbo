"use client";

/**
 * Motion-preview tab "Mini test": the dashboard's REAL mini-test UI (header, progress strip, QOption cards,
 * explanation, footer buttons — mirrored from preparation/components/modal/MiniTest.tsx) with sample
 * questions and local state, plus ONLY the animations from @clearcut/motion (option pick/right/wrong
 * motion, question slide, Nibbu feedback, streak toast, confetti + result). Dev/QA only — not used by any flow.
 */
import { useEffect, useRef, useState } from "react";
import { Button } from "@clearcut/ui/button";
import Text from "@clearcut/ui/text";
import { CheckIcon, ChevronIcon, CrossIcon, StarBadge } from "@/components/ui/icons";
import TickIcon from "@/components/ui/icons/tick-icon";
import WarningCirleIcon from "@/components/ui/icons/warning-circle-icon";
import QOption from "@/components/ui/cards/QuestionMaterial/Qoption/QOption";
import QuestionText from "@/components/ui/cards/QuestionMaterial/Question/QuestionText";
import Exaplanation from "@/components/ui/cards/QuestionMaterial/Explanation/Exaplanation";
import ExplanationTitle from "@/components/ui/cards/QuestionMaterial/Explanation/ExplanationTitle";
import { Confetti } from "@clearcut/motion/core";
import {
  AnswerFeedback,
  OptionMotion,
  QuestionSlide,
  StreakCombo,
  type OptionMotionState,
} from "@clearcut/motion/test/mini-test";
import { TestIntro, TestResult } from "@clearcut/motion/test/flow";
import { QUESTIONS } from "@clearcut/motion/preview/samples";

type Lang = "en" | "hi";
const LETTERS = ["A", "B", "C", "D", "E"];

export default function MiniTestDemo() {
  const [lang, setLang] = useState<Lang>("en");
  const [run, setRun] = useState(0);
  return (
    <div className="mx-auto w-full max-w-[680px]">
      <div className="mb-3 flex items-center justify-between gap-3">
        <div className="inline-flex rounded-full bg-[#e6edf5] p-[3px]">
          {(["en", "hi"] as Lang[]).map((l) => (
            <button
              key={l}
              type="button"
              onClick={() => {
                setLang(l);
                setRun((r) => r + 1);
              }}
              className={`rounded-full px-3 py-1.5 text-sm font-semibold ${lang === l ? "bg-white text-[#005cb8]" : "text-[#566c82]"}`}
            >
              {l === "en" ? "English" : "हिंदी"}
            </button>
          ))}
        </div>
        <button
          type="button"
          onClick={() => setRun((r) => r + 1)}
          className="rounded-full bg-[#e8f2fb] px-3 py-1.5 text-sm font-bold text-[#005cb8]"
        >
          ↻ Restart test
        </button>
      </div>
      <TopicTestFlow key={`${lang}-${run}`} lang={lang} onRestart={() => setRun((r) => r + 1)} />
    </div>
  );
}

const TOPIC_TITLE: Record<Lang, string> = {
  en: "Child Development & Pedagogy",
  hi: "बाल विकास एवं शिक्षाशास्त्र",
};

/**
 * Topic test = library "start test" animation (TestIntro, topic: title, meta, 3-2-1-Go countdown, Skip)
 * -> the app's mini-test UI (below) -> library result. The intro overlay is position: fixed, so it is
 * boxed in a transformed container to cover only this frame.
 */
function TopicTestFlow({ lang, onRestart }: { lang: Lang; onRestart: () => void }) {
  const [started, setStarted] = useState(false);
  if (started) return <MiniTestFlow lang={lang} onRestart={onRestart} />;
  return (
    <div
      className="relative overflow-hidden rounded-2xl border border-[var(--border-gray-subtle)] bg-white"
      style={{ height: 600, transform: "translateZ(0)" }}
    >
      <TestIntro
        type="topic"
        title={TOPIC_TITLE[lang]}
        questions={QUESTIONS[lang].length}
        minutes={5}
        lang={lang}
        onStart={() => setStarted(true)}
      />
    </div>
  );
}

function MiniTestFlow({ lang, onRestart }: { lang: Lang; onRestart: () => void }) {
  const questions = QUESTIONS[lang];
  const [i, setI] = useState(0);
  const [answers, setAnswers] = useState<(number | undefined)[]>(() => questions.map(() => undefined));
  const [checked, setChecked] = useState<boolean[]>(() => questions.map(() => false));
  const [streak, setStreak] = useState(0);
  const [combo, setCombo] = useState<number | null>(null);
  const [finished, setFinished] = useState(false);
  const started = useRef(Date.now());
  const [elapsed, setElapsed] = useState(0);

  const q = questions[i];
  const selected = answers[i];
  const hasSelected = selected !== undefined;
  const hasChecked = checked[i];
  const isLast = i === questions.length - 1;
  const isRight = hasChecked && selected === q.answer;

  const correctCount = questions.filter((qq, k) => checked[k] && answers[k] === qq.answer).length;
  const wrongCount = questions.filter((qq, k) => checked[k] && answers[k] !== undefined && answers[k] !== qq.answer).length;

  useEffect(() => {
    if (combo === null) return;
    const t = setTimeout(() => setCombo(null), 1800);
    return () => clearTimeout(t);
  }, [combo]);

  const check = () => {
    if (!hasSelected || hasChecked) return;
    setChecked((c) => c.map((v, k) => (k === i ? true : v)));
    if (selected === q.answer) {
      const n = streak + 1;
      setStreak(n);
      if (n === 3 || n === 5 || n === 10) setCombo(n);
    } else {
      setStreak(0);
    }
  };

  const finish = () => {
    setElapsed(Math.round((Date.now() - started.current) / 1000));
    setFinished(true);
  };

  if (finished) {
    return (
      <div className="relative overflow-hidden rounded-2xl border border-[var(--border-gray-subtle)] bg-white">
        <Confetti count={30} />
        <TestResult
          type="topic"
          lang={lang}
          data={{
            score: correctCount,
            maxScore: questions.length,
            cutoff: 3,
            correct: correctCount,
            wrong: wrongCount,
            skipped: questions.length - correctCount - wrongCount,
            timeTakenSec: elapsed,
            mastery: { topic: lang === "hi" ? "बाल विकास" : "Child Development", from: 1, to: correctCount >= 4 ? 2 : 1 },
          }}
          onSecondary={onRestart}
        />
      </div>
    );
  }

  return (
    <div className="relative overflow-hidden rounded-2xl border border-[var(--border-gray-subtle)] bg-white">
      {combo !== null && <StreakCombo count={combo} lang={lang} top={64} />}

      <div className="flex min-h-[50dvh] flex-col justify-between bg-white">
        {/* Header */}
        <div className="sticky top-0 z-10 flex justify-between bg-white px-3 py-4">
          <Text variant="heading-large" weight="semibold">
            Mini Test
          </Text>
          <button type="button" onClick={onRestart} aria-label="Close">
            <CrossIcon />
          </button>
        </div>

        <div className="flex w-full justify-center overflow-y-auto py-2">
          <div className="flex w-full flex-col gap-5 bg-white md:p-5">
            {/* Progress */}
            <div className="flex items-center justify-between gap-4 border-l-4 border-brand bg-brand/9 px-3 py-2">
              <div className="space-y-0.5">
                <Text as="p" variant="heading-medium" weight="semibold" color="gray-normal">
                  Questions {i + 1}/{questions.length}
                </Text>
                <div className="flex items-center gap-1">
                  <StarBadge size={20} />
                  <Text as="p" variant="body-small" weight="bold" className="whitespace-nowrap !text-[#00a251]">
                    Easy
                  </Text>
                </div>
              </div>
              <div className="px-3">
                <div className="grid grid-cols-5 gap-2">
                  {questions.map((qq, k) => {
                    const a = answers[k];
                    if (!checked[k] || a === undefined) {
                      return <div key={k} className="h-6 w-6 rounded-full border border-[var(--border-gray-subtle)] bg-white" />;
                    }
                    return a === qq.answer ? (
                      <CheckIcon key={k} size={24} variant="simple" color="#00a251" />
                    ) : (
                      <CrossIcon key={k} size={24} padding={4} radius={24} variant="filled" mode="danger" />
                    );
                  })}
                </div>
                {(correctCount > 0 || wrongCount > 0) && (
                  <div className="w-full text-center">
                    <Text variant="body-medium" weight="normal" color="gray-normal">
                      {correctCount} correct • {wrongCount} wrong
                    </Text>
                  </div>
                )}
              </div>
            </div>

            {/* motion: question slides in from the right */}
            <QuestionSlide key={q.id}>
              <div className="flex flex-col gap-5">
                <div className="px-3">
                  <QuestionText question={q.text} />
                </div>

                {/* Options */}
                <div className="grid gap-3 px-3 md:grid-cols-2">
                  {q.options.map((text, index) => {
                    const isSelected = selected === index;
                    const isCorrect = index === q.answer;
                    const showCorrect = hasChecked && isCorrect;
                    const showWrong = hasChecked && isSelected && !isCorrect;
                    const state: OptionMotionState = showCorrect ? "right" : showWrong ? "wrong" : isSelected ? "picked" : "idle";

                    return (
                      <OptionMotion key={index} state={state} index={index}>
                        <QOption
                          value={{ index, text }}
                          onClick={() => {
                            if (hasChecked) return;
                            setAnswers((a) => a.map((v, k) => (k === i ? index : v)));
                          }}
                          mainContainer={{
                            borderwidth: 2,
                            className: hasChecked ? "pointer-events-none" : undefined,
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

            {/* Explanation (+ Nibbu reaction from the motion library) */}
            {hasChecked && (
              <div className="space-y-2 px-3">
                <AnswerFeedback
                  right={isRight}
                  lang={lang}
                  detail={isRight ? undefined : `${LETTERS[q.answer]}. ${q.options[q.answer]}`}
                />
                <ExplanationTitle title=" Answer & Explanation" index={q.answer} />
                <Exaplanation explanation={q.explanation ?? ""} />
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-white px-3 py-2">
          <div className="mx-auto flex max-w-[420px] gap-3">
            {i > 0 && (
              <Button variant="soft" color="gray" onClick={() => setI(i - 1)} fullWidth sx={{ borderRadius: "50px" }}>
                <div className="flex items-center gap-2">
                  <ChevronIcon variant="left" color="black" type="double" />
                  <p>Previous</p>
                </div>
              </Button>
            )}

            {!hasChecked && (
              <div className="flex w-full flex-col items-center gap-2">
                <div className="w-[200px]">
                  <Button disabled={!hasSelected} onClick={check} color="primary" fullWidth sx={{ borderRadius: "50px" }}>
                    <div className="flex items-center gap-2">
                      <p>Check My Answer</p>
                      <TickIcon color="white" />
                    </div>
                  </Button>
                </div>
                {i === 0 && (
                  <div className="flex items-center gap-1">
                    <WarningCirleIcon size={20} />
                    <Text as="p" variant="body-small" weight="normal" color="gray-subtle">
                      Select an option to continue
                    </Text>
                  </div>
                )}
              </div>
            )}

            {hasChecked && !isLast && (
              <div className="flex w-full flex-col items-center gap-2">
                <div className="w-[200px]">
                  <Button onClick={() => setI(i + 1)} variant="soft" color="gray" fullWidth sx={{ borderRadius: "50px" }}>
                    <div className="flex items-center gap-2">
                      <p>Next Question </p>
                      <ChevronIcon variant="right" color="black" type="double" />
                    </div>
                  </Button>
                </div>
              </div>
            )}

            {hasChecked && isLast && (
              <Button onClick={finish} color="primary" fullWidth sx={{ borderRadius: "50px" }}>
                <div className="flex items-center gap-2">
                  <p>Finish Topic Test</p>
                  <ChevronIcon variant="right" color="white" type="double" />
                </div>
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

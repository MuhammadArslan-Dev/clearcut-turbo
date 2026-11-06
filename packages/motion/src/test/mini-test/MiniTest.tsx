"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import ui from "../../core/ui.module.css";
import s from "./minitest.module.css";
import { NibMascot } from "../../nibbu/NibMascot";

type Lang = "en" | "hi";

export type Question = {
  id: string;
  text: string;
  options: string[];
  /** index of the correct option */
  answer: number;
  explanation?: string;
};

export type MiniTestResult = {
  answers: (number | null)[];
  correct: number;
  wrong: number;
  skipped: number;
  timeTakenSec: number;
  bestStreak: number;
};

export type MiniTestProps = {
  questions: Question[];
  /**
   * focus — one question at a time, instant feedback, streaks (practice on the preparation page)
   * exam  — real-exam feel: OMR bubbles, timer ring, question palette, mark for review, submit at end
   */
  layout?: "focus" | "exam";
  title?: string;
  /** exam layout: time limit in minutes (default 1 per question) */
  minutes?: number;
  lang?: Lang;
  onFinish: (r: MiniTestResult) => void;
  onExit?: () => void;
};

const L = {
  check: { en: "Check", hi: "जाँचें" },
  continue: { en: "Continue", hi: "आगे बढ़ें" },
  correct: { en: "Correct!", hi: "सही जवाब!" },
  wrong: { en: "Not quite", hi: "सही नहीं" },
  answerIs: { en: "Correct answer:", hi: "सही जवाब:" },
  inARow: { en: "in a row!", hi: "लगातार सही!" },
  q: { en: "Question", hi: "प्रश्न" },
  of: { en: "of", hi: "/" },
  exit: { en: "Exit test", hi: "टेस्ट छोड़ें" },
  prev: { en: "Previous", hi: "पिछला" },
  next: { en: "Next", hi: "अगला" },
  submit: { en: "Submit", hi: "सबमिट" },
  submitTest: { en: "Submit test", hi: "टेस्ट सबमिट करें" },
  keepGoing: { en: "Keep going", hi: "जारी रखें" },
  mark: { en: "Mark for review", hi: "रिव्यू के लिए मार्क" },
  marked: { en: "Marked", hi: "मार्क किया" },
  palette: { en: "All questions", hi: "सभी प्रश्न" },
  answered: { en: "Answered", hi: "हल किए" },
  notAnswered: { en: "Not answered", hi: "बाकी" },
  current: { en: "Current", hi: "अभी" },
  sure: { en: "Submit your test?", hi: "टेस्ट सबमिट करें?" },
  timeLeft: { en: "Time left", hi: "बचा समय" },
  letters: { en: ["A", "B", "C", "D", "E"], hi: ["क", "ख", "ग", "घ", "ङ"] },
};

export function MiniTest(props: MiniTestProps) {
  return props.layout === "exam" ? <ExamLayout {...props} /> : <FocusLayout {...props} />;
}

/* ====================================================================== */
/* FOCUS — Duolingo-style: one card, check, instant feedback sheet, streak */
/* ====================================================================== */

function FocusLayout({ questions, title, lang = "en", onFinish, onExit }: MiniTestProps) {
  const [i, setI] = useState(0);
  const [picked, setPicked] = useState<number | null>(null);
  const [checked, setChecked] = useState(false);
  const [answers, setAnswers] = useState<(number | null)[]>(() => questions.map(() => null));
  const [streak, setStreak] = useState(0);
  const [best, setBest] = useState(0);
  const [combo, setCombo] = useState<number | null>(null);
  const started = useRef(Date.now());
  const q = questions[i];
  const isRight = checked && picked === q.answer;
  const done = answers.filter((a) => a !== null).length;

  const check = useCallback(() => {
    if (picked === null || checked) return;
    setChecked(true);
    setAnswers((a) => a.map((v, k) => (k === i ? picked : v)));
    if (picked === q.answer) {
      const n = streak + 1;
      setStreak(n);
      setBest((b) => Math.max(b, n));
      if (n === 3 || n === 5 || n === 10) setCombo(n);
    } else {
      setStreak(0);
    }
  }, [picked, checked, i, q.answer, streak]);

  const next = useCallback(() => {
    if (!checked) return;
    if (i === questions.length - 1) {
      const final = answers;
      const correct = final.filter((a, k) => a === questions[k].answer).length;
      const wrong = final.filter((a, k) => a !== null && a !== questions[k].answer).length;
      onFinish({ answers: final, correct, wrong, skipped: questions.length - correct - wrong, timeTakenSec: Math.round((Date.now() - started.current) / 1000), bestStreak: best });
      return;
    }
    setI(i + 1);
    setPicked(null);
    setChecked(false);
  }, [checked, i, questions, answers, best, onFinish]);

  useEffect(() => {
    if (combo === null) return;
    const t = setTimeout(() => setCombo(null), 1800);
    return () => clearTimeout(t);
  }, [combo]);

  // keyboard: 1–4 pick, Enter checks / continues
  useEffect(() => {
    const on = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLButtonElement && e.key === "Enter") return;
      const n = Number(e.key);
      if (!checked && n >= 1 && n <= q.options.length) setPicked(n - 1);
      if (e.key === "Enter") (checked ? next : check)();
    };
    addEventListener("keydown", on);
    return () => removeEventListener("keydown", on);
  }, [checked, q.options.length, next, check]);

  return (
    <div className={`${ui.root} ${ui.rootTokens} ${s.focus}`}>
      <div className={s.topBar}>
        <button type="button" className={s.iconBtn} onClick={onExit} aria-label={L.exit[lang]}>
          <svg viewBox="0 0 24 24"><path d="M6 6l12 12M18 6L6 18" /></svg>
        </button>
        <div className={s.progress} role="progressbar" aria-valuemin={0} aria-valuemax={questions.length} aria-valuenow={done} aria-label={title}>
          <span style={{ transform: `scaleX(${done / questions.length})` }} />
        </div>
        <span className={`${s.streak} ${streak >= 2 ? s.streakOn : ""}`} aria-label={`${streak} ${L.inARow[lang]}`}>
          <Flame />
          <b key={streak}>{streak}</b>
        </span>
      </div>

      {combo !== null && (
        <div className={s.combo} role="status">
          <Flame /> {combo} {L.inARow[lang]}
        </div>
      )}

      <div key={q.id} className={s.qCard}>
        <span className={s.qMeta}>
          {L.q[lang]} {i + 1} {L.of[lang]} {questions.length}
        </span>
        <h2 className={s.qText}>{q.text}</h2>
        <div className={s.options} role="radiogroup" aria-label={q.text}>
          {q.options.map((opt, k) => {
            const state = !checked
              ? picked === k ? s.optPicked : ""
              : k === q.answer ? s.optRight : k === picked ? s.optWrong : s.optDim;
            return (
              <button
                key={k}
                type="button"
                role="radio"
                aria-checked={picked === k}
                disabled={checked}
                className={`${s.opt} ${state}`}
                style={{ animationDelay: `${0.08 + k * 0.05}s` }}
                onClick={() => setPicked(k)}
              >
                <span className={s.letter}>{L.letters[lang][k]}</span>
                <span className={s.optText}>{opt}</span>
                {checked && k === q.answer && (
                  <span className={s.optIcon}><svg viewBox="0 0 16 16"><path d="M4.2 8.3l2.5 2.4 5-5.2" /></svg></span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      <div className={`${s.footer} ${checked ? (isRight ? s.footRight : s.footWrong) : ""}`}>
        {checked && (
          <div className={s.feedback} role="status">
            <div className={s.fbNib} aria-hidden="true">
              <div className={isRight ? s.fbHop : s.fbNod}>
                <NibMascot className={ui.mascot} mood={isRight ? "happy" : "determined"} accessory={isRight ? "none" : "headband"} />
              </div>
            </div>
            <div className={s.fbText}>
              <b>{isRight ? L.correct[lang] : L.wrong[lang]}</b>
              {!isRight && (
                <span>
                  {L.answerIs[lang]} {L.letters[lang][q.answer]}. {q.options[q.answer]}
                </span>
              )}
              {q.explanation && <span className={s.expl}>{q.explanation}</span>}
            </div>
          </div>
        )}
        <button
          type="button"
          className={`${ui.btn} ${ui.btnBlock} ${checked ? (isRight ? ui.success : ui.danger) : ui.primary} ${s.mainBtn}`}
          disabled={!checked && picked === null}
          onClick={checked ? next : check}
        >
          {checked ? L.continue[lang] : L.check[lang]}
        </button>
      </div>
    </div>
  );
}

function Flame() {
  return (
    <svg viewBox="0 0 70 90" aria-hidden="true">
      <path fill="#ff6a1f" d="M35 4C40 22 62 30 62 56c0 18-12 30-27 30S8 74 8 56c0-14 8-22 14-30 2 10 6 14 10 14-2-12-2-24 3-36Z" />
      <path fill="#ffd34d" d="M35 40c5 12 15 16 15 26 0 10-7 16-15 16s-15-6-15-16c0-8 6-12 8-18 2 6 4 8 6 8-1-6-1-10 1-16Z" />
    </svg>
  );
}

/* ====================================================================== */
/* EXAM — OMR bubbles, timer ring, palette drawer, mark for review         */
/* ====================================================================== */

function ExamLayout({ questions, title, minutes, lang = "en", onFinish, onExit }: MiniTestProps) {
  const total = Math.round((minutes ?? questions.length) * 60);
  const [i, setI] = useState(0);
  const [dir, setDir] = useState<1 | -1>(1);
  const [answers, setAnswers] = useState<(number | null)[]>(() => questions.map(() => null));
  const [marked, setMarked] = useState<boolean[]>(() => questions.map(() => false));
  const [left, setLeft] = useState(total);
  const [sheet, setSheet] = useState<"none" | "palette" | "confirm">("none");
  const finished = useRef(false);
  const q = questions[i];

  const finish = useCallback(() => {
    if (finished.current) return;
    finished.current = true;
    const correct = answers.filter((a, k) => a === questions[k].answer).length;
    const wrong = answers.filter((a, k) => a !== null && a !== questions[k].answer).length;
    onFinish({ answers, correct, wrong, skipped: questions.length - correct - wrong, timeTakenSec: total - left, bestStreak: 0 });
  }, [answers, questions, onFinish, total, left]);

  useEffect(() => {
    const id = setInterval(() => setLeft((l) => Math.max(0, l - 1)), 1000);
    return () => clearInterval(id);
  }, []);
  useEffect(() => {
    if (left === 0) finish();
  }, [left, finish]);

  const go = (n: number) => {
    if (n < 0 || n >= questions.length) return;
    setDir(n > i ? 1 : -1);
    setI(n);
    setSheet("none");
  };
  const pick = (k: number) => setAnswers((a) => a.map((v, idx) => (idx === i ? (v === k ? null : k) : v)));
  const toggleMark = () => setMarked((m) => m.map((v, idx) => (idx === i ? !v : v)));

  const frac = left / total;
  const timeTone = frac <= 0.1 ? s.timeLow : frac <= 0.25 ? s.timeWarn : "";
  const mm = String(Math.floor(left / 60)).padStart(2, "0");
  const ss = String(left % 60).padStart(2, "0");
  const answeredN = answers.filter((a) => a !== null).length;
  const markedN = marked.filter(Boolean).length;

  return (
    <div className={`${ui.root} ${ui.rootTokens} ${s.exam}`}>
      <header className={s.examHead}>
        <button type="button" className={s.iconBtn} onClick={onExit} aria-label={L.exit[lang]}>
          <svg viewBox="0 0 24 24"><path d="M15 6l-6 6 6 6" /></svg>
        </button>
        <div className={s.examTitle}>
          <b>{title}</b>
          <span>
            {L.q[lang]} {i + 1} {L.of[lang]} {questions.length}
          </span>
        </div>
        <div className={`${s.timer} ${timeTone}`} role="timer" aria-label={`${L.timeLeft[lang]} ${mm}:${ss}`}>
          <svg viewBox="0 0 44 44" aria-hidden="true">
            <circle className={s.timerTrack} cx="22" cy="22" r="18" />
            <circle className={s.timerArc} cx="22" cy="22" r="18" pathLength={1} style={{ strokeDashoffset: 1 - frac }} />
          </svg>
          <span>{mm}:{ss}</span>
        </div>
        <button type="button" className={s.iconBtn} onClick={() => setSheet("palette")} aria-label={L.palette[lang]}>
          <svg viewBox="0 0 24 24"><path d="M5 5h4v4H5zM15 5h4v4h-4zM5 15h4v4H5zM15 15h4v4h-4z" /></svg>
        </button>
      </header>

      <div className={s.dots} aria-hidden="true">
        {questions.map((_, k) => (
          <span key={k} className={`${answers[k] !== null ? s.dotDone : ""} ${marked[k] ? s.dotMarked : ""} ${k === i ? s.dotNow : ""}`} />
        ))}
      </div>

      <div key={q.id} className={`${s.examCard} ${dir === 1 ? s.fromRight : s.fromLeft}`}>
        <h2 className={s.qText}>
          <span className={s.qNum}>{i + 1}.</span> {q.text}
        </h2>
        <div className={s.omr} role="radiogroup" aria-label={q.text}>
          {q.options.map((opt, k) => (
            <button key={k} type="button" role="radio" aria-checked={answers[i] === k} className={`${s.omrRow} ${answers[i] === k ? s.omrOn : ""}`} onClick={() => pick(k)}>
              <span className={s.bubble}>
                <i />
                <span>{L.letters[lang][k]}</span>
              </span>
              <span className={s.optText}>{opt}</span>
            </button>
          ))}
        </div>
        <button type="button" className={`${s.markBtn} ${marked[i] ? s.markOn : ""}`} aria-pressed={marked[i]} onClick={toggleMark}>
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 21V4h10l-1.5 4L16 12H6" /></svg>
          {marked[i] ? L.marked[lang] : L.mark[lang]}
        </button>
      </div>

      <div className={s.examFoot}>
        <button type="button" className={`${ui.btn} ${ui.secondary}`} onClick={() => go(i - 1)} disabled={i === 0}>
          {L.prev[lang]}
        </button>
        {i < questions.length - 1 ? (
          <button type="button" className={`${ui.btn} ${ui.primary}`} onClick={() => go(i + 1)}>
            {L.next[lang]}
          </button>
        ) : (
          <button type="button" className={`${ui.btn} ${ui.success}`} onClick={() => setSheet("confirm")}>
            {L.submit[lang]}
          </button>
        )}
      </div>

      {sheet !== "none" && <button type="button" className={s.scrim} aria-label={L.keepGoing[lang]} onClick={() => setSheet("none")} />}
      {sheet === "palette" && (
        <div className={s.sheet} role="dialog" aria-label={L.palette[lang]}>
          <span className={s.grip} />
          <h3>{L.palette[lang]}</h3>
          <div className={s.grid}>
            {questions.map((_, k) => (
              <button
                key={k}
                type="button"
                className={`${s.cell} ${answers[k] !== null ? s.cellDone : ""} ${marked[k] ? s.cellMarked : ""} ${k === i ? s.cellNow : ""}`}
                style={{ animationDelay: `${0.04 + k * 0.025}s` }}
                onClick={() => go(k)}
              >
                {k + 1}
              </button>
            ))}
          </div>
          <div className={s.legend}>
            <span><i className={s.cellDone} />{L.answered[lang]}</span>
            <span><i className={s.cellMarked} />{L.marked[lang]}</span>
            <span><i />{L.notAnswered[lang]}</span>
          </div>
          <button type="button" className={`${ui.btn} ${ui.success} ${ui.btnBlock}`} onClick={() => setSheet("confirm")}>
            {L.submitTest[lang]}
          </button>
        </div>
      )}
      {sheet === "confirm" && (
        <div className={s.sheet} role="dialog" aria-label={L.sure[lang]}>
          <span className={s.grip} />
          <h3>{L.sure[lang]}</h3>
          <div className={s.summary}>
            <span className={s.sumDone}><b>{answeredN}</b>{L.answered[lang]}</span>
            <span className={s.sumMarked}><b>{markedN}</b>{L.marked[lang]}</span>
            <span><b>{questions.length - answeredN}</b>{L.notAnswered[lang]}</span>
          </div>
          <button type="button" className={`${ui.btn} ${ui.success} ${ui.btnBlock}`} onClick={finish}>
            {L.submitTest[lang]}
          </button>
          <button type="button" className={`${ui.btn} ${ui.ghost} ${ui.btnBlock}`} onClick={() => setSheet("none")}>
            {L.keepGoing[lang]}
          </button>
        </div>
      )}
    </div>
  );
}

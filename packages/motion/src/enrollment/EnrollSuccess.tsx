"use client";

import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";
import ui from "../core/ui.module.css";
import s from "./enroll.module.css";
import { OnboardingComplete } from "../onboarding";
import { NibMascot } from "../nibbu/NibMascot";
import { Confetti } from "../core/Confetti";
import { usePrefersReducedMotion } from "../core/useCountUp";

type Lang = "en" | "hi";

/** One step of the user's selection (the real flow is a path: Paper -> one option per group). */
export type SelectionItem = { title: string; subtitle?: string };

export type EnrollSuccessProps = {
  /** e.g. "HTET Exam" */
  exam: string;
  /** What the user picked in the enrolment sheet, in order: the paper, then each chosen option. */
  selection: (string | SelectionItem)[];
  /** The exam's logo above the mascot in the second half (optional). */
  logo?: ReactNode;
  /** The sheet's step indicator, shown filled at the top of the second half, e.g. { current: 2, total: 2 } (optional). */
  progress?: { current: number; total: number };
  /** Flip to true when the Preparation page data is ready. The last step never completes before this. */
  ready: boolean;
  /** Called after the curtain lifts: navigate to the Preparation page here. */
  onDone: () => void;
  lang?: Lang;
  /** "screen" (default) covers the viewport; "parent" fills the nearest positioned parent (inside the sheet / modal). */
  fit?: "screen" | "parent";
};

const T = {
  exam: { en: "Exam", hi: "परीक्षा" },
  selected: { en: "selected", hi: "चुने गए" },
  stamp: { en: "ENROLLED", hi: "नामांकित" },
  adding: { en: "Adding your subjects", hi: "आपके विषय जोड़े जा रहे हैं" },
  title: { en: (e: string) => `You're enrolled in ${e}!`, hi: (e: string) => `${e} में आपका नामांकन हो गया!` },
  highlight: { en: "enrolled", hi: "नामांकन" },
  sub: { en: "You can change or add anytime", hi: "आप कभी भी बदल या जोड़ सकते हैं" },
  building: { en: "Setting up your Preparation page", hi: "आपका प्रिपरेशन पेज तैयार हो रहा है" },
  buildingSub: { en: "This takes a few seconds", hi: "बस कुछ सेकंड" },
  steps: {
    en: ["Adding your subjects", "Building your syllabus", "Opening your Preparation page"],
    hi: ["आपके विषय जोड़े जा रहे हैं", "आपका सिलेबस बन रहा है", "प्रिपरेशन पेज खुल रहा है"],
  },
};

type Phase = "collect" | "enrolled" | "exit";

function Highlighted({ text, word }: { text: string; word: string }) {
  const i = text.indexOf(word);
  if (i < 0) return <>{text}</>;
  return (
    <>
      {text.slice(0, i)}
      <span className={s.hl}>{word}</span>
      {text.slice(i + word.length)}
    </>
  );
}

/** First half: the picks fly into the exam ticket, it gets stamped, then the ticket leaves. */
function EnrollTicket({ exam, picks, lang, fit, onFinished }: { exam: string; picks: string[]; lang: Lang; fit: "screen" | "parent"; onFinished: () => void }) {
  const reduced = usePrefersReducedMotion();
  const [phase, setPhase] = useState<Phase>("collect");
  const [landed, setLanded] = useState(0);
  const [offsets, setOffsets] = useState<{ x: number; y: number }[]>([]);
  const chipRefs = useRef<(HTMLLIElement | null)[]>([]);
  const ticketRef = useRef<HTMLDivElement>(null);
  const finishedRef = useRef(onFinished);
  finishedRef.current = onFinished;

  const FLY_START = reduced ? 150 : 650;
  const FLY_GAP = reduced ? 40 : 110;
  const FLY_MS = reduced ? 1 : 460;

  // measure where each chip has to fly to (the ticket's counter)
  useEffect(() => {
    const target = ticketRef.current?.querySelector("[data-target]")?.getBoundingClientRect();
    if (!target) return;
    setOffsets(
      chipRefs.current.map((el) => {
        const r = el?.getBoundingClientRect();
        if (!r) return { x: 0, y: 0 };
        return { x: target.left + target.width / 2 - (r.left + r.width / 2), y: target.top + target.height / 2 - (r.top + r.height / 2) };
      }),
    );
  }, [picks.length]);

  useEffect(() => {
    const timers = picks.map((_, i) => setTimeout(() => setLanded(i + 1), FLY_START + i * FLY_GAP + FLY_MS));
    timers.push(setTimeout(() => setPhase("enrolled"), FLY_START + picks.length * FLY_GAP + FLY_MS + 180));
    return () => timers.forEach(clearTimeout);
  }, [picks.length, FLY_START, FLY_GAP, FLY_MS]);

  useEffect(() => {
    if (phase !== "enrolled") return;
    const t = setTimeout(() => setPhase("exit"), reduced ? 500 : 1400);
    return () => clearTimeout(t);
  }, [phase, reduced]);

  useEffect(() => {
    if (phase !== "exit") return;
    const t = setTimeout(() => finishedRef.current(), reduced ? 120 : 420);
    return () => clearTimeout(t);
  }, [phase, reduced]);

  const stamped = phase !== "collect";

  return (
    <div className={`${ui.root} ${ui.rootTokens} ${s.overlay} ${fit === "parent" ? s.parent : ""} ${phase === "exit" ? s.exit : ""}`} role="dialog" aria-modal="true" aria-label={T.title[lang](exam)}>
      <div className={s.stage}>
        <ul className={s.chips} aria-hidden="true">
          {picks.map((p, i) => {
            const o = offsets[i];
            const style = {
              "--dx": `${o?.x ?? 0}px`,
              "--dy": `${o?.y ?? 120}px`,
              animationDelay: `${i * 0.07}s, ${(FLY_START + i * FLY_GAP) / 1000}s`,
            } as CSSProperties;
            return (
              <li key={`${p}-${i}`} ref={(el) => { chipRefs.current[i] = el; }} className={s.chip} style={style}>
                {p}
              </li>
            );
          })}
        </ul>

        <div ref={ticketRef} className={`${s.ticket} ${stamped ? s.ticketStamped : ""}`}>
          {stamped && <Confetti count={20} spread={0.8} />}
          <span className={s.strip} />
          <div className={s.ticketBody}>
            <span className={s.label}>{T.exam[lang]}</span>
            <b className={s.exam}>{exam}</b>
            <span className={s.count} data-target>
              <span key={landed} className={s.countNum}>{landed}</span> {T.selected[lang]}
            </span>
          </div>
          <span className={s.notch} />
          <span className={`${s.notch} ${s.notchB}`} />
          {stamped && <span className={s.stamp}>{T.stamp[lang]}</span>}
          <div className={s.nib} aria-hidden="true">
            <div className={stamped ? s.cheer : s.peek}>
              <NibMascot className={ui.mascot} mood={stamped ? "wow" : "happy"} />
            </div>
          </div>
        </div>

        <div className={s.titles}>
          <h2 key={stamped ? "t2" : "t1"} className={s.title}>
            {stamped ? <Highlighted text={T.title[lang](exam)} word={T.highlight[lang]} /> : T.adding[lang]}
          </h2>
        </div>

        <span className={ui.srOnly} role="status" aria-live="polite">
          {stamped ? T.title[lang](exam) : T.adding[lang]}
        </span>
      </div>
    </div>
  );
}

/**
 * Shown after "Start Learning" in the exam-enrolment sheet, until the Preparation page is ready.
 * 1) the picks fly into the exam ticket and it is stamped ENROLLED; 2) the onboarding completion animation (same mascot,
 * motion, timing and curtain, see ../onboarding) shows the real selection path as the app's selected cards while the
 * Preparation page loads. `ready` is honoured by the second half only, so slow data never ends the animation early.
 */
export function EnrollSuccess({ exam, selection, logo, progress, ready, onDone, lang = "en", fit = "screen" }: EnrollSuccessProps) {
  const [half, setHalf] = useState<"ticket" | "build">("ticket");
  const picks: SelectionItem[] = selection.map((x) => (typeof x === "string" ? { title: x } : x));

  if (half === "ticket") {
    return <EnrollTicket exam={exam} picks={picks.map((p) => p.title)} lang={lang} fit={fit} onFinished={() => setHalf("build")} />;
  }
  return (
    <OnboardingComplete
      lang={lang}
      fit={fit}
      ready={ready}
      onDone={onDone}
      logo={logo}
      progress={progress}
      summary={picks}
      title={T.title[lang](exam)}
      highlight={T.highlight[lang]}
      subtitle={T.sub[lang]}
      buildingTitle={T.building[lang]}
      buildingSubtitle={T.buildingSub[lang]}
      steps={T.steps[lang]}
    />
  );
}

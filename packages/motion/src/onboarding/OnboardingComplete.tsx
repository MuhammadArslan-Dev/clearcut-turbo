"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import ui from "../core/ui.module.css";
import s from "./onboarding.module.css";
import { NibMascot } from "../nibbu/NibMascot";
import { Confetti } from "../core/Confetti";
import { usePrefersReducedMotion } from "../core/useCountUp";

type Lang = "en" | "hi";

/** One thing the user chose in onboarding, drawn like the app's own selected option card. */
export type SummaryItem = {
  title: string;
  /** Second line, e.g. "Haryana (State)". */
  subtitle?: string;
  /** Leading artwork, e.g. the language circle icon. */
  icon?: ReactNode;
};

export type OnboardingCompleteProps = {
  /** First name for the headline. */
  name?: string;
  /** What the user chose, shown as the app's selected option cards, e.g. [{ title: "हिंदी", icon }, { title: "HTET Exam", subtitle: "Haryana (State)" }]. Plain strings work too. */
  summary: (string | SummaryItem)[];
  /** The app's brand logo, shown above the mascot's headline (optional). */
  logo?: ReactNode;
  /** Step indicator like the onboarding screens' "2/2" + bars, shown filled at the top (optional). */
  progress?: { current: number; total: number };
  /** "screen" (default) covers the viewport; "parent" fills the nearest positioned parent (e.g. inside a sheet). */
  fit?: "screen" | "parent";
  /** Flip to true when the dashboard data has loaded. The last step never completes before this. */
  ready: boolean;
  /** Called after the curtain lifts — route to the dashboard here (or render it underneath). */
  onDone: () => void;
  lang?: Lang;
  /** Override the three loading steps. */
  steps?: string[];
  /** How the layer leaves: "lift" (default) slides up like a curtain; "none" leaves it to the host (e.g. it fades its own frame out on `onReveal`). */
  exit?: "lift" | "none";
  /** Called when the exit starts (the steps are done), before `onDone`. */
  onReveal?: () => void;
  /** Copy overrides, so other flows (e.g. enrollment) reuse this exact animation with their own wording. */
  title?: string;
  /** The word of `title` drawn in the brand blue. */
  highlight?: string;
  subtitle?: string;
  buildingTitle?: string;
  buildingSubtitle?: string;
};

const T = {
  title: { en: (n?: string) => (n ? `You're all set, ${n}!` : "You're all set!"), hi: (n?: string) => (n ? `सब तैयार है, ${n}!` : "सब तैयार है!") },
  highlight: { en: "all set", hi: "तैयार" },
  sub: { en: "You can change these anytime", hi: "आप इन्हें कभी भी बदल सकते हैं" },
  building: { en: "Setting up your dashboard", hi: "आपका डैशबोर्ड तैयार हो रहा है" },
  buildingSub: { en: "This takes a few seconds", hi: "बस कुछ सेकंड" },
  steps: {
    en: ["Saving your exam", "Setting up your courses", "Opening your dashboard"],
    hi: ["आपका एग्ज़ाम सेव हो रहा है", "आपके कोर्स तैयार हो रहे हैं", "डैशबोर्ड खुल रहा है"],
  },
};

type Phase = "celebrate" | "building" | "reveal";

/** Colours one word of the headline in the brand blue, like the app's own headings. */
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

export function OnboardingComplete({ name, summary, logo, progress, fit = "screen", exit = "lift", onReveal, ready, onDone, lang = "en", steps, title, highlight, subtitle, buildingTitle, buildingSubtitle }: OnboardingCompleteProps) {
  const titleText = title ?? T.title[lang](name);
  const highlightWord = highlight ?? T.highlight[lang];
  const subText = subtitle ?? T.sub[lang];
  const buildTitle = buildingTitle ?? T.building[lang];
  const buildSub = buildingSubtitle ?? T.buildingSub[lang];
  const items: SummaryItem[] = summary.map((x) => (typeof x === "string" ? { title: x } : x));
  const reduced = usePrefersReducedMotion();
  const labels = steps ?? T.steps[lang];
  const [phase, setPhase] = useState<Phase>("celebrate");
  const [doneCount, setDoneCount] = useState(0);
  const buildStart = useRef(0);
  const doneRef = useRef(onDone);
  doneRef.current = onDone;
  const revealRef = useRef(onReveal);
  revealRef.current = onReveal;

  // celebrate → building
  useEffect(() => {
    const t = setTimeout(() => {
      buildStart.current = Date.now();
      setPhase("building");
    }, reduced ? 700 : 2300);
    return () => clearTimeout(t);
  }, [reduced]);

  // steps tick in order; the last one waits for `ready`
  useEffect(() => {
    if (phase !== "building") return;
    const beat = reduced ? 250 : 650;
    if (doneCount < labels.length - 1) {
      const t = setTimeout(() => setDoneCount((c) => c + 1), beat);
      return () => clearTimeout(t);
    }
    if (doneCount === labels.length - 1 && ready) {
      const t = setTimeout(() => setDoneCount(labels.length), beat);
      return () => clearTimeout(t);
    }
    if (doneCount === labels.length) {
      const t = setTimeout(() => setPhase("reveal"), reduced ? 200 : 420);
      return () => clearTimeout(t);
    }
  }, [phase, doneCount, ready, labels.length, reduced]);

  // reveal → done
  useEffect(() => {
    if (phase !== "reveal") return;
    revealRef.current?.();
    const t = setTimeout(() => doneRef.current(), reduced ? 150 : 620);
    return () => clearTimeout(t);
  }, [phase, reduced]);

  const building = phase !== "celebrate";

  return (
    <div
      className={`${ui.root} ${ui.rootTokens} ${s.overlay} ${fit === "parent" ? s.parent : ""} ${phase === "reveal" && exit === "lift" ? s.lift : ""}`}
      role="dialog"
      aria-modal="true"
      aria-label={titleText}
    >
      <div className={`${s.stage} ${building ? s.isBuilding : ""}`}>
        {progress && (
          <div className={s.progress} aria-hidden="true">
            <span className={s.counter}>{progress.current}/{progress.total}</span>
            <span className={s.bars}>
              {Array.from({ length: progress.total }, (_, i) => (
                <i key={i} className={i < progress.current ? s.barOn : undefined} style={{ animationDelay: `${0.1 + i * 0.12}s` }} />
              ))}
            </span>
          </div>
        )}
        {logo && <div className={s.logo} aria-hidden="true">{logo}</div>}
        <div className={s.hero} aria-hidden="true">
          <span className={s.ring} />
          <span className={`${s.ring} ${s.ring2}`} />
          {!building && <Confetti delay={0.55} />}
          <div className={s.nib}>
            <div className={phase === "reveal" ? s.wave : building ? s.bob : s.jump}>
              <NibMascot className={ui.mascot} mood={building ? "happy" : "wow"} />
            </div>
          </div>
        </div>

        <div className={s.titles}>
          <div className={`${s.titleSet} ${building ? s.out : s.in}`}>
            <h2 className={s.title}><Highlighted text={titleText} word={highlightWord} /></h2>
            <p className={s.sub}>{subText}</p>
          </div>
          <div className={`${s.titleSet} ${building ? s.in : s.hidden}`} aria-hidden={!building}>
            <h2 className={s.title}>{buildTitle}</h2>
            <p className={s.sub}>{buildSub}</p>
          </div>
        </div>

        <ul className={s.cards}>
          {items.map((c, i) => (
            <li key={`${c.title}-${i}`} className={s.card} style={{ animationDelay: `${0.75 + i * 0.14}s` }}>
              {c.icon && <span className={s.cardIcon}>{c.icon}</span>}
              <span className={s.cardText}>
                <b>{c.title}</b>
                {c.subtitle && <small>{c.subtitle}</small>}
              </span>
              <span className={s.check}>
                <svg viewBox="0 0 16 16"><path d="M4.2 8.3l2.5 2.4 5-5.2" pathLength={1} style={{ animationDelay: `${1.0 + i * 0.14}s` }} /></svg>
              </span>
            </li>
          ))}
        </ul>

        <ol className={`${s.steps} ${building ? s.stepsIn : ""}`} aria-hidden={!building}>
          {labels.map((l, i) => {
            const state = i < doneCount ? "done" : i === doneCount ? "active" : "todo";
            return (
              <li key={l} className={s[state]} style={{ animationDelay: `${0.1 + i * 0.08}s` }}>
                <span className={s.mark}>
                  {state === "done" ? (
                    <svg viewBox="0 0 16 16"><path d="M4.2 8.3l2.5 2.4 5-5.2" pathLength={1} /></svg>
                  ) : (
                    <i />
                  )}
                </span>
                {l}
              </li>
            );
          })}
        </ol>

        <span className={ui.srOnly} role="status" aria-live="polite">
          {building ? `${buildTitle}. ${labels[Math.min(doneCount, labels.length - 1)]}` : titleText}
        </span>
      </div>
    </div>
  );
}

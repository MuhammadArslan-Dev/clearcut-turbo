"use client";

import { useEffect, useRef, useState } from "react";
import ui from "../core/ui.module.css";
import s from "./onboarding.module.css";
import { NibMascot } from "../nibbu/NibMascot";
import { Confetti } from "../core/Confetti";
import { usePrefersReducedMotion } from "../core/useCountUp";

type Lang = "en" | "hi";

export type OnboardingCompleteProps = {
  /** First name for the headline. */
  name?: string;
  /** What the user chose in onboarding, shown as chips, e.g. ["HTET Level 2", "Hindi medium", "20 min a day"]. */
  summary: string[];
  /** Flip to true when the dashboard data has loaded. The last step never completes before this. */
  ready: boolean;
  /** Called after the curtain lifts — route to the dashboard here (or render it underneath). */
  onDone: () => void;
  lang?: Lang;
  /** Override the three loading steps. */
  steps?: string[];
};

const T = {
  title: { en: (n?: string) => (n ? `You're all set, ${n}!` : "You're all set!"), hi: (n?: string) => (n ? `सब तैयार है, ${n}!` : "सब तैयार है!") },
  sub: { en: "Here's what we'll prepare you for", hi: "हम आपको इसकी तैयारी करवाएँगे" },
  building: { en: "Setting up your dashboard", hi: "आपका डैशबोर्ड तैयार हो रहा है" },
  buildingSub: { en: "This takes a few seconds", hi: "बस कुछ सेकंड" },
  steps: {
    en: ["Building your exam plan", "Picking today's daily test", "Loading your dashboard"],
    hi: ["आपका एग्ज़ाम प्लान बन रहा है", "आज का डेली टेस्ट चुना जा रहा है", "डैशबोर्ड लोड हो रहा है"],
  },
};

type Phase = "celebrate" | "building" | "reveal";

export function OnboardingComplete({ name, summary, ready, onDone, lang = "en", steps }: OnboardingCompleteProps) {
  const reduced = usePrefersReducedMotion();
  const labels = steps ?? T.steps[lang];
  const [phase, setPhase] = useState<Phase>("celebrate");
  const [doneCount, setDoneCount] = useState(0);
  const buildStart = useRef(0);
  const doneRef = useRef(onDone);
  doneRef.current = onDone;

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
    const t = setTimeout(() => doneRef.current(), reduced ? 150 : 620);
    return () => clearTimeout(t);
  }, [phase, reduced]);

  const building = phase !== "celebrate";

  return (
    <div
      className={`${ui.root} ${ui.rootTokens} ${s.overlay} ${phase === "reveal" ? s.lift : ""}`}
      role="dialog"
      aria-modal="true"
      aria-label={T.title[lang](name)}
    >
      <div className={`${s.stage} ${building ? s.isBuilding : ""}`}>
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
            <h2 className={s.title}>{T.title[lang](name)}</h2>
            <p className={s.sub}>{T.sub[lang]}</p>
          </div>
          <div className={`${s.titleSet} ${building ? s.in : s.hidden}`} aria-hidden={!building}>
            <h2 className={s.title}>{T.building[lang]}</h2>
            <p className={s.sub}>{T.buildingSub[lang]}</p>
          </div>
        </div>

        <ul className={s.chips}>
          {summary.map((c, i) => (
            <li key={c} style={{ animationDelay: `${0.75 + i * 0.12}s` }}>{c}</li>
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
          {building ? `${T.building[lang]}. ${labels[Math.min(doneCount, labels.length - 1)]}` : T.title[lang](name)}
        </span>
      </div>
    </div>
  );
}

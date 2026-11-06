"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";
import ui from "../core/ui.module.css";
import s from "./enroll.module.css";
import { NibMascot } from "../nibbu/NibMascot";
import { Confetti } from "../core/Confetti";
import { usePrefersReducedMotion } from "../core/useCountUp";

type Lang = "en" | "hi";

export type EnrollSuccessProps = {
  /** e.g. "HTET Level 2" */
  exam: string;
  /** Subjects the user selected. */
  subjects: string[];
  /** Flip to true when the preparation page data is ready. The plan never "finishes" before this. */
  ready: boolean;
  /** Called after the exit transition — navigate to the preparation page here. */
  onDone: () => void;
  lang?: Lang;
};

const T = {
  exam: { en: "Exam", hi: "परीक्षा" },
  subjects: { en: "subjects", hi: "विषय" },
  stamp: { en: "ENROLLED", hi: "नामांकित" },
  title: { en: (e: string) => `You're enrolled in ${e}!`, hi: (e: string) => `${e} में आपका नामांकन हो गया!` },
  enrolling: { en: "Adding your subjects", hi: "आपके विषय जोड़े जा रहे हैं" },
  plan: { en: "Building your 7-day study plan", hi: "आपका 7 दिन का स्टडी प्लान बन रहा है" },
  planDone: { en: "Your plan is ready", hi: "आपका प्लान तैयार है" },
  week: { en: ["S", "M", "T", "W", "T", "F", "S"], hi: ["र", "सो", "मं", "बु", "गु", "शु", "श"] },
};

type Phase = "collect" | "enrolled" | "plan" | "exit";

export function EnrollSuccess({ exam, subjects, ready, onDone, lang = "en" }: EnrollSuccessProps) {
  const reduced = usePrefersReducedMotion();
  const [phase, setPhase] = useState<Phase>("collect");
  const [landed, setLanded] = useState(0);
  const [planDays, setPlanDays] = useState(0);
  const [offsets, setOffsets] = useState<{ x: number; y: number }[]>([]);
  const chipRefs = useRef<(HTMLLIElement | null)[]>([]);
  const ticketRef = useRef<HTMLDivElement>(null);
  const doneRef = useRef(onDone);
  doneRef.current = onDone;

  const FLY_START = reduced ? 150 : 650;
  const FLY_GAP = reduced ? 40 : 110;
  const FLY_MS = reduced ? 1 : 460;

  // measure where each chip has to fly to (the ticket's subject counter)
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
  }, [subjects.length]);

  // count chips as they land, then stamp
  useEffect(() => {
    const timers = subjects.map((_, i) => setTimeout(() => setLanded(i + 1), FLY_START + i * FLY_GAP + FLY_MS));
    timers.push(setTimeout(() => setPhase("enrolled"), FLY_START + subjects.length * FLY_GAP + FLY_MS + 180));
    return () => timers.forEach(clearTimeout);
  }, [subjects, FLY_START, FLY_GAP, FLY_MS]);

  useEffect(() => {
    if (phase !== "enrolled") return;
    const t = setTimeout(() => setPhase("plan"), reduced ? 500 : 1500);
    return () => clearTimeout(t);
  }, [phase, reduced]);

  // plan days fill one by one; the last day waits for `ready`
  useEffect(() => {
    if (phase !== "plan") return;
    const beat = reduced ? 60 : 170;
    if (planDays < 6) {
      const t = setTimeout(() => setPlanDays((d) => d + 1), beat);
      return () => clearTimeout(t);
    }
    if (planDays === 6 && ready) {
      const t = setTimeout(() => setPlanDays(7), beat);
      return () => clearTimeout(t);
    }
    if (planDays === 7) {
      const t = setTimeout(() => setPhase("exit"), reduced ? 200 : 650);
      return () => clearTimeout(t);
    }
  }, [phase, planDays, ready, reduced]);

  useEffect(() => {
    if (phase !== "exit") return;
    const t = setTimeout(() => doneRef.current(), reduced ? 150 : 520);
    return () => clearTimeout(t);
  }, [phase, reduced]);

  const stamped = phase !== "collect";
  const inPlan = phase === "plan" || phase === "exit";
  const today = new Date().getDay();

  return (
    <div className={`${ui.root} ${ui.rootTokens} ${s.overlay} ${phase === "exit" ? s.exit : ""}`} role="dialog" aria-modal="true" aria-label={T.title[lang](exam)}>
      <div className={s.stage}>
        <ul className={s.chips} aria-hidden="true">
          {subjects.map((sub, i) => {
            const o = offsets[i];
            const style = {
              "--dx": `${o?.x ?? 0}px`,
              "--dy": `${o?.y ?? 120}px`,
              animationDelay: `${i * 0.07}s, ${(FLY_START + i * FLY_GAP) / 1000}s`,
            } as CSSProperties;
            return (
              <li key={sub} ref={(el) => { chipRefs.current[i] = el; }} className={s.chip} style={style}>
                {sub}
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
              <span key={landed} className={s.countNum}>{landed}</span> {T.subjects[lang]}
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
            {stamped ? T.title[lang](exam) : T.enrolling[lang]}
          </h2>
          <p key={inPlan ? (planDays === 7 ? "p3" : "p2") : "p1"} className={s.sub}>
            {inPlan ? (planDays === 7 ? T.planDone[lang] : T.plan[lang]) : " "}
          </p>
        </div>

        <div className={`${s.week} ${inPlan ? s.weekIn : ""}`} aria-hidden="true">
          {Array.from({ length: 7 }, (_, i) => (
            <span key={i} className={i < planDays ? s.dayOn : undefined}>
              <i />
              {T.week[lang][(today + i) % 7]}
            </span>
          ))}
        </div>

        <span className={ui.srOnly} role="status" aria-live="polite">
          {stamped ? T.title[lang](exam) : T.enrolling[lang]} {inPlan ? (planDays === 7 ? T.planDone[lang] : T.plan[lang]) : ""}
        </span>
      </div>
    </div>
  );
}

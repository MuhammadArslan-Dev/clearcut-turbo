"use client";

import { useEffect, useRef, useState } from "react";
import f from "./flow.module.css";
import s from "./submit.module.css";
import { NibMascot } from "../../nibbu/NibMascot";
import { COPY, SUBMIT_NOTE } from "./copy";
import { usePrefersReducedMotion } from "../../core/useCountUp";
import type { Lang, TestType } from "./types";

export type TestSubmitProps = {
  type: TestType;
  /** total questions — drives the "32 / 50" counter */
  total: number;
  /** flip to true when your evaluate/submit API resolves */
  done: boolean;
  /** called after the CHECKED stamp lands — navigate to results here */
  onFinish: () => void;
  lang?: Lang;
  /** minimum time on screen before the stamp, so it never feels like a glitch (ms) */
  minDuration?: number;
};

const ROWS: { pick: number; mark: "ok" | "bad" | "skip" }[] = [
  { pick: 1, mark: "ok" },
  { pick: 3, mark: "ok" },
  { pick: 0, mark: "bad" },
  { pick: 2, mark: "ok" },
  { pick: -1, mark: "skip" },
  { pick: 1, mark: "ok" },
];
const LOOP = 1.2; // seconds — keep in sync with sBeam
const BEAM_TRAVEL = 140; // px

export function TestSubmit({ type, total, done, onFinish, lang = "en", minDuration = 1800 }: TestSubmitProps) {
  const reduced = usePrefersReducedMotion();
  const [n, setN] = useState(0);
  const [stamped, setStamped] = useState(false);
  const started = useRef(Date.now());
  const finishRef = useRef(onFinish);
  finishRef.current = onFinish;

  useEffect(() => {
    if (stamped) return;
    const id = setInterval(() => {
      const elapsed = Date.now() - started.current;
      const min = reduced ? 600 : minDuration;
      if (done && elapsed >= min) {
        setN(total);
        setStamped(true);
        clearInterval(id);
        return;
      }
      // ease toward ~92% while waiting, never claim 100% before the server says so
      const p = Math.min(0.92, 1 - Math.exp(-elapsed / (min * 0.55)));
      setN(Math.floor(total * p));
    }, 60);
    return () => clearInterval(id);
  }, [done, stamped, total, minDuration, reduced]);

  useEffect(() => {
    if (!stamped) return;
    const t = setTimeout(() => finishRef.current(), reduced ? 500 : 1300);
    return () => clearTimeout(t);
  }, [stamped, reduced]);

  return (
    <div className={`${f.root} ${f.overlay}`} role="dialog" aria-modal="true" aria-label={SUBMIT_NOTE[type][lang]}>
      <div className={`${s.stage} ${stamped ? s.isStamped : ""}`}>
        <span className={s.pill}>
          <span className={s.pillTick}>
            <svg viewBox="0 0 16 16"><path d="M4.2 8.3l2.5 2.4 5-5.2" fill="none" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" /></svg>
          </span>
          {SUBMIT_NOTE[type][lang]}
        </span>

        <div className={s.visual} aria-hidden="true">
          <div className={s.sheet}>
            <span className={s.head} />
            {ROWS.map((row, i) => {
              const at = 0.05 + ((i * 24 + 8) / BEAM_TRAVEL) * 0.8;
              return (
                <span key={i} className={s.row}>
                  <b className={s.qn}>{i + 1}</b>
                  {[0, 1, 2, 3].map((c) => (
                    <i key={c} className={c === row.pick ? s.on : undefined} />
                  ))}
                  <span
                    className={`${s.mark} ${s[row.mark]}`}
                    style={{ animationDelay: stamped ? "0s" : `${(at * LOOP).toFixed(2)}s` }}
                  >
                    {row.mark === "ok" && <svg viewBox="0 0 16 16"><path d="M4.2 8.3l2.5 2.4 5-5.2" /></svg>}
                    {row.mark === "bad" && <svg viewBox="0 0 16 16"><path d="M5 5l6 6M11 5l-6 6" /></svg>}
                    {row.mark === "skip" && <svg viewBox="0 0 16 16"><path d="M5 8h6" /></svg>}
                  </span>
                </span>
              );
            })}
            {!stamped && <span className={s.beam} />}
            {stamped && <span className={s.stamp}>{COPY.stamp[lang]}</span>}
          </div>
          <div className={s.buddy}>
            <div className={stamped ? s.cheer : s.idle}>
              <NibMascot className={f.mascot} look={stamped ? "none" : "scan"} mood={stamped ? "wow" : "happy"} />
            </div>
          </div>
        </div>

        <p className={s.headline}>
          {stamped ? COPY.allDone[lang] : COPY.checking[lang]}
          {!stamped && <span className={s.dots}><i /><i /><i /></span>}
        </p>
        <p className={s.count}>
          {n} / {total}
        </p>
        <div className={s.bar}>
          <span style={{ transform: `scaleX(${total ? n / total : 0})` }} />
        </div>
        <span className={f.srOnly} role="status" aria-live="polite">
          {stamped ? COPY.allDone[lang] : COPY.checking[lang]}
        </span>
      </div>
    </div>
  );
}

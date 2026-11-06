"use client";

import { useEffect, useRef, useState, type KeyboardEvent, type MouseEvent, type ReactNode } from "react";
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
  /** Pill text override (e.g. "Practice test submitted"); defaults to the library copy for `type`. */
  note?: string;
  /** "large" scales the artwork up (full-page hosts: Daily/Practice Test); default keeps the compact size. */
  size?: "default" | "large";
  /** "sheet" = dimmed backdrop + bottom sheet (mobile) / centred modal (desktop) over the host screen; "cover" (default) = the original full-screen takeover. */
  presentation?: "cover" | "sheet";
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

export function TestSubmit({ type, total, done, onFinish, lang = "en", note, size = "default", presentation = "cover", minDuration = 1800 }: TestSubmitProps) {
  const reduced = usePrefersReducedMotion();
  const [n, setN] = useState(0);
  const [stamped, setStamped] = useState(false);
  const started = useRef(Date.now());
  const finishRef = useRef(onFinish);
  finishRef.current = onFinish;
  const panelRef = useRef<HTMLDivElement>(null);

  // Not dismissible, by design: no close/skip control, no backdrop tap, no Escape, and focus stays on the panel so
  // Tab/Enter cannot reach (or trigger) the screen underneath. It ends only when the result is ready (onFinish).
  useEffect(() => {
    panelRef.current?.focus({ preventScroll: true });
  }, []);
  const lockKeys = (e: KeyboardEvent) => {
    e.stopPropagation();
    if (e.key === "Tab" || e.key === "Escape") e.preventDefault();
  };
  // A tap on the dimmed area must not move focus out of the panel (the next Tab/Enter would reach the screen behind).
  const keepFocus = (e: MouseEvent) => e.preventDefault();
  const refocus = () => panelRef.current?.focus({ preventScroll: true });

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

  const sheet = presentation === "sheet";
  const label = note ?? SUBMIT_NOTE[type][lang];
  // A plain function (not a component): a component defined here would remount the whole animation on every render.
  const frame = (children: ReactNode) =>
    sheet ? (
      <div className={`${f.root} ${f.sheetBackdrop}`} onKeyDown={lockKeys} onMouseDown={keepFocus}>
        <div ref={panelRef} tabIndex={-1} className={f.sheetPanel} role="dialog" aria-modal="true" aria-label={label} onBlur={refocus}>
          {children}
        </div>
      </div>
    ) : (
      <div ref={panelRef} tabIndex={-1} className={`${f.root} ${f.overlay}`} role="dialog" aria-modal="true" aria-label={label} onKeyDown={lockKeys} onMouseDown={keepFocus} onBlur={refocus}>
        {children}
      </div>
    );

  return frame(
      <div className={`${s.stage} ${stamped ? s.isStamped : ""} ${size === "large" ? s.large : ""} ${sheet ? s.inSheet : ""}`}>
        <span className={s.pill}>
          <span className={s.pillTick}>
            <svg viewBox="0 0 16 16"><path d="M4.2 8.3l2.5 2.4 5-5.2" fill="none" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" /></svg>
          </span>
          {note ?? SUBMIT_NOTE[type][lang]}
        </span>

        <div className={s.visualBox} aria-hidden="true">
          <div className={s.visual}>
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
      </div>,
  );
}

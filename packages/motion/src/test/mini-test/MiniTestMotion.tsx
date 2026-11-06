"use client";

import type { CSSProperties, ReactNode } from "react";
import s from "./motion.module.css";
import { NibMascot } from "../../nibbu/NibMascot";

/**
 * Animation-only building blocks of the mini test, for hosts that already have their own
 * mini-test UI (the dashboard's preparation modal). They add motion around the host's
 * markup and never set the host's colours, borders or layout.
 */
type Lang = "en" | "hi";

export type OptionMotionState = "idle" | "picked" | "right" | "wrong";

/** Wrap one answer option. Staggered entrance, pick pulse, correct pulse + tick badge, wrong shake. */
export function OptionMotion({
  state = "idle",
  index = 0,
  children,
}: {
  state?: OptionMotionState;
  index?: number;
  children: ReactNode;
}) {
  const cls = [s.optMotion, state === "picked" && s.picked, state === "right" && s.right, state === "wrong" && s.wrong]
    .filter(Boolean)
    .join(" ");
  const style = state === "idle" ? ({ animationDelay: `${0.08 + index * 0.05}s` } as CSSProperties) : undefined;
  return (
    <div className={cls} style={style}>
      {children}
      {state === "right" && (
        <span className={s.badge} aria-hidden="true">
          <svg viewBox="0 0 16 16">
            <path d="M4.2 8.3l2.5 2.4 5-5.2" />
          </svg>
        </span>
      )}
    </div>
  );
}

/** Re-key it per question: the card slides in from the right. */
export function QuestionSlide({ children }: { children: ReactNode }) {
  return <div className={s.qIn}>{children}</div>;
}

const L = {
  correct: { en: "Correct!", hi: "सही जवाब!" },
  wrong: { en: "Not quite", hi: "सही नहीं" },
  inARow: { en: "in a row!", hi: "लगातार सही!" },
};

/**
 * Nibbu reacts to a checked answer: happy hop when right; determined + headband nod when wrong
 * (never a sad face, see MOTION_GUIDELINES.md). `detail` is an optional second line.
 */
export function AnswerFeedback({ right, lang = "en", detail }: { right: boolean; lang?: Lang; detail?: ReactNode }) {
  return (
    <div className={s.feedback} role="status">
      <div className={s.fbNib} aria-hidden="true">
        <div className={right ? s.fbHop : s.fbNod}>
          <NibMascot mood={right ? "happy" : "determined"} accessory={right ? "none" : "headband"} />
        </div>
      </div>
      <div className={`${s.fbText} ${right ? s.fbRight : s.fbWrong}`}>
        <b>{right ? L.correct[lang] : L.wrong[lang]}</b>
        {detail ? <span>{detail}</span> : null}
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

/** "3 in a row!" toast. Place inside a `position: relative` container; the host removes it after ~1.8s. */
export function StreakCombo({ count, lang = "en", top = 12 }: { count: number; lang?: Lang; top?: number }) {
  return (
    <div className={s.combo} style={{ top }} role="status">
      <Flame /> {count} {L.inARow[lang]}
    </div>
  );
}

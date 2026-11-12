"use client";

import { forwardRef, useEffect, useState } from "react";
import { NibMascot } from "@clearcut/motion/nibbu";
import styles from "./start.module.css";

export type StartMood = "wave" | "point" | "idle" | "happy" | "sad" | "otp" | "cheer";
export type BubbleTone = "" | "sad" | "happy";

/** Mood -> the approved artwork's face/accessory (shape and colours stay locked). */
function faceFor(mood: StartMood) {
  if (mood === "happy") return "wow" as const;
  if (mood === "sad") return "determined" as const;
  return "happy" as const;
}

const CONFETTI = ["var(--color-brand)", "var(--color-success)", "var(--color-gold)", "var(--color-danger-muted)", "var(--color-success-soft)"];

/**
 * The prototype's mascot stage: Nibbu (from @clearcut/motion/nibbu, always with
 * the graduation cap), a speech bubble and the decorative scene. Purely
 * presentational — the page decides mood and text (useStartMascot).
 */
const StartMascotStage = forwardRef<
  HTMLButtonElement,
  {
    mood: StartMood;
    text: string;
    tone: BubbleTone;
    /** Changes for every new line, so the bubble re-plays its pop. */
    sayKey: number;
    /** Bubble above a big mascot (tall phones, desktop). */
    column: boolean;
    /** Bump to fire one confetti burst. */
    confettiKey: number;
    look: { x: number; y: number } | null;
    label: string;
    onTap: () => void;
  }
>(function StartMascotStage({ mood, text, tone, sayKey, column, confettiKey, look, label, onTap }, ref) {
  const [pieces, setPieces] = useState<{ x: number; y: number; r: number; d: number }[]>([]);

  useEffect(() => {
    if (!confettiKey) return;
    setPieces(
      Array.from({ length: 22 }, () => {
        const a = Math.random() * Math.PI * 2;
        const dist = 70 + Math.random() * 130;
        return { x: Math.cos(a) * dist + 60, y: Math.sin(a) * dist * 0.7 + 40, r: Math.random() * 720 - 360, d: Math.random() * 0.25 };
      }),
    );
  }, [confettiKey]);

  const lookStyle = {
    "--nib-look-x": look ? `${look.x.toFixed(1)}px` : "0px",
    "--nib-look-y": look ? `${look.y.toFixed(1)}px` : "0px",
  } as React.CSSProperties;

  return (
    <div className={styles.stage} data-col={column ? "true" : "false"}>
      <div className={styles.decor} aria-hidden="true">
        <svg width="26" height="26" viewBox="0 0 24 24" fill="var(--color-gold)">
          <path d="M12 2l2.9 6.3 6.9.8-5.1 4.7 1.4 6.8L12 17.2 5.9 20.6l1.4-6.8L2.2 9.1l6.9-.8z" />
        </svg>
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
          <path d="M4 5.5A2.5 2.5 0 016.5 3H20v15H6.5A2.5 2.5 0 004 20.5z" fill="var(--color-brand)" />
          <path d="M4 20.5A2.5 2.5 0 016.5 18H20v3H6.5A2.5 2.5 0 014 20.5z" fill="white" stroke="var(--color-brand)" strokeWidth="1.5" />
        </svg>
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
          <circle cx="12" cy="12" r="10" fill="var(--color-success)" />
          <path d="M7.5 12.5l3 3L16.5 9.5" stroke="white" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>

      <button ref={ref} type="button" className={styles.mascotBtn} aria-label={label} onClick={onTap}>
        <span className={styles.mascot} data-mood={mood} style={lookStyle}>
          <span className={styles.shadow} aria-hidden="true" />
          <NibMascot className={styles.nib} mood={faceFor(mood)} accessory="cap" frame="tall" />
        </span>
      </button>

      <div key={sayKey} className={styles.bubble} data-tone={tone || undefined} role="status" aria-live="polite">
        {text}
      </div>

      <div className={styles.confetti} aria-hidden="true">
        {pieces.map((p, i) => (
          <i
            key={`${confettiKey}-${i}`}
            style={
              {
                background: CONFETTI[i % CONFETTI.length],
                "--x": `${p.x.toFixed(0)}px`,
                "--y": `${p.y.toFixed(0)}px`,
                "--r": `${p.r.toFixed(0)}deg`,
                animationDelay: `${p.d.toFixed(2)}s`,
              } as React.CSSProperties
            }
          />
        ))}
      </div>
    </div>
  );
});

export default StartMascotStage;

"use client";

import { useEffect, useState, type CSSProperties } from "react";
import styles from "./CCLoader.module.css";
import { NibMascot } from "../nibbu/NibMascot";
import { useDelayedVisibility } from "./useDelayedVisibility";
import { CutoffScene } from "./scenes/CutoffScene";
import { NotebookScene } from "./scenes/NotebookScene";
import { FlashcardScene } from "./scenes/FlashcardScene";
import { PathScene } from "./scenes/PathScene";
import { BookScene } from "./scenes/BookScene";
import { StopwatchScene } from "./scenes/StopwatchScene";

export type Lang = "en" | "hi";
/** omr V1 bubble hop · cutoff V2 score bar · notebook V3 writing · flashcard V4 card flip
 *  path V5 lesson path · book V6 page flip · stopwatch V7 exam timer */
export type LoaderDesign = "omr" | "cutoff" | "notebook" | "flashcard" | "path" | "book" | "stopwatch";
type Tip = Record<Lang, string>;

export const DEFAULT_TIPS: Tip[] = [
  {
    en: "PYQs repeat patterns — solve them topic-wise, not randomly.",
    hi: "PYQ में पैटर्न दोहराते हैं — टॉपिक-वाइज़ हल करें, रैंडम नहीं।",
  },
  {
    en: "Stuck on a question? Mark it, move on, come back later.",
    hi: "जिस सवाल पर अटकें, उसे मार्क करें और आगे बढ़ें।",
  },
  {
    en: "Revise your wrong answers within 24 hours — that's where marks hide.",
    hi: "गलत जवाब 24 घंटे के अंदर दोहराएँ — असली नंबर वहीं छिपे हैं।",
  },
  {
    en: "CDP & Pedagogy carry big weight in every TET. Revise a little daily.",
    hi: "हर TET में CDP और पेडागॉजी का वेटेज बड़ा है — रोज़ थोड़ा दोहराएँ।",
  },
  {
    en: "One full-length mock a week builds exam-day stamina.",
    hi: "हफ़्ते में एक फुल-लेंथ मॉक से परीक्षा के दिन की स्टैमिना बनती है।",
  },
  {
    en: "Accuracy first, speed second. Speed follows accuracy.",
    hi: "पहले सटीकता, फिर स्पीड — स्पीड अपने आप आएगी।",
  },
];

const LABELS: Record<Lang, string> = {
  en: "Getting your prep ready",
  hi: "आपकी तैयारी लोड हो रही है",
};

const OPTIONS: Record<Lang, string[]> = {
  en: ["A", "B", "C", "D"],
  hi: ["क", "ख", "ग", "घ"],
};

export type CCLoaderProps = {
  /**
   * fullscreen — overlay for route changes / test start / payment verify
   * inline     — same scene inside a card or section, no overlay
   * compact    — tiny mascot + text for buttons and table rows
   */
  variant?: "fullscreen" | "inline" | "compact";
  /** Which animation scene to show (fullscreen/inline only). Default "omr". */
  design?: LoaderDesign;
  /**
   * Controlled mode: pass your isLoading flag. Handles delay, min-duration and
   * exit animation for you. Leave undefined in `loading.tsx` (Suspense fallbacks).
   */
  active?: boolean;
  label?: string;
  /** `false` hides tips. Defaults to DEFAULT_TIPS. */
  tips?: Tip[] | false;
  lang?: Lang;
  /** compact only: "onBrand" = white mascot for use inside blue buttons */
  tone?: "brand" | "onBrand";
  /** ms before anything appears (avoids flashes on fast loads) */
  delay?: number;
  /** ms the loader stays once shown (controlled mode) */
  minDuration?: number;
  className?: string;
};

function usePrefersReducedMotion() {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReduced(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);
  return reduced;
}

/** Keeps the previous index around for one transition so the old tip can fade out
    while the new one fades in (no hard cut, no layout jump). */
function useCrossfade(index: number) {
  const [view, setView] = useState({ current: index, prev: null as number | null, n: 0 });
  useEffect(() => {
    setView((v) => (v.current === index ? v : { current: index, prev: v.current, n: v.n + 1 }));
  }, [index]);
  return view;
}

function useRotatingIndex(length: number, enabled: boolean, interval: number) {
  const [i, setI] = useState(0);
  useEffect(() => {
    if (!enabled || length < 2) return;
    const id = setInterval(() => setI((n) => (n + 1) % length), interval);
    return () => clearInterval(id);
  }, [length, enabled, interval]);
  return i;
}

export function CCLoader({
  variant = "fullscreen",
  design = "omr",
  active,
  label,
  tips = DEFAULT_TIPS,
  lang = "en",
  tone = "brand",
  delay = 250,
  minDuration = 700,
  className,
}: CCLoaderProps) {
  const controlled = active !== undefined;
  const { mounted, exiting } = useDelayedVisibility(controlled ? !!active : true, {
    delay: controlled ? delay : 0,
    minDuration,
  });
  const reduced = usePrefersReducedMotion();
  const tipList = tips === false ? [] : tips;
  const tipIndex = useRotatingIndex(tipList.length, mounted, reduced ? 6000 : 3600);
  const tipView = useCrossfade(tipIndex);
  const text = label ?? LABELS[lang];

  if (!mounted) return null;

  // In uncontrolled mode the JS delay is 0, so CSS holds the fade-in instead.
  // This keeps Suspense fallbacks SSR-safe and flash-free.
  const style = { "--cc-delay": `${controlled ? 0 : delay}ms` } as CSSProperties;

  if (variant === "compact") {
    return (
      <span
        role="status"
        aria-live="polite"
        className={[styles.compact, tone === "onBrand" && styles.onBrand, className]
          .filter(Boolean)
          .join(" ")}
      >
        <span className={styles.compactMascot}>
          <NibMascot />
        </span>
        <span>{text}</span>
      </span>
    );
  }

  const opts = OPTIONS[lang];

  return (
    <div
      role="status"
      aria-live="polite"
      aria-busy="true"
      style={style}
      className={[
        variant === "fullscreen" ? styles.overlay : styles.inline,
        exiting && styles.exiting,
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <div className={styles.stage}>
        {design === "cutoff" && <CutoffScene lang={lang} />}
        {design === "notebook" && <NotebookScene />}
        {design === "flashcard" && <FlashcardScene lang={lang} />}
        {design === "path" && <PathScene />}
        {design === "book" && <BookScene />}
        {design === "stopwatch" && <StopwatchScene />}
        {design === "omr" && (
          <div className={styles.scene} aria-hidden="true">
            <div className={styles.halo} />

            <div className={styles.bubbles}>
              <span className={`${styles.bubble} ${styles.bubbleA}`}>
                <span className={styles.letter}>{opts[0]}</span>
              </span>
              <span className={`${styles.bubble} ${styles.bubbleB}`}>
                <span className={styles.letter}>{opts[1]}</span>
              </span>
              <span className={`${styles.bubble} ${styles.bubbleC}`}>
                <span className={styles.fill} />
                <span className={`${styles.letter} ${styles.letterC}`}>{opts[2]}</span>
                <span className={styles.check}>
                  <svg viewBox="0 0 16 16">
                    <path className={styles.checkPath} d="M4.2 8.3l2.5 2.4 5-5.2" pathLength={1} />
                  </svg>
                </span>
                <span className={`${styles.spark} ${styles.spark1}`} />
                <span className={`${styles.spark} ${styles.spark2}`} />
                <span className={`${styles.spark} ${styles.spark3}`} />
              </span>
              <span className={styles.bubble}>
                <span className={styles.letter}>{opts[3]}</span>
              </span>
            </div>

            {/* X glide › Y gravity › squash & lean — three layers so each axis has its own easing */}
            <div className={styles.shadowX}>
              <div className={styles.shadow} />
            </div>
            <div className={styles.rider}>
              <div className={styles.hop}>
                <div className={styles.squash}>
                  <NibMascot className={styles.mascot} />
                </div>
              </div>
            </div>
          </div>
        )}

        <p className={styles.label}>
          {text}
          <span className={styles.dots}>
            <i />
            <i />
            <i />
          </span>
        </p>

        {tipList.length > 0 && (
          <div className={styles.tips} aria-hidden="true">
            {tipView.prev !== null && tipList[tipView.prev] && (
              <p key={`out-${tipView.prev}-${tipView.n}`} className={`${styles.tip} ${styles.tipOut}`}>
                <span className={styles.tipTag}>{lang === "hi" ? "टिप" : "Tip"}</span>
                {tipList[tipView.prev][lang]}
              </p>
            )}
            <p key={`in-${tipView.current}-${tipView.n}`} className={`${styles.tip} ${tipView.n > 0 ? styles.tipIn : ""}`}>
              <span className={styles.tipTag}>{lang === "hi" ? "टिप" : "Tip"}</span>
              {tipList[tipView.current]?.[lang]}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export default CCLoader;

import styles from "./NibMascot.module.css";

export type NibMood = "happy" | "determined" | "wow";
export type NibAccessory = "none" | "cap" | "headband";

/**
 * "Nibbu" — ClearCutoff's pen-nib mascot, derived from the logo mark.
 * Pure inline SVG. Colours come from CSS variables so it can be re-toned
 * (e.g. white-on-blue inside a button) without new assets.
 *
 * mood:      happy (default) · determined (eyebrows, set mouth) · wow (open mouth)
 * accessory: cap (graduation cap — cleared cutoff) · headband (keep-fighting mode)
 */
export function NibMascot({
  className,
  mood = "happy",
  accessory = "none",
  look = "none",
}: {
  className?: string;
  mood?: NibMood;
  accessory?: NibAccessory;
  /** scan = eyes sweep top→bottom (reading an answer sheet), 1.2s loop */
  look?: "none" | "scan";
}) {
  const cls = [className, look === "scan" && styles.lookScan].filter(Boolean).join(" ");
  return (
    <svg className={cls || undefined} viewBox="0 0 64 72" aria-hidden="true" focusable="false">
      {/* nib body */}
      <path
        className={styles.nibBody}
        d="M32 3C46.5 3 55 11.5 55 24v9.5c0 10.5-10 22.5-20.4 34.6a3.4 3.4 0 0 1-5.2 0C19 56 9 44 9 33.5V24C9 11.5 17.5 3 32 3Z"
      />
      {/* darker writing tip */}
      <path
        className={styles.nibTip}
        d="M14.2 46h35.6C45.6 53 40.2 60 34.6 66.1a3.4 3.4 0 0 1-5.2 0C23.8 60 18.4 53 14.2 46Z"
      />
      {/* soft highlight */}
      <path className={styles.nibShine} d="M17 18c1.6-5.4 6-8.6 12-9.2" fill="none" strokeWidth="3" strokeLinecap="round" />
      {/* breather hole + slit */}
      <circle className={styles.nibHole} cx="32" cy="50.5" r="2.6" />
      <path className={styles.nibSlit} d="M32 53.2V65" fill="none" strokeWidth="1.6" strokeLinecap="round" />
      {/* cheeks */}
      <ellipse className={styles.nibCheek} cx="18.5" cy="34" rx="3.4" ry="2.2" />
      <ellipse className={styles.nibCheek} cx="45.5" cy="34" rx="3.4" ry="2.2" />
      {/* eyes (blink as a group) */}
      <g className={styles.nibEyes}>
        <ellipse className={styles.nibSclera} cx="24" cy="25.5" rx="5.6" ry="6.6" />
        <ellipse className={styles.nibSclera} cx="40" cy="25.5" rx="5.6" ry="6.6" />
        <g className={styles.nibPupils}>
          <circle className={styles.nibPupil} cx="25.6" cy="26.6" r="3.1" />
          <circle className={styles.nibPupil} cx="41.6" cy="26.6" r="3.1" />
          <circle className={styles.nibGlint} cx="26.6" cy="25.2" r="1.05" />
          <circle className={styles.nibGlint} cx="42.6" cy="25.2" r="1.05" />
        </g>
      </g>

      {mood === "determined" && (
        <>
          <path className={styles.nibSmile} d="M19 17.5l8.5 2.6M45 17.5l-8.5 2.6" fill="none" strokeWidth="2.3" strokeLinecap="round" />
          <path className={styles.nibSmile} d="M27.5 36.2q4.5 2.2 9 0" fill="none" strokeWidth="2.1" strokeLinecap="round" />
        </>
      )}
      {mood === "wow" && <ellipse className={styles.nibMouth} cx="32" cy="37" rx="3.2" ry="3.6" />}
      {mood === "happy" && (
        <path className={styles.nibSmile} d="M27.2 35.2q4.8 4.4 9.6 0" fill="none" strokeWidth="2.1" strokeLinecap="round" />
      )}

      {accessory === "headband" && (
        <g>
          <path className={styles.nibBand} d="M9.6 15.5Q32 7.5 54.4 15.5l.2 5.2Q32 12.8 9.4 20.7Z" />
          <path className={styles.nibBand} d="M53.5 16.5l8 -3.5-1.5 6.2zM53.8 18.8l7.2 3.8-6.4 1.6z" />
        </g>
      )}
      {accessory === "cap" && (
        <g className={styles.nibCap}>
          <path className={styles.nibCapBase} d="M20 2.5h24v6.8q-12 5.4-24 0Z" />
          <path className={styles.nibCapTop} d="M32-7.5 55 1 32 9.5 9 1Z" />
          <path className={styles.nibTassel} d="M32 1 49 5.5v9" fill="none" strokeWidth="1.6" strokeLinecap="round" />
          <circle className={styles.nibTasselEnd} cx="49" cy="15.5" r="2.2" />
        </g>
      )}
    </svg>
  );
}

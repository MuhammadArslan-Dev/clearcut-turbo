import base from "../CCLoader.module.css";
import s from "./flashcard.module.css";
import { NibMascot } from "../../nibbu/NibMascot";
import type { Lang } from "../CCLoader";

/** V4 — a PYQ flashcard flips from "?" to "Correct!" while Nibbu cheers; next card slides in. */
export function FlashcardScene({ lang }: { lang: Lang }) {
  return (
    <div className={s.scene} aria-hidden="true">
      <div className={base.halo} />
      <span className={`${s.ghost} ${s.ghost1}`} />
      <span className={`${s.ghost} ${s.ghost2}`} />
      <div className={s.card}>
        <div className={s.flip}>
          <div className={`${s.face} ${s.front}`}>
            <span className={s.chip}>PYQ</span>
            <span className={s.q}>?</span>
          </div>
          <div className={`${s.face} ${s.back}`}>
            <span className={s.okIcon}>
              <svg viewBox="0 0 16 16">
                <path d="M4.2 8.3l2.5 2.4 5-5.2" fill="none" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </span>
            <span className={s.ok}>{lang === "hi" ? "सही!" : "Correct!"}</span>
          </div>
        </div>
      </div>
      <span className={`${s.spk} ${s.spk1}`} />
      <span className={`${s.spk} ${s.spk2}`} />
      <span className={`${s.spk} ${s.spk3}`} />
      <div className={s.buddy}>
        <div className={s.jump}>
          <NibMascot className={s.mascot} />
        </div>
      </div>
    </div>
  );
}

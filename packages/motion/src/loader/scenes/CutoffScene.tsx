import base from "../CCLoader.module.css";
import s from "./cutoff.module.css";
import { NibMascot } from "../../nibbu/NibMascot";
import type { Lang } from "../CCLoader";

/** V2 — Nibbu runs up a score bar and clears the cutoff line. */
export function CutoffScene({ lang }: { lang: Lang }) {
  return (
    <div className={s.scene} aria-hidden="true">
      <div className={base.halo} />
      <div className={s.track}>
        <div className={s.fill} />
        <div className={`${s.fill} ${s.fillWin}`} />
        <span className={s.sheen} />
      </div>
      <div className={s.marker}>
        <span className={s.line} />
        <span className={s.burst} />
        <span className={`${s.tag} ${s.tagA}`}>{lang === "hi" ? "कटऑफ" : "Cutoff"}</span>
        <span className={`${s.tag} ${s.tagB}`}>{lang === "hi" ? "क्लियर ✓" : "Cleared ✓"}</span>
        <span className={`${s.spk} ${s.spk1}`} />
        <span className={`${s.spk} ${s.spk2}`} />
        <span className={`${s.spk} ${s.spk3}`} />
      </div>
      {/* rider = X along the bar › boost = big jumps on the main timeline › run = stride cycle */}
      <div className={s.rider}>
        <div className={s.boost}>
          <div className={s.run}>
            <NibMascot className={s.mascot} />
          </div>
        </div>
      </div>
    </div>
  );
}

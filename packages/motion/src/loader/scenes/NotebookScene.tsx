import s from "./notebook.module.css";
import { NibMascot } from "../../nibbu/NibMascot";

const LINE_1 = "M36 31q5-7 10 0t10 0t10 0t10 0t10 0t10 0t10 0t10 0t10 0t10 0t10 0";
const LINE_2 = "M36 53q5-7 10 0t10 0t10 0t10 0t10 0t10 0t10 0t10 0";
const TICK = "M132 55l7 7l14-16";

/** V3 — Nibbu writes two lines of notes on ruled paper, then ticks them off. */
export function NotebookScene() {
  return (
    <div className={s.scene} aria-hidden="true">
      <div className={s.paper}>
        <span className={s.margin} />
        <svg className={s.ink} viewBox="0 0 184 120">
          <path className={`${s.stroke} ${s.l1}`} d={LINE_1} pathLength={100} />
          <path className={`${s.stroke} ${s.l2}`} d={LINE_2} pathLength={100} />
          <path className={`${s.stroke} ${s.tick}`} d={TICK} pathLength={100} />
        </svg>
      </div>
      <div className={s.rider}>
        <div className={s.pen}>
          <NibMascot className={s.mascot} />
        </div>
      </div>
    </div>
  );
}

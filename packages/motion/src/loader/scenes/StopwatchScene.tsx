import base from "../CCLoader.module.css";
import s from "./stopwatch.module.css";
import { NibMascot } from "../../nibbu/NibMascot";

/** V7 — Stopwatch: Nibbu bounces to the beat inside an exam timer; at full time it dings. */
export function StopwatchScene() {
  return (
    <div className={s.scene} aria-hidden="true">
      <div className={base.halo} />
      <div className={s.watch}>
        <span className={s.crown} />
        <span className={s.side} />
        <span className={`${s.ding} ${s.dingL}`} />
        <span className={`${s.ding} ${s.dingR}`} />
        <div className={s.body}>
          <svg className={s.ring} viewBox="0 0 96 96">
            <circle className={s.track} cx="48" cy="48" r="38" />
            <circle className={s.arc} cx="48" cy="48" r="38" pathLength={1} />
            <path className={s.ticks} d="M48 14v4M82 48h-4M48 82v-4M14 48h4" />
          </svg>
          <div className={s.buddy}>
            <div className={s.boost}>
              <div className={s.beat}>
                <NibMascot className={s.mascot} />
              </div>
            </div>
          </div>
        </div>
      </div>
      <span className={`${s.spk} ${s.spk1}`} />
      <span className={`${s.spk} ${s.spk2}`} />
      <span className={`${s.spk} ${s.spk3}`} />
    </div>
  );
}

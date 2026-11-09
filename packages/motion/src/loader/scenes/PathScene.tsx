import base from "../CCLoader.module.css";
import s from "./path.module.css";
import { NibMascot } from "../../nibbu/NibMascot";

/** V5 — Lesson Path: Nibbu hops up a chapter path, each node lights up, the trophy shines. */
export function PathScene() {
  return (
    <div className={s.scene} aria-hidden="true">
      <div className={base.halo} />
      <svg className={s.trail} viewBox="0 0 200 120">
        <polyline className={s.dots} points="25,96 75,66 125,96 175,66" />
        <polyline className={s.done} points="25,96 75,66 125,96 175,66" pathLength={1} />
      </svg>

      {[1, 2, 3].map((n) => (
        <span key={n} className={`${s.node} ${s[`n${n}`]}`}>
          <span className={s.nodeFill}>
            <svg viewBox="0 0 16 16"><path d="M4.2 8.3l2.5 2.4 5-5.2" /></svg>
          </span>
        </span>
      ))}
      <span className={`${s.node} ${s.trophy}`}>
        <svg viewBox="0 0 24 24">
          <path d="M7 4h10v3a5 5 0 0 1-10 0Z M5 5H3v1.5A3.5 3.5 0 0 0 6.5 10 M19 5h2v1.5A3.5 3.5 0 0 1 17.5 10 M12 12v4 M8.5 19h7l-1-3h-5Z" />
        </svg>
        <i className={s.ray} style={{ transform: "rotate(0deg)" }} />
        <i className={s.ray} style={{ transform: "rotate(60deg)" }} />
        <i className={s.ray} style={{ transform: "rotate(120deg)" }} />
        <i className={s.ray} style={{ transform: "rotate(180deg)" }} />
        <i className={s.ray} style={{ transform: "rotate(240deg)" }} />
        <i className={s.ray} style={{ transform: "rotate(300deg)" }} />
      </span>

      <div className={s.rider}>
        <div className={s.hop}>
          <div className={s.squash}>
            <NibMascot className={s.mascot} />
          </div>
        </div>
      </div>
    </div>
  );
}

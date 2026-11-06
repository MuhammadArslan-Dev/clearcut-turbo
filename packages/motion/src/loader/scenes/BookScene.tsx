import base from "../CCLoader.module.css";
import s from "./book.module.css";
import { NibMascot } from "../../nibbu/NibMascot";

const Lines = ({ write }: { write?: boolean }) => (
  <>
    {[0, 1, 2, 3].map((i) => (
      <span key={i} className={`${s.line} ${write ? s.write : ""}`} style={write ? { animationDelay: `${i * 0.05}s` } : undefined} />
    ))}
  </>
);

/** V6 — Book Flip: pages turn, fresh notes write themselves in, Nibbu cheers each page. */
export function BookScene() {
  return (
    <div className={s.scene} aria-hidden="true">
      <div className={base.halo} />
      <div className={s.cover} />
      <div className={s.book}>
        <div className={`${s.page} ${s.left}`}><Lines /></div>
        <div className={`${s.page} ${s.right}`}><Lines write /></div>
        <div className={s.flip}>
          <div className={`${s.face} ${s.front}`}><Lines /></div>
          <div className={`${s.face} ${s.back}`}><Lines /></div>
        </div>
      </div>
      <span className={`${s.spk} ${s.spk1}`} />
      <span className={`${s.spk} ${s.spk2}`} />
      <span className={`${s.spk} ${s.spk3}`} />
      <div className={s.buddy}>
        <div className={s.cheer}>
          <NibMascot className={s.mascot} />
        </div>
      </div>
    </div>
  );
}

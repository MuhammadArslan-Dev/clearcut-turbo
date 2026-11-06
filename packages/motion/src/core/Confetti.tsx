import type { CSSProperties } from "react";
import s from "./confetti.module.css";

const COLORS = ["#0083ff", "#12b76a", "#ffc542", "#ff6a1f", "#ff9bb0", "#005cb8"];

/** Deterministic confetti burst (SSR-safe — no Math.random). Renders nothing under reduced motion via CSS. */
export function Confetti({ count = 26, delay = 0, spread = 1 }: { count?: number; delay?: number; spread?: number }) {
  return (
    <span className={s.confetti} aria-hidden="true">
      {Array.from({ length: count }, (_, i) => {
        const ang = (i / count) * Math.PI * 2 + (i % 3) * 0.2;
        const dist = (70 + ((i * 37) % 60)) * spread;
        const style = {
          "--x": `${Math.cos(ang) * dist}px`,
          "--up": `${(-60 - ((i * 23) % 50)) * spread}px`,
          "--down": `${(70 + ((i * 29) % 70)) * spread}px`,
          "--r": `${((i * 97) % 720) - 360}deg`,
          background: COLORS[i % COLORS.length],
          width: i % 4 === 0 ? "6px" : "8px",
          height: i % 4 === 0 ? "6px" : "4px",
          borderRadius: i % 4 === 0 ? "50%" : "1px",
          animationDelay: `${delay + (i % 5) * 0.03}s`,
        } as CSSProperties;
        return <i key={i} style={style} />;
      })}
    </span>
  );
}

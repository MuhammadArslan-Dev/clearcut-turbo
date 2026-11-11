"use client";

import { useCallback, useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";
import styles from "./meters.module.css";

const CONFETTI_COLOURS = ["#0083ff", "#12b76a", "#ffc542", "#ff6a1f", "#ff9bb0", "#067a46"];

type Fx =
  | { id: number; type: "conf"; style: CSSProperties }
  | { id: number; type: "burst"; style: CSSProperties }
  | { id: number; type: "stamp"; text: string }
  | { id: number; type: "toast"; body: ReactNode; on: boolean };

export interface ToastHandle {
  on(): void;
  off(): void;
  remove(): void;
}

export interface FxApi {
  confetti(): void;
  burst(x: string, y: string): void;
  stamp(text: string, ms?: number): () => void;
  toast(body: ReactNode): ToastHandle;
  clear(): void;
}

let fxSeq = 0;

/**
 * Celebration / message layer for a positioned stage (the meter card or a moment stage).
 * Render `nodes` inside the stage; call the api to fire effects. Durations scale with k.
 */
export function useFx(k: number): { nodes: ReactNode; api: FxApi } {
  const [items, setItems] = useState<Fx[]>([]);
  const timers = useRef(new Set<ReturnType<typeof setTimeout>>());
  const kRef = useRef(k);
  kRef.current = k;

  const later = useCallback((fn: () => void, ms: number) => {
    const t = setTimeout(() => {
      timers.current.delete(t);
      fn();
    }, ms);
    timers.current.add(t);
  }, []);
  useEffect(() => () => timers.current.forEach(clearTimeout), []);

  const remove = useCallback((ids: number[]) => setItems((xs) => xs.filter((x) => !ids.includes(x.id))), []);

  const apiRef = useRef<FxApi | null>(null);
  if (!apiRef.current) {
    apiRef.current = {
      confetti() {
        const made: Fx[] = [];
        for (let i = 0; i < 34; i++) {
          const ang = Math.random() * Math.PI * 2;
          const dist = 70 + Math.random() * 120;
          made.push({
            id: ++fxSeq,
            type: "conf",
            style: {
              background: CONFETTI_COLOURS[i % CONFETTI_COLOURS.length],
              "--x": `${Math.cos(ang) * dist}px`,
              "--y": `${Math.sin(ang) * dist + 60}px`,
              "--r": `${Math.random() * 720 - 360}deg`,
              animationDelay: `${Math.random() * 120 * kRef.current}ms`,
            } as CSSProperties,
          });
        }
        setItems((xs) => [...xs, ...made]);
        later(() => remove(made.map((m) => m.id)), 1600 * kRef.current);
      },
      burst(x, y) {
        const id = ++fxSeq;
        setItems((xs) => [...xs, { id, type: "burst", style: { left: x, top: y } }]);
        later(() => remove([id]), 800 * kRef.current);
      },
      stamp(text, ms) {
        const id = ++fxSeq;
        setItems((xs) => [...xs, { id, type: "stamp", text }]);
        if (ms) later(() => remove([id]), ms * kRef.current);
        return () => remove([id]);
      },
      toast(body) {
        const id = ++fxSeq;
        setItems((xs) => [...xs, { id, type: "toast", body, on: false }]);
        const set = (on: boolean) => setItems((xs) => xs.map((x) => (x.id === id && x.type === "toast" ? { ...x, on } : x)));
        return { on: () => set(true), off: () => set(false), remove: () => remove([id]) };
      },
      clear() {
        setItems([]);
      },
    };
  }

  const nodes = (
    <>
      {items.map((it) => {
        if (it.type === "conf") return <i key={it.id} className={styles.conf} style={it.style} />;
        if (it.type === "burst") return <i key={it.id} className={styles.burst} style={it.style} />;
        if (it.type === "stamp") return <div key={it.id} className={styles.stamp}>{it.text}</div>;
        return (
          <div key={it.id} className={[styles.toast, it.on && styles.on].filter(Boolean).join(" ")}>
            {it.body}
          </div>
        );
      })}
    </>
  );

  return { nodes, api: apiRef.current };
}

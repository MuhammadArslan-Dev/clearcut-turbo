"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { BubbleTone, StartMood } from "./StartMascotStage";

/**
 * Nibbu's state for /start (phase 101): the bubble line, the mood (optionally
 * reverting after a moment) and where the eyes look. Mirrors the prototype's
 * say() / mood() / lookAt() helpers.
 */
export function useStartMascot(initialText: string) {
  const [line, setLine] = useState<{ text: string; tone: BubbleTone; key: number }>({ text: initialText, tone: "", key: 0 });
  const [mood, setMoodState] = useState<StartMood>("wave");
  const [look, setLook] = useState<{ x: number; y: number } | null>(null);
  const mascotRef = useRef<HTMLButtonElement | null>(null);
  const revertRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const textRef = useRef(initialText);

  const say = useCallback((text: string, tone: BubbleTone = "") => {
    if (textRef.current === text) return;
    textRef.current = text;
    setLine((l) => ({ text, tone, key: l.key + 1 }));
  }, []);

  const setMood = useCallback((m: StartMood, revertTo?: StartMood, ms = 1800) => {
    if (revertRef.current) clearTimeout(revertRef.current);
    setMoodState(m);
    if (revertTo) revertRef.current = setTimeout(() => setMoodState(revertTo), ms);
  }, []);

  const lookAt = useCallback((x: number, y: number) => {
    const el = mascotRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const dx = x - (r.left + r.width / 2);
    const dy = y - (r.top + r.height * 0.44);
    const d = Math.sqrt(dx * dx + dy * dy) || 1;
    // The prototype moves the pupils up to 1.5 SVG units; scale to the rendered size.
    const k = Math.min(1, d / 120) * 1.5 * (r.width / 76);
    setLook({ x: (dx / d) * k, y: (dy / d) * k });
  }, []);

  const lookAtEl = useCallback(
    (el: Element | null | undefined) => {
      if (!el) return;
      const r = el.getBoundingClientRect();
      lookAt(r.left + r.width * 0.6, r.top + r.height / 2);
    },
    [lookAt],
  );

  const lookFront = useCallback(() => setLook(null), []);

  // Eyes follow a real mouse (never touch: a finger would make them jump).
  useEffect(() => {
    const onMove = (e: PointerEvent) => {
      if (e.pointerType === "mouse") lookAt(e.clientX, e.clientY);
    };
    window.addEventListener("pointermove", onMove);
    return () => {
      window.removeEventListener("pointermove", onMove);
      if (revertRef.current) clearTimeout(revertRef.current);
    };
  }, [lookAt]);

  return { line, mood, look, mascotRef, say, setMood, lookAtEl, lookFront };
}

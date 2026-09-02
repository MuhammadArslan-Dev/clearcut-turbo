"use client";

import { useEffect, useRef, ReactNode } from "react";

type MathJaxWithClear = typeof window.MathJax & {
  typesetClear?: (elements?: (Element | null)[]) => void;
};

/**
 * Shared across every mounted <Math> instance: collects elements needing
 * (re)typesetting and flushes them in ONE typesetPromise call per animation
 * frame instead of one call per instance. Pages that mount many at once
 * (e.g. ExamReportSheet's question review list) used to trigger one MathJax
 * reflow per element as each one's effect fired independently — that's N
 * separate DOM mutations competing for the same frame. Batching collapses
 * them into a single reflow, cutting layout-thrash/INP cost on those pages.
 */
let pendingTypeset = new Set<Element>();
let typesetScheduled = false;

function flushTypeset() {
  typesetScheduled = false;
  const els = Array.from(pendingTypeset);
  pendingTypeset = new Set();
  if (!els.length) return;

  const mj = window.MathJax as MathJaxWithClear | undefined;
  if (!mj?.typesetPromise) return;
  mj.typesetClear?.(els);
  mj.typesetPromise(els).catch(() => {});
}

function scheduleTypeset(el: Element) {
  pendingTypeset.add(el);
  if (typesetScheduled) return;
  typesetScheduled = true;
  requestAnimationFrame(flushTypeset);
}

export default function Math({
  children,
  content,
  className,
}: {
  children: ReactNode;
  /** Pass the raw string content so the effect re-runs only when text actually changes, not on every parent re-render. */
  content?: string;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!ref.current) return;

    const el = ref.current;
    const enqueue = () => scheduleTypeset(el);

    if (window.MathJax) {
      enqueue();
    } else {
      // MathJax CDN hasn't finished loading yet — wait for the ready signal
      window.addEventListener("mathjax-ready", enqueue, { once: true });
    }

    return () => {
      window.removeEventListener("mathjax-ready", enqueue);
      pendingTypeset.delete(el);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [content ?? children]);

  return (
    <div ref={ref} className={className}>
      {children}
    </div>
  );
}

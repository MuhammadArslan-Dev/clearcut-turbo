"use client";

import { useEffect, useRef, ReactNode } from "react";

type MathJaxWithClear = typeof window.MathJax & {
  typesetClear?: (elements?: (Element | null)[]) => void;
};

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

    const typeset = () => {
      const mj = window.MathJax as MathJaxWithClear | undefined;
      if (!mj?.typesetPromise) return;
      mj.typesetClear?.([el]);
      mj.typesetPromise([el]).catch(() => {});
    };

    if (window.MathJax) {
      typeset();
    } else {
      // MathJax CDN hasn't finished loading yet — wait for the ready signal
      window.addEventListener("mathjax-ready", typeset, { once: true });
      return () => window.removeEventListener("mathjax-ready", typeset);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [content ?? children]);

  return (
    <div ref={ref} className={className}>
      {children}
    </div>
  );
}

"use client";

import { useLayoutEffect, useRef, ReactNode } from "react";
import "katex/dist/katex.min.css";
import { splitMath } from "@/lib/math/katex-render";

function typesetTextNode(node: Text) {
  const parts = splitMath(node.data);
  if (!parts) return;

  const frag = document.createDocumentFragment();
  for (const part of parts) {
    if ("text" in part) {
      frag.appendChild(document.createTextNode(part.text));
    } else {
      const span = document.createElement("span");
      span.dataset.katex = "1";
      span.innerHTML = part.html;
      frag.appendChild(span);
    }
  }
  node.replaceWith(frag);
}

/**
 * Walks `root`'s text nodes and replaces $...$/$$...$$ runs with KaTeX
 * output, leaving react-markdown's own formatted output (bold/lists/<img>)
 * untouched — only its text nodes are post-processed.
 */
function typeset(root: HTMLElement) {
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
    acceptNode(n) {
      const parent = (n as Text).parentElement;
      if (!parent) return NodeFilter.FILTER_REJECT;
      if (parent.closest("[data-katex]")) return NodeFilter.FILTER_REJECT;
      return NodeFilter.FILTER_ACCEPT;
    },
  });

  // Collect first, then mutate — replacing nodes while the TreeWalker is
  // still iterating the live tree can skip siblings.
  const nodes: Text[] = [];
  let n: Node | null;
  while ((n = walker.nextNode())) nodes.push(n as Text);
  for (const node of nodes) typesetTextNode(node);
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

  useLayoutEffect(() => {
    if (!ref.current) return;
    typeset(ref.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [content ?? children]);

  return (
    <div ref={ref} className={className}>
      {children}
    </div>
  );
}

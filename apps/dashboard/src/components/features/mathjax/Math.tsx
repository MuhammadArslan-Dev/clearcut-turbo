"use client";

import { useLayoutEffect, useRef, ReactNode } from "react";
import katex from "katex";
import "katex/dist/katex.min.css";

// Same delimiters the old MathJax config used: displayMath $$...$$ checked
// first so it isn't swallowed as two inline $...$ matches.
const MATH_RE = /\$\$([\s\S]+?)\$\$|\$([^\$\n]+?)\$/;

function renderMathHtml(expr: string, displayMode: boolean): string {
  try {
    // throwOnError: false makes KaTeX return an inline "error" span (red
    // text, not a thrown exception) for malformed LaTeX instead of crashing
    // the question card — a real, if small, share of the content bank has
    // pre-existing authoring typos (mismatched braces, `\time` instead of
    // `\times`) that need to fail visibly-but-safely, not take the page down.
    return katex.renderToString(expr, { throwOnError: false, displayMode, strict: "ignore" });
  } catch {
    return expr;
  }
}

function typesetTextNode(node: Text) {
  const text = node.data;
  if (!text.includes("$")) return;

  const parts: Array<{ text: string } | { html: string }> = [];
  let rest = text;
  let match: RegExpExecArray | null;
  let foundAny = false;

  while (rest.length && (match = MATH_RE.exec(rest))) {
    foundAny = true;
    if (match.index > 0) parts.push({ text: rest.slice(0, match.index) });
    const isDisplay = match[1] !== undefined;
    const expr = isDisplay ? match[1] : match[2];
    parts.push({ html: renderMathHtml(expr, isDisplay) });
    rest = rest.slice(match.index + match[0].length);
  }
  if (!foundAny) return;
  if (rest.length) parts.push({ text: rest });

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
 * output, mirroring exactly what MathJax's typesetPromise used to do to
 * this same DOM (leaving react-markdown's own formatted output —
 * bold/lists/<img> — untouched, only post-processing its text nodes). The
 * one thing that changed is WHEN this runs: MathJax ran in a useEffect,
 * after the CDN script loaded and after the browser had already painted the
 * raw, un-typeset "$...$" text — that paint-then-swap was the CLS source
 * (field data: 1.8-1.9 on question-heavy pages). katex is bundled (no CDN
 * round trip) and synchronous, so doing this in useLayoutEffect means it
 * completes before the browser's first paint of this content — there is no
 * intermediate frame showing raw LaTeX to shift away from.
 */
function typeset(root: HTMLElement) {
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
    acceptNode(n) {
      const parent = (n as Text).parentElement;
      if (!parent) return NodeFilter.FILTER_REJECT;
      // Don't re-descend into a span we already rendered (defensive — normal
      // content-change re-renders replace this subtree via react-markdown
      // before this effect re-runs, so there's nothing stale to skip).
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

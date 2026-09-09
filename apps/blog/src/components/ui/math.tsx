"use client";

import { useLayoutEffect, useRef, ReactNode } from "react";
import katex from "katex";
import "katex/dist/katex.min.css";

// displayMath $$...$$ checked first so it isn't swallowed as two inline $...$ matches.
const MATH_RE = /\$\$([\s\S]+?)\$\$|\$([^\$\n]+?)\$/;

// Fill-in-the-blank questions are commonly authored with a run of raw "_"
// as the blank, left inside the $...$ span (e.g. "$(11011)_2 = (____)_{10}$").
// In LaTeX a bare "_" always starts a subscript and must be followed by a
// single char or a {...} group, so 2+ consecutive un-grouped underscores are
// never valid syntax — this can only repair already-broken content, never
// break a real subscript. Escaping them ("\_") makes KaTeX render literal
// underscore characters (a blank line) instead of erroring on the "_ _".
function escapeBlankRuns(expr: string): string {
  return expr.replace(/_{2,}/g, (run) => "\\_".repeat(run.length));
}

function renderMathHtml(expr: string, displayMode: boolean): string {
  const safeExpr = escapeBlankRuns(expr);
  try {
    // throwOnError: false makes KaTeX return an inline "error" span (red
    // text, not a thrown exception) for malformed LaTeX instead of crashing
    // the question card — pre-existing authoring typos (mismatched braces,
    // `\time` instead of `\times`) need to fail visibly-but-safely.
    return katex.renderToString(safeExpr, { throwOnError: false, displayMode, strict: "ignore" });
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

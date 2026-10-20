import katex from "katex";

// Shared by the client `Math` component (components/ui/math.tsx), which
// typesets DOM text nodes after render, and the server-side rehype plugin
// (./rehype-katex-text.ts), which typesets markdown text nodes before render
// — so both find and render math the same way.

// displayMath $$...$$ checked first so it isn't swallowed as two inline $...$ matches.
export const MATH_RE = /\$\$([\s\S]+?)\$\$|\$([^\$\n]+?)\$/;

// Fill-in-the-blank questions are commonly authored with a run of raw "_"
// as the blank, left inside the $...$ span (e.g. "$(11011)_2 = (____)_{10}$").
// In LaTeX a bare "_" always starts a subscript and must be followed by a
// single char or a {...} group, so 2+ consecutive un-grouped underscores are
// never valid syntax — this can only repair already-broken content, never
// break a real subscript. Escaping them ("\_") makes KaTeX render literal
// underscore characters (a blank line) instead of erroring on the "_ _".
export function escapeBlankRuns(expr: string): string {
  return expr.replace(/_{2,}/g, (run) => "\\_".repeat(run.length));
}

export function renderMathHtml(expr: string, displayMode: boolean): string {
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

export type MathPart = { text: string } | { html: string };

/** Splits text into plain runs and rendered math; null when it has no math. */
export function splitMath(text: string): MathPart[] | null {
  if (!text.includes("$")) return null;
  const parts: MathPart[] = [];
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
  if (!foundAny) return null;
  if (rest.length) parts.push({ text: rest });
  return parts;
}

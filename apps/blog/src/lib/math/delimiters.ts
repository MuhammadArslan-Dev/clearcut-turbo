// Question content mixes two LaTeX delimiter styles: $...$ / $$...$$ and
// \( ... \) / \[ ... \]. The math renderers (katex-render.ts) only look for
// the dollar form, and Markdown reads "\(" / "\)" / "\[" / "\]" as escaped
// punctuation — it strips the backslash, so "\( n = 3 \)" reached the page
// as the plain text "( n = 3 )". Rewriting the backslash form to the dollar
// form BEFORE Markdown runs (and before plain option text is split) lets the
// one existing renderer handle both. Dependency-free on purpose: it is also
// imported by the client `TextMarkDown`, which must not pull KaTeX in.

// (?<!\\) keeps an escaped backslash ("\\(") out of it: that is a literal "\"
// followed by "(", not a delimiter.
const BRACKET_MATH_RE = /(?<!\\)\\\[([\s\S]+?)(?<!\\)\\\]/g;
const PAREN_MATH_RE = /(?<!\\)\\\(([\s\S]+?)(?<!\\)\\\)/g;

export function normalizeMathDelimiters(text: string): string {
  if (!text.includes("\\")) return text;
  return text
    .replace(BRACKET_MATH_RE, (_, expr: string) => "$$" + expr + "$$")
    // The inline matcher in katex-render.ts does not span newlines.
    .replace(PAREN_MATH_RE, (_, expr: string) => "$" + expr.replace(/\s*\n\s*/g, " ").trim() + "$");
}

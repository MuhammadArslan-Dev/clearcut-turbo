import { splitMath } from "./katex-render";

// Minimal hast shapes — enough for this walk, without a direct dependency on
// the `hast` types package.
type HastText = { type: "text"; value: string };
type HastElement = {
  type: "element";
  tagName: string;
  properties?: Record<string, unknown>;
  children: HastNode[];
};
type HastNode = HastText | HastElement | { type: string; children?: HastNode[] };

export const KATEX_HTML_PROP = "dataKatexHtml";

function isMathSpan(node: HastNode): boolean {
  return node.type === "element" && Boolean((node as HastElement).properties?.[KATEX_HTML_PROP]);
}

function walk(node: HastNode) {
  const children = (node as { children?: HastNode[] }).children;
  if (!children) return;
  const out: HastNode[] = [];
  for (const child of children) {
    if (child.type === "text") {
      const parts = splitMath((child as HastText).value);
      if (!parts) {
        out.push(child);
        continue;
      }
      for (const part of parts) {
        out.push(
          "text" in part
            ? { type: "text", value: part.text }
            : { type: "element", tagName: "span", properties: { [KATEX_HTML_PROP]: part.html }, children: [] },
        );
      }
    } else {
      if (!isMathSpan(child)) walk(child);
      out.push(child);
    }
  }
  (node as { children: HastNode[] }).children = out;
}

/**
 * Rehype plugin: replaces $...$ / $$...$$ in text nodes with a placeholder
 * span carrying KaTeX's HTML, which the renderer turns into
 * `dangerouslySetInnerHTML` (see components/question-bank/rich-text.tsx).
 * Runs after rehype-sanitize, so the trusted KaTeX output is never sanitized
 * away and untrusted content is still sanitized first. Same text-node
 * matching as the client `Math` component, done on the server instead.
 */
export default function rehypeKatexText() {
  return (tree: HastNode) => walk(tree);
}

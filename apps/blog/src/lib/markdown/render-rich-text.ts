import { toHtml } from "hast-util-to-html";
import { urlAttributes } from "html-url-attributes";
import { defaultUrlTransform } from "react-markdown";
import rehypeRaw from "rehype-raw";
import rehypeSanitize from "rehype-sanitize";
import remarkBreaks from "remark-breaks";
import remarkParse from "remark-parse";
import remarkRehype from "remark-rehype";
import { unified } from "unified";
import { visit } from "unist-util-visit";
import { markdownSanitizeSchema } from "@/components/ui/text-markdown";
import rehypeKatexText, { KATEX_HTML_PROP } from "@/lib/math/rehype-katex-text";
import { escapeMathForMarkdown, normalizeImgTags } from "./prepare";

// Question/explanation markdown + KaTeX rendered to an HTML string, once per
// distinct text per server instance. Same pipeline react-markdown 10 ran in
// components/question-bank/rich-text.tsx (remark-parse -> remark-breaks ->
// remark-rehype with raw HTML -> rehype-raw -> rehype-sanitize ->
// rehype-katex-text), plus the two steps react-markdown does after it
// (`post()`): leftover raw nodes become text, and URL attributes go through
// defaultUrlTransform. The component overrides become hast edits: the KaTeX
// placeholder span carries KaTeX's trusted HTML, images get lazy loading.
//
// One question shows up on its chapter page, subject page, year page and
// their /hi copies; rendering it through React each time was most of a
// page's CPU. Output is checked against the React path on real questions by
// rich-text.parity.test.tsx. docs/phases/16 part B.

type HastNode = {
  type: string;
  tagName?: string;
  value?: string;
  properties?: Record<string, unknown>;
  children?: HastNode[];
};

const processor = unified()
  .use(remarkParse)
  .use(remarkBreaks)
  .use(remarkRehype, { allowDangerousHtml: true })
  .use(rehypeRaw)
  .use(rehypeSanitize, markdownSanitizeSchema)
  .use(rehypeKatexText)
  .freeze();

/** react-markdown's post(): raw -> text, then URL attributes made safe. */
function post(tree: HastNode) {
  visit(tree as never, (node: HastNode, index: number | undefined, parent: HastNode | undefined) => {
    if (node.type === "raw" && parent?.children && typeof index === "number") {
      parent.children[index] = { type: "text", value: node.value };
      return index;
    }
    if (node.type !== "element" || !node.properties) return;
    for (const key in urlAttributes) {
      if (Object.prototype.hasOwnProperty.call(urlAttributes, key) && Object.prototype.hasOwnProperty.call(node.properties, key)) {
        const test = urlAttributes[key];
        if (test === null || test.includes(node.tagName ?? "")) {
          node.properties[key] = defaultUrlTransform(String(node.properties[key] || ""));
        }
      }
    }
  });
}

/** The component overrides rich-text.tsx passed to react-markdown. */
function applyComponents(tree: HastNode) {
  visit(tree as never, "element", (node: HastNode) => {
    const html = node.properties?.[KATEX_HTML_PROP];
    if (node.tagName === "span" && typeof html === "string") {
      // Trusted KaTeX output for one $...$ run (it was sanitized as text first).
      node.properties = { dataKatex: "1" };
      node.children = [{ type: "raw", value: html }];
      return "skip";
    }
    if (node.tagName === "img") {
      node.properties = { ...node.properties, loading: "lazy", decoding: "async" };
    }
  });
}

function render(markdown: string): string {
  const normalized = escapeMathForMarkdown(normalizeImgTags(markdown));
  const tree = processor.runSync(processor.parse(normalized)) as unknown as HastNode;
  post(tree);
  applyComponents(tree);
  return toHtml(tree as never, { allowDangerousHtml: true });
}

// Bounded memo: insertion order doubles as recency (a hit is re-inserted).
const MEMO_MAX = 5000;
const memo = new Map<string, string>();

/** HTML for one question or explanation text (without the wrapping div). */
export function renderRichText(markdown: string): string {
  const key = markdown ?? "";
  const hit = memo.get(key);
  if (hit !== undefined) {
    memo.delete(key);
    memo.set(key, hit);
    return hit;
  }
  const html = render(key);
  memo.set(key, html);
  if (memo.size > MEMO_MAX) memo.delete(memo.keys().next().value as string);
  return html;
}

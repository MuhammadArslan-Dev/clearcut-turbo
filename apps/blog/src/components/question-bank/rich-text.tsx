import "katex/dist/katex.min.css";
import { renderRichText } from "@/lib/markdown/render-rich-text";

/**
 * Server-rendered markdown + math for question-bank cards: the same pipeline
 * and sanitizing as the client `TextMarkDown` + `Math` pair, but KaTeX runs
 * here (lib/math/rehype-katex-text.ts), so the HTML already contains the
 * typeset math and none of this ships to or runs in the browser.
 *
 * The HTML is built once per distinct text per server instance
 * (lib/markdown/render-rich-text.ts) instead of through react-markdown on
 * every render. It is the sanitized pipeline output: user content is
 * sanitized first and only KaTeX's own output is inserted raw, as before.
 * Same DOM as the react-markdown version: rich-text.parity.test.tsx.
 */
export default function RichText({ children }: { children: string }) {
  return <div className="markdown-content" dangerouslySetInnerHTML={{ __html: renderRichText(children ?? "") }} />;
}

import ReactMarkdown, { type Components } from "react-markdown";
import rehypeRaw from "rehype-raw";
import rehypeSanitize from "rehype-sanitize";
import remarkBreaks from "remark-breaks";
import "katex/dist/katex.min.css";
import { escapeMathForMarkdown, normalizeImgTags } from "@/lib/markdown/prepare";
import rehypeKatexText, { KATEX_HTML_PROP } from "@/lib/math/rehype-katex-text";
import { markdownSanitizeSchema } from "@/components/ui/text-markdown";

const components: Components = {
  span({ node, ...props }) {
    const html = node?.properties?.[KATEX_HTML_PROP];
    if (typeof html === "string") {
      // KaTeX output for one $...$ run, rendered on the server.
      return <span data-katex="1" dangerouslySetInnerHTML={{ __html: html }} />;
    }
    return <span {...props} />;
  },
  img(props) {
    // Images inside question/explanation text: off-screen ones (and every
    // one inside a closed explanation) shouldn't download up front.
    const { node, ...imgProps } = props;
    void node;
    // eslint-disable-next-line @next/next/no-img-element, jsx-a11y/alt-text
    return <img {...imgProps} loading="lazy" decoding="async" />;
  },
};

/**
 * Server-rendered markdown + math for question-bank cards: the same pipeline
 * and sanitizing as the client `TextMarkDown` + `Math` pair, but KaTeX runs
 * here (lib/math/rehype-katex-text.ts), so the HTML already contains the
 * typeset math and none of this ships to or runs in the browser.
 */
export default function RichText({ children }: { children: string }) {
  const normalized = escapeMathForMarkdown(normalizeImgTags(children ?? ""));
  return (
    <div className="markdown-content">
      <ReactMarkdown
        remarkPlugins={[remarkBreaks]}
        rehypePlugins={[rehypeRaw, [rehypeSanitize, markdownSanitizeSchema], rehypeKatexText]}
        components={components}
      >
        {normalized}
      </ReactMarkdown>
    </div>
  );
}

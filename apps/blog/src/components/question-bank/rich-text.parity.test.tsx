import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import ReactMarkdown, { type Components } from "react-markdown";
import rehypeRaw from "rehype-raw";
import rehypeSanitize from "rehype-sanitize";
import remarkBreaks from "remark-breaks";
import { toHtml } from "hast-util-to-html";
import { unified } from "unified";
import { escapeMathForMarkdown, normalizeImgTags } from "@/lib/markdown/prepare";
import { renderRichText } from "@/lib/markdown/render-rich-text";
import rehypeKatexText, { KATEX_HTML_PROP } from "@/lib/math/rehype-katex-text";
import { markdownSanitizeSchema } from "@/components/ui/text-markdown";

// The string renderer (lib/markdown/render-rich-text.ts) must produce the same
// DOM as the React path it replaced. `Reference` is that React path, verbatim
// from rich-text.tsx before 2026-10-22. Both outputs are parsed and
// re-serialized the same way, so only real DOM differences count (not
// `<br/>` vs `<br>` or attribute quoting).

const components: Components = {
  span({ node, ...props }) {
    const html = node?.properties?.[KATEX_HTML_PROP];
    if (typeof html === "string") return <span data-katex="1" dangerouslySetInnerHTML={{ __html: html }} />;
    return <span {...props} />;
  },
  img(props) {
    const { node, ...imgProps } = props;
    void node;
    // eslint-disable-next-line @next/next/no-img-element, jsx-a11y/alt-text
    return <img {...imgProps} loading="lazy" decoding="async" />;
  },
};

function Reference({ children }: { children: string }) {
  return (
    <div className="markdown-content">
      <ReactMarkdown
        remarkPlugins={[remarkBreaks]}
        rehypePlugins={[rehypeRaw, [rehypeSanitize, markdownSanitizeSchema], rehypeKatexText]}
        components={components}
      >
        {escapeMathForMarkdown(normalizeImgTags(children ?? ""))}
      </ReactMarkdown>
    </div>
  );
}

const reparse = unified().use(rehypeRaw);
/** Parse HTML and serialize it back: the same DOM gives the same string. */
function canonical(html: string): string {
  const tree = reparse.runSync({ type: "root", children: [{ type: "raw", value: html }] } as never);
  return toHtml(tree as never);
}

const oldHtml = (md: string) => canonical(renderToStaticMarkup(<Reference>{md}</Reference>));
const newHtml = (md: string) => canonical(`<div class="markdown-content">${renderRichText(md)}</div>`);

const SAMPLES = [
  "Costs 5 dollars",
  "Find $x^2$ when $$\\frac{1}{2}$$",
  "**Bold** and $a_1 + a_2$",
  "$(11011)_2 = (____)_{10}$",
  "line one\nline two\n\n- a\n- b\n\n1. one\n2. two",
  'Hi <script>alert(1)</script><span onclick="x()">t</span>',
  "<img src= https://cdn.example.com/a.png>",
  '<img src="javascript:alert(1)"> [x](javascript:alert(1)) [ok](https://example.com)',
  "| a | b |\n|---|---|\n| 1 | 2 |",
  "Price ₹99 & <b>bold</b> 'quote' \"dq\" <br> a < b > c",
  "हिन्दी प्रश्न $\\sqrt{2}$ — उत्तर",
  "`code` and ~~strike~~ and <sub>2</sub><sup>3</sup>",
  "",
];

describe("renderRichText == React RichText", () => {
  it.each(SAMPLES)("same DOM for %j", (md) => {
    expect(newHtml(md)).toBe(oldHtml(md));
  });

  it("returns the memoized string on repeat calls", () => {
    expect(renderRichText("memo $x$ test")).toBe(renderRichText("memo $x$ test"));
  });
});

// Real questions (not part of CI):
//   PARITY_BACKEND=http://clearcutoff-main-backend.test/api npx vitest run rich-text.parity
const BACKEND = process.env.PARITY_BACKEND;
describe.runIf(BACKEND)("renderRichText == React RichText on real questions", () => {
  it("matches every question and explanation text", { timeout: 3_600_000 }, async () => {
    // The public API allows ~60 requests/min: pace the calls, wait out a 429.
    const pause = (ms: number) => new Promise((r) => setTimeout(r, ms));
    const get = async (p: string) => {
      for (let attempt = 0; ; attempt++) {
        const res = await fetch(`${BACKEND}${p}`);
        if (res.ok) {
          await pause(1100);
          return (await res.json()).data;
        }
        if (attempt >= 5) throw new Error(`${p} -> HTTP ${res.status}`);
        await pause(30_000);
      }
    };
    const ids: number[] = [];
    for (const exam of ["ctet", "htet"]) {
      const index = await get(`/blog/question-index?exam_name=${exam}`);
      for (const list of Object.values(index.chapters) as [number][][]) ids.push(...list.map(([id]) => id));
    }
    const texts = new Set<string>();
    const unique = [...new Set(ids)];
    for (let i = 0; i < unique.length; i += 100) {
      const rows = await get(`/blog/get-questions-by-ids?ids=${unique.slice(i, i + 100).join(",")}`);
      for (const q of rows ?? []) {
        for (const t of q.translations ?? []) {
          if (t.question) texts.add(t.question);
          if (t.explanation) texts.add(t.explanation);
        }
      }
    }
    const mismatches: string[] = [];
    for (const md of texts) if (newHtml(md) !== oldHtml(md)) mismatches.push(md);
    console.log(`questions=${unique.length} texts=${texts.size} mismatches=${mismatches.length}`);
    for (const md of mismatches.slice(0, 5)) {
      console.log("MISMATCH", JSON.stringify(md).slice(0, 300), "\n old:", oldHtml(md).slice(0, 400), "\n new:", newHtml(md).slice(0, 400));
    }
    expect(mismatches).toEqual([]);
  });
});

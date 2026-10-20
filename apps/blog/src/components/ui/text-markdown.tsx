import ReactMarkdown from "react-markdown";
import rehypeRaw from "rehype-raw";
import rehypeSanitize, { defaultSchema } from "rehype-sanitize";
import remarkBreaks from "remark-breaks";
import { escapeMathForMarkdown, normalizeImgTags } from "@/lib/markdown/prepare";

// Extend the default sanitize schema to allow <img> with src/alt/title and https URLs.
export const markdownSanitizeSchema = {
  ...defaultSchema,
  attributes: {
    ...defaultSchema.attributes,
    img: ["src", "alt", "title", "width", "height"],
  },
  protocols: {
    ...defaultSchema.protocols,
    src: ["http", "https"],
  },
};
const schema = markdownSanitizeSchema;

export default function TextMarkDown({ children }: { children: string }) {
  const normalized = escapeMathForMarkdown(normalizeImgTags(children ?? ""));

  // `markdown-content` (src/app/globals.css) restores the p/ul/ol/li spacing
  // Tailwind's Preflight strips by default, and remarkBreaks turns a single
  // "\n" (CommonMark "soft break" — most real explanation/question rows use
  // this mid-paragraph) into an actual <br> AST node. Same fix as
  // apps/dashboard's TextMarkDown — see that file's docblock for why a
  // CSS-only `white-space: pre-line` approach was rejected (it breaks loose
  // numbered lists) in favor of remarkBreaks.
  return (
    <div className="markdown-content">
      <ReactMarkdown
        remarkPlugins={[remarkBreaks]}
        rehypePlugins={[rehypeRaw, [rehypeSanitize, schema]]}
      >
        {normalized}
      </ReactMarkdown>
    </div>
  );
}

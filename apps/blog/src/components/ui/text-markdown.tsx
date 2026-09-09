import ReactMarkdown from "react-markdown";
import rehypeRaw from "rehype-raw";
import rehypeSanitize, { defaultSchema } from "rehype-sanitize";

// Extend the default sanitize schema to allow <img> with src/alt/title and https URLs.
const schema = {
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

function normalizeImgTags(text: string): string {
  // The database stores images as <img src= URL> (space after =, no quotes).
  // CommonMark's inline HTML parser rejects this and treats the whole tag as plain text.
  // Normalize to <img src="URL"> so rehypeRaw can parse it as actual HTML.
  return text.replace(/<img(\s[^>]*)?\ssrc=\s+([^\s"'>]+)/gi, (_, attrs, url) => {
    const safeAttrs = (attrs ?? "").replace(/\bsrc=[^\s>]*/gi, "").trim();
    return `<img${safeAttrs ? " " + safeAttrs : ""} src="${url}"`;
  });
}

// Matches the same $...$/$$...$$ spans the downstream Math component
// (see components/ui/math.tsx) looks for once this renders to DOM text.
const MATH_SPAN_RE = /\$\$[\s\S]+?\$\$|\$[^\$\n]+?\$/g;

function escapeMathForMarkdown(text: string): string {
  // LaTeX inside $...$ leans on _ (subscripts), * (rare, e.g. \ast usage) and
  // ` freely. CommonMark reads unescaped runs of those as emphasis/code spans
  // BEFORE Math's typeset() ever sees the text, splitting "$(11011)_2$" into
  // multiple DOM nodes (e.g. an <em> for the "_2 ... _" run) so the downstream
  // $...$ regex no longer matches a single text node and the raw "$...$"
  // source is left on the page instead of being KaTeX-rendered. Backslash-
  // escaping these chars only inside math spans makes CommonMark emit them
  // as literal characters (escapes are stripped, not rendered) — the DOM
  // text node Math walks ends up with the original, unmangled LaTeX. The
  // negative lookbehind skips characters the source already escaped (e.g.
  // blanks authored as "\_\_\_\_") — re-escaping an already-escaped "\_"
  // would double the backslash, which CommonMark reads as a literal "\"
  // followed by a now-*unescaped* "_", reintroducing the exact emphasis
  // bug this function exists to prevent.
  return text.replace(MATH_SPAN_RE, (span) => span.replace(/(?<!\\)[_*`]/g, "\\$&"));
}

export default function TextMarkDown({ children }: { children: string }) {
  const normalized = escapeMathForMarkdown(normalizeImgTags(children ?? ""));

  return (
    <ReactMarkdown rehypePlugins={[rehypeRaw, [rehypeSanitize, schema]]}>
      {normalized}
    </ReactMarkdown>
  );
}

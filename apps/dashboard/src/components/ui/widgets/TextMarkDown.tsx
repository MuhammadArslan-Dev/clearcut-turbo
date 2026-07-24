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

export default function TextMarkDown({ children }: { children: string }) {
  const normalized = normalizeImgTags(children ?? "");

  return (
    <ReactMarkdown rehypePlugins={[rehypeRaw, [rehypeSanitize, schema]]}>
      {normalized}
    </ReactMarkdown>
  );
}

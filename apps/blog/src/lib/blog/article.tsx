// Parses a post's server-rendered `content_html` in a single pass that both
// (a) injects a slugified, de-duplicated `id` onto every H2/H3 heading and
// (b) extracts the table of contents from those headings.
//
// The injected ids are the scroll anchors the Contents sidebar links to (and
// that the P5 scroll-spy observer watches). Payload's Lexical→HTML converter
// does not emit heading ids, so we add them here on the blog side.
import parse, { domToReact } from "html-react-parser";
import type { DOMNode, HTMLReactParserOptions } from "html-react-parser";
import { createElement, type ReactNode } from "react";
import { formatToSlug } from "@/utils/slugify";
import { resolveMediaUrl } from "@/lib/blog/media";
import type { TocItem } from "@/types/blog/post";

// Narrow a parsed node to an element (tag) node with children/attribs.
type TagNode = DOMNode & {
  name: string;
  children: DOMNode[];
  attribs: Record<string, string>;
};

function isTag(node: DOMNode): node is TagNode {
  return (node as { type?: string }).type === "tag";
}

// Collect the visible text of a heading, descending into inline markup
// (e.g. <strong>, <em>) so ids/labels reflect the full heading text.
function extractText(nodes: DOMNode[]): string {
  let out = "";
  for (const node of nodes) {
    const n = node as { type?: string; data?: string; children?: DOMNode[] };
    if (n.type === "text") out += n.data ?? "";
    else if (n.children) out += extractText(n.children);
  }
  return out;
}

export interface ParsedArticle {
  content: ReactNode;
  toc: TocItem[];
}

export function parseArticle(html: string): ParsedArticle {
  const toc: TocItem[] = [];
  const counts = new Map<string, number>();

  // Slugify heading text; suffix `-1`, `-2`, … on collisions so ids stay unique.
  const uniqueId = (text: string): string => {
    const base = formatToSlug(text) || "section";
    const seen = counts.get(base) ?? 0;
    counts.set(base, seen + 1);
    return seen === 0 ? base : `${base}-${seen}`;
  };

  const options: HTMLReactParserOptions = {
    replace: (domNode) => {
      if (isTag(domNode) && (domNode.name === "h2" || domNode.name === "h3")) {
        const text = extractText(domNode.children).trim();
        const id = uniqueId(text);
        toc.push({ id, text, level: domNode.name === "h2" ? 2 : 3 });
        return createElement(
          domNode.name,
          { id },
          domToReact(domNode.children, options),
        );
      }
      // Rewrite relative asset URLs to absolute CMS URLs. Mutating attribs and
      // returning undefined lets the default converter render with the fix.
      if (isTag(domNode)) {
        // <img> src is always a Payload media asset when root-relative.
        if (domNode.name === "img" && domNode.attribs.src) {
          domNode.attribs.src =
            resolveMediaUrl(domNode.attribs.src) ?? domNode.attribs.src;
        }
        // For links, only rewrite CMS asset paths (e.g. media/file downloads);
        // leave other relative links alone so blog-internal links keep working.
        else if (
          domNode.name === "a" &&
          domNode.attribs.href &&
          /^\/(api|media)\//.test(domNode.attribs.href)
        ) {
          domNode.attribs.href =
            resolveMediaUrl(domNode.attribs.href) ?? domNode.attribs.href;
        }
      }
      return undefined;
    },
  };

  const content = parse(html, options);
  return { content, toc };
}

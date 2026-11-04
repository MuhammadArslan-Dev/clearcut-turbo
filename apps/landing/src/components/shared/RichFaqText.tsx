import React from "react";

// Payload wraps every rich-text HTML value in `<div class="payload-richtext">`.
// Unwrap it so a question can sit inside the accordion's <summary> (a <div> is
// not valid inside the <p> the title lives in) and answers get our own wrapper.
export function unwrapRichHtml(html: string): string {
  return (
    html
      .trim()
      .replace(/^<div class="payload-richtext">([\s\S]*)<\/div>$/, "$1")
      // Payload's list items come out as a multi-line `<li class="" style="" value="1">`:
      // collapse the whitespace inside tags and drop the empty attributes (for the page
      // and the JSON-LD).
      .replace(/<([a-z][a-z0-9]*)(\s[^<>]*)?>/gi, (_match, tag: string, attrs?: string) => {
        const clean = (attrs ?? "").replace(/\s+/g, " ").replace(/ (?:class|style)=""/g, "").trimEnd();
        return `<${tag}${clean}>`;
      })
      .trim()
  );
}

type Props = {
  /** CMS HTML (bold / blue / links). Absent for plain, unformatted text. */
  html?: string;
  /** Plain text, always present; rendered exactly as before when there is no HTML. */
  text: string;
  /** Single line (questions): renders a <span>, never a block. */
  inline?: boolean;
};

/**
 * One FAQ question or answer. Formatted CMS HTML is rendered inside `.faq-rich`
 * (styles in globals.css, brand tokens only); anything without HTML falls back
 * to the plain string, so records saved before rich text existed look the same.
 * HTML comes from the CMS admin, produced by Payload's converter from a fixed
 * feature set (bold, blue, links, lists), the same trust model as ArticleBody.
 */
export default function RichFaqText({ html, text, inline = false }: Props) {
  const inner = html ? unwrapRichHtml(html) : "";
  if (!inner) return <>{text}</>;

  if (inline) {
    return <span className="faq-rich faq-rich-inline" dangerouslySetInnerHTML={{ __html: inner }} />;
  }
  return <div className="faq-rich" dangerouslySetInnerHTML={{ __html: inner }} />;
}

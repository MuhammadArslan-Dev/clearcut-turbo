import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import RichText from "./rich-text";
import { splitMath } from "@/lib/math/katex-render";

const render = (md: string) => renderToStaticMarkup(<RichText>{md}</RichText>);

describe("RichText (server markdown + KaTeX)", () => {
  it("typesets inline and display math on the server", () => {
    const html = render("Find $x^2$ when $$\\frac{1}{2}$$");
    expect(html).toContain('class="katex"');
    expect(html).toContain('class="katex-display"');
    expect(html).not.toContain("$x^2$");
  });

  it("keeps markdown formatting around math", () => {
    const html = render("**Bold** and $a_1 + a_2$");
    expect(html).toContain("<strong>Bold</strong>");
    expect(html).toContain('class="katex"');
    // `_` inside math must not have become <em>.
    expect(html).not.toContain("<em>");
  });

  it("renders fill-in-the-blank underscores instead of erroring", () => {
    const html = render("$(11011)_2 = (____)_{10}$");
    expect(html).toContain('class="katex"');
    expect(html).not.toContain("katex-error");
  });

  it("leaves text without math untouched", () => {
    expect(render("Costs 5 dollars")).toBe('<div class="markdown-content"><p>Costs 5 dollars</p></div>');
  });

  it("still sanitizes raw HTML from content", () => {
    const html = render('Hi <script>alert(1)</script><span onclick="x()">t</span>');
    expect(html).not.toContain("<script");
    expect(html).not.toContain("onclick");
  });

  it("normalizes the stored <img src= URL> form and lazy-loads it", () => {
    const html = render("<img src= https://cdn.example.com/a.png>");
    expect(html).toContain('src="https://cdn.example.com/a.png"');
    expect(html).toContain('loading="lazy"');
  });

  it("matches the client Math splitter", () => {
    expect(splitMath("no math")).toBeNull();
    const parts = splitMath("a $x$ b");
    expect(parts?.map((p) => ("text" in p ? p.text : "math"))).toEqual(["a ", "math", " b"]);
  });
});

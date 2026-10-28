import { describe, expect, it } from "vitest";
import { escapeMathForMarkdown } from "@/lib/markdown/prepare";
import { renderRichText } from "@/lib/markdown/render-rich-text";
import { renderMathText, splitMath } from "./katex-render";
import { normalizeMathDelimiters } from "./delimiters";

describe("normalizeMathDelimiters (CC-166)", () => {
  it("turns \\( ... \\) into $...$ and \\[ ... \\] into $$...$$", () => {
    expect(normalizeMathDelimiters("For \\( n = 3 \\), \\( n^2 \\) = 9")).toBe("For $n = 3$, $n^2$ = 9");
    expect(normalizeMathDelimiters("\\[ x^2 \\]")).toBe("$$ x^2 $$");
  });

  it("keeps an escaped backslash and text without math as it is", () => {
    expect(normalizeMathDelimiters("a \\\\( b")).toBe("a \\\\( b");
    expect(normalizeMathDelimiters("plain text (1) and [2]")).toBe("plain text (1) and [2]");
  });

  it("folds a line break inside inline math (the inline matcher stops at a newline)", () => {
    expect(normalizeMathDelimiters("\\( a +\n b \\)")).toBe("$a + b$");
  });
});

describe("option text (plain, no Markdown)", () => {
  it("renders $...$ and \\( \\) to KaTeX", () => {
    expect(renderMathText("$H>Na>K>Li$")).toContain('class="katex"');
    expect(renderMathText("\\(n^{2}\\)")).toContain('class="katex"');
    expect(splitMath("$n+l$")).not.toBeNull();
  });

  it("returns null for text without math, so it renders as before", () => {
    expect(renderMathText("Mainstreaming")).toBeNull();
  });

  it("escapes the plain runs around math", () => {
    const html = renderMathText("a < b and $x$") ?? "";
    expect(html).toContain("a &lt; b and ");
    expect(html).not.toContain("a < b");
  });
});

describe("explanations (Markdown)", () => {
  it("no longer leaves ( n = 3 ) as plain text", () => {
    expect(escapeMathForMarkdown("so \\( n = 3 \\)")).toBe("so $n = 3$");
    const html = renderRichText("Here \\( n = 3 \\) and \\( n^2 \\).");
    expect(html).toContain('class="katex"');
    expect(html).not.toContain("( n = 3 )");
  });

  it("typesets a $$ block written across several lines (was left as raw LaTeX)", () => {
    const md = "The formula is:\n$$\nN = N_0 \\left(\\frac{1}{2}\\right)^{t}\n$$\nso it decays.";
    expect(escapeMathForMarkdown(md)).toBe(
      // "_" is backslash-escaped inside math on purpose (existing behaviour).
      "The formula is:\n$$ N = N\\_0 \\left(\\frac{1}{2}\\right)^{t} $$\nso it decays.",
    );
    const html = renderRichText(md);
    expect(html).toContain('class="katex-display"');
    // KaTeX's MathML <annotation> keeps the TeX source; look at what is left without it.
    expect(html.replace(/<annotation[\s\S]*?<\/annotation>/g, "")).not.toContain("\\frac{1}");
  });
});

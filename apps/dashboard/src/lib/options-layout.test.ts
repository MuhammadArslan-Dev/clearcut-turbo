import { describe, expect, it } from "vitest";
import {
  COMPACT_OPTION_CHARS,
  LONG_OPTION_CHARS,
  optionsLayout,
  visibleTextLength,
} from "@clearcut/ui/options-layout";

// MCQ option layout rule shared by the dashboard and the blog (@clearcut/ui/options-grid).
describe("optionsLayout", () => {
  it("all options very short -> compact (2 columns at every width)", () => {
    expect(optionsLayout(["12", "15", "18", "21"])).toBe("compact");
    expect(optionsLayout(["Delhi", "Agra", "Pune", "Goa"])).toBe("compact");
    expect(optionsLayout([{ text: "a" }, { text: "b" }, { text: "c" }, { text: "d" }])).toBe("compact");
  });

  it("short-ish options -> split (1 column on phones, 2 from the screen's breakpoint)", () => {
    expect(optionsLayout(["Jawaharlal Nehru", "Sardar Patel", "B. R. Ambedkar", "Lal Bahadur"])).toBe("split");
    expect(optionsLayout(["x".repeat(COMPACT_OPTION_CHARS + 1), "a", "b", "c"])).toBe("split");
  });

  it("ONE long option switches the whole set to a single column", () => {
    const long = "x".repeat(LONG_OPTION_CHARS + 1);
    expect(optionsLayout(["12", "15", long, "21"])).toBe("single");
    expect(optionsLayout(["a", "b", "c", long])).toBe("single");
  });

  it("the boundary is inclusive on the short side", () => {
    expect(optionsLayout(["y".repeat(LONG_OPTION_CHARS), "a", "b", "c"])).toBe("split");
    expect(optionsLayout(["y".repeat(LONG_OPTION_CHARS + 1), "a", "b", "c"])).toBe("single");
    expect(optionsLayout(["y".repeat(COMPACT_OPTION_CHARS), "a", "b", "c"])).toBe("compact");
  });

  it("measures visible characters, not markup", () => {
    expect(visibleTextLength("**bold** and _it_")).toBe("bold and it".length);
    expect(visibleTextLength("<p>Hello <b>you</b></p>")).toBe("Hello you".length);
    expect(visibleTextLength("$x^2$")).toBe("x^2".length);
    expect(visibleTextLength("  a   b  ")).toBe(3);
    // Devanagari counts per character, not per UTF-16 unit.
    expect(visibleTextLength("नमस्ते")).toBe(Array.from("नमस्ते").length);
  });

  it("a line break always means a full-width card", () => {
    expect(optionsLayout(["1\n2", "a", "b", "c"])).toBe("single");
    expect(optionsLayout(["a\r\nb", "a", "b", "c"])).toBe("single");
  });

  it("an image keeps an option out of the phone 2-column layout, but it is not 'long'", () => {
    expect(optionsLayout([{ text: "A", image: "/a.png" }, { text: "B" }, { text: "C" }, { text: "D" }])).toBe("split");
    expect(optionsLayout([{ image: "/a.png" }, { image: "/b.png" }, { img: "/c.png" }, { img: "/d.png" }])).toBe("split");
  });

  it("empty / missing options fall back to the old behaviour (split)", () => {
    expect(optionsLayout([])).toBe("split");
    expect(optionsLayout([null, undefined, "", { text: null }])).toBe("split");
    expect(optionsLayout(["   ", "\t"])).toBe("split");
  });

  it("is order independent", () => {
    const set = ["12", "a very very very long option text indeed", "15", "18"];
    expect(optionsLayout(set)).toBe("single");
    expect(optionsLayout([...set].reverse())).toBe("single");
  });
});

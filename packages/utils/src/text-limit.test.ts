import { describe, expect, it } from "vitest";
import { limitChars, limitWords } from "./text-limit";

describe("limitChars", () => {
  it("leaves short text unchanged", () => {
    expect(limitChars("hello", 10)).toBe("hello");
  });

  it("truncates and appends an ellipsis when over the limit", () => {
    expect(limitChars("hello world", 5)).toBe("hello…");
  });

  it("returns an empty string for falsy input", () => {
    expect(limitChars("", 5)).toBe("");
  });
});

describe("limitWords", () => {
  it("leaves text within the word limit unchanged", () => {
    expect(limitWords("the quick brown fox", 10)).toBe("the quick brown fox");
  });

  it("truncates to the word limit and appends an ellipsis", () => {
    expect(limitWords("the quick brown fox jumps", 3)).toBe("the quick brown…");
  });

  it("collapses repeated whitespace when counting words", () => {
    expect(limitWords("the   quick   brown   fox", 2)).toBe("the quick…");
  });

  it("returns an empty string for falsy input", () => {
    expect(limitWords("", 5)).toBe("");
  });
});

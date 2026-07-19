import { describe, expect, it } from "vitest";
import { capitalizeFirst, capitalizeWords, toLower, toUpper } from "./text-format";

describe("capitalizeFirst", () => {
  it("capitalizes only the first letter, lowercasing the rest", () => {
    expect(capitalizeFirst("hELLO world")).toBe("Hello world");
  });

  it("trims surrounding whitespace", () => {
    expect(capitalizeFirst("  hello  ")).toBe("Hello");
  });

  it("returns an empty string for falsy input", () => {
    expect(capitalizeFirst("")).toBe("");
  });
});

describe("capitalizeWords", () => {
  it("capitalizes the first letter of every word", () => {
    expect(capitalizeWords("the quick BROWN fox")).toBe("The Quick Brown Fox");
  });

  it("returns an empty string for falsy input", () => {
    expect(capitalizeWords("")).toBe("");
  });
});

describe("toUpper", () => {
  it("uppercases and trims", () => {
    expect(toUpper("  clear cutoff  ")).toBe("CLEAR CUTOFF");
  });

  it("returns an empty string for falsy input", () => {
    expect(toUpper("")).toBe("");
  });
});

describe("toLower", () => {
  it("lowercases and trims", () => {
    expect(toLower("  CLEAR CUTOFF  ")).toBe("clear cutoff");
  });

  it("returns an empty string for falsy input", () => {
    expect(toLower("")).toBe("");
  });
});

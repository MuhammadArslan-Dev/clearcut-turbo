import { describe, expect, it } from "vitest";
import type { SearchIndexItem } from "./card-model";
import { MAX_SUGGESTIONS, indexRows, matchesRow, suggestionsFor } from "./toolbar-search";

const items: SearchIndexItem[] = [
  { id: 1, n: 1, p: 1, g: "Growth", gh: "विकास", t: ["Play helps children", "A B"], h: ["खेल बच्चों की मदद", "क ख"] },
  { id: 2, n: 51, p: 2, g: "Theories", t: ["Piaget stages", "sensorimotor"] },
];

describe("toolbar search", () => {
  it("builds rows for the selected course language", () => {
    expect(indexRows(items, "en")[0]).toMatchObject({ text: "play helps children a b", group: "Growth", page: 1 });
    expect(indexRows(items, "hi")[0]).toMatchObject({ text: "खेल बच्चों की मदद क ख", group: "विकास" });
    // No Hindi copy: Hindi falls back to the English text and label.
    expect(indexRows(items, "hi")[1]).toMatchObject({ text: "piaget stages sensorimotor", group: "Theories" });
  });

  it("matches question/option text or the group label, case-insensitively", () => {
    const [row] = indexRows(items, "en");
    expect(matchesRow(row, "HELPS")).toBe(true);
    expect(matchesRow(row, "growth")).toBe(true);
    expect(matchesRow(row, "explanation only")).toBe(false);
    expect(matchesRow(row, "  ")).toBe(true);
  });

  it("suggests across pages, with each question's page", () => {
    const s = suggestionsFor(indexRows(items, "en"), "sensori", "(none)");
    expect(s).toEqual([{ id: 2, n: 51, page: 2, snippet: "Piaget stages", groupLabel: "Theories" }]);
  });

  it("needs two characters and caps the list", () => {
    const many: SearchIndexItem[] = Array.from({ length: 20 }, (_, i) => ({ id: i, n: i + 1, p: 1, g: null, t: ["same text", ""] }));
    expect(suggestionsFor(indexRows(many, "en"), "s", "-")).toEqual([]);
    expect(suggestionsFor(indexRows(many, "en"), "same", "-")).toHaveLength(MAX_SUGGESTIONS);
  });
});

import { describe, expect, it } from "vitest";
import {
  buildSearchText,
  getGroupOptions,
  matchesGroup,
  matchesQuestionText,
  matchesSearch,
  stripHtml,
} from "./section-search";

describe("stripHtml", () => {
  it("removes tags and tolerates null/undefined", () => {
    expect(stripHtml("<p>hello <b>world</b></p>")).toBe("hello world");
    expect(stripHtml(null)).toBe("");
    expect(stripHtml(undefined)).toBe("");
  });
});

describe("buildSearchText", () => {
  it("joins question + options, strips html, lowercases", () => {
    const text = buildSearchText({
      question: "<p>What is <b>Pedagogy</b>?</p>",
      option_1_text: "Teaching",
      option_2_text: null,
      option_3_text: "Learning",
      option_4_text: undefined,
    });
    expect(text).toBe("what is pedagogy? teaching  learning ");
  });

  it("excludes explanation (not a param at all) from the haystack", () => {
    const text = buildSearchText({ question: "abc" });
    expect(text).not.toContain("explanation");
  });
});

describe("matchesSearch", () => {
  it("matches everything for an empty/blank query", () => {
    expect(matchesSearch("anything", "")).toBe(true);
    expect(matchesSearch("anything", "   ")).toBe(true);
  });

  it("is a case-insensitive substring match", () => {
    expect(matchesSearch("what is pedagogy", "PEDAGOGY")).toBe(true);
    expect(matchesSearch("what is pedagogy", "zzz")).toBe(false);
  });
});

describe("getGroupOptions", () => {
  it("returns unique labels in first-seen order, skipping missing/blank ones", () => {
    const labels = [
      "Child Development",
      "Learning Theories",
      "Child Development",
      null,
      "  ",
      undefined,
    ];
    expect(getGroupOptions(labels)).toEqual([
      "Child Development",
      "Learning Theories",
    ]);
  });
});

describe("matchesQuestionText", () => {
  it("matches everything for an empty/blank query", () => {
    expect(matchesQuestionText({ searchText: "abc", groupLabel: "Water" }, "")).toBe(true);
  });

  it("matches on question/option text", () => {
    expect(matchesQuestionText({ searchText: "what is pedagogy", groupLabel: null }, "pedagogy")).toBe(true);
  });

  it("matches on the group label even when the question text doesn't contain the query", () => {
    expect(
      matchesQuestionText({ searchText: "unrelated text here", groupLabel: "Water: Importance & Sources" }, "water"),
    ).toBe(true);
  });

  it("is case-insensitive on both text and group label", () => {
    expect(matchesQuestionText({ searchText: "abc", groupLabel: "WATER" }, "water")).toBe(true);
  });

  it("returns false when neither text nor group label match", () => {
    expect(matchesQuestionText({ searchText: "abc", groupLabel: "Water" }, "zzz")).toBe(false);
  });

  it("tolerates a missing groupLabel", () => {
    expect(matchesQuestionText({ searchText: "abc" }, "zzz")).toBe(false);
    expect(matchesQuestionText({ searchText: "abc", groupLabel: null }, "")).toBe(true);
  });
});

describe("matchesGroup", () => {
  it("matches everything when no group is active", () => {
    expect(matchesGroup("Anything", null)).toBe(true);
    expect(matchesGroup(null, null)).toBe(true);
  });

  it("matches only the exact active group", () => {
    expect(matchesGroup("Child Development", "Child Development")).toBe(true);
    expect(matchesGroup("Learning Theories", "Child Development")).toBe(false);
    expect(matchesGroup(null, "Child Development")).toBe(false);
  });
});

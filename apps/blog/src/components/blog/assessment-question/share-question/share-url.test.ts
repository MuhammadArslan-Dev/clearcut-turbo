import { describe, expect, it } from "vitest";
import { canonicalChapterPathMap } from "@/lib/seo/exam-index";
import { fixtureIndex } from "@/lib/seo/exam-index.fixture";
import { questionShareUrl, whatsAppShareUrl } from "./share-url";

const ORIGIN = "https://academy.clearcutoff.in";

describe("questionShareUrl", () => {
  it("links to the canonical chapter page with the question's anchor", () => {
    expect(
      questionShareUrl({
        origin: `${ORIGIN}/`,
        locale: "en",
        exam: "ctet",
        chapterPath: "paper-1/subject/english/parts-of-speech",
        fallbackPath: "/ctet/paper-1/year/ctet-2024",
        questionId: 10,
      }),
    ).toBe(`${ORIGIN}/ctet/paper-1/subject/english/parts-of-speech#q-10`);
  });

  it("keeps the Hindi locale", () => {
    expect(
      questionShareUrl({ origin: ORIGIN, locale: "hi", exam: "ctet", chapterPath: "paper-1/subject/english/parts-of-speech", fallbackPath: "/hi/x", questionId: 10 }),
    ).toBe(`${ORIGIN}/hi/ctet/paper-1/subject/english/parts-of-speech#q-10`);
  });

  it("falls back to the current page (which shows the same card) when the chapter is unknown", () => {
    expect(
      questionShareUrl({ origin: ORIGIN, locale: "hi", fallbackPath: "/hi/ctet/paper-1/year/ctet-2024", questionId: 7 }),
    ).toBe(`${ORIGIN}/hi/ctet/paper-1/year/ctet-2024#q-7`);
  });
});

describe("canonicalChapterPathMap", () => {
  it("maps shared chapters to their first (canonical) level and skips unknown slugs", () => {
    expect(canonicalChapterPathMap(fixtureIndex, ["development-theories", "history-basics", "nope", "history-basics"])).toEqual({
      "development-theories": "paper-1/subject/child-development-pedagogy/development-theories",
      "history-basics": "paper-2/subject/social-studies/history-basics",
    });
  });
});

describe("whatsAppShareUrl", () => {
  it("encodes the whole message, link included", () => {
    const url = whatsAppShareUrl("Try this: A & B? 50% सही", `${ORIGIN}/ctet/a#q-1`);
    expect(url.startsWith("https://wa.me/?text=")).toBe(true);
    expect(decodeURIComponent(url.slice("https://wa.me/?text=".length))).toBe(`Try this: A & B? 50% सही\n${ORIGIN}/ctet/a#q-1`);
    // No raw space, newline, '&', '#' or '?' may survive into the query value.
    expect(url.split("?text=")[1]).not.toMatch(/[\s&#?]/);
  });
});

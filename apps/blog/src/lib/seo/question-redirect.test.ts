import { describe, expect, it } from "vitest";
import { chapterPageUrl, examSlugFromQuestion, parseQuestionId } from "./question-redirect";

describe("parseQuestionId", () => {
  it("reads the trailing id of slug-id and bare-id params", () => {
    expect(parseQuestionId("play-has-significant-role-in-development-2701")).toBe("2701");
    expect(parseQuestionId("2701")).toBe("2701");
  });

  it("rejects params without a numeric id", () => {
    expect(parseQuestionId("no-id-here")).toBeNull();
    expect(parseQuestionId("slug-12a")).toBeNull();
    expect(parseQuestionId("")).toBeNull();
  });
});

describe("examSlugFromQuestion", () => {
  it("derives the exam from the stage, then the year", () => {
    expect(examSlugFromQuestion({ stage_id_b: "CTET_P1" })).toBe("ctet");
    expect(examSlugFromQuestion({ stage_id_b: null, exam_instance_id_b: "HTET_2019" })).toBe("htet");
    expect(examSlugFromQuestion({})).toBeNull();
  });
});

describe("chapterPageUrl", () => {
  const base = {
    siteUrl: "https://academy.clearcutoff.in/",
    exam: "ctet",
    path: { level: "paper-1", subject: "english" },
    chapter: "parts-of-speech",
    questionId: "10",
  };

  it("builds the absolute en URL with the question anchor", () => {
    expect(chapterPageUrl({ ...base, locale: "en" })).toBe(
      "https://academy.clearcutoff.in/ctet/paper-1/subject/english/parts-of-speech#q-10",
    );
  });

  it("keeps the /hi prefix and the query string, with the anchor last", () => {
    expect(chapterPageUrl({ ...base, locale: "hi", search: "?utm_source=wa&x=1" })).toBe(
      "https://academy.clearcutoff.in/hi/ctet/paper-1/subject/english/parts-of-speech?utm_source=wa&x=1#q-10",
    );
  });

  it("drops an empty query string", () => {
    expect(chapterPageUrl({ ...base, locale: "en", search: "?" })).not.toContain("?");
  });
});

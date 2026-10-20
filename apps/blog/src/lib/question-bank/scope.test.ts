import { describe, expect, it } from "vitest";
import { parseScopeQuery, searchIndexPath, toExamYear, type QuestionScope } from "./scope";

describe("question-bank scope", () => {
  it("round-trips every scope through the search index URL", () => {
    const scopes: QuestionScope[] = [
      { kind: "chapter", exam: "ctet", chapter: "development-theories" },
      { kind: "subject", exam: "ctet", subject: "child-development-pedagogy" },
      { kind: "subject", exam: "ctet", subject: "english", section: "CTET_L2_ENG" },
      { kind: "subject", exam: "htet", subject: "mathematics", section: "HTET_COM_MATH" },
      { kind: "year", exam: "ctet", level: "paper-1", year: "ctet-2024" },
    ];
    for (const scope of scopes) {
      const url = new URL(searchIndexPath(scope), "http://x");
      expect(url.pathname).toBe("/api/question-search");
      expect(parseScopeQuery(url.searchParams)).toEqual(scope);
    }
  });

  it("rejects malformed or unknown scopes", () => {
    const bad = [
      "scope=chapter&exam=ctet",
      "scope=chapter&exam=ctet&chapter=a%20b",
      "scope=chapter&exam=ctet&chapter=%25",
      "scope=subject&exam=CTET&subject=x",
      "scope=subject&exam=ctet&subject=english&section=",
      "scope=subject&exam=ctet&subject=english&section=ctet_l1_eng",
      "scope=subject&exam=ctet&subject=english&section=CTET_L1_ENG%25",
      "scope=subject&exam=ctet&subject=english&section=CTET__ENG",
      "scope=year&exam=ctet&level=paper-1&year=2024",
      "scope=other&exam=ctet",
      "",
    ];
    for (const q of bad) expect(parseScopeQuery(new URLSearchParams(q))).toBeNull();
  });

  it("maps year slugs to exam instance ids", () => {
    expect(toExamYear("ctet-2024")).toBe("CTET_2024");
  });
});

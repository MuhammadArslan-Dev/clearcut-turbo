import { describe, expect, it } from "vitest";
import {
  canonicalChapterPath,
  canonicalChapterPaths,
  canonicalSubjectPaths,
  canonicalSubjects,
  isChapterEmpty,
  levelHasChapters,
  resolveChapterRoute,
  subjectPageHasChapters,
  resolveSubjectRoute,
} from "./exam-index";
import { fixtureIndex } from "./exam-index.fixture";

describe("resolveChapterRoute", () => {
  it("accepts the canonical path", () => {
    expect(resolveChapterRoute(fixtureIndex, "paper-1", "child-development-pedagogy", "development-theories")).toEqual({
      kind: "ok",
      canonical: { level: "paper-1", subject: "child-development-pedagogy" },
      isCanonical: true,
    });
  });

  it("keeps a listed duplicate live but points its canonical at the first level", () => {
    expect(resolveChapterRoute(fixtureIndex, "paper-2", "child-development-pedagogy", "development-theories")).toEqual({
      kind: "ok",
      canonical: { level: "paper-1", subject: "child-development-pedagogy" },
      isCanonical: false,
    });
  });

  it("redirects a real chapter on a made-up level or the wrong subject", () => {
    const to = { level: "paper-1", subject: "child-development-pedagogy", chapter: "development-theories" };
    expect(resolveChapterRoute(fixtureIndex, "made-up", "x", "development-theories")).toEqual({ kind: "redirect", to });
    expect(resolveChapterRoute(fixtureIndex, "paper-1", "english", "development-theories")).toEqual({ kind: "redirect", to });
  });

  it("redirects an old hyphen-less chapter slug to the real one", () => {
    expect(resolveChapterRoute(fixtureIndex, "paper-1", "childdevelopmentpedagogy", "developmenttheories")).toEqual({
      kind: "redirect",
      to: { level: "paper-1", subject: "child-development-pedagogy", chapter: "development-theories" },
    });
  });

  it("uses the only level a chapter appears under", () => {
    expect(canonicalChapterPath(fixtureIndex, "history-basics")).toEqual({ level: "paper-2", subject: "social-studies" });
  });

  it("404s an unknown chapter", () => {
    expect(resolveChapterRoute(fixtureIndex, "paper-1", "english", "no-such-chapter")).toEqual({ kind: "notFound" });
  });
});

describe("resolveSubjectRoute", () => {
  it("canonicalises a subject to the first level showing the same section", () => {
    expect(resolveSubjectRoute(fixtureIndex, "paper-2", "child-development-pedagogy")).toEqual({
      kind: "ok",
      canonical: { level: "paper-1" },
      isCanonical: false,
    });
  });

  it("keeps a same-slug subject with a different section as its own canonical", () => {
    // paper-2 English is CTET_L2_ENG, not paper-1's CTET_L1_ENG.
    expect(resolveSubjectRoute(fixtureIndex, "paper-2", "english")).toEqual({
      kind: "ok",
      canonical: { level: "paper-2" },
      isCanonical: true,
    });
    expect(resolveSubjectRoute(fixtureIndex, "paper-1", "english")).toEqual({
      kind: "ok",
      canonical: { level: "paper-1" },
      isCanonical: true,
    });
  });

  it("redirects a subject listed under another level", () => {
    expect(resolveSubjectRoute(fixtureIndex, "paper-1", "sanskrit")).toEqual({ kind: "redirect", to: { level: "paper-2", subject: "sanskrit" } });
    expect(resolveSubjectRoute(fixtureIndex, "nope", "english")).toEqual({ kind: "redirect", to: { level: "paper-1", subject: "english" } });
  });

  it("redirects old hyphen-less subject slugs (seen in Search Console) to the real slug", () => {
    expect(resolveSubjectRoute(fixtureIndex, "up-tgt", "socialstudies")).toEqual({
      kind: "redirect",
      to: { level: "paper-2", subject: "social-studies" },
    });
    expect(resolveSubjectRoute(fixtureIndex, "paper-1", "childdevelopmentpedagogy")).toEqual({
      kind: "redirect",
      to: { level: "paper-1", subject: "child-development-pedagogy" },
    });
  });

  it("404s an unknown subject", () => {
    expect(resolveSubjectRoute(fixtureIndex, "paper-1", "no-such-subject")).toEqual({ kind: "notFound" });
  });
});

describe("chapters with no questions", () => {
  it("are still valid pages at their canonical path", () => {
    expect(resolveChapterRoute(fixtureIndex, "paper-1", "english", "phonetics-and-reading")).toEqual({
      kind: "ok",
      canonical: { level: "paper-1", subject: "english" },
      isCanonical: true,
    });
    expect(isChapterEmpty(fixtureIndex, "phonetics-and-reading")).toBe(true);
    expect(isChapterEmpty(fixtureIndex, "parts-of-speech")).toBe(false);
  });

  it("make a subject page or level count as having no content only when every chapter is empty", () => {
    expect(subjectPageHasChapters(fixtureIndex, "paper-1", "english")).toBe(true);
    expect(subjectPageHasChapters(fixtureIndex, "paper-1", "science")).toBe(false);
    expect(subjectPageHasChapters(fixtureIndex, "paper-4", "science")).toBe(false);
    expect(levelHasChapters(fixtureIndex, "paper-1")).toBe(true);
    expect(levelHasChapters(fixtureIndex, "paper-3")).toBe(false);
    expect(levelHasChapters(fixtureIndex, "paper-4")).toBe(false);
  });

  it("judge a subject page by its own section, not another level's copy of the slug", () => {
    // paper-1 English has questions; paper-2 English (its own section) has none.
    expect(subjectPageHasChapters(fixtureIndex, "paper-2", "english")).toBe(false);
    // A merged slug: the page shows only its first section's chapters.
    expect(subjectPageHasChapters(fixtureIndex, "paper-2", "mathematics")).toBe(false);
    expect(subjectPageHasChapters(fixtureIndex, "paper-1", "no-such-subject")).toBe(false);
  });
});

describe("canonical path lists", () => {
  it("lists each chapter once, at its canonical path, in navigation order", () => {
    expect(canonicalChapterPaths(fixtureIndex)).toEqual([
      "/ctet/paper-1/subject/child-development-pedagogy/development-theories",
      "/ctet/paper-1/subject/child-development-pedagogy/social-development",
      "/ctet/paper-1/subject/english/parts-of-speech",
      "/ctet/paper-2/subject/social-studies/history-basics",
      "/ctet/paper-2/subject/mathematics/number-system",
    ]);
  });

  it("lists each subject section once and skips genuinely empty sections", () => {
    expect(canonicalSubjectPaths(fixtureIndex)).toEqual([
      "/ctet/paper-1/subject/child-development-pedagogy",
      "/ctet/paper-1/subject/english",
      "/ctet/paper-2/subject/social-studies",
    ]);
    expect(canonicalSubjects(fixtureIndex).map((s) => s.sectionId)).toEqual(["CTET_CDP", "CTET_L1_ENG", "CTET_SST"]);
  });
});

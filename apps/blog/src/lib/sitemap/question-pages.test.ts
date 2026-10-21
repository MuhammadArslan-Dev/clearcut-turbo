import { describe, expect, it } from "vitest";
import { fixtureIndex } from "@/lib/seo/exam-index.fixture";
import { urlsetXml } from "./xml";
import { isWellFormed } from "./xml-well-formed";
import {
  YEAR_PAGE_LIMIT,
  chapterPageEntries,
  pagedEntries,
  stageIdFor,
  subjectPageEntries,
  yearPageEntries,
  yearQuestions,
  type IndexEntry,
  type QuestionIndex,
} from "./question-pages";

const ORIGIN = "https://academy.clearcutoff.in";
const T0 = Date.UTC(2026, 0, 1) / 1000; // 2026-01-01T00:00:00Z
const iso = (ts: number) => new Date(ts * 1000).toISOString();
/** n questions with ids from `firstId`, timestamps T0 + offset (null for listed indexes). */
function list(n: number, firstId = 1, nullAt: number[] = []): IndexEntry[] {
  return Array.from({ length: n }, (_, i) => [firstId + i, nullAt.includes(i) ? null : T0 + i]);
}
const locs = (entries: { loc: string }[]) => entries.map((e) => e.loc);

const qIndex: QuestionIndex = {
  chapters: {
    "development-theories": list(60, 1000),
    "social-development": list(5, 2000),
    "parts-of-speech": list(3, 3000, [0, 1, 2]),
    "history-basics": [],
  },
  years: {
    "CTET_2024|CTET_P1": list(520, 1),
    "CTET_2024|CTET_P2": list(2, 9000),
  },
};

describe("pagedEntries", () => {
  it("makes one URL per 50 questions, with no /page/1", () => {
    const urls = locs(pagedEntries(ORIGIN, "/x", list(101)));
    expect(urls).toEqual([`${ORIGIN}/x`, `${ORIGIN}/x/page/2`, `${ORIGIN}/x/page/3`]);
    expect(pagedEntries(ORIGIN, "/x", [])).toEqual([]);
  });

  it("dates each page by the newest question on that page only", () => {
    const entries = pagedEntries(ORIGIN, "/x", list(60));
    expect(entries[0].lastmod).toBe(iso(T0 + 49));
    expect(entries[1].lastmod).toBe(iso(T0 + 59));
  });

  it("never invents a date for a page without timestamps", () => {
    const [entry] = pagedEntries(ORIGIN, "/x", list(3, 1, [0, 1, 2]));
    expect(entry).toEqual({ loc: `${ORIGIN}/x` });
  });

  it("adds the /hi twin right after each page whose questions are mostly bilingual", () => {
    // Page 1: 50 bilingual; page 2: 50 English-only; page 3: 10 bilingual.
    const flags: (0 | 1)[] = [...Array(50).fill(1), ...Array(50).fill(0), ...Array(10).fill(1)];
    const entries = pagedEntries(ORIGIN, "/x", list(110).map(([id, ts], i) => [id, ts, flags[i]]));
    expect(locs(entries)).toEqual([
      `${ORIGIN}/x`,
      `${ORIGIN}/hi/x`,
      `${ORIGIN}/x/page/2`,
      `${ORIGIN}/x/page/3`,
      `${ORIGIN}/hi/x/page/3`,
    ]);
    // The /hi page carries the same content date as its English twin.
    expect(entries[1].lastmod).toBe(entries[0].lastmod);
  });

  it("lists no /hi URLs when the backend sends no bilingual flag", () => {
    expect(locs(pagedEntries(ORIGIN, "/x", list(60))).some((u) => u.includes("/hi/"))).toBe(false);
  });
});

describe("stageIdFor", () => {
  it("mirrors the backend year filter", () => {
    expect(stageIdFor("CTET_2024", "paper-1")).toBe("CTET_P1");
    expect(stageIdFor("HTET_2017", "level-3-pgt")).toBe("HTET_L3");
    expect(stageIdFor("CTET_2024", "primary")).toBeNull();
  });
});

describe("question-bank sitemap entries", () => {
  it("lists every page of each canonical chapter, skipping empty ones", () => {
    const urls = locs(chapterPageEntries(ORIGIN, fixtureIndex, qIndex));
    const cdp = `${ORIGIN}/ctet/paper-1/subject/child-development-pedagogy`;
    expect(urls).toEqual([
      `${cdp}/development-theories`,
      `${cdp}/development-theories/page/2`,
      `${cdp}/social-development`,
      `${ORIGIN}/ctet/paper-1/subject/english/parts-of-speech`,
    ]);
    // Non-canonical level copies and question-less chapters are left out.
    expect(urls.some((u) => u.includes("/paper-2/"))).toBe(false);
    expect(urls.some((u) => u.endsWith("/history-basics") || u.endsWith("/tissues"))).toBe(false);
  });

  it("lists a subject's pages from its chapters in the subject page's order", () => {
    const entries = subjectPageEntries(ORIGIN, fixtureIndex, qIndex, {
      "/ctet/paper-1/subject/child-development-pedagogy": ["social-development", "development-theories"],
      "/ctet/paper-1/subject/english": ["parts-of-speech", "phonetics-and-reading"],
      "/ctet/paper-2/subject/social-studies": ["history-basics"],
    });
    const cdp = `${ORIGIN}/ctet/paper-1/subject/child-development-pedagogy`;
    expect(locs(entries)).toEqual([cdp, `${cdp}/page/2`, `${ORIGIN}/ctet/paper-1/subject/english`]);
    // Page 2 holds development-theories' last 15 questions (5 + 60 = 65).
    expect(entries[1].lastmod).toBe(iso(T0 + 59));
    // A subject with no questions (social-studies) is not listed.
    expect(locs(entries).some((u) => u.includes("social-studies"))).toBe(false);
  });

  it("lists only level x year pages with questions, capped at what the year page serves", () => {
    const urls = locs(yearPageEntries(ORIGIN, fixtureIndex, qIndex, ["CTET_2024", "CTET_2023"]));
    const p1 = `${ORIGIN}/ctet/paper-1/year/ctet-2024`;
    expect(urls.filter((u) => u.startsWith(p1))).toHaveLength(YEAR_PAGE_LIMIT / 50);
    expect(urls).toContain(`${p1}/page/10`);
    expect(urls).not.toContain(`${p1}/page/11`);
    expect(urls).toContain(`${ORIGIN}/ctet/paper-2/year/ctet-2024`);
    expect(urls.some((u) => u.includes("ctet-2023"))).toBe(false);
    expect(urls.some((u) => u.includes("/paper-3/") || u.includes("/paper-4/"))).toBe(false);
  });

  it("falls back to every stage of a year when a level has no stage code", () => {
    expect(yearQuestions(qIndex, "CTET_2024", "primary").map((e) => e[0]).slice(0, 2)).toEqual([1, 2]);
    expect(yearQuestions(qIndex, "CTET_2024", "primary")).toHaveLength(YEAR_PAGE_LIMIT);
  });

  it("lists no /hi URLs and renders valid XML", () => {
    const all = [
      ...chapterPageEntries(ORIGIN, fixtureIndex, qIndex),
      ...yearPageEntries(ORIGIN, fixtureIndex, qIndex, ["CTET_2024"]),
    ];
    expect(locs(all).some((u) => u.includes("/hi/"))).toBe(false);
    expect(isWellFormed(urlsetXml(all))).toBe(true);
  });
});

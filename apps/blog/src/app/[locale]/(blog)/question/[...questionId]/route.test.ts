import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { fixtureIndex } from "@/lib/seo/exam-index.fixture";
import { QUESTIONS_PER_PAGE } from "@/lib/question-bank/pagination";
import type { IndexEntry, QuestionIndex } from "@/lib/sitemap/question-pages";

// The redirect reads two cached indexes (exam navigation + question index)
// and, only for ids they don't list, the backend's row for that id.
let questionIndex: QuestionIndex = { chapters: {}, years: {} };
let questionIndexFails = false;
vi.mock("@/lib/seo/load-exam-index", () => ({
  loadExamIndex: async (exam: string) => {
    if (exam === "ctet") return fixtureIndex;
    throw new Error("no such exam in the fixture");
  },
}));
vi.mock("@/lib/sitemap/question-index", () => ({
  fetchQuestionIndex: async (exam: string) => {
    if (questionIndexFails || exam !== "ctet") throw new Error("index down");
    return questionIndex;
  },
}));

process.env.BACKEND_URL = "https://backend.test/api";
const { GET } = await import("./route");

const SITE = "https://academy.clearcutoff.in";
const CHAPTER = `${SITE}/ctet/paper-1/subject/child-development-pedagogy/development-theories`;

type Row = { id: number; stage_id_b?: string; section_id_b?: string; chapter?: { slug: string | null } | null; translations?: unknown[] };

/** Backend stub for /blog/get-questions?id=: `rows`, or a failing status. */
function stubBackend(rows: Row[] | number = []) {
  const fetchMock = vi.fn(async () =>
    typeof rows === "number" ? new Response("down", { status: rows }) : Response.json({ data: rows }),
  );
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

const entries = (ids: number[], bilingual = 0): IndexEntry[] => ids.map((id) => [id, 1700000000, bilingual as 0 | 1]);

function call(locale: string, segments: string[], search = "") {
  return GET(new Request(`${SITE}/${locale === "hi" ? "hi/" : ""}question/${segments.join("/")}${search}`), {
    params: Promise.resolve({ locale, questionId: segments }),
  });
}

describe("legacy /question/* URLs", () => {
  beforeEach(() => {
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", SITE);
    questionIndexFails = false;
    questionIndex = { chapters: { "development-theories": entries([161]) }, years: {} };
  });
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  it("sends every variant of one question to its chapter page in a single 301, without a backend call", async () => {
    const backend = stubBackend();
    const variants: [string, string[]][] = [
      ["en", ["161"]],
      ["en", ["function-of-castles-not-expressed-in-the-passage-161"]],
      ["en", ["what-is-3", "7-of-21-161"]],
      ["hi", ["161"]],
      ["hi", ["function-of-castles-not-expressed-in-the-passage-161"]],
    ];
    for (const [locale, segments] of variants) {
      const res = await call(locale, segments);
      expect(res.status, segments.join("/")).toBe(301);
      expect(res.headers.get("location"), `${locale} ${segments.join("/")}`).toBe(`${CHAPTER}#q-161`);
      expect(res.headers.get("cache-control")).toBe("public, max-age=3600");
    }
    expect(backend).not.toHaveBeenCalled();
  });

  it("keeps the query string and finds the page that shows the question", async () => {
    stubBackend();
    const before = Array.from({ length: QUESTIONS_PER_PAGE + 5 }, (_, i) => 1000 + i);
    questionIndex = { chapters: { "development-theories": entries([...before, 161, 2000]) }, years: {} };
    const res = await call("en", ["161"], "?utm_source=wa");
    expect(res.headers.get("location")).toBe(`${CHAPTER}/page/2?utm_source=wa#q-161`);
  });

  it("sends /hi to the /hi chapter page only when that page is genuinely Hindi", async () => {
    stubBackend();
    questionIndex = { chapters: { "development-theories": entries([161, 162], 1) }, years: {} };
    expect((await call("hi", ["161"])).headers.get("location")).toBe(
      `${SITE}/hi/ctet/paper-1/subject/child-development-pedagogy/development-theories#q-161`,
    );
    expect((await call("en", ["161"])).headers.get("location")).toBe(`${CHAPTER}#q-161`);
  });

  it("uses the canonical chapter path, never a cross-level copy", async () => {
    stubBackend();
    questionIndex = { chapters: { "social-development": entries([5]) }, years: {} };
    expect((await call("en", ["5"])).headers.get("location")).toBe(
      `${SITE}/ctet/paper-1/subject/child-development-pedagogy/social-development#q-5`,
    );
  });

  it("falls back to the backend row when the index doesn't list the id: chapter page 1", async () => {
    stubBackend([{ id: 7, stage_id_b: "CTET_P1", chapter: { slug: "development-theories" }, translations: [{}] }]);
    const res = await call("en", ["new-question-7"]);
    expect(res.status).toBe(301);
    expect(res.headers.get("location")).toBe(`${CHAPTER}#q-7`);
  });

  it("sends a question whose chapter has no slug to its subject page, else level, else exam", async () => {
    const cases: [Row, string][] = [
      [{ id: 7276, stage_id_b: "CTET_P1", section_id_b: "CTET_CDP", chapter: { slug: null }, translations: [{}] }, "/ctet/paper-1/subject/child-development-pedagogy"],
      // paper-2 CDP is the same section as paper-1: the canonical subject level.
      [{ id: 7276, stage_id_b: "CTET_P2", section_id_b: "CTET_CDP", chapter: { slug: null }, translations: [{}] }, "/ctet/paper-1/subject/child-development-pedagogy"],
      // A subject page with no chapter that has questions is noindex: level instead.
      [{ id: 7276, stage_id_b: "CTET_P2", section_id_b: "CTET_L2_ENG", chapter: null, translations: [{}] }, "/ctet/paper-2"],
      [{ id: 7276, stage_id_b: "CTET_P9", section_id_b: "CTET_CDP", chapter: null, translations: [{}] }, "/ctet"],
      // Chapter not in navigation.
      [{ id: 7276, stage_id_b: "CTET_P1", section_id_b: "CTET_CDP", chapter: { slug: "not-listed" }, translations: [{}] }, "/ctet/paper-1/subject/child-development-pedagogy"],
    ];
    for (const [row, path] of cases) {
      stubBackend([row]);
      const res = await call("en", ["if-you-wish-to-7276"]);
      expect(res.status, JSON.stringify(row)).toBe(301);
      expect(res.headers.get("location"), JSON.stringify(row)).toBe(`${SITE}${path}`);
    }
  });

  it("keeps /hi on the Hindi exam/level hub, English for a subject page", async () => {
    stubBackend([{ id: 9, stage_id_b: "CTET_P2", section_id_b: "CTET_L2_ENG", chapter: null, translations: [{}] }]);
    expect((await call("hi", ["9"])).headers.get("location")).toBe(`${SITE}/hi/ctet/paper-2`);
    stubBackend([{ id: 9, stage_id_b: "CTET_P1", section_id_b: "CTET_CDP", chapter: null, translations: [{}] }]);
    expect((await call("hi", ["9"])).headers.get("location")).toBe(`${SITE}/ctet/paper-1/subject/child-development-pedagogy`);
  });

  it("404s an id the backend doesn't have, an id without content, and a URL with no id", async () => {
    stubBackend([{ id: 99999998, stage_id_b: "CTET_P1", chapter: null, translations: [{}] }]);
    expect((await call("en", ["does-not-exist-99999999"])).status).toBe(404);
    stubBackend([{ id: 8, stage_id_b: "CTET_P1", chapter: { slug: "development-theories" }, translations: [] }]);
    expect((await call("en", ["8"])).status).toBe(404);
    stubBackend([{ id: 8, stage_id_b: "UPTET_P1", chapter: { slug: "x" }, translations: [{}] }]);
    expect((await call("en", ["8"])).status).toBe(404);
    expect((await call("en", ["no-id-here"])).status).toBe(404);
  });

  it("never answers 5xx: with nothing to look up it 302s (no-store) to the home page", async () => {
    questionIndexFails = true;
    for (const failure of [500, 429]) {
      stubBackend(failure);
      const en = await call("en", ["161"], "?utm_source=wa");
      expect(en.status).toBe(302);
      expect(en.headers.get("location")).toBe(`${SITE}/?utm_source=wa`);
      expect(en.headers.get("cache-control")).toBe("no-store");
      expect((await call("hi", ["161"])).headers.get("location")).toBe(`${SITE}/hi`);
    }
    vi.stubGlobal("fetch", vi.fn(async () => new Response("<html>", { status: 200 })));
    expect((await call("en", ["161"])).status).toBe(302);
  });
});

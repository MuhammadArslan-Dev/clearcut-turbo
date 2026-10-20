import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { fixtureIndex } from "@/lib/seo/exam-index.fixture";

vi.mock("@/lib/seo/load-exam-index", () => ({ loadExamIndex: async () => fixtureIndex }));

// lib/api/api2 reads BACKEND_URL when it is first imported.
process.env.BACKEND_URL = "https://backend.test/api";
const { GET } = await import("./route");

const SITE = "https://academy.clearcutoff.in";
const CHAPTER = `${SITE}/ctet/paper-1/subject/child-development-pedagogy/development-theories`;

const translation = (id: number) => ({ locale: "en", question: `Q${id}`, option_1_text: "a", correct_option: "1" });

/** Backend stub: the legacy lookup, plus the chapter's question list in
 * page order (`chapterIds`; `untranslated` ids get no translation). */
function stubBackend({
  chapterIds = [] as number[],
  untranslated = [] as number[],
  chapterStatus = 200,
} = {}) {
  vi.stubGlobal(
    "fetch",
    vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input);
      if (url.includes("/blog/get-questions-by-chapter")) {
        if (chapterStatus !== 200) return new Response("down", { status: chapterStatus });
        return Response.json({
          data: {
            questions_new: chapterIds.map((id) => ({
              id,
              translations: untranslated.includes(id) ? [] : [translation(id)],
              chapter: { slug: "development-theories" },
            })),
          },
        });
      }
      return Response.json({ data: [{ id: 161, stage_id_b: "CTET_P1", chapter: { slug: "development-theories" } }] });
    }),
  );
}

function call(locale: string, segments: string[], search = "") {
  return GET(new Request(`${SITE}/${locale === "hi" ? "hi/" : ""}question/${segments.join("/")}${search}`), {
    params: Promise.resolve({ locale, questionId: segments }),
  });
}

describe("legacy /question/* URLs", () => {
  beforeEach(() => {
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", SITE);
    stubBackend({ chapterIds: [161] });
  });
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  it("consolidates every variant of one question onto the English chapter URL in a single 301", async () => {
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
    }
  });

  it("keeps the query string", async () => {
    const res = await call("en", ["161"], "?utm_source=wa");
    expect(res.headers.get("location")).toBe(`${CHAPTER}?utm_source=wa#q-161`);
  });

  it("sends a question to the chapter page that shows it", async () => {
    // 161 is the 76th rendered question -> page 2 (50 per page).
    stubBackend({ chapterIds: [...Array.from({ length: 75 }, (_, i) => 1000 + i), 161, 2000] });
    const res = await call("en", ["161"], "?utm_source=wa");
    expect(res.status).toBe(301);
    expect(res.headers.get("location")).toBe(`${CHAPTER}/page/2?utm_source=wa#q-161`);
    expect(res.headers.get("cache-control")).toBe("public, max-age=3600");
  });

  it("counts only rendered questions, like the chapter page", async () => {
    // 50 before it, but one has no translation (no card) -> 161 is the 50th card -> page 1.
    const before = Array.from({ length: 50 }, (_, i) => 1000 + i);
    stubBackend({ chapterIds: [...before, 161], untranslated: [1000] });
    expect((await call("en", ["161"])).headers.get("location")).toBe(`${CHAPTER}#q-161`);
  });

  it("falls back to page 1 when the question isn't listed on the chapter page", async () => {
    stubBackend({ chapterIds: [1, 2, 3] });
    expect((await call("en", ["161"])).headers.get("location")).toBe(`${CHAPTER}#q-161`);
  });

  it("answers 503, not a guessed 301, when the chapter can't be loaded", async () => {
    stubBackend({ chapterStatus: 500 });
    const res = await call("en", ["161"]);
    expect(res.status).toBe(503);
    expect(res.headers.get("location")).toBeNull();
  });

  it("404s a URL with no question id", async () => {
    expect((await call("en", ["no-id-here"])).status).toBe(404);
  });
});

import { afterEach, describe, expect, it, vi } from "vitest";

// unstable_cache needs Next's runtime: run the function directly and record
// the options (cache tags) it was given.
const cacheOptions: { tags?: string[]; revalidate?: number | false }[] = [];
vi.mock("next/cache", () => ({
  unstable_cache:
    <T,>(fn: () => Promise<T>, _key: string[], options: { tags?: string[] }) =>
    () => {
      cacheOptions.push(options);
      return fn();
    },
}));

// lib/api/api2 reads BACKEND_URL when it is first imported.
process.env.BACKEND_URL = "https://backend.test/api";
const { loadSubjectChapterSlugs, loadSubjectQuestions } = await import("./load");

type FetchInit = RequestInit & { next?: { revalidate?: number; tags?: string[] } };

/** Backend stub: the section lists `chapters`; `failing` chapters answer 429. */
function stubBackend(chapters: string[], failing: string[] = []) {
  const calls: { url: string; init: FetchInit }[] = [];
  vi.stubGlobal(
    "fetch",
    vi.fn(async (input: RequestInfo | URL, init: FetchInit = {}) => {
      const url = String(input);
      calls.push({ url, init });
      if (url.includes("/blog/get-questions-by-section")) {
        return Response.json({ data: { data: chapters.map((slug) => ({ chapter: { slug } })) } });
      }
      const slug = new URL(url).searchParams.get("slug") ?? "";
      if (failing.includes(slug)) return new Response("Too Many Attempts.", { status: 429 });
      return Response.json({ data: { questions_new: [{ id: slug.length, translations: [] }] } });
    }),
  );
  return calls;
}

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("subject loaders", () => {
  it("ask for the level's own section exactly, tagged for revalidation", async () => {
    const calls = stubBackend(["parts-of-speech"]);
    expect(await loadSubjectChapterSlugs("ctet", "english", "CTET_L2_ENG")).toEqual(["parts-of-speech"]);
    const url = new URL(calls[0].url);
    expect(url.searchParams.get("section_id")).toBe("CTET_L2_ENG");
    expect(url.searchParams.get("exact_section")).toBe("1");
    expect(cacheOptions.at(-1)?.tags).toEqual(["qb", "qb:ctet"]);
  });

  it("fall back to the exam-wide prefix when the section is unknown", async () => {
    const calls = stubBackend([]);
    await loadSubjectChapterSlugs("htet", "chemistry");
    const url = new URL(calls[0].url);
    expect(url.searchParams.get("section_id")).toBe("htet");
    expect(url.searchParams.has("exact_section")).toBe(false);
  });

  it("fail the whole subject when any chapter fails, never return a shorter one", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    stubBackend(["a-chapter", "b-chapter"], ["b-chapter"]);
    expect(await loadSubjectQuestions("htet", "social-studies", "HTET_SST")).toBeNull();
  });

  it("concatenate every chapter when all load", async () => {
    stubBackend(["a-chapter", "bb-chapter"]);
    const loaded = await loadSubjectQuestions("htet", "social-studies", "HTET_SST2");
    expect(loaded?.questions.map((q) => q.id)).toEqual([9, 10]);
  });
});

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { assembleExamIndex, forgetExamIndex, loadExamIndex } from "./load-exam-index";

// One backend, two shapes of the same data: the single /blog/exam-index call
// and the old per-level/per-section endpoints.
const RAW = {
  levels: [
    {
      slug: "level-1",
      subjects: [
        { slug: "maths", section_id: "X_MATH" },
        // get-subject can repeat a slug within a level (HTET mathematics).
        { slug: "maths", section_id: "X_COM_MATH" },
      ],
    },
    { slug: "level-2", subjects: [{ slug: "maths", section_id: "X_MATH" }] },
  ],
  sections: {
    X_MATH: [
      { slug: "numbers", has_questions: true },
      { slug: "geometry", has_questions: false },
    ],
    X_COM_MATH: [
      { slug: "geometry", has_questions: true },
      { slug: "algebra", has_questions: false },
    ],
  },
};

function respond(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });
}

const legacy: Record<string, unknown> = {
  "/blog/get-enavigation?parent_id=true": [
    { slug: "level-1", exam_id_b: "TEACHING_X" },
    { slug: "level-2", exam_id_b: "TEACHING_X" },
    { slug: "other", exam_id_b: "TEACHING_Y" },
  ],
  "/blog/get-subject?exam_id=x&slug=level-1": [
    { slug: "maths", section_id: "X_MATH" },
    { slug: "maths", section_id: "X_COM_MATH" },
  ],
  "/blog/get-subject?exam_id=x&slug=level-2": [{ slug: "maths", section_id: "X_MATH" }],
  "/blog/get-questions-by-section?section_id=X_MATH&exact_section=1": {
    data: [
      { chapter: { slug: "numbers", questions_new: [{}] } },
      { chapter: { slug: "geometry", questions_new: [] } },
    ],
  },
  "/blog/get-questions-by-section?section_id=X_COM_MATH&exact_section=1": {
    data: [
      { chapter: { slug: "geometry", questions_new: [{}] } },
      { chapter: { slug: "algebra", questions_new: [] } },
    ],
  },
};

let calls: string[] = [];
beforeEach(() => {
  process.env.BACKEND_URL = "https://be.test/api";
  calls = [];
  forgetExamIndex();
});
afterEach(() => {
  vi.unstubAllGlobals();
});

function stubBackend(hasExamIndex: boolean) {
  vi.stubGlobal("fetch", async (url: string) => {
    const path = url.replace("https://be.test/api", "");
    calls.push(path);
    if (path.startsWith("/blog/exam-index")) return hasExamIndex ? respond({ data: RAW }) : respond({}, 404);
    return path in legacy ? respond({ data: legacy[path] }) : respond({}, 500);
  });
}

describe("assembleExamIndex", () => {
  it("merges repeated subject slugs and marks chapters empty only when no section shows questions", () => {
    const index = assembleExamIndex("x", RAW);
    expect(index.levels[0].subjects).toEqual([
      { slug: "maths", sectionId: "X_MATH", chapters: ["numbers", "geometry", "algebra"], pageChapters: ["numbers", "geometry"] },
    ]);
    expect(index.emptyChapters).toEqual(["algebra"]);
  });
});

describe("loadExamIndex", () => {
  it("builds the tree from the single /blog/exam-index call", async () => {
    stubBackend(true);
    const index = await loadExamIndex("x");
    expect(calls).toEqual(["/blog/exam-index?exam_name=x"]);
    expect(index).toEqual(assembleExamIndex("x", RAW));
  });

  it("falls back to the per-call endpoints on a backend without it, with the same result", async () => {
    stubBackend(false);
    const index = await loadExamIndex("x");
    expect(calls[0]).toBe("/blog/exam-index?exam_name=x");
    expect(calls.length).toBe(1 + 1 + 2 + 2);
    expect(index).toEqual(assembleExamIndex("x", RAW));
  });
});

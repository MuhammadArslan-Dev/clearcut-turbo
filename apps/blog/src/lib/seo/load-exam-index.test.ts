import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { forgetQuestionIndexFallback } from "@/lib/sitemap/question-index";
import { assembleExamIndex, forgetExamIndex, forgetExamIndexFallback, loadExamIndex } from "./load-exam-index";

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
// /blog/question-index's chapter lists (null: the endpoint fails).
let questionIndex: Record<string, unknown[]> | null = null;
let examIndexDown = false;
beforeEach(() => {
  process.env.BACKEND_URL = "https://be.test/api";
  calls = [];
  questionIndex = null;
  examIndexDown = false;
  forgetExamIndexFallback();
  forgetQuestionIndexFallback();
});
afterEach(() => {
  vi.unstubAllGlobals();
});

function stubBackend(hasExamIndex: boolean) {
  vi.stubGlobal("fetch", async (url: string) => {
    const path = url.replace("https://be.test/api", "");
    if (path.startsWith("/blog/question-index")) {
      return questionIndex ? respond({ data: { chapters: questionIndex, years: {} } }) : respond({}, 500);
    }
    calls.push(path);
    if (path.startsWith("/blog/exam-index")) {
      if (examIndexDown) return respond({}, 503);
      return hasExamIndex ? respond({ data: RAW }) : respond({}, 404);
    }
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

  it("decides empty chapters from the question index when it loads (phase 125)", async () => {
    // has_questions says geometry has questions in one section and algebra
    // none; the pages render what the question index lists.
    questionIndex = { numbers: [[1, null, 0]], algebra: [[2, null, 0]], geometry: [] };
    stubBackend(true);
    const index = await loadExamIndex("x");
    expect(index.emptyChapters).toEqual(["geometry"]);
    expect(index).toEqual(assembleExamIndex("x", RAW, questionIndex));
  });

  it("serves the last good index when the backend fails later, and only then", async () => {
    stubBackend(true);
    examIndexDown = true;
    await expect(loadExamIndex("x")).rejects.toThrow();
    examIndexDown = false;
    const good = await loadExamIndex("x");
    forgetExamIndex(["x"]); // memo expired; the last-good copy stays
    examIndexDown = true;
    await expect(loadExamIndex("x")).resolves.toEqual(good);
  });
});


import { afterEach, describe, expect, it, vi } from "vitest";
import { buildQuestionsSitemapXml } from "./build-questions-sitemap-xml";

const BASE_URL = "https://clearcutoff.in";

function levelsPayload() {
  return {
    data: [{ slug: "paper-1", exam_id_b: "teaching_ctet" }],
  };
}

function subjectsPayload() {
  return {
    data: [{ slug: "cdp", section_id: "CTET_CDP" }],
  };
}

function sectionPayload() {
  return {
    data: {
      data: [{ chapter: { slug: "child-development" } }],
    },
  };
}

function chapterPayload(translation: Record<string, unknown>) {
  return {
    data: {
      questions_new: [
        {
          id: 1,
          translations: [translation],
        },
      ],
    },
  };
}

function mockFetchSequence(chapterTranslation: Record<string, unknown>) {
  const responses = [levelsPayload(), subjectsPayload(), sectionPayload(), chapterPayload(chapterTranslation)];
  let call = 0;
  return vi.fn(async () => {
    const body = responses[call++];
    return {
      ok: true,
      json: async () => body,
    } as Response;
  });
}

describe("buildQuestionsSitemapXml", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("uses the real translation.updated_at as <lastmod>", async () => {
    vi.stubGlobal(
      "fetch",
      mockFetchSequence({
        question: "What is pedagogy?",
        ai_slug: "what-is-pedagogy",
        updated_at: "2026-03-05T10:00:00.000000Z",
      }),
    );

    const xml = await buildQuestionsSitemapXml("ctet", BASE_URL);

    expect(xml).toContain(`<loc>${BASE_URL}/question/what-is-pedagogy-1</loc>`);
    expect(xml).toContain("<lastmod>2026-03-05T10:00:00.000000Z</lastmod>");
    // Exactly one <lastmod> per URL (en + hi), never a fabricated extra one.
    expect(xml.match(/<lastmod>/g)).toHaveLength(2);
  });

  it("omits <lastmod> entirely when the translation has no real timestamp", async () => {
    vi.stubGlobal(
      "fetch",
      mockFetchSequence({
        question: "What is pedagogy?",
        ai_slug: "what-is-pedagogy",
        updated_at: null,
      }),
    );

    const xml = await buildQuestionsSitemapXml("ctet", BASE_URL);

    expect(xml).toContain(`<loc>${BASE_URL}/question/what-is-pedagogy-1</loc>`);
    expect(xml).not.toContain("<lastmod>");
    // Never a Date.now()/new Date() fallback standing in for a missing value.
    expect(xml).not.toMatch(/\d{4}-\d{2}-\d{2}T/);
  });

  it("produces a well-formed urlset for both locale variants", async () => {
    vi.stubGlobal(
      "fetch",
      mockFetchSequence({
        question: "What is pedagogy?",
        ai_slug: "what-is-pedagogy",
        updated_at: "2026-03-05T10:00:00.000000Z",
      }),
    );

    const xml = await buildQuestionsSitemapXml("ctet", BASE_URL);

    expect(xml.startsWith('<?xml version="1.0" encoding="UTF-8"?>')).toBe(true);
    expect(xml).toContain('<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">');
    expect(xml).toContain(`<loc>${BASE_URL}/question/what-is-pedagogy-1</loc>`);
    expect(xml).toContain(`<loc>${BASE_URL}/hi/question/what-is-pedagogy-1</loc>`);
    expect(xml.match(/<url>/g)).toHaveLength(2);
    expect(xml.match(/<\/url>/g)).toHaveLength(2);
  });
});

import { describe, expect, it } from "vitest";
import type { Question, Translation } from "@/components/blog/assessment-question/questions-list";
import { buildCards, cardBlocks, cardLabels, groupsByLang, labelFor, searchIndexItems } from "./card-model";
import { QUESTIONS_PER_PAGE } from "./pagination";

function tr(locale: string, over: Partial<Translation> = {}): Translation {
  return {
    id: 1,
    question_new_id: 1,
    locale,
    ai_slug: "slug",
    question: `<p>${locale} question</p>`,
    question_image: null,
    option_1_text: `${locale} A`,
    option_1_image: null,
    option_2_text: `${locale} B`,
    option_2_image: null,
    option_3_text: null,
    option_3_image: null,
    option_4_text: null,
    option_4_image: "https://img/x.png",
    correct_option: "2",
    explanation: `${locale} because`,
    ...over,
  };
}

function q(id: number, translations: Translation[], extra: Partial<Question> = {}): Question {
  return {
    id,
    question_id: "Q",
    exam_instance_id_b: "CTET_2024",
    stage_id: "",
    section_id: "",
    chapter_id: "",
    topic_id: "",
    question_number: "1",
    ai_slug: "s",
    translations,
    chapter: { id: 1, slug: "growth", chapter_id: "C", name: "Growth", translations: { en: { name: "Growth" }, hi: { name: "विकास" } } },
    topic: { id: 2, slug: "play", topic_id: "T", name: "Play", translations: null, children: [], trends: null },
    ...extra,
  };
}

describe("cardBlocks", () => {
  it("renders a single translation for both course languages", () => {
    const blocks = cardBlocks([tr("en")]);
    expect(blocks).toHaveLength(1);
    expect(blocks[0].show).toBe("both");
  });

  it("splits en/hi when both exist, matching selectTranslation", () => {
    const blocks = cardBlocks([tr("en"), tr("hi")]);
    expect(blocks.map((b) => [b.show, b.locale])).toEqual([
      ["en", "en"],
      ["hi", "hi"],
    ]);
  });

  it("keeps only real options, with their numbers, and the correct option", () => {
    const [block] = cardBlocks([tr("en")]);
    expect(block.options.map((o) => o.n)).toEqual([1, 2, 4]);
    expect(block.options[2]).toEqual({ n: 4, text: null, image: "https://img/x.png" });
    expect(block.correct).toBe(2);
    expect(block.explanation).toBe("en because");
  });

  it("drops nothing a card shows and nothing else", () => {
    const [block] = cardBlocks([tr("en")]);
    expect(Object.keys(block).sort()).toEqual(
      ["correct", "explanation", "locale", "options", "question", "questionImage", "show"].sort(),
    );
  });

  it("returns no blocks for a question with no translation", () => {
    expect(cardBlocks([])).toEqual([]);
    expect(cardBlocks(undefined)).toEqual([]);
  });
});

describe("cardLabels", () => {
  it("gives per-language labels when the names differ", () => {
    expect(cardLabels(q(1, [tr("en")]), "chapter")).toEqual([
      { show: "en", text: "Growth" },
      { show: "hi", text: "विकास" },
    ]);
  });

  it("collapses to one label when both languages resolve the same", () => {
    expect(cardLabels(q(1, [tr("en")]), "topic")).toEqual([{ show: "both", text: "Play" }]);
  });
});

describe("buildCards", () => {
  it("numbers rendered cards and skips untranslated questions", () => {
    const cards = buildCards([q(10, [tr("en")]), q(11, []), q(12, [tr("en")])], "topic");
    expect(cards.map((c) => [c.id, c.position])).toEqual([
      [10, 1],
      [12, 2],
    ]);
  });

  it("derives each question's chapter page from its chapter index", () => {
    const cards = buildCards([q(10, [tr("en")]), q(12, [tr("en")])], "chapter", new Map([[10, 0], [12, QUESTIONS_PER_PAGE + 5]]));
    expect(cards.map((c) => c.chapterPage)).toEqual([1, 2]);
    expect(buildCards([q(10, [tr("en")])], "section")[0].chapterPage).toBeNull();
  });

  it("lists groups per language in first-seen order", () => {
    const cards = buildCards([q(1, [tr("en")]), q(2, [tr("en")])], "chapter");
    expect(groupsByLang(cards)).toEqual({ en: ["Growth"], hi: ["विकास"] });
    expect(labelFor(cards[0], "hi")).toBe("विकास");
  });
});

describe("searchIndexItems", () => {
  it("indexes plain question/option text with its page", () => {
    const many = Array.from({ length: QUESTIONS_PER_PAGE + 1 }, (_, i) => q(100 + i, [tr("en")]));
    const items = searchIndexItems(buildCards(many, "topic"));
    expect(items[0]).toEqual({ id: 100, n: 1, p: 1, g: "Play", t: ["en question", "en A en B"] });
    expect(items[QUESTIONS_PER_PAGE].p).toBe(2);
  });

  it("adds Hindi text only when it differs", () => {
    const [item] = searchIndexItems(buildCards([q(1, [tr("en"), tr("hi")])], "chapter"));
    expect(item.h).toEqual(["hi question", "hi A hi B"]);
    expect(item.gh).toBe("विकास");
  });
});

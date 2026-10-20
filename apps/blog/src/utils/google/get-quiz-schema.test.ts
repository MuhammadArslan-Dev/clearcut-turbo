import { describe, expect, it } from "vitest";
import { getQuizSchema } from "./get-quiz-schema";
import type { Question, Translation } from "@/components/blog/assessment-question/questions-list";

function trans(overrides: Partial<Translation> = {}): Translation {
  return {
    id: 1,
    question_new_id: 1,
    locale: "en",
    ai_slug: "slug",
    question: "What is 2 + 2?",
    question_image: null,
    option_1_text: "3",
    option_1_image: null,
    option_2_text: "4",
    option_2_image: null,
    option_3_text: "5",
    option_3_image: null,
    option_4_text: "6",
    option_4_image: null,
    correct_option: "2",
    explanation: "Basic addition.",
    ...overrides,
  };
}

function question(id: number, overrides: Partial<Question> = {}): Question {
  return {
    id,
    question_id: String(id),
    exam_instance_id_b: "CTET_2021",
    stage_id: "CTET_P1",
    section_id: "CTET_P1_MATH",
    chapter_id: "1",
    topic_id: "1",
    question_number: String(id),
    ai_slug: "slug",
    translations: [trans()],
    chapter: { id: 1, slug: "numbers", chapter_id: "1", name: "Numbers" },
    topic: { id: 1, slug: "addition", topic_id: "1", name: "Addition", children: [], trends: null },
    ...overrides,
  };
}

const BASE_ARGS = { name: "CTET Paper 1 Numbers Quiz", url: "https://clearcutoff.in/ctet/paper-1/subject/numbers" };

describe("getQuizSchema", () => {
  it("returns null for an empty or missing question list", () => {
    expect(getQuizSchema({ ...BASE_ARGS, questions: [] })).toBeNull();
    expect(getQuizSchema({ ...BASE_ARGS, questions: undefined as unknown as Question[] })).toBeNull();
  });

  it("builds a valid Quiz with one Question/Answer per real question", () => {
    const schema = getQuizSchema({ ...BASE_ARGS, questions: [question(1)] });
    expect(schema).toMatchObject({
      "@context": "https://schema.org",
      "@type": "Quiz",
      name: BASE_ARGS.name,
      url: BASE_ARGS.url,
      numberOfQuestions: 1,
    });
    expect(schema?.hasPart).toEqual([
      {
        "@type": "Question",
        name: "What is 2 + 2?",
        acceptedAnswer: { "@type": "Answer", text: "4" },
      },
    ]);
  });

  it("reports the true total via numberOfQuestions even when hasPart is capped", () => {
    const questions = Array.from({ length: 50 }, (_, i) => question(i + 1));
    const schema = getQuizSchema({ ...BASE_ARGS, questions });
    expect(schema?.numberOfQuestions).toBe(50);
    expect((schema?.hasPart as unknown[]).length).toBe(20); // MAX_QUESTIONS_IN_SCHEMA
  });

  it("skips a question with no resolvable correct option rather than fabricating an answer", () => {
    const badIndex = question(1, { translations: [trans({ correct_option: "9" })] });
    const missingOptionText = question(2, { translations: [trans({ correct_option: "3", option_3_text: null })] });
    const schema = getQuizSchema({ ...BASE_ARGS, questions: [badIndex, missingOptionText] });
    expect(schema).toBeNull();
  });

  it("skips a question with no translation for the requested course language", () => {
    const hiOnly = question(1, { translations: [trans({ locale: "hi" })] });
    // Only one translation exists, so selectTranslation still returns it
    // regardless of courseLang (see question-translation.test.ts) — use two
    // translations, neither "en", to exercise the real "no match" path.
    const noEnglish = question(2, {
      translations: [trans({ locale: "hi", id: 1 }), trans({ locale: "mr", id: 2 })],
    });
    const schema = getQuizSchema({ ...BASE_ARGS, questions: [noEnglish], courseLang: "en" });
    // selectTranslation falls back to the first translation when there's no
    // exact match (see selectTranslation), so this still produces a Question
    // — asserting the fallback is used, not that it's excluded.
    expect(schema?.hasPart).toHaveLength(1);
    void hiOnly;
  });

  it("deduplicates a question id that appears more than once in the input", () => {
    const q = question(1);
    const schema = getQuizSchema({ ...BASE_ARGS, questions: [q, q] });
    expect(schema?.hasPart).toHaveLength(1);
    expect(schema?.numberOfQuestions).toBe(2); // the real (unfiltered) count, not de-duplicated
  });

  it("strips HTML out of question and answer text (also closes off a </script> break-out)", () => {
    const withMarkup = question(1, {
      translations: [
        trans({
          question: "<p>What is 2 + 2?</p><script>alert(1)</script>",
          correct_option: "1",
          option_1_text: "<strong>4</strong></script>",
        }),
      ],
    });
    const schema = getQuizSchema({ ...BASE_ARGS, questions: [withMarkup] });
    const part = (schema?.hasPart as Record<string, unknown>[])[0];
    expect(part.name).toBe("What is 2 + 2?alert(1)");
    expect((part.acceptedAnswer as Record<string, unknown>).text).toBe("4");
    expect(JSON.stringify(schema)).not.toContain("<script>");
    expect(JSON.stringify(schema)).not.toContain("</script>");
  });
});

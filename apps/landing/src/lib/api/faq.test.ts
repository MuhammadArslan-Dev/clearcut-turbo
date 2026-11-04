import { describe, expect, it } from "vitest";
import { normalizeFaq } from "./cms";
import { unwrapRichHtml } from "@/components/shared/RichFaqText";

const category = (questions: object[]) => ({ key: "general", label: "General", questions });

describe("normalizeFaq", () => {
  it("keeps legacy plain rows exactly as they were (older CMS, no *Text / *Html fields)", () => {
    const doc = normalizeFaq({ categories: [category([{ question: "What is it?", answer: "Line 1\nLine 2" }])] });
    expect(doc.categories[0].questions).toEqual([
      { question: "What is it?", answer: "Line 1\nLine 2", questionHtml: undefined, answerHtml: undefined },
    ]);
  });

  it("prefers the plain text derived from rich text and passes the HTML through", () => {
    const doc = normalizeFaq({
      categories: [
        category([
          {
            question: null,
            answer: null,
            questionText: "Is it free?",
            answerText: "Yes. Read the policy.",
            questionHtml: '<div class="payload-richtext">Is it <strong>free</strong>?</div>',
            answerHtml: '<div class="payload-richtext"><p>Yes.</p></div>',
          },
        ]),
      ],
    });
    const [q] = doc.categories[0].questions;
    expect(q.question).toBe("Is it free?");
    expect(q.answer).toBe("Yes. Read the policy.");
    expect(q.questionHtml).toContain("<strong>free</strong>");
  });

  it("treats empty HTML as no HTML and drops rows without a question or answer", () => {
    const doc = normalizeFaq({
      categories: [
        category([
          { question: "Q", answer: "A", questionHtml: "", answerHtml: "" },
          { question: "Only a question", answer: "" },
          { questionText: "", answerText: "" },
        ]),
      ],
    });
    expect(doc.categories[0].questions).toHaveLength(1);
    expect(doc.categories[0].questions[0].questionHtml).toBeUndefined();
  });

  it("copes with empty / missing categories and questions", () => {
    expect(normalizeFaq({ categories: [] }).categories).toEqual([]);
    expect(normalizeFaq({}).categories).toEqual([]);
    expect(normalizeFaq({ categories: [{ key: "k", label: "L", questions: null }] }).categories[0].questions).toEqual([]);
  });
});

describe("unwrapRichHtml", () => {
  it("removes Payload's container div and keeps the content", () => {
    expect(unwrapRichHtml('<div class="payload-richtext">Is the <strong>refund</strong>? </div>')).toBe(
      "Is the <strong>refund</strong>?",
    );
  });
  it("cleans Payload's multi-line list item tags and empty attributes", () => {
    const raw =
      '<div class="payload-richtext"><ul class="list-bullet"><li\n          class=""\n          style=""\n          value="1"\n        >One</li></ul></div>';
    expect(unwrapRichHtml(raw)).toBe('<ul class="list-bullet"><li value="1">One</li></ul>');
  });
  it("keeps link attributes intact", () => {
    const a = '<a href="https://example.com/x?a=1&amp;b=2" rel="noopener noreferrer" target="_blank">x</a>';
    expect(unwrapRichHtml(a)).toBe(a);
  });
  it("leaves HTML without the container untouched", () => {
    expect(unwrapRichHtml("<p>x</p>")).toBe("<p>x</p>");
  });
});

// src/lib/utils/schema.ts — schema.org `Quiz`/`Question`/`Answer` for the
// chapter/subject/year question-bank pages (components/question-bank/).
//
// Deliberately NOT Google's "Education Q&A" structured data feature
// (`eduQuestionType`): that feature is documented specifically for
// flashcard-style Q&A and requires every question to carry
// `eduQuestionType: "Flashcard"` to be eligible for its carousel — these are
// multiple-choice questions with 4 options, not flashcards, so claiming that
// type would misrepresent the content (and risk a manual action under
// Google's content guidelines for the feature). Also deliberately NOT
// `QAPage` (documented for community pages where multiple users submit
// answers and one is accepted/upvoted — there's no such community-answer
// data here) or `FAQPage` (Google retired FAQ rich results in 2026, and the
// content isn't FAQ-shaped either way). Plain `Quiz`/`Question`/`Answer`
// schema.org vocabulary is the only one of the four that actually, honestly
// describes this page's real content: it won't earn a Google rich result
// today, but it's valid and accurate, which the others aren't.
import type { Question } from "@/components/blog/assessment-question/questions-list";
import { selectTranslation } from "@/utils/question-translation";

const OPTION_FIELDS = [
  "option_1_text",
  "option_2_text",
  "option_3_text",
  "option_4_text",
] as const;

// This page can genuinely carry 300+ real questions (see the subject page's
// `getQuestionsByChapter` fan-out). Enumerating every one's full text in
// `hasPart` would duplicate the same content a THIRD time on top of the
// visible HTML and the RSC hydration payload — directly undoing the page-
// weight work done alongside this change. `numberOfQuestions` always reports
// the true total regardless of how many are enumerated here, so the markup
// never overstates or understates what's actually on the page.
const MAX_QUESTIONS_IN_SCHEMA = 20;

function stripHtml(html: string | null | undefined): string {
  return (html ?? "").replace(/<[^>]*>/g, "").trim();
}

export function getQuizSchema({
  questions,
  name,
  url,
  courseLang = "en",
}: {
  questions: Question[];
  name: string;
  url: string;
  courseLang?: "en" | "hi";
}): Record<string, unknown> | null {
  if (!Array.isArray(questions) || questions.length === 0) return null;

  const seenIds = new Set<number>();
  const hasPart: Record<string, unknown>[] = [];

  for (const q of questions) {
    if (hasPart.length >= MAX_QUESTIONS_IN_SCHEMA) break;
    if (seenIds.has(q.id)) continue; // defend against an upstream duplicate row
    seenIds.add(q.id);

    const translation = selectTranslation(q.translations, courseLang);
    const questionText = stripHtml(translation?.question);
    if (!questionText) continue;

    const correctIndex = Number(translation?.correct_option);
    const correctField = OPTION_FIELDS[correctIndex - 1];
    const answerText = correctField ? stripHtml(translation?.[correctField]) : "";
    // Never fabricate an answer: a question with no resolvable correct
    // option (bad index, missing option text) is left out of the schema
    // rather than emitting a Question with a guessed/empty Answer.
    if (!answerText) continue;

    hasPart.push({
      "@type": "Question",
      name: questionText,
      acceptedAnswer: {
        "@type": "Answer",
        text: answerText,
      },
    });
  }

  if (hasPart.length === 0) return null;

  return {
    "@context": "https://schema.org",
    "@type": "Quiz",
    name,
    url,
    numberOfQuestions: questions.length,
    hasPart,
  };
}

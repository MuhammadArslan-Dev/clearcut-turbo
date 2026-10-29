import type { PracticeAnswerCheck, PracticeExplanation, PracticeQuestion } from "@/lib/api/firstPracticeTest";

// The practice test keeps nothing on the server: questions and the learner's
// answers live in sessionStorage for the tab, so a refresh resumes the same
// test instead of drawing new questions (and a finished test stays on its
// result). `checks` (correct option + explanation) only exists once the test
// has been submitted. Cleared on Continue / Skip / Retake.

export type PracticeSession = {
  questions: PracticeQuestion[];
  answers: Record<number, number>;
  checks: Record<number, PracticeAnswerCheck>;
  marked: number[];
  visited: number[];
  index: number;
  startedAt: number;
  finishedAt: number | null;
  /** Active time spent on the test so far (no time limit; shown on the result). Missing in tests stored before this existed. */
  elapsedMs?: number;
  /** Explanations fetched with "Show Explanation", by question id (cached: toggling/navigating never refetches). Missing in older stored tests. */
  explained?: Record<number, PracticeExplanation>;
  /** Question ids whose explanation panel is open. */
  shown?: number[];
};

const key = (courseId: string) => `cc-first-practice-test-v2:${courseId}`;

export function loadPracticeSession(courseId: string): PracticeSession | null {
  try {
    const raw = sessionStorage.getItem(key(courseId));
    if (!raw) return null;
    const s = JSON.parse(raw) as PracticeSession;
    return Array.isArray(s.questions) && s.questions.length > 0 ? s : null;
  } catch {
    return null;
  }
}

export function savePracticeSession(courseId: string, session: PracticeSession) {
  try {
    sessionStorage.setItem(key(courseId), JSON.stringify(session));
  } catch {
    // Storage full / blocked: the test still works, it just won't survive a refresh.
  }
}

export function clearPracticeSession(courseId: string) {
  try {
    sessionStorage.removeItem(key(courseId));
  } catch {
    // ignore
  }
}

export function newPracticeSession(questions: PracticeQuestion[]): PracticeSession {
  return {
    questions,
    answers: {},
    checks: {},
    marked: [],
    visited: questions[0] ? [questions[0].question_id] : [],
    index: 0,
    startedAt: Date.now(),
    finishedAt: null,
    elapsedMs: 0,
  };
}

/** The question in the chosen language; a missing locale falls back to its default text. */
export function localizeQuestion(q: PracticeQuestion, locale: string | null) {
  const tr = locale ? q.translations?.find((t) => t.locale === locale) : undefined;
  return tr ? { question: tr.question, question_image: tr.question_image, options: tr.options } : q;
}

export function localizeExplanation(check: Pick<PracticeAnswerCheck, "explanation" | "translations"> | undefined, locale: string | null) {
  if (!check) return null;
  const tr = locale ? check.translations?.find((t) => t.locale === locale)?.explanation : null;
  return tr || check.explanation;
}

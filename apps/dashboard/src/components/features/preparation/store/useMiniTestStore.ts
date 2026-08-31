import { create } from "zustand";
import { QuestionNew } from "../types/question";

/* -------------------------------------------------------------------------- */
/*                                   TYPES                                    */
/* -------------------------------------------------------------------------- */

type AnswerMap = Record<number, number>;   // questionIndex -> selected option
type CheckedMap = Record<number, boolean>; // questionIndex -> checked or not

interface MiniTestState {
  questions: QuestionNew[];
  currentIndex: number;
  locale: string;

  answers: AnswerMap;
  checked: CheckedMap;

  isFinished: boolean;

  /* ----------------------------- ACTIONS ----------------------------- */

  setQuestions: (q: QuestionNew[], locale?: string) => void;
  setLocale: (locale: string) => void;

  selectOption: (questionIndex: number, optionKey: number) => void;
  checkAnswer: (questionIndex: number) => void;

  next: () => void;
  prev: () => void;
  finish: () => void;
  reset: () => void;

  getResult: () => {
    total: number;
    correct: number;
    incorrect: number;
  };
}

/* -------------------------------------------------------------------------- */
/*                                   STORE                                    */
/* -------------------------------------------------------------------------- */

export const useMiniTestStore = create<MiniTestState>((set, get) => ({
  questions: [],
  currentIndex: 0,
  locale: "en",

  answers: {},
  checked: {},

  isFinished: false,

  /* ----------------------------- SETTERS ----------------------------- */

  setQuestions: (q, locale = "en") =>
    set({
      questions: q,
      locale,
      currentIndex: 0,
      answers: {},
      checked: {},
      isFinished: false,
    }),

  setLocale: (locale) => set({ locale }),

  /**
   * Select option (allowed ONLY before checking)
   */
  selectOption: (questionIndex, optionKey) =>
    set((state) => {
      if (state.checked[questionIndex]) return state;

      return {
        answers: {
          ...state.answers,
          [questionIndex]: optionKey,
        },
      };
    }),

  /**
   * Confirm / check answer
   */
  checkAnswer: (questionIndex) =>
    set((state) => {
      if (state.answers[questionIndex] === undefined) return state;

      return {
        checked: {
          ...state.checked,
          [questionIndex]: true,
        },
      };
    }),

  /* ----------------------------- NAVIGATION ----------------------------- */

  next: () =>
    set((state) => ({
      currentIndex: Math.min(
        state.currentIndex + 1,
        state.questions.length - 1
      ),
    })),

  prev: () =>
    set((state) => ({
      currentIndex: Math.max(state.currentIndex - 1, 0),
    })),

  finish: () => set({ isFinished: true }),

  reset: () =>
    set({
      questions: [],
      currentIndex: 0,
      answers: {},
      checked: {},
      isFinished: false,
    }),

  /* ----------------------------- RESULT ----------------------------- */

  getResult: () => {
    const { questions, answers, locale } = get();

    let correct = 0;
    let incorrect = 0;

    questions.forEach((q, index) => {
      const selected = answers[index];
      if (selected === undefined) return;

      // find translation by locale — a partial API response can omit
      // translations/answer entirely, so never index into them blindly.
      // Falls back to the first available translation when none match the
      // course locale (e.g. a question that only has an "en" translation in
      // a Hindi-medium course): the in-progress test screen (MiniTest.tsx's
      // Content component) already falls back to translations[0] the same
      // way when showing the correct/wrong highlight, so scoring must use
      // the same translation it graded against — otherwise every such
      // question silently drops out of the score below instead of counting,
      // which is exactly what made the result screen show 0/N even when the
      // user answered correctly.
      const translation =
        q?.translations?.find((t) => t.locale === locale) ??
        q?.translations?.[0];

      if (!translation?.answer?.correct_option) return;

      const correctOption = Number(
        translation.answer.correct_option
      );

      if (selected === correctOption) {
        correct++;
      } else {
        incorrect++;
      }
    });

    return {
      total: questions.length,
      correct,
      incorrect,
    };
  },
}));

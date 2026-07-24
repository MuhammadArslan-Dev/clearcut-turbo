import { create } from "zustand";
import { persist } from "zustand/middleware";

import { Exam, AttemptQuestion } from "../types/exam";


// ===============================
// STORE TYPE
// ===============================

interface ExamStore {

  exam: Exam | null;

  currentSection: number;
  currentQuestion: number;

  language: string;

  timeLeft: number;

  started: boolean;


  // ===============================
  // ACTIONS
  // ===============================

  setExam: (exam: Exam) => void;

  setLanguage: (lang: string) => void;

  setTime: (sec: number) => void;
  tick: () => void;

  setPosition: (s: number, q: number) => void;

  goTo: (s: number, q: number) => void;

  next: () => void;
  prev: () => void;

  answer: (opt: string) => void;
  clear: () => void;

  toggleReview: () => void;

  reset: () => void;

  getCurrent: () => AttemptQuestion | null;

  getStats: () => {
    total: number;
    answered: number;
    review: number;
    notVisited: number;
    notAnswered: number;
  };
}


// ===============================
// STORE
// ===============================

export const useExamStore = create<ExamStore>()(
  persist(

    (set, get) => ({

      // ===============================
      // STATE
      // ===============================

      exam: null,

      currentSection: 0,
      currentQuestion: 0,

      language: "en",

      timeLeft: 0,

      started: false,


      // ===============================
      // INIT
      // ===============================

      setExam: (exam) => {

        set({
          exam,
          started: true,
        });
      },


      reset: () => {

        set({
          exam: null,
          currentSection: 0,
          currentQuestion: 0,
          timeLeft: 0,
          started: false,
        });
      },


      // ===============================
      // UI
      // ===============================

      setLanguage: (lang) => {
        set({ language: lang });
      },


      // ===============================
      // TIMER
      // ===============================

      setTime: (sec) => {
        set({ timeLeft: Math.max(sec, 0) });
      },


      tick: () => {

        set((s) => ({
          timeLeft: Math.max(s.timeLeft - 1, 0),
        }));
      },


      // ===============================
      // POSITION
      // ===============================

      setPosition: (s, q) => {

        set({
          currentSection: s,
          currentQuestion: q,
        });
      },


      // ===============================
      // NAVIGATION
      // ===============================

      goTo: (s, q) => {

        set((state) => {

          if (!state.exam) return state;

          const exam = structuredClone(state.exam);

          const ques =
            exam.sections[s]?.questions[q];

          if (!ques) return state;

          ques.visited = true;

          return {
            exam,
            currentSection: s,
            currentQuestion: q,
          };
        });
      },


      next: () => {

        const { exam, currentSection, currentQuestion } = get();

        if (!exam) return;

        const section = exam.sections[currentSection];

        if (!section) return;


        // Same section
        if (currentQuestion + 1 < section.questions.length) {

          get().goTo(currentSection, currentQuestion + 1);
          return;
        }


        // Next section
        if (currentSection + 1 < exam.sections.length) {

          get().goTo(currentSection + 1, 0);
        }
      },


      prev: () => {

        const { currentSection, currentQuestion } = get();

        if (currentQuestion > 0) {

          get().goTo(currentSection, currentQuestion - 1);
        }
      },


      // ===============================
      // ANSWERS
      // ===============================

      answer: (opt) => {

        set((state) => {

          if (!state.exam) return state;

          const exam = structuredClone(state.exam);

          const q =
            exam.sections[state.currentSection]
              ?.questions[state.currentQuestion];

          if (!q) return state;

          q.user_option = opt;
          q.visited = true;
          q.marked_for_review = false;

          return { exam };
        });
      },


      clear: () => {

        set((state) => {

          if (!state.exam) return state;

          const exam = structuredClone(state.exam);

          const q =
            exam.sections[state.currentSection]
              ?.questions[state.currentQuestion];

          if (!q) return state;

          q.user_option = null;

          return { exam };
        });
      },


      // ===============================
      // REVIEW
      // ===============================

      toggleReview: () => {

        set((state) => {

          if (!state.exam) return state;

          const exam = structuredClone(state.exam);

          const q =
            exam.sections[state.currentSection]
              ?.questions[state.currentQuestion];

          if (!q) return state;

          q.marked_for_review = !q.marked_for_review;

          return { exam };
        });
      },


      // ===============================
      // HELPERS
      // ===============================

      getCurrent: () => {

        const { exam, currentSection, currentQuestion } = get();

        if (!exam) return null;

        return exam.sections[currentSection]
          ?.questions[currentQuestion] ?? null;
      },


      getStats: () => {

        const { exam } = get();

        const stats = {
          total: 0,
          answered: 0,
          review: 0,
          notVisited: 0,
          notAnswered: 0,
        };

        if (!exam) return stats;


        exam.sections.forEach((s) => {

          s.questions.forEach((q) => {

            stats.total++;

            if (!q.visited) stats.notVisited++;
            else if (q.marked_for_review) stats.review++;
            else if (q.user_option) stats.answered++;
            else stats.notAnswered++;

          });
        });

        return stats;
      },

    }),

    // ===============================
    // PERSIST CONFIG
    // ===============================

    {
      name: "exam-store", // localStorage key

      partialize: (state) => ({
        exam: state.exam,
        currentSection: state.currentSection,
        currentQuestion: state.currentQuestion,
        language: state.language,
        timeLeft: state.timeLeft,
        started: state.started,
      }),
    }
  )
);

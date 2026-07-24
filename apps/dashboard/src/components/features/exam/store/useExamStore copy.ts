import { create } from "zustand";
import { Exam,AttemptQuestion } from "../types/exam";


// ===============================
// STORE TYPE
// ===============================

interface ExamStore {

  exam: Exam | null;

  currentSection: number;
  currentQuestion: number;

  language: string;

  timeLeft: number;


  // Actions
  setExam: (exam: Exam) => void;

  setLanguage: (lang: string) => void;

  setTime: (sec: number) => void;
  tick: () => void;

  goTo: (s: number, q: number) => void;

  next: () => void;
  prev: () => void;

  answer: (opt: string) => void;
  clear: () => void;

  toggleReview: () => void;

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

export const useExamStore = create<ExamStore>((set, get) => ({

  exam: null,

  currentSection: 0,
  currentQuestion: 0,

  language: "en",

  timeLeft: 0,


  // ===============================
  // INIT
  // ===============================

  setExam: (exam) => {

    set({
      exam,
      currentSection: 0,
      currentQuestion: 0,
    });
  },


  setLanguage: (lang) => {
    set({ language: lang });
  },


  setTime: (sec) => {
    set({ timeLeft: sec });
  },


  tick: () => {
    set((s) => ({ timeLeft: s.timeLeft - 1 }));
  },


  // ===============================
  // NAVIGATION
  // ===============================

  goTo: (s, q) => {

    set((state) => {

      if (!state.exam) return state;

      const exam = structuredClone(state.exam);

      const ques =
        exam.sections[s].questions[q];

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

    if (currentQuestion + 1 < section.questions.length) {

      get().goTo(currentSection, currentQuestion + 1);
      return;
    }

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
  // ANSWER
  // ===============================

  answer: (opt) => {

    set((state) => {

      if (!state.exam) return state;

      const exam = structuredClone(state.exam);

      const q =
        exam.sections[state.currentSection]
          .questions[state.currentQuestion];

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
          .questions[state.currentQuestion];

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
          .questions[state.currentQuestion];

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
      .questions[currentQuestion];
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

}));

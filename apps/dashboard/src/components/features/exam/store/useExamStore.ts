import { create } from "zustand";
import { persist } from "zustand/middleware";

import { Exam, AttemptQuestion } from "../types/exam";

// ===============================
// TYPES
// ===============================

interface ExamContext {
  sections: any[];

  sectionIndex: number;
  questionIndex: number;

  currentSection: any | null;
  currentQuestion: AttemptQuestion | null;

  translation: any | null;
}

interface SectionStats {
  total: number;
  answered: number;
  review: number;
  visited: number;
  notVisited: number;
}

// ===============================
// STORE TYPE
// ===============================

interface ExamStore {
  // ===============================
  // STATE
  // ===============================

  exam: Exam | null;
  examId: string | null;

  currentSection: number;
  currentQuestion: number;

  language: string;

  timeLeft: number;

  started: boolean;
  isFinished: boolean;

  hasHydrated: boolean;

  // ===============================
  // INIT
  // ===============================

  setExam: (exam: Exam) => void;
  reset: () => void;

  // ===============================
  // UI
  // ===============================

  setLanguage: (lang: string) => void;

  // ===============================
  // TIMER
  // ===============================

  setTime: (sec: number) => void;
  tick: () => void;

  // ===============================
  // NAVIGATION
  // ===============================

  next: () => void;
  prev: () => void;

  goToQuestion: (s: number, q: number) => void;
  goToSection: (s: number) => void;
  jumpTo: (s: number, q: number) => void;

  // ===============================
  // ANSWER
  // ===============================

  answer: (opt: string) => void;
  clear: () => void;

  toggleReview: () => void;
  markReviewAndNext: () => void;

  // ===============================
  // HELPERS
  // ===============================

  getExamContext: () => ExamContext;

  getSectionStats: (sectionIndex: number) => SectionStats;
  getStats: () => SectionStats;

  setHasHydrated: (v: boolean) => void;
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
      examId: null,

      currentSection: 0,
      currentQuestion: 0,

      language: "hi",

      timeLeft: 0,

      started: false,
      isFinished: false,

      hasHydrated: false,

      // ===============================
      // INIT
      // ===============================

      setExam: (exam) => {
        if (!exam) return;

        const state = get();

        // If different exam, reset first
        if (state.examId && state?.exam?.uuid !== exam?.uuid) {
          state.reset();
        }

        const remainT = Number(exam?.total_duration_seconds) - Number(exam?.time_used_seconds);

        set({
          exam,
          examId: exam.id.toString()!,
          started: true,
          isFinished: false,
          currentSection: 0,
          currentQuestion: 0,
          timeLeft: remainT ?? 0,
        });
      },

      reset: () => {
        set({
          exam: null,
          examId: null,
          currentSection: 0,
          currentQuestion: 0,
          timeLeft: 0,
          started: false,
          isFinished: false,
        });
      },

      // ===============================
      // UI
      // ===============================

      setLanguage: (lang) => {
        set((state) => ({ language: state.language === "en" ? "hi" : "en" }));
      },

      // ===============================
      // TIMER
      // ===============================

      setTime: (sec) => {
        set({ timeLeft: Math.max(sec, 0) });
      },

      tick: () => {
        set((s) => {
          if (s.timeLeft <= 1) {
            return { timeLeft: 0, isFinished: true };
          }
          return { timeLeft: s.timeLeft - 1 };
        });
      },

      // ===============================
      // NAVIGATION
      // ===============================

      goToQuestion: (s, q) => {
        const { exam } = get();
        if (!exam) return;

        const question = exam.sections[s]?.questions[q];
        if (!question) return;

        question.visited = true;

        set({
          currentSection: s,
          currentQuestion: q,
        });
      },

      goToSection: (s) => {
        const { exam } = get();
        if (!exam?.sections[s]) return;
        get().goToQuestion(s, 0);
      },

      jumpTo: (s, q) => {
        get().goToQuestion(s, q);
      },

      next: () => {
        const { exam, currentSection, currentQuestion } = get();
        if (!exam) return;

        const section = exam.sections[currentSection];
        if (!section) return;

        const isLastQ = currentQuestion + 1 === section.questions.length;
        const isLastS = currentSection + 1 === exam.sections.length;

        if (!isLastQ) {
          get().goToQuestion(currentSection, currentQuestion + 1);
          return;
        }

        if (isLastQ && !isLastS) {
          get().goToQuestion(currentSection + 1, 0);
          return;
        }

        if (isLastQ && isLastS) {
          set({ isFinished: true });
        }
      },

      prev: () => {
        const { exam, currentSection, currentQuestion } = get();
        if (!exam) return;

        if (currentQuestion > 0) {
          get().goToQuestion(currentSection, currentQuestion - 1);
          return;
        }

        if (currentSection > 0) {
          const prevSection = exam.sections[currentSection - 1];
          const lastIndex = prevSection.questions.length - 1;
          get().goToQuestion(currentSection - 1, lastIndex);
        }
      },

      // ===============================
      // ANSWER
      // ===============================

      answer: (opt) => {
        const { exam, currentSection, currentQuestion } = get();
        if (!exam) return;

        const q = exam.sections[currentSection]?.questions[currentQuestion];
        if (!q) return;

        q.user_option = opt;
        q.visited = true;
        q.marked_for_review = false;

        set({ exam: { ...exam } });
      },

      clear: () => {
        const { exam, currentSection, currentQuestion } = get();
        if (!exam) return;

        const q = exam.sections[currentSection]?.questions[currentQuestion];
        if (!q) return;

        q.user_option = null;
        set({ exam: { ...exam } });
      },

      toggleReview: () => {
        const { exam, currentSection, currentQuestion } = get();
        if (!exam) return;

        const q = exam.sections[currentSection]?.questions[currentQuestion];
        if (!q) return;

        q.marked_for_review = !q.marked_for_review;
        set({ exam: { ...exam } });
      },

      markReviewAndNext: () => {
        get().toggleReview();
        get().next();
      },

      // ===============================
      // CONTEXT
      // ===============================

      getExamContext: () => {
        const { exam, currentSection, currentQuestion, language } = get();

        if (!exam) {
          return {
            sections: [],
            sectionIndex: 0,
            questionIndex: 0,
            currentSection: null,
            currentQuestion: null,
            translation: null,
          };
        }

        const section = exam.sections[currentSection] ?? null;
        const question = section?.questions[currentQuestion] ?? null;

        let translation = null;

        if (question?.question?.translations) {
          if (section?.section?.type === "subject") {
            translation =
              question.question.translations.find((t: any) => t.locale === language) ??
              question.question.translations[0] ??
              null;
          } else {
            translation = question.question.translations[0] ?? null;
          }
        }

        return {
          sections: exam.sections,
          sectionIndex: currentSection,
          questionIndex: currentQuestion,
          currentSection: section,
          currentQuestion: question,
          translation,
        };
      },

      // ===============================
      // STATS
      // ===============================

      getSectionStats: (sectionIndex) => {
        const { exam } = get();

        const stats: SectionStats = {
          total: 0,
          answered: 0,
          review: 0,
          visited: 0,
          notVisited: 0,
        };

        if (!exam?.sections[sectionIndex]) return stats;

        exam.sections[sectionIndex].questions.forEach((q: any) => {
          stats.total++;

          if (q.visited) stats.visited++;
          else stats.notVisited++;

          if (q.user_option) stats.answered++;
          if (q.marked_for_review) stats.review++;
        });

        return stats;
      },

      getStats: () => {
        const { exam } = get();

        const stats: SectionStats = {
          total: 0,
          answered: 0,
          review: 0,
          visited: 0,
          notVisited: 0,
        };

        if (!exam) return stats;

        exam.sections.forEach((s) => {
          s.questions.forEach((q: any) => {
            stats.total++;

            if (q.visited) stats.visited++;
            else stats.notVisited++;

            if (q.user_option) stats.answered++;
            if (q.marked_for_review) stats.review++;
          });
        });

        return stats;
      },

      setHasHydrated: (v) => set({ hasHydrated: v }),
    }),
    {
      name: "exam-store",

      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },

      // 🚀 Do NOT persist full exam
      partialize: (state) => ({
        examId: state.examId,
        currentSection: state.currentSection,
        currentQuestion: state.currentQuestion,
        language: state.language,
        timeLeft: 0,
        started: state.started,
        isFinished: state.isFinished,
      }),
    },
  ),
);

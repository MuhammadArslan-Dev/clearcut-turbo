import { create } from "zustand";
import { Exam } from "../../exam/types/exam";

// ===============================
// TYPES
// ===============================

interface ExamContext {
  sections: any[];

  sectionIndex: number;

  currentSection: any | null;
}

// ===============================
// STORE TYPE
// ===============================

interface ExamStore {
  // ===============================
  // STATE
  // ===============================

  exam: Exam | null;

  currentSection: number;

  language: string;

  // ===============================
  // INIT
  // ===============================

  setExam: (exam: Exam) => void;

  // ===============================
  // UI
  // ===============================

  setLanguage: (lang: string) => void;

  goToQuestion: (s: number, q: number) => void;
  goToSection: (s: number) => void;

  // ===============================
  // HELPERS
  // ===============================

  getExamContext: () => ExamContext;
}

// ===============================
// STORE
// ===============================

export const useExamReportStore = create<ExamStore>((set, get) => ({
  // ===============================
  // STATE
  // ===============================

  exam: null,

  currentSection: 0,

  language: "hi",

  // ===============================
  // INIT
  // ===============================

  setExam: (exam) => {
    if (!exam) return;

    set({
      exam,
      currentSection: 0,
    });
  },

  // ===============================
  // UI
  // ===============================

  setLanguage: (lang) => {
    set((state) => ({ language: state.language === "en" ? "hi" : "en" }));
  },

  // ===============================
  // INTERNAL NAV
  // ===============================

  goToQuestion: (s, q) => {
    set((state) => {
      if (!state.exam) return state;

      const exam = structuredClone(state.exam);

      const question = exam.sections[s]?.questions[q];

      if (!question) return state;

      question.visited = true;

      return {
        exam,
        currentSection: s,
        currentQuestion: q,
      };
    });
  },

  goToSection: (s) => {
    set((state) => {
      if (!state.exam) return state;

      const exam = structuredClone(state.exam);

      const question = exam.sections[s]?.questions[0];

      if (!question) return state;

      return {
        exam,
        currentSection: s,
      };
    });
  },

  // ===============================
  // CONTEXT
  // ===============================

  getExamContext: () => {
    const { exam, currentSection } = get();

    if (!exam) {
      return {
        sections: [],
        sectionIndex: 0,
        currentSection: null,
      };
    }

    const section = exam.sections[currentSection] ?? null;

    return {
      sections: exam.sections,

      sectionIndex: currentSection,

      currentSection: section,
    };
  },
}));

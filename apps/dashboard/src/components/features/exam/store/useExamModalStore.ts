import { TestsList } from "@/lib/tests/getExam";
import { create } from "zustand";

/* ---------------------------------- */
/* Modal Modes                         */
/* ---------------------------------- */

export type Mode = "end-exam" | "exam-report" | "exam-navigation-panel";

/* ---------------------------------- */
/* Payload                             */
/* ---------------------------------- */

export interface ModalPayload {
  examId?: string | number | undefined;
}

/* ---------------------------------- */
/* Store State                         */
/* ---------------------------------- */

export interface PreparationModalState {
  stack: Mode[];
  isOpen: boolean;
  isHistory: boolean;
  hasHistoryEntry: boolean;

  examId: number | string | undefined;

  open: (
    mode: Mode,
    payload?: ModalPayload,
    isHistory?: boolean | undefined,
  ) => void;
  close: () => void;
  closeModal: (mode: Mode) => void;
  reset: () => void;
}

/* ---------------------------------- */
/* Mobile Helper                       */
/* ---------------------------------- */

const isMobile = () =>
  typeof window !== "undefined" &&
  window.matchMedia("(max-width: 768px)").matches;

/* ---------------------------------- */
/* Store                               */
/* ---------------------------------- */

export const useExamModalStore = create<PreparationModalState>((set) => ({
  stack: [],
  isOpen: false,
  isHistory: false,

  examId: undefined,
  hasHistoryEntry: false,

  /* ---------------------------------- */
  /* Open Modal (push to stack)          */
  /* ---------------------------------- */

  open: (mode, payload, isHistory = false) => {
    set((state) => {
      const shouldPushHistory =
        isHistory && isMobile() && !state.hasHistoryEntry;

      if (shouldPushHistory) {
        window.history.pushState({ drawer: true }, "");
      }

      return {
        stack: [...state.stack, mode],
        isOpen: true,
        isHistory: isHistory || state.isHistory,
        hasHistoryEntry: state.hasHistoryEntry || shouldPushHistory,
        examId: payload?.examId,
      };
    });
  },

  /* ---------------------------------- */
  /* Close Top-most Modal                */
  /* ---------------------------------- */

  close: () =>
    set((state) => {
      const newStack = state.stack.slice(0, -1);
      const isEmpty = newStack.length === 0;

      // If last modal & we used history → clean it
      if (isEmpty && state.hasHistoryEntry) {
        window.history.back();
      }

      return {
        stack: newStack,
        isOpen: !isEmpty,
        isHistory: !isEmpty && state.isHistory,
        hasHistoryEntry: !isEmpty && state.hasHistoryEntry,
        examId: isEmpty ? undefined : state.examId,
      };
    }),

  /* ---------------------------------- */
  /* Close ONE Instance of Modal         */
  /* ---------------------------------- */

  closeModal: (mode) =>
    set((state) => {
      const index = state.stack.lastIndexOf(mode);
      if (index === -1) return state;

      const newStack = [...state.stack];
      newStack.splice(index, 1);

      const isEmpty = newStack.length === 0;

      // If last modal closed → clean fake history
      if (isEmpty && state.hasHistoryEntry) {
        window.history.back();
      }

      return {
        stack: newStack,
        isOpen: !isEmpty,
        isHistory: !isEmpty && state.isHistory,
        hasHistoryEntry: !isEmpty && state.hasHistoryEntry,
        examId: isEmpty ? undefined : state.examId,
      };
    }),

  /* ---------------------------------- */
  /* Reset Everything                   */
  /* ---------------------------------- */

  reset: () => ({
    stack: [],
    isOpen: false,
    isHistory: false,
    hasHistoryEntry: false,
  }),
}));

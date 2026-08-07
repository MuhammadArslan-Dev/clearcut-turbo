import { create } from "zustand";

/* ---------------------------------- */
/* Modal Modes                         */
/* ---------------------------------- */

export type Mode =
  | "chapter-index"
  | "mini-test"
  | "mini-test-result"
  | "previous-modal"
  | "change-paper"
  | "preparation-guide";

/* ---------------------------------- */
/* Payload                             */
/* ---------------------------------- */

export interface ModalPayload {
  miniTestData?: unknown;
  chapterIndex?: unknown;
  miniTestResult?: unknown;
  previousModal?: unknown;
}

/* ---------------------------------- */
/* Store State                         */
/* ---------------------------------- */

export interface PreparationModalState {
  stack: Mode[];
  isOpen: boolean;
  isHistory: boolean;
  hasHistoryEntry: boolean;

  previousModal: unknown;
  miniTestData: unknown;
  chapterIndex: unknown;
  miniTestResult: unknown;

  open: (
    mode: Mode,
    payload?: ModalPayload,
    isHistory?: boolean | undefined
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

export const usePreparationModalStore = create<PreparationModalState>(
  (set) => ({
    stack: [],
    isOpen: false,
    isHistory: false,

    previousModal: null,
    miniTestData: null,
    chapterIndex: null,
    miniTestResult: null,
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

          miniTestData: payload?.miniTestData ?? state.miniTestData,
          chapterIndex: payload?.chapterIndex ?? state.chapterIndex,
          miniTestResult: payload?.miniTestResult ?? state.miniTestResult,
          previousModal: payload?.previousModal ?? state.previousModal,
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

        return {
          stack: newStack,
          isOpen: !isEmpty,
          isHistory: !isEmpty && state.isHistory,
          hasHistoryEntry: !isEmpty && state.hasHistoryEntry,
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

        return {
          stack: newStack,
          isOpen: !isEmpty,
          isHistory: !isEmpty && state.isHistory,
          hasHistoryEntry: !isEmpty && state.hasHistoryEntry,
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
      miniTestData: null,
      chapterIndex: null,
      miniTestResult: null,
    }),
  })
);

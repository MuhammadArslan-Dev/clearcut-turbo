import { TestsList } from "@/lib/tests/getExam";
import { create } from "zustand";

/* ---------------------------------- */
/* Modal Modes                         */
/* ---------------------------------- */

export type Mode =
  | "change-paper-modal"
  | "attempt-history"
  | "pre-test-confirmation"
  | "test-start-countdown"
  | "section-index";

/* ---------------------------------- */
/* Payload                             */
/* ---------------------------------- */

export interface ModalPayload {
  attemptHistory?: unknown;
  preTestConfirmation?: unknown;
  sectionIndex?: unknown;
  test?: TestsList | null;
  sectionId?: number | string | null;
}

/* ---------------------------------- */
/* Store State                         */
/* ---------------------------------- */

export interface PreparationModalState {
  stack: Mode[];
  isOpen: boolean;
  isHistory: boolean;
  hasHistoryEntry: boolean;

  attemptHistory: unknown;
  preTestConfirmation: unknown;
  sectionIndex: unknown;

  test: TestsList | null;
  sectionId: null | number | string;

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

export const useTestSeriesModalStore = create<PreparationModalState>((set) => ({
  stack: [],
  isOpen: false,
  isHistory: false,

  test: null,
  sectionId: null,

  attemptHistory: null,
  preTestConfirmation: null,
  sectionIndex: null,
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

        attemptHistory: payload?.attemptHistory ?? state.attemptHistory,
        preTestConfirmation:
          payload?.preTestConfirmation ?? state.preTestConfirmation,
        sectionIndex: payload?.sectionIndex ?? state.sectionIndex,
        test: payload?.test ?? state.test,
        sectionId: payload?.sectionId ?? state.sectionId,
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
    attemptHistory: null,
    preTestConfirmation: null,
    sectionIndex: null,
  }),
}));

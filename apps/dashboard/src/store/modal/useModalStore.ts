import { create } from "zustand";

/** Allowed modes */
export type Mode =
  | "language"
  | "helpsport"
  | "change-exam"
  | "chapter-index"
  | "mini-test"
  | "mini-test-result"
  | "account-delete"
  | "account-delete-confirm"
  | "preparation-guide";

export interface State {
  stack: Mode[]; // 👈 modal stack
  isOpen: boolean;

  open: (mode: Mode) => void;
  close: () => void; // closes top modal
  closeModal: (mode: Mode) => void; // closes specific modal
  reset: () => void;
}

export const useModalStore = create<State>((set) => ({
  stack: [],
  isOpen: false,

  open: (mode) =>
    set((state) => ({
      stack: [...state.stack, mode],
      isOpen: true,
    })),

  // 👈 closes top-most modal
  close: () =>
    set((state) => {
      const newStack = state.stack.slice(0, -1);

      return {
        stack: newStack,
        isOpen: newStack.length > 0,
      };
    }),

  // 👈 closes a specific modal (safe for nested)
  closeModal: (mode) =>
    set((state) => {
      const newStack = state.stack.filter((m) => m !== mode);

      return {
        stack: newStack,
        isOpen: newStack.length > 0,
      };
    }),

  reset: () =>
    set({
      stack: [],
      isOpen: false,
    }),
}));

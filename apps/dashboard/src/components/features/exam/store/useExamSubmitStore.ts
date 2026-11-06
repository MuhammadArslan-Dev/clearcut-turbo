import { create } from "zustand";

/**
 * Hand-off between "the exam is being ended" (End Test sheet, timer expiry) and the "checking your answers"
 * animation that sits over the exam page (@clearcut/motion TestSubmit via SubmitOverlay in mainContent.tsx).
 * The animation plays while the end-exam request is in flight; its onFinish then navigates to the report.
 * `begin` doubles as the double-submit guard (manual End Test racing the timer expiry).
 */
export type ExamSubmitTarget = {
  courseCode: string | undefined;
  examId: string | undefined;
  type: string | null | undefined;
};

interface ExamSubmitState {
  phase: "idle" | "running";
  /** true once the end-exam request has settled (success or failure, like before: the report opens either way) */
  done: boolean;
  total: number;
  target: ExamSubmitTarget | null;
  /** returns false when a submit is already running */
  begin: (target: ExamSubmitTarget, total: number) => boolean;
  /** end-exam settled; `type` is the type the response reported (preferred over the store's). */
  settle: (type?: string | null) => void;
  reset: () => void;
}

export const useExamSubmitStore = create<ExamSubmitState>((set, get) => ({
  phase: "idle",
  done: false,
  total: 0,
  target: null,
  begin: (target, total) => {
    if (get().phase === "running") return false;
    set({ phase: "running", done: false, total, target });
    return true;
  },
  settle: (type) =>
    set((s) => ({
      done: true,
      target: s.target ? { ...s.target, type: type ?? s.target.type } : s.target,
    })),
  reset: () => set({ phase: "idle", done: false, total: 0, target: null }),
}));

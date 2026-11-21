"use client";

// Phase 122: shared state of the "finish setup" experiment on the Learn page. Written by <SetupFirstGate> (eligibility +
// GrowthBook answer) and by the Select Paper sheet (closed / kept choice); read by the card, Daily Test, banner, ResumeBar
// and the sheet. Nothing here is persisted except the "auto-opened once" mark (see SetupFirstGate).
import { create } from "zustand";
import type { Exam } from "@/types/Exam";
import { useCourseStore } from "@/store/course/useCourseStore";
import { SETUP_FIRST_FLAG, isSetupFirst } from "./setupFirstValue";

/** Where the Select Paper sheet was opened from. Sent on the setup events in both variants. */
export type SetupSource =
  | "auto_open"
  | "course_card"
  | "daily_test"
  | "banner"
  | "resume_bar"
  | "other";

/** A paper (and the subjects under it) picked in the sheet but not saved yet; kept per exam id in the variant. */
export type SetupDraft = { paperId: number | string; paperName: string; pathIds: Array<number | string>; paperHasSubjects: boolean };

type SetupFirstState = {
  /** No enrolment of this learner has a level yet (needsFirstSetup). */
  eligible: boolean;
  /** GrowthBook answered for this page view (always true for a learner who is not eligible). */
  ready: boolean;
  /** The variant value from GrowthBook (control when unknown / any failure). */
  value: string | null;
  /** The learner closed the sheet ("Do it later" / X / backdrop) at least once on this page view. */
  dismissed: boolean;
  /** created_at of the course the sheet is for, for time_since_enrolment_s. */
  enrolledAt: string | number | null;
  /** Source of the current/last sheet open. */
  source: SetupSource | null;
  drafts: Record<string, SetupDraft>;
  setEligibility: (eligible: boolean, enrolledAt?: string | number | null) => void;
  setAnswer: (value: string) => void;
  setDismissed: (dismissed: boolean) => void;
  setDraft: (examId: number | string, draft: SetupDraft | null) => void;
  reset: () => void;
};

const DRAFT_KEY = "cc-setup-first-draft:";

/** A kept paper choice survives a reload (per browser; best effort, a blocked storage just forgets it). */
export function readStoredDraft(examId: number | string): SetupDraft | null {
  try {
    const raw = window.localStorage.getItem(DRAFT_KEY + examId);
    const d = raw ? (JSON.parse(raw) as SetupDraft) : null;
    return d && d.paperId != null && Array.isArray(d.pathIds) ? d : null;
  } catch {
    return null;
  }
}

function writeStoredDraft(examId: number | string, draft: SetupDraft | null): void {
  try {
    if (draft) window.localStorage.setItem(DRAFT_KEY + examId, JSON.stringify(draft));
    else window.localStorage.removeItem(DRAFT_KEY + examId);
  } catch {
    /* ignore */
  }
}

const initial = { eligible: false, ready: true, value: null, dismissed: false, enrolledAt: null, source: null, drafts: {} };

export const useSetupFirstStore = create<SetupFirstState>((set) => ({
  ...initial,
  // Becoming eligible = waiting for GrowthBook (ready false) until the gate's evaluator answers.
  setEligibility: (eligible, enrolledAt = null) =>
    set((s) => (s.eligible === eligible ? { enrolledAt } : { eligible, ready: !eligible, value: null, enrolledAt })),
  setAnswer: (value) => set({ value, ready: true }),
  setDismissed: (dismissed) => set({ dismissed }),
  setDraft: (examId, draft) =>
    set((s) => {
      writeStoredDraft(examId, draft);
      const drafts = { ...s.drafts };
      if (draft) drafts[String(examId)] = draft;
      else delete drafts[String(examId)];
      return { drafts };
    }),
  reset: () => set(initial),
}));

/** Variant flags for components. `pending` = eligible but GrowthBook has not answered: keep the layout, hide the text. */
export function useSetupFirst(): { eligible: boolean; pending: boolean; treatment: boolean } {
  const eligible = useSetupFirstStore((s) => s.eligible);
  const ready = useSetupFirstStore((s) => s.ready);
  const value = useSetupFirstStore((s) => s.value);
  return { eligible, pending: eligible && !ready, treatment: eligible && ready && isSetupFirst(value) };
}

/** Properties that tag the setup events of a learner who is in the experiment (none for anybody else). */
export function setupExperimentProps(): { experiment_flag?: string; experiment_variant?: string } {
  const s = useSetupFirstStore.getState();
  if (!s.eligible || !s.ready || s.value == null) return {};
  return { experiment_flag: SETUP_FIRST_FLAG, experiment_variant: isSetupFirst(s.value) ? s.value : "control" };
}

/** Open the Select Paper sheet for `exam`, remembering where it was opened from (both variants). */
export function openSetupSheet(exam: Exam, source: SetupSource): void {
  useSetupFirstStore.setState({ source });
  useCourseStore.getState().open("single", exam);
}

import { create } from "zustand";
import { Exam } from "@/types/Exam";

/** Allowed modes */
export type EditCourseMode =
  | "edit"
  | "single"
  | "full"
  | "payment"
  | "payment-success"
  | "payment-failed"
  | "payment-failed-warning";

export type PropertySource =
  | "onboarding_completed"
  | "notes_downloaded"
  | "trends_pyq_clicked"
  | "my_courses_card_clicked"
  | "timeline_content_clicked";
interface EditCourseState {
  isOpen: boolean;
  data: Exam | undefined | null;
  mode: EditCourseMode | null;
  source?: PropertySource | null;
  /**
   * Run after the enrollment is saved successfully, before the modal closes.
   *
   * The modal already invalidates the my-courses list, which is all the
   * dashboard needs. Callers opened from a screen that renders enrollment data
   * of its own (preparation, whose paper tabs come from a separate
   * `["preparation", courseId]` query) pass their own refresh here rather than
   * having the modal grow knowledge of every screen that can open it.
   */
  onSuccess?: (() => void) | null;

  open: (
    mode: EditCourseMode,
    data: Exam,
    source?: PropertySource,
    onSuccess?: () => void,
  ) => void;
  close: () => void;
}

const isMobile = () =>
  typeof window !== "undefined" &&
  window.matchMedia("(max-width: 768px)").matches;

export const useCourseStore = create<EditCourseState>((set) => ({
  isOpen: false,
  data: null,
  mode: null,
  source: null,
  onSuccess: null,

  open: (mode, data, source, onSuccess) => {
    if (isMobile()) {
      window.history.pushState({ drawer: true }, "");
    }

    set({
      isOpen: true,
      mode,
      data,
      source,
      onSuccess: onSuccess ?? null,
    });
  },

  close: () =>
    set({
      isOpen: false,
      mode: null,
      source: null,
      data: null,
      onSuccess: null,
    }),
}));

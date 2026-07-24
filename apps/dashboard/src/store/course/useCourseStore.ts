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

  open: (mode: EditCourseMode, data: Exam, source?: PropertySource) => void;
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

  open: (mode, data, source) => {
    if (isMobile()) {
      window.history.pushState({ drawer: true }, "");
    }

    set({
      isOpen: true,
      mode,
      data,
      source,
    });
  },

  close: () =>
    set({
      isOpen: false,
      mode: null,
      source: null,
      data: null,
    }),
}));

import { create } from "zustand";
import { Exam } from "@/types/Exam";
import { ExamEnrollmentWithExam } from "@/lib/dashboard/learning";

/** Allowed modes */
export type PaywallTypes =
  | "preparation-paywall"
  | "test-series-paywall"
  | "main-paywall"
  | "course-paywall"
  | "topic-locked-modal"
  | "test-locked-modal";

export type PaywallSource =
  | "my_courses_card_clicked"
  | "topic_card_clicked"
  | "chapter_card_clicked"
  | "chapter_index_list_card_clicked"
  | "floating_widget_clicked"
  | "full_test_card_clicked"
  | "sectional_test_card_clicked"
  | "test_series_card_clicked"
  | "payment_failed_retry_clicked";
interface EditCourseState {
  isOpen: boolean;
  data: Exam | undefined | null;
  /**
   * Full enrollment, needed alongside `data` (the bare exam) by callers that
   * navigate to `/payment/initiated` — that route needs `group_code`, which
   * only lives on the enrollment, not on `Exam` itself.
   */
  course?: ExamEnrollmentWithExam | null;
  mode: PaywallTypes | null;
  source?: PaywallSource | null;

  open: (
    mode: PaywallTypes,
    data: Exam,
    source?: PaywallSource,
    course?: ExamEnrollmentWithExam | null,
  ) => void;
  close: () => void;
}

const isMobile = () =>
  typeof window !== "undefined" &&
  window.matchMedia("(max-width: 768px)").matches;

export const usePaywallsStore = create<EditCourseState>((set) => ({
  isOpen: false,
  data: null,
  course: null,
  mode: null,
  source: null,

  open: (mode, data, source, course) => {
    if (isMobile()) {
      window.history.pushState({ drawer: true }, "");
    }

    set({
      isOpen: true,
      mode,
      data,
      source,
      course: course ?? null,
    });
  },

  close: () =>
    set({
      isOpen: false,
      mode: null,
      source: null,
      data: null,
      course: null,
    }),
}));

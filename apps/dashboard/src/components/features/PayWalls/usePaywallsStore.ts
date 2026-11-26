import { create } from "zustand";
import { Exam } from "@/types/Exam";
import { ExamEnrollmentWithExam } from "@/lib/dashboard/learning";
import type { FreeCreditsLock } from "@/lib/api/freeCredits";

/** Allowed modes */
export type PaywallTypes =
  | "preparation-paywall"
  | "test-series-paywall"
  | "main-paywall"
  | "course-paywall"
  | "topic-locked-modal"
  | "test-locked-modal"
  | "daily-test-locked-modal"
  | "daily-tests-locked-modal"
  // CC-196: free test credits used up (also the upgraded view of "test-locked-modal").
  | "credits-locked-modal";

export type PaywallSource =
  | "my_courses_card_clicked"
  | "topic_card_clicked"
  | "chapter_card_clicked"
  | "chapter_index_list_card_clicked"
  | "floating_widget_clicked"
  | "full_test_card_clicked"
  | "sectional_test_card_clicked"
  | "test_series_card_clicked"
  | "payment_failed_retry_clicked"
  | "next_button_clicked"
  | "daily_test_result_clicked"
  | "daily_tests_page_clicked"
  // CC-129: server refused a paid test (plan ended) / grace-period widget.
  | "renewal_required"
  | "plan_grace_widget"
  // CC-196: checkout opened from the free-credits lock screen (or the Cutoff Meter).
  | "cutoff_meter";

/** CC-196: what the free-credits lock screen needs to know about the tap that opened it. */
export type PaywallMeta = {
  /** sectional | chapter | full-length | daily_test */
  testType?: string;
  /** Where it was hit - Test Locked's `source`. */
  surface?: "test_card" | "daily_card" | "test_start";
  /** The server's 403 body, when the lock came from a refused start. */
  lock?: FreeCreditsLock | null;
};

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
  meta?: PaywallMeta | null;

  open: (
    mode: PaywallTypes,
    data: Exam,
    source?: PaywallSource,
    course?: ExamEnrollmentWithExam | null,
    meta?: PaywallMeta | null,
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
  meta: null,

  open: (mode, data, source, course, meta) => {
    if (isMobile()) {
      window.history.pushState({ drawer: true }, "");
    }

    set({
      isOpen: true,
      mode,
      data,
      source,
      course: course ?? null,
      meta: meta ?? null,
    });
  },

  close: () =>
    set({
      isOpen: false,
      mode: null,
      source: null,
      data: null,
      course: null,
      meta: null,
    }),
}));
